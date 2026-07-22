/**
 * Telemetry ingest pure logic (0077).
 * Bar-raising credential + fail-closed quotas + deep field caps.
 * Honest ceiling: embedded CLI token is obfuscation, not strong auth.
 */

export const PAYLOAD_MAX_SIZE = 10 * 1024; // 10KB
export const AUTH_HEADER = "x-ledgerful-telemetry-token";
export const DEFAULT_INGEST_TOKEN = "lf-tel-v1-7c4e9b2a1f8d3e6a0c5b9d4e8f1a2b3c";

/** Starting caps from phase0-memo / DoD-3 */
export const CAPS = {
  stringMax: 128,
  commandCountKeys: 64,
  commandKeyMax: 64,
  commandValueMax: 1_000_000,
  featuresMax: 64,
  featureItemMax: 64,
  activeDaysMax: 366,
  jsonDepthMax: 8,
} as const;

export const QUOTA = {
  globalPerMin: 120,
  globalPerDay: 5_000,
  ipPerMin: 30,
} as const;

export type JsonOk = { ok: true };
export type JsonErr = { ok: false; status: number; error: string };
export type JsonResult = JsonOk | JsonErr;

export function jsonResponse(
  status: number,
  body: Record<string, unknown> | null,
): Response {
  if (body === null) {
    return new Response(null, { status });
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Reject browser-like Origin (CLI-only surface; no CORS allow headers). */
export function rejectBrowserOrigin(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return jsonResponse(403, { error: "CORS not allowed" });
  }
  const origin = req.headers.get("origin");
  if (origin !== null && origin !== "") {
    return jsonResponse(403, { error: "Browser origin not allowed" });
  }
  return null;
}

/**
 * Accept current + up to N=2 previous tokens.
 * Env: TELEMETRY_INGEST_TOKEN (current), TELEMETRY_INGEST_TOKEN_PREV (comma-separated).
 * Falls back to DEFAULT_INGEST_TOKEN when no env is set (matches engine default).
 */
export function allowedTokens(env: {
  get(key: string): string | undefined;
}): string[] {
  const current = env.get("TELEMETRY_INGEST_TOKEN")?.trim() ||
    DEFAULT_INGEST_TOKEN;
  const prevRaw = env.get("TELEMETRY_INGEST_TOKEN_PREV")?.trim() ?? "";
  const prev = prevRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 2);
  return [current, ...prev];
}

export function isAuthRequired(env: {
  get(key: string): string | undefined;
}): boolean {
  const v = env.get("TELEMETRY_REQUIRE_TOKEN")?.trim().toLowerCase();
  // Production end-state default: required. Explicit false keeps cutover (a).
  if (v === "false" || v === "0" || v === "optional") return false;
  if (v === "true" || v === "1" || v === "required") return true;
  // Default required when unset (CLI ships header; silent-fail for old binaries).
  return true;
}

export function checkAuth(
  req: Request,
  env: { get(key: string): string | undefined },
): JsonResult {
  const provided = req.headers.get(AUTH_HEADER)?.trim() ?? "";
  const tokens = allowedTokens(env);
  const match = provided.length > 0 && tokens.includes(provided);
  if (match) return { ok: true };
  if (!isAuthRequired(env) && provided.length === 0) {
    // Cutover step (a): optional credential — missing header allowed.
    return { ok: true };
  }
  return { ok: false, status: 401, error: "unauthorized" };
}

/**
 * True client IP matrix (phase0 / DoD-2):
 * Only Deno.serve `connInfo.remoteAddr` is treated as trustworthy (not a
 * client-controlled header). All request headers including XFF /
 * cf-connecting-ip / x-real-ip are ignored for quota keys — they are
 * spoofable from the caller. Missing connInfo → "unknown" → per-IP
 * fail-closed; global quotas remain the primary control (DoD-2 fallback:
 * global-quota-only when no trustworthy IP).
 */
function normalizeIpHost(host: string): string {
  const trimmed = host.trim();
  // [IPv6]:port
  const bracketed = trimmed.match(/^\[([^\]]+)\](?::\d+)?$/);
  if (bracketed) return bracketed[1];
  // IPv4:port
  const ipv4 = trimmed.match(/^(\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?$/);
  if (ipv4) return ipv4[1];
  return trimmed;
}

export function resolveClientIp(
  _req: Request,
  remoteAddr?: string | null,
): string | "unknown" {
  if (remoteAddr && remoteAddr.trim() && remoteAddr !== "unknown") {
    return normalizeIpHost(remoteAddr);
  }
  return "unknown";
}

