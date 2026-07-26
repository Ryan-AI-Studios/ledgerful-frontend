import { maybeInvalidateSession } from "./api";
import type { DaemonEvent } from "./types";
import { buildApiUrl, getAuthToken } from "./utils";

export type { DaemonEvent };

/** Initial reconnect delay (ms). DoD-4: 1 s → ×2 → 30 s ceiling. */
export const SSE_BACKOFF_INITIAL_MS = 1000;
/** Maximum reconnect delay (ms). */
export const SSE_BACKOFF_MAX_MS = 30_000;
/** Connection is considered stable after this open duration (even without events). */
const SSE_DEFAULT_STABLE_AFTER_MS = 2000;

export type SseTransportState =
  | "connecting"
  | "live"
  | "reconnecting"
  | "fallback" // permanent: 404/405 or exhausted
  | "auth_failed"
  | "stopped";

export interface ParsedSseFrame {
  event: string;
  data: string;
  id?: string;
  retry?: number;
}

export interface ConnectSseOptions {
  onEvent: (eventName: string, data: string) => void;
  onStateChange?: (state: SseTransportState) => void;
  /** For tests: inject fetch, now, scheduleDelay */
  fetchImpl?: typeof fetch;
  getToken?: () => string | null;
  buildUrl?: () => string;
  schedule?: (fn: () => void, ms: number) => { clear: () => void };
  random?: () => number; // for jitter 0..1
  stableAfterMs?: number; // default 2000
  /** Max consecutive unstable failures before permanent fallback. */
  maxUnstableFailures?: number;
}

/**
 * Parse a single SSE frame (text between blank-line delimiters).
 * Ignores comment lines (`:` keep-alives). Multi-line `data:` joined with `\n`.
 * Returns null for empty / comment-only frames.
 */
export function parseSseFrame(frame: string): ParsedSseFrame | null {
  const normalized = frame.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (!normalized.trim()) return null;

  let event = "message";
  const dataLines: string[] = [];
  let id: string | undefined;
  let retry: number | undefined;
  let sawField = false;

  for (const rawLine of normalized.split("\n")) {
    if (rawLine.startsWith(":")) {
      // comment / keep-alive — ignore
      continue;
    }
    if (rawLine === "") continue;

    const colon = rawLine.indexOf(":");
    let field: string;
    let value: string;
    if (colon === -1) {
      field = rawLine;
      value = "";
    } else {
      field = rawLine.slice(0, colon);
      value = rawLine.slice(colon + 1);
      if (value.startsWith(" ")) value = value.slice(1);
    }

    sawField = true;
    switch (field) {
      case "event":
        event = value;
        break;
      case "data":
        dataLines.push(value);
        break;
      case "id":
        id = value;
        break;
      case "retry": {
        const n = Number.parseInt(value, 10);
        if (!Number.isNaN(n) && n >= 0) retry = n;
        break;
      }
      default:
        // ignore unknown fields per SSE spec
        break;
    }
  }

  if (!sawField) return null;
  // Spec: if no data field, the frame is a dispatch of empty data — still surface if event set.
  // We only emit frames that carried at least one recognized field.
  return {
    event,
    data: dataLines.join("\n"),
    ...(id !== undefined ? { id } : {}),
    ...(retry !== undefined ? { retry } : {}),
  };
}

/**
 * Bounded exponential backoff with upward jitter (DoD-4).
 * attempt 0 → base 1 s (never below 1 s), then ×2, hard-capped at 30 s.
 * Jitter is applied *above* the base: [base, base * 1.25], then clamped to max.
 * Worst-case (always-minimum) schedule: 1+2+4+8+16+30 ≈ 61 s for 6 attempts —
 * well under rate_limit_layer's 60/min and matches DoD-4's ≈6/first-minute budget.
 */
