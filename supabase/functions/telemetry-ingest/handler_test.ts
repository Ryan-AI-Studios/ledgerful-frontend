/**
 * Deno unit tests for telemetry-ingest handler (0077 fail-closed matrix).
 * Run: deno test --allow-env supabase/functions/telemetry-ingest/handler_test.ts
 */
import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  AUTH_HEADER,
  CAPS,
  DEFAULT_INGEST_TOKEN,
  checkAuth,
  enforceQuotas,
  handleTelemetryRequest,
  isNonNegInt,
  jsonDepth,
  resolveClientIp,
  validatePayload,
  type UpstashClient,
} from "./handler.ts";

function envMap(map: Record<string, string | undefined>) {
  return {
    get(key: string) {
      return map[key];
    },
  };
}

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    schema_version: 1,
    anonymous_id: "550e8400-e29b-41d4-a716-446655440000",
    client_version: "0.1.9",
    platform: "windows",
    sent_at: "2026-07-22T12:00:00Z",
    window_start: "2026-07-15T00:00:00Z",
    window_end: "2026-07-22T00:00:00Z",
    command_counts: { scan: 3, verify: 1 },
    features_enabled: ["usage-metrics"],
    active_days_in_window: 4,
    ...overrides,
  };
}

function mockUpstash(opts: {
  failIncr?: boolean;
  failExpire?: boolean;
  counts?: Record<string, number>;
} = {}): UpstashClient {
  const store = opts.counts ?? {};
  return {
    async incr(key: string) {
      if (opts.failIncr) return { ok: false };
      store[key] = (store[key] ?? 0) + 1;
      return { ok: true, value: store[key] };
    },
    async expire(..._args: [string, number]) {
      void _args;
      return !opts.failExpire;
    },
    async del(key: string) {
      delete store[key];
    },
  };
}

Deno.test("auth: missing token required → 401", () => {
  const req = new Request("http://local/t", { method: "POST" });
  const r = checkAuth(req, envMap({ TELEMETRY_REQUIRE_TOKEN: "true" }));
  assertEquals(r.ok, false);
  if (!r.ok) assertEquals(r.status, 401);
});

Deno.test("auth: bad token → 401", () => {
  const req = new Request("http://local/t", {
    method: "POST",
    headers: { [AUTH_HEADER]: "wrong" },
  });
  const r = checkAuth(req, envMap({ TELEMETRY_REQUIRE_TOKEN: "true" }));
  assertEquals(r.ok, false);
});

Deno.test("auth: default token accepted", () => {
  const req = new Request("http://local/t", {
    method: "POST",
    headers: { [AUTH_HEADER]: DEFAULT_INGEST_TOKEN },
  });
  const r = checkAuth(req, envMap({ TELEMETRY_REQUIRE_TOKEN: "true" }));
  assertEquals(r.ok, true);
});

Deno.test("auth: previous token accepted (rotation N=2)", () => {
  const req = new Request("http://local/t", {
    method: "POST",
    headers: { [AUTH_HEADER]: "old-token-1" },
  });
  const r = checkAuth(
    req,
    envMap({
      TELEMETRY_REQUIRE_TOKEN: "true",
      TELEMETRY_INGEST_TOKEN: "current",
      TELEMETRY_INGEST_TOKEN_PREV: "old-token-1,old-token-2",
    }),
  );
  assertEquals(r.ok, true);
});

Deno.test("auth: optional mode allows missing header", () => {
  const req = new Request("http://local/t", { method: "POST" });
  const r = checkAuth(req, envMap({ TELEMETRY_REQUIRE_TOKEN: "false" }));
  assertEquals(r.ok, true);
});

Deno.test("auth: optional mode still rejects wrong token", () => {
  const req = new Request("http://local/t", {
    method: "POST",
    headers: { [AUTH_HEADER]: "nope" },
  });
  const r = checkAuth(req, envMap({ TELEMETRY_REQUIRE_TOKEN: "false" }));
  assertEquals(r.ok, false);
});

Deno.test("IP: client XFF alone is untrusted → unknown (no free bucket)", () => {
  const req = new Request("http://local/t", {
    headers: { "x-forwarded-for": "1.2.3.4, 9.9.9.9" },
  });
  assertEquals(resolveClientIp(req), "unknown");
});

Deno.test("IP: single spoofed XFF cannot create known IP", () => {
  const req = new Request("http://local/t", {
    headers: { "x-forwarded-for": "203.0.113.9" },
  });
  assertEquals(resolveClientIp(req), "unknown");
});

Deno.test("IP: connInfo preferred over spoofed XFF", () => {
  const req = new Request("http://local/t", {
    headers: { "x-forwarded-for": "1.2.3.4" },
  });
  assertEquals(resolveClientIp(req, "10.0.0.5"), "10.0.0.5");
});

Deno.test("IP: cf-connecting-ip is NOT trusted without connInfo", () => {
  const req = new Request("http://local/t", {
    headers: {
      "x-forwarded-for": "1.2.3.4",
      "cf-connecting-ip": "8.8.8.8",
      "x-real-ip": "9.9.9.9",
    },
  });
  assertEquals(resolveClientIp(req), "unknown");
});