export function isStrictLimiter(
  env: { get(key: string): string | undefined },
): boolean {
  // Soft-fail only when explicitly disabled AND non-prod.
  const strict = env.get("LEDGERFUL_TELEMETRY_STRICT")?.trim().toLowerCase();
  if (strict === "false" || strict === "0") {
    const envName = env.get("ENVIRONMENT")?.trim().toLowerCase() ??
      env.get("DENO_ENV")?.trim().toLowerCase() ?? "";
    if (envName === "development" || envName === "dev" || envName === "local") {
      return false;
    }
  }
  return true;
}

export type UpstashClient = {
  incr(key: string): Promise<{ ok: true; value: number } | { ok: false }>;
  expire(key: string, seconds: number): Promise<boolean>;
  del(key: string): Promise<void>;
};

export function createUpstashClient(
  baseUrl: string,
  token: string,
  fetchFn: typeof fetch = fetch,
): UpstashClient {
  const headers = { Authorization: `Bearer ${token}` };
  return {
    async incr(key: string) {
      try {
        const res = await fetchFn(
          `${baseUrl}/incr/${encodeURIComponent(key)}`,
          { headers },
        );
        if (!res.ok) return { ok: false as const };
        const body = await res.json() as { result?: number };
        if (typeof body.result !== "number") return { ok: false as const };
        return { ok: true as const, value: body.result };
      } catch {
        return { ok: false as const };
      }
    },
    async expire(key: string, seconds: number) {
      try {
        const res = await fetchFn(
          `${baseUrl}/expire/${encodeURIComponent(key)}/${seconds}`,
          { headers },
        );
        return res.ok;
      } catch {
        return false;
      }
    },
    async del(key: string) {
      try {
        await fetchFn(`${baseUrl}/del/${encodeURIComponent(key)}`, {
          headers,
        });
      } catch {
        // ignore
      }
    },
  };
}

export type QuotaDecision =
  | { allow: true }
  | { allow: false; status: number; error: string };

/**
 * Fail-closed global + per-IP quotas.
 * Any limiter-unavailable path rejects in production (strict).
 *
 * When IP is unknown (no Deno connInfo), per-IP is skipped and only
 * **global** quotas bind (DoD-2 global-quota-only residual). We still
 * require Upstash to be healthy for the global counters.
 */
export async function enforceQuotas(opts: {
  env: { get(key: string): string | undefined };
  ip: string | "unknown";
  upstash: UpstashClient | null;
  now?: Date;
}): Promise<QuotaDecision> {
  const strict = isStrictLimiter(opts.env);
  if (!opts.upstash) {
    if (strict) {
      return {
        allow: false,
        status: 503,
        error: "rate limiter unavailable",
      };
    }
    return { allow: true };
  }

  const now = opts.now ?? new Date();
  const minBucket = Math.floor(now.getTime() / 60_000);
  const dayBucket = now.toISOString().slice(0, 10); // UTC YYYY-MM-DD

  // Global per-minute
  const gMinKey = `tel:g:min:${minBucket}`;
  const gMin = await opts.upstash.incr(gMinKey);
  if (!gMin.ok) {
    return strict
      ? { allow: false, status: 503, error: "rate limiter unavailable" }
      : { allow: true };
  }
  if (gMin.value === 1) {
    const expOk = await opts.upstash.expire(gMinKey, 120);
    if (!expOk) {
      await opts.upstash.del(gMinKey);
      return strict
        ? { allow: false, status: 503, error: "rate limiter unavailable" }
        : { allow: true };
    }
  }
  if (gMin.value > QUOTA.globalPerMin) {
    return { allow: false, status: 429, error: "global rate limit exceeded" };
  }

  // Global per-day
  const gDayKey = `tel:g:day:${dayBucket}`;
  const gDay = await opts.upstash.incr(gDayKey);
  if (!gDay.ok) {
    return strict
      ? { allow: false, status: 503, error: "rate limiter unavailable" }
      : { allow: true };
  }
  if (gDay.value === 1) {
    const expOk = await opts.upstash.expire(gDayKey, 86_400 + 3_600);
    if (!expOk) {
      await opts.upstash.del(gDayKey);
      return strict
        ? { allow: false, status: 503, error: "rate limiter unavailable" }
        : { allow: true };
    }
  }
  if (gDay.value > QUOTA.globalPerDay) {
    return {
      allow: false,
      status: 429,
      error: "global daily limit exceeded",
    };
  }

  // Per-IP only when connInfo provides a trustworthy address.
  // Unknown IP → global-quota-only (DoD-2 fallback), not a free bucket.
  if (opts.ip === "unknown") {
    return { allow: true };
  }

  const ipKey = `tel:ip:min:${opts.ip}:${minBucket}`;
  const ipCount = await opts.upstash.incr(ipKey);
  if (!ipCount.ok) {
    return strict
      ? { allow: false, status: 503, error: "rate limiter unavailable" }
      : { allow: true };
  }
  if (ipCount.value === 1) {
    const expOk = await opts.upstash.expire(ipKey, 120);
    if (!expOk) {
      await opts.upstash.del(ipKey);
      return strict
        ? { allow: false, status: 503, error: "rate limiter unavailable" }
        : { allow: true };
    }
  }
  if (ipCount.value > QUOTA.ipPerMin) {
    return { allow: false, status: 429, error: "rate limit exceeded" };
  }

  return { allow: true };
}