export function computeBackoffMs(
  attempt: number,
  random: () => number = Math.random,
): number {
  const exp = Math.max(0, Math.floor(attempt));
  const base = Math.min(
    SSE_BACKOFF_INITIAL_MS * 2 ** exp,
    SSE_BACKOFF_MAX_MS,
  );
  // Upward-only jitter: delay ∈ [base, base * 1.25], never below the DoD floor.
  const unit = clamp01(random());
  const withJitter = Math.floor(base * (1 + 0.25 * unit));
  return Math.min(withJitter, SSE_BACKOFF_MAX_MS);
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function defaultSchedule(fn: () => void, ms: number): { clear: () => void } {
  const id = setTimeout(fn, ms);
  return { clear: () => clearTimeout(id) };
}

/**
 * Dependency-free SSE-over-fetch client for `GET /api/events`.
 * Bearer token via Authorization header only — never URL/query (0080/FE-A1).
 */
export function connectDaemonEvents(
  options: ConnectSseOptions,
): { stop: () => void } {
  const fetchImpl = options.fetchImpl ?? fetch;
  const getToken = options.getToken ?? getAuthToken;
  const buildUrl = options.buildUrl ?? (() => buildApiUrl("/events"));
  const schedule = options.schedule ?? defaultSchedule;
  const random = options.random ?? Math.random;
  const stableAfterMs = options.stableAfterMs ?? SSE_DEFAULT_STABLE_AFTER_MS;
  const maxUnstableFailures = options.maxUnstableFailures ?? 12;

  let stopped = false;
  let attempt = 0;
  let controller: AbortController | null = null;
  let pendingTimer: { clear: () => void } | null = null;
  let stableTimer: { clear: () => void } | null = null;
  let currentState: SseTransportState | null = null;

  const setState = (state: SseTransportState) => {
    if (stopped && state !== "stopped") return;
    if (currentState === state) return;
    currentState = state;
    options.onStateChange?.(state);
  };

  const clearTimers = () => {
    pendingTimer?.clear();
    pendingTimer = null;
    stableTimer?.clear();
    stableTimer = null;
  };

  const abortInFlight = () => {
    if (controller) {
      controller.abort();
      controller = null;
    }
  };

  const stop = () => {
    if (stopped) return;
    stopped = true;
    clearTimers();
    abortInFlight();
    setState("stopped");
  };

  const markStable = () => {
    attempt = 0;
  };

  const scheduleReconnect = () => {
    if (stopped) return;
    if (attempt >= maxUnstableFailures) {
      setState("fallback");
      return;
    }
    setState("reconnecting");
    const delay = computeBackoffMs(attempt, random);
    attempt += 1;
    pendingTimer?.clear();
    pendingTimer = schedule(() => {
      pendingTimer = null;
      if (!stopped) void runLoop();
    }, delay);
  };

  const readStream = async (body: ReadableStream<Uint8Array>) => {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let receivedEvent = false;

    stableTimer?.clear();
    stableTimer = schedule(() => {
      stableTimer = null;
      if (!stopped && !receivedEvent) {
        // Open duration alone proves stability (DoD-4).
        markStable();
      }
    }, stableAfterMs);

    try {
      while (!stopped) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          // Normalize CRLF → LF before frame split so `\r\n\r\n` delimits
          // correctly (parseSseFrame also normalizes, but split must see `\n\n`).
          buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";
          for (const frame of parts) {
            const parsed = parseSseFrame(frame);
            if (!parsed) continue;
            receivedEvent = true;
            markStable();
            options.onEvent(parsed.event, parsed.data);
          }
        }
      }
      // Flush decoder for any trailing multibyte sequence (no more stream).
      buffer += decoder.decode();
      if (buffer.trim()) {
        const parsed = parseSseFrame(buffer);
        if (parsed) {
          receivedEvent = true;
          markStable();
          options.onEvent(parsed.event, parsed.data);
        }
      }
    } finally {
      stableTimer?.clear();
      stableTimer = null;
      try {
        reader.releaseLock();
      } catch {
        // already released
      }
    }
  };

  const runLoop = async () => {
    if (stopped) return;

    // Enter connecting for both first open and post-backoff attempts.
    // (Backoff path briefly sets "reconnecting" while waiting on the timer.)
    setState("connecting");

    const url = buildUrl();
    const token = getToken();
    controller = new AbortController();
    const signal = controller.signal;

    const headers = new Headers();
    headers.set("Accept", "text/event-stream");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    let res: Response;
    try {
      res = await fetchImpl(url, {
        method: "GET",
        headers,
        signal,
        // No cache: stream must be live
        cache: "no-store",
      });
    } catch (err) {
      if (stopped || (err instanceof DOMException && err.name === "AbortError")) {
        return;
      }
      // Network / TypeError — retry with backoff
      scheduleReconnect();
      return;
    }

    if (stopped) return;

    // Auth hard-stop (DoD-4): invalidate session, do not reconnect.
    if (res.status === 401 || res.status === 403) {
      maybeInvalidateSession(res.status, token);
      setState("auth_failed");
      return;
    }

    // Permanent fallback — older daemon / sidecar without the route.
    if (res.status === 404 || res.status === 405) {
      setState("fallback");
      return;
    }

    if (!res.ok || !res.body) {
      scheduleReconnect();
      return;
    }

    // Connected — live while stream is open. Backoff is NOT reset here (DoD-4).
    setState("live");

    try {
      await readStream(res.body);
    } catch (err) {
      if (stopped || (err instanceof DOMException && err.name === "AbortError")) {
        return;
      }
      // Stream read error → reconnect
    }

    if (stopped) return;
    // Stream ended without stop — reconnect (daemon restart, keep-alive drop, etc.)
    scheduleReconnect();
  };

  void runLoop();

  return { stop };
}

/** Parse JSON DaemonEvent data; returns null on malformed payload. */
export function parseDaemonEventData(data: string): DaemonEvent | null {
  try {
    const raw: unknown = JSON.parse(data);
    if (!raw || typeof raw !== "object") return null;
    const o = raw as Record<string, unknown>;
    if (
      typeof o.pendingTransactions !== "number" ||
      typeof o.unauditedDrift !== "number" ||
      typeof o.indexReady !== "boolean" ||
      typeof o.graphReady !== "boolean"
    ) {
      return null;
    }
    return {
      pendingTransactions: o.pendingTransactions,
      unauditedDrift: o.unauditedDrift,
      indexReady: o.indexReady,
      graphReady: o.graphReady,
    };
  } catch {
    return null;
  }
}