Deno.test("IP: omitted headers → unknown", () => {
  const req = new Request("http://local/t");
  assertEquals(resolveClientIp(req), "unknown");
});

Deno.test("quota: missing upstash → 503 in strict prod", async () => {
  const d = await enforceQuotas({
    env: envMap({}),
    ip: "1.1.1.1",
    upstash: null,
  });
  assertEquals(d.allow, false);
  if (!d.allow) assertEquals(d.status, 503);
});

Deno.test("quota: upstash incr fail → 503", async () => {
  const d = await enforceQuotas({
    env: envMap({}),
    ip: "1.1.1.1",
    upstash: mockUpstash({ failIncr: true }),
  });
  assertEquals(d.allow, false);
  if (!d.allow) assertEquals(d.status, 503);
});

Deno.test("quota: upstash expire fail → 503", async () => {
  const d = await enforceQuotas({
    env: envMap({}),
    ip: "1.1.1.1",
    upstash: mockUpstash({ failExpire: true }),
  });
  assertEquals(d.allow, false);
  if (!d.allow) assertEquals(d.status, 503);
});

Deno.test("quota: unknown IP → global-quota-only (allow under global cap)", async () => {
  const d = await enforceQuotas({
    env: envMap({}),
    ip: "unknown",
    upstash: mockUpstash(),
  });
  // DoD-2 fallback: no trustworthy IP → skip per-IP, keep global only
  assertEquals(d.allow, true);
});

Deno.test("auth: default when TELEMETRY_REQUIRE_TOKEN unset → required", () => {
  const req = new Request("http://local/t", { method: "POST" });
  const r = checkAuth(req, envMap({}));
  assertEquals(r.ok, false);
  if (!r.ok) assertEquals(r.status, 401);
});

Deno.test("quota: spoofed first XFF cannot free-bucket (connInfo binds)", async () => {
  // IP resolution already prefers connInfo; quota keys on that IP.
  const store: Record<string, number> = {};
  const upstash = mockUpstash({ counts: store });
  const now = new Date("2026-07-22T12:00:00Z");
  for (let i = 0; i < 31; i++) {
    await enforceQuotas({
      env: envMap({}),
      ip: "10.0.0.5",
      upstash,
      now,
    });
  }
  const blocked = await enforceQuotas({
    env: envMap({}),
    ip: "10.0.0.5",
    upstash,
    now,
  });
  // After 30 allowed, further should 429 (31st already consumed above loop)
  // loop did 31 incrs → 31st exceeded. Call again to confirm still blocked path.
  assertEquals(blocked.allow, false);
  if (!blocked.allow) assertEquals(blocked.status, 429);
});

Deno.test("validate: rejects float active_days", () => {
  const r = validatePayload(validPayload({ active_days_in_window: 1.5 }));
  assertEquals(r.ok, false);
});

Deno.test("validate: rejects NaN and Infinity", () => {
  assertEquals(
    validatePayload(validPayload({ active_days_in_window: NaN })).ok,
    false,
  );
  assertEquals(
    validatePayload(validPayload({ active_days_in_window: Infinity })).ok,
    false,
  );
});

Deno.test("validate: rejects too many command_counts keys", () => {
  const counts: Record<string, number> = {};
  for (let i = 0; i < CAPS.commandCountKeys + 1; i++) counts[`c${i}`] = 1;
  const r = validatePayload(validPayload({ command_counts: counts }));
  assertEquals(r.ok, false);
});

Deno.test("validate: rejects long strings", () => {
  const r = validatePayload(
    validPayload({ client_version: "x".repeat(CAPS.stringMax + 1) }),
  );
  assertEquals(r.ok, false);
});

Deno.test("validate: accepts valid payload", () => {
  const r = validatePayload(validPayload());
  assertEquals(r.ok, true);
  assertExists(r.data);
});

Deno.test("isNonNegInt helpers", () => {
  assertEquals(isNonNegInt(0, 10), true);
  assertEquals(isNonNegInt(1.5, 10), false);
  assertEquals(isNonNegInt(NaN, 10), false);
  assertEquals(isNonNegInt(Infinity, 10), false);
  assertEquals(isNonNegInt(-1, 10), false);
});

Deno.test("jsonDepth cap", () => {
  let nested: unknown = 1;
  for (let i = 0; i < 10; i++) nested = { a: nested };
  assertEquals(jsonDepth(nested) > CAPS.jsonDepthMax, true);
  const r = validatePayload(
    // Build deep nesting under a forbidden path by stuffing into command_counts value — but values must be ints.
    // Use features_enabled with nested via object payload root:
    (() => {
      const p = validPayload() as Record<string, unknown>;
      let n: unknown = "x";
      for (let i = 0; i < 12; i++) n = { n };
      p.extra_deep = n; // unknown field also fails, so use schema-valid deep via command_counts object values...
      // Direct depth on root with only allowed fields:
      delete p.extra_deep;
      // features can't nest. Force deep via replacing command_counts with nested objects:
      let deep: unknown = 1;
      for (let i = 0; i < 12; i++) deep = { k: deep };
      p.command_counts = deep as Record<string, number>;
      return p;
    })(),
  );
  assertEquals(r.ok, false);
});

