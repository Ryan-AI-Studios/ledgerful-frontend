import { apiPost } from "./api";
import type { ExtractBody, ExtractResponse } from "./api/contract-types";
import { getAuthToken, setAuthToken } from "./utils";

/** Fragment form minted by `ledgerful web start --open`: `#c=<hex>` (256-bit → 64 hex chars). */
const HANDOFF_HASH_RE = /^#c=([0-9a-fA-F]{64})$/;

/**
 * Banner copy when automatic `#c=` exchange fails or the code is expired.
 * Shared by ProjectContext and TokenPrompt so the strings stay in lockstep.
 */
export const HANDOFF_FAILED_MESSAGE =
  "Automatic sign-in expired — paste the token from .ledgerful/web-session-token " +
  "(written by ledgerful web start).";

type SessionExchangeBody = ExtractBody<"/api/session/exchange", "post">;
type SessionExchangeResponse = ExtractResponse<"/api/session/exchange", "post">;

/**
 * Module-level in-flight exchange so React Strict Mode remounts join the same
 * promise instead of abandoning a consumed handoff code after the hash is stripped.
 */
let inflightExchange: Promise<string> | null = null;

/**
 * Parse `location.hash` for a handoff code. Returns the hex code or null when
 * the fragment is missing or not exactly 64 hex chars (`#c=<64-hex>` only).
 */
export function readHandoffCode(): string | null {
  if (typeof window === "undefined") return null;
  const match = HANDOFF_HASH_RE.exec(window.location.hash);
  if (!match) return null;
  return match[1] ?? null;
}

/**
 * Same API base derivation as `buildApiUrl`:
 * `process.env.NEXT_PUBLIC_LEDGERFUL_API_URL ?? "http://127.0.0.1:52001"`.
 * Returns true only when that origin matches `window.location.origin`.
 * Cross-origin bases skip bootstrap (no CORS change in this track).
 */
export function isSameOriginApiBase(): boolean {
  if (typeof window === "undefined") return false;
  const base =
    process.env.NEXT_PUBLIC_LEDGERFUL_API_URL ?? "http://127.0.0.1:52001";
  try {
    return new URL(base).origin === window.location.origin;
  } catch {
    return false;
  }
}

/**
 * Strip `#c=…` from the address bar. Must run synchronously before any
 * `await` on the exchange request (DoD-6).
 */
export function clearHandoffHash(): void {
  if (typeof window === "undefined") return;
  const { pathname, search } = window.location;
  window.history.replaceState(null, "", `${pathname}${search}`);
}

/**
 * Read the handoff code and strip the fragment immediately (before any await).
 * Returns null when no valid `#c=<64-hex>` is present (hash left untouched).
 */
export function takeHandoffCodeFromLocation(): string | null {
  const code = readHandoffCode();
  if (code === null) return null;
  clearHandoffHash();
  return code;
}

/**
 * Exchange a single-use handoff code for the long-lived session bearer.
 * Code travels in the JSON body only — never as a query param.
 * Unauthenticated by design; 403 means bad/expired code, not session invalid.
 */
export async function exchangeHandoffCode(
  code: string,
): Promise<SessionExchangeResponse> {
  const body: SessionExchangeBody = { code };
  return apiPost<SessionExchangeResponse>("/session/exchange", body);
}

/**
 * Start or join the single-flight handoff exchange.
 *
 * - Returns a resolved promise if a token is already stored.
 * - Returns the shared in-flight promise if an exchange is already running
 *   (Strict Mode remount joins instead of abandoning a burned code).
 * - Otherwise takes `#c=`, strips the hash, exchanges once, and always calls
 *   `setAuthToken` at module level so remounts can re-seed from `getAuthToken()`.
 * - Returns null when bootstrap is not applicable (SSR, cross-origin, no hash).
 */
export function beginHandoffExchange(): Promise<string> | null {
  if (typeof window === "undefined") return null;

  const existing = getAuthToken();
  if (existing) return Promise.resolve(existing);

  if (inflightExchange) return inflightExchange;

  if (!isSameOriginApiBase()) return null;

  const code = takeHandoffCodeFromLocation();
  if (!code) return null;

  inflightExchange = exchangeHandoffCode(code)
    .then((res) => {
      setAuthToken(res.token);
      inflightExchange = null;
      return res.token;
    })
    .catch((err: unknown) => {
      inflightExchange = null;
      throw err;
    });

  return inflightExchange;
}

/**
 * True when mount should attempt handoff bootstrap (same-origin + valid hash,
 * or an exchange already in flight, and no existing token). Used to seed
 * `bootstrapping` so TokenPrompt does not flash during exchange or Strict Mode remount.
 */
export function shouldBootstrapHandoff(): boolean {
  if (typeof window === "undefined") return false;
  if (getAuthToken()) return false;
  if (inflightExchange) return true;
  if (!isSameOriginApiBase()) return false;
  return readHandoffCode() !== null;
}

/**
 * Clears module-level in-flight exchange state between unit tests.
 * Not for production callers.
 */
export function resetHandoffExchangeState(): void {
  inflightExchange = null;
}