export function isUUID(str: unknown): boolean {
  return typeof str === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      .test(str);
}

export function isISO8601(str: unknown): boolean {
  return typeof str === "string" && !Number.isNaN(Date.parse(str));
}

/** Reject non-integer / NaN / Infinity. */
export function isNonNegInt(n: unknown, max: number): boolean {
  return typeof n === "number" &&
    Number.isInteger(n) &&
    !Number.isNaN(n) &&
    Number.isFinite(n) &&
    n >= 0 &&
    n <= max;
}

export function jsonDepth(value: unknown, depth = 0): number {
  if (depth > CAPS.jsonDepthMax) return depth;
  if (value === null || typeof value !== "object") return depth;
  if (Array.isArray(value)) {
    let max = depth;
    for (const item of value) {
      max = Math.max(max, jsonDepth(item, depth + 1));
    }
    return max;
  }
  let max = depth;
  for (const v of Object.values(value as Record<string, unknown>)) {
    max = Math.max(max, jsonDepth(v, depth + 1));
  }
  return max;
}

const REQUIRED_FIELDS = [
  "anonymous_id",
  "client_version",
  "platform",
  "sent_at",
  "window_start",
  "window_end",
  "command_counts",
  "features_enabled",
  "active_days_in_window",
] as const;

const ALLOWED_FIELDS = new Set<string>([...REQUIRED_FIELDS, "schema_version"]);

export type TelemetryPayload = {
  schema_version: number;
  anonymous_id: string;
  client_version: string;
  platform: string;
  sent_at: string;
  window_start: string;
  window_end: string;
  command_counts: Record<string, number>;
  features_enabled: string[];
  active_days_in_window: number;
};

export function validatePayload(payload: unknown): JsonResult & {
  data?: TelemetryPayload;
} {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, status: 400, error: "Invalid JSON payload" };
  }
  const p = payload as Record<string, unknown>;

  if (jsonDepth(p) > CAPS.jsonDepthMax) {
    return { ok: false, status: 400, error: "JSON nesting too deep" };
  }

  if (p.schema_version !== 1) {
    return { ok: false, status: 400, error: "Unsupported schema version" };
  }

  for (const key of Object.keys(p)) {
    if (!ALLOWED_FIELDS.has(key)) {
      return { ok: false, status: 400, error: `Unknown field: ${key}` };
    }
  }
  for (const field of REQUIRED_FIELDS) {
    if (!(field in p)) {
      return {
        ok: false,
        status: 400,
        error: `Missing required field: ${field}`,
      };
    }
  }

  if (!isUUID(p.anonymous_id)) {
    return {
      ok: false,
      status: 400,
      error: "Invalid anonymous_id: must be a UUID",
    };
  }
  if (typeof p.client_version !== "string") {
    return {
      ok: false,
      status: 400,
      error: "Invalid client_version: must be a string",
    };
  }
  if (p.client_version.length > CAPS.stringMax) {
    return {
      ok: false,
      status: 400,
      error: "Invalid client_version: too long",
    };
  }
  if (typeof p.platform !== "string") {
    return {
      ok: false,
      status: 400,
      error: "Invalid platform: must be a string",
    };
  }
  if (p.platform.length > CAPS.stringMax) {
    return { ok: false, status: 400, error: "Invalid platform: too long" };
  }
  if (!isISO8601(p.sent_at) || !isISO8601(p.window_start) || !isISO8601(p.window_end)) {
    return {
      ok: false,
      status: 400,
      error:
        "Invalid date format: sent_at, window_start, and window_end must be ISO 8601",
    };
  }
  if (!isNonNegInt(p.active_days_in_window, CAPS.activeDaysMax)) {
    return {
      ok: false,
      status: 400,
      error:
        "Invalid active_days_in_window: must be an integer 0…366 (no float/NaN/Infinity)",
    };
  }

  const sentAt = new Date(p.sent_at as string);
  const windowStart = new Date(p.window_start as string);
  const windowEnd = new Date(p.window_end as string);
  if (sentAt < windowStart || windowEnd < windowStart) {
    return {
      ok: false,
      status: 400,
      error:
        "Invalid date range: sent_at and window_end must be >= window_start",
    };
  }

  if (
    typeof p.command_counts !== "object" ||
    p.command_counts === null ||
    Array.isArray(p.command_counts)
  ) {
    return {
      ok: false,
      status: 400,
      error: "Invalid command_counts: must be an object",
    };
  }
  const counts = p.command_counts as Record<string, unknown>;
  const keys = Object.keys(counts);
  if (keys.length > CAPS.commandCountKeys) {
    return {
      ok: false,
      status: 400,
      error: "Invalid command_counts: too many keys",
    };
  }
  for (const k of keys) {
    if (k.length > CAPS.commandKeyMax) {
      return {
        ok: false,
        status: 400,
        error: "Invalid command_counts: key too long",
      };
    }
    const v = counts[k];
    if (!isNonNegInt(v, CAPS.commandValueMax)) {
      return {
        ok: false,
        status: 400,
        error:
          "Invalid command_counts: values must be integers 0…1000000",
      };
    }
  }

  if (!Array.isArray(p.features_enabled)) {
    return {
      ok: false,
      status: 400,
      error: "Invalid features_enabled: must be an array of strings",
    };
  }
  if (p.features_enabled.length > CAPS.featuresMax) {
    return {
      ok: false,
      status: 400,
      error: "Invalid features_enabled: too many items",
    };
  }
  for (const item of p.features_enabled) {
    if (typeof item !== "string" || item.length > CAPS.featureItemMax) {
      return {
        ok: false,
        status: 400,
        error:
          "Invalid features_enabled: each item must be a string ≤64 chars",
      };
    }
  }

  return {
    ok: true,
    data: {
      schema_version: 1,
      anonymous_id: p.anonymous_id as string,
      client_version: p.client_version as string,
      platform: p.platform as string,
      sent_at: p.sent_at as string,
      window_start: p.window_start as string,
      window_end: p.window_end as string,
      command_counts: counts as Record<string, number>,
      features_enabled: p.features_enabled as string[],
      active_days_in_window: p.active_days_in_window as number,
    },
  };
}