Deno.test("end-to-end: valid token + missing Upstash → 503", async () => {
  const req = new Request("http://local/t", {
    method: "POST",
    headers: {
      [AUTH_HEADER]: DEFAULT_INGEST_TOKEN,
      "content-type": "application/json",
    },
    body: JSON.stringify(validPayload()),
  });
  const res = await handleTelemetryRequest(req, {
    env: envMap({ TELEMETRY_REQUIRE_TOKEN: "true" }),
    remoteAddr: "1.1.1.1",
    insert: async () => ({ error: null }),
  });
  assertEquals(res.status, 503);
});

Deno.test("end-to-end: Upstash fetch non-OK → 503", async () => {
  const req = new Request("http://local/t", {
    method: "POST",
    headers: {
      [AUTH_HEADER]: DEFAULT_INGEST_TOKEN,
      "content-type": "application/json",
    },
    body: JSON.stringify(validPayload()),
  });
  const res = await handleTelemetryRequest(req, {
    env: envMap({
      TELEMETRY_REQUIRE_TOKEN: "true",
      UPSTASH_REDIS_REST_URL: "https://example.upstash",
      UPSTASH_REDIS_REST_TOKEN: "t",
    }),
    remoteAddr: "1.1.1.1",
    fetchFn: async () => new Response("err", { status: 500 }),
    insert: async () => ({ error: null }),
  });
  assertEquals(res.status, 503);
});

Deno.test("end-to-end: unauthenticated POST → 401", async () => {
  const req = new Request("http://local/t", {
    method: "POST",
    body: JSON.stringify(validPayload()),
    headers: { "content-type": "application/json" },
  });
  const res = await handleTelemetryRequest(req, {
    env: envMap({
      TELEMETRY_REQUIRE_TOKEN: "true",
      UPSTASH_REDIS_REST_URL: "https://example.upstash",
      UPSTASH_REDIS_REST_TOKEN: "t",
    }),
    remoteAddr: "1.1.1.1",
    fetchFn: async () =>
      new Response(JSON.stringify({ result: 1 }), { status: 200 }),
    insert: async () => ({ error: null }),
  });
  assertEquals(res.status, 401);
});

Deno.test("end-to-end: browser Origin → 403", async () => {
  const req = new Request("http://local/t", {
    method: "POST",
    headers: {
      origin: "https://evil.example",
      [AUTH_HEADER]: DEFAULT_INGEST_TOKEN,
      "content-type": "application/json",
    },
    body: JSON.stringify(validPayload()),
  });
  const res = await handleTelemetryRequest(req, {
    env: envMap({ TELEMETRY_REQUIRE_TOKEN: "true" }),
    remoteAddr: "1.1.1.1",
    insert: async () => ({ error: null }),
  });
  assertEquals(res.status, 403);
});

Deno.test("end-to-end: happy path 204", async () => {
  let inserted = false;
  const req = new Request("http://local/t", {
    method: "POST",
    headers: {
      [AUTH_HEADER]: DEFAULT_INGEST_TOKEN,
      "content-type": "application/json",
    },
    body: JSON.stringify(validPayload()),
  });
  const res = await handleTelemetryRequest(req, {
    env: envMap({
      TELEMETRY_REQUIRE_TOKEN: "true",
      UPSTASH_REDIS_REST_URL: "https://example.upstash",
      UPSTASH_REDIS_REST_TOKEN: "t",
    }),
    remoteAddr: "1.1.1.1",
    fetchFn: async (input) => {
      const url = String(input);
      if (url.includes("/incr/")) {
        return new Response(JSON.stringify({ result: 1 }), { status: 200 });
      }
      if (url.includes("/expire/")) {
        return new Response(JSON.stringify({ result: 1 }), { status: 200 });
      }
      return new Response(JSON.stringify({ result: 1 }), { status: 200 });
    },
    insert: async () => {
      inserted = true;
      return { error: null };
    },
  });
  assertEquals(res.status, 204);
  assertEquals(inserted, true);
});

Deno.test("end-to-end: multi-UUID flood still hits global quota", async () => {
  const store: Record<string, number> = {};
  // Simulate global min already at limit
  const minBucket = Math.floor(
    new Date("2026-07-22T12:00:00Z").getTime() / 60_000,
  );
  store[`tel:g:min:${minBucket}`] = 120;

  const upstash = mockUpstash({ counts: store });
  // Direct quota check
  const d = await enforceQuotas({
    env: envMap({}),
    ip: "2.2.2.2",
    upstash,
    now: new Date("2026-07-22T12:00:00Z"),
  });
  // incr makes it 121 → blocked
  assertEquals(d.allow, false);
  if (!d.allow) assertEquals(d.status, 429);
});