export function serviceRoleKey(env: {
  get(key: string): string | undefined;
}): string {
  // Prefer project secret SERVICE_ROLE_KEY (avoids reserved SUPABASE_ prefix
  // injection issues on Edge). Accept SUPABASE_SERVICE_ROLE_KEY for sb_secret_ model.
  return (
    env.get("SERVICE_ROLE_KEY")?.trim() ||
    env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() ||
    ""
  );
}

/**
 * Handler order: method → origin → auth → size → quota → parse → deep-validate → insert
 */
export async function handleTelemetryRequest(
  req: Request,
  deps: {
    env: { get(key: string): string | undefined };
    fetchFn?: typeof fetch;
    remoteAddr?: string | null;
    insert: (row: TelemetryPayload) => Promise<{ error: unknown | null }>;
  },
): Promise<Response> {
  const env = deps.env;
  const fetchFn = deps.fetchFn ?? fetch;

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const originReject = rejectBrowserOrigin(req);
  if (originReject) return originReject;

  const auth = checkAuth(req, env);
  if (!auth.ok) {
    return jsonResponse(auth.status, { error: auth.error });
  }

  const contentLengthStr = req.headers.get("content-length");
  if (contentLengthStr) {
    const contentLength = parseInt(contentLengthStr, 10);
    if (Number.isNaN(contentLength) || contentLength > PAYLOAD_MAX_SIZE) {
      return jsonResponse(413, { error: "Payload too large" });
    }
  }

  let body: ArrayBuffer;
  try {
    body = await req.arrayBuffer();
  } catch {
    return jsonResponse(400, { error: "Invalid JSON payload" });
  }
  if (body.byteLength > PAYLOAD_MAX_SIZE) {
    return jsonResponse(413, { error: "Payload too large" });
  }

  const upstashUrl = env.get("UPSTASH_REDIS_REST_URL")?.trim() ?? "";
  const upstashToken = env.get("UPSTASH_REDIS_REST_TOKEN")?.trim() ?? "";
  const upstash = upstashUrl && upstashToken
    ? createUpstashClient(upstashUrl, upstashToken, fetchFn)
    : null;

  const ip = resolveClientIp(req, deps.remoteAddr);
  const quota = await enforceQuotas({ env, ip, upstash });
  if (!quota.allow) {
    return jsonResponse(quota.status, { error: quota.error });
  }

  let parsed: unknown;
  try {
    const text = new TextDecoder().decode(body);
    parsed = JSON.parse(text);
  } catch {
    return jsonResponse(400, { error: "Invalid JSON payload" });
  }

  const validated = validatePayload(parsed);
  if (!validated.ok) {
    return jsonResponse(validated.status, { error: validated.error });
  }
  if (!validated.data) {
    return jsonResponse(400, { error: "Invalid JSON payload" });
  }

  const { error } = await deps.insert(validated.data);
  if (error) {
    return jsonResponse(500, { error: "Internal server error" });
  }
  return jsonResponse(204, null);
}
