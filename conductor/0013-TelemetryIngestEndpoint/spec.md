# Track SPEC: 0013-TelemetryIngestEndpoint — Receive Opt-In CLI Usage Metrics

## Objective

Stand up the receiving side of ChangeGuard's opt-in usage-metrics pipeline (CLI side: `ChangeGuard/conductor/trackM7`) so the "Anonymous Usage Metrics" toggle and "Live Payload" viewer already built in Track `0011` have something real behind them.

## Why This Matters

Track `0011-GitHubTeamIntegration` already shipped the Settings UI for this ("Privacy Section in Settings... Toggle for 'Anonymous Usage Metrics'... A 'Live Payload' view showing exactly what is sent to the `/telemetry` endpoint") but explicitly noted it's "in mock mode." This track makes it real on the receiving end. The CLI side (`changeguard usage enable|disable|status|show-payload`) is `ChangeGuard/conductor/trackM7` — **the JSON payload schema in this spec must match that spec exactly, field for field.**

## Important Architecture Note — Why This Is Not a Next.js Route Handler

This repo's `next.config.ts` sets `output: "export"` — confirmed unchanged as of 2026-06-17. Static export produces a fully static site with **no Node.js server at runtime**; Route Handlers under `output: "export"` are restricted to static `GET` responses computed at build time (per Next.js's own static-export docs) — they cannot dynamically read a POST body and write to a database at request time. A `POST /api/telemetry` Route Handler is fundamentally incompatible with this app's current build mode, and changing `output: "export"` would break ChangeGuard's CLI-embedding model (Track M3 relies on a static `out/` directory to embed into the Rust binary).

**Resolution: implement the ingest endpoint as a Supabase Edge Function**, not a Next.js Route Handler. Supabase Edge Functions are Deno-based serverless TypeScript functions, deployed independently of this Next.js app's build, and are Supabase's own documented pattern for exactly this use case ("listening to webhooks or integrating your Supabase project with third-parties" — confirmed current via `supabase.com/docs/guides/functions`, 2026-06-17). This also means **no new dependency on this Next.js app's package.json** for the ingest logic itself — it lives in `supabase/functions/telemetry-ingest/`, deployed via the Supabase CLI, separate from `vercel.json`'s build.

The Settings page's "Live Payload" preview (already built in `0011`) should NOT query this ingest endpoint's stored data — that conflates "what the CLI is about to send" (a local, daemon-mediated concern) with "what was received" (a cloud-side concern, and also privacy-sensitive to expose broadly). Leave `0011`'s existing payload-preview wiring pointed at the local daemon (`GET /api/usage/preview` or equivalent — note: this is a **new, small ChangeGuard endpoint**, not yet specified anywhere; flag this gap explicitly if `0011`'s current mock doesn't already assume a local source — check `0011`'s implementation before assuming this needs new work here).

## Payload Schema (must match `ChangeGuard` Track M7 exactly)

```json
{
  "schema_version": 1,
  "anonymous_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "client_version": "0.1.4",
  "platform": "windows",
  "sent_at": "2026-06-17T12:00:00Z",
  "window_start": "2026-06-10T00:00:00Z",
  "window_end": "2026-06-17T00:00:00Z",
  "command_counts": {
    "scan": 12,
    "ledger_start": 4,
    "ledger_commit": 4,
    "ask": 2,
    "web_start": 1
  },
  "features_enabled": ["web", "mcp", "sync"],
  "active_days_in_window": 5
}
```

## Requirements

### Must Have

- Supabase table `telemetry_events`:
  ```sql
  create table telemetry_events (
    id bigint generated always as identity primary key,
    received_at timestamptz not null default now(),
    schema_version int not null,
    anonymous_id uuid not null,
    client_version text not null,
    platform text not null,
    sent_at timestamptz not null,
    window_start timestamptz not null,
    window_end timestamptz not null,
    command_counts jsonb not null,
    features_enabled text[] not null,
    active_days_in_window int not null
  );
  -- Index for aggregate queries (MAU/DAU dashboards, future work)
  create index telemetry_events_received_at_idx on telemetry_events (received_at);
  create index telemetry_events_anonymous_id_idx on telemetry_events (anonymous_id);
  ```
- Supabase Edge Function `supabase/functions/telemetry-ingest/index.ts`:
  - Accepts `POST` only.
  - Validates `schema_version === 1` (reject unknown versions with `400`, not a silent drop — so the CLI can detect schema drift via the HTTP status rather than data quietly vanishing).
  - Validates required fields are present and correctly typed (Deno + a small schema check — `zod` is fine if already idiomatic for the team, otherwise plain manual checks; don't add a heavy dependency for this).
  - Caps payload size (reject anything over ~10KB — this payload should never be larger than ~1KB; a 10KB cap is generous headroom against abuse, not a tight optimization target).
  - Basic abuse mitigation: rely on Supabase's platform-level rate limiting for Edge Functions as the first line of defense; do not build custom IP-tracking logic in this track (YAGNI — add it later only if abuse is actually observed).
  - Inserts a row into `telemetry_events` using the **service role key** (Edge Functions run server-side, this is safe — never expose the service role key to the browser/CLI).
  - Returns `204 No Content` on success, `400` on validation failure, `500` on database error (with no payload echoed back beyond a generic message — don't leak internals).
- Deploy via `supabase functions deploy telemetry-ingest`.
- Document the deployed URL (`https://<project-ref>.supabase.co/functions/v1/telemetry-ingest`) as the value `ChangeGuard` Track M7 should use for `CHANGEGUARD_USAGE_ENDPOINT`'s production default — cross-check this against M7's hardcoded `https://changeguard.dev/api/telemetry` default. **These must agree before both tracks ship**; if `changeguard.dev` is meant to proxy/redirect to the Supabase function URL, that redirect needs to exist, or M7's default needs to change to the direct Supabase URL. Resolve this explicitly, don't ship a mismatch.

### Should Have

- A simple aggregate query (SQL view or a one-off script) for "distinct `anonymous_id` count in the last 30 days" (MAU) — not a UI, just confirms the data is queryable for the investor/enterprise-credibility use case the roadmap describes.

### Won't Do

- No admin dashboard for telemetry data in this track (future work, if ever needed).
- No per-event PII scrubbing logic beyond what the CLI already guarantees (Track M7's spec commits to never sending repo names, file paths, or content) — this endpoint trusts the CLI's payload shape, it does not need to re-derive privacy guarantees itself.

## Testing Strategy

- `supabase functions serve telemetry-ingest` locally; POST a valid payload via `curl`, confirm `204` and a row appears in the local Supabase instance.
- POST an invalid `schema_version`, confirm `400`.
- POST a payload missing a required field, confirm `400`.
- POST an oversized payload, confirm rejection.
- Cross-check: once `ChangeGuard` Track M7 is implemented, run the actual CLI's `changeguard usage enable` against this endpoint (point `CHANGEGUARD_USAGE_ENDPOINT` at the local `supabase functions serve` URL) and confirm a real end-to-end flush works.

## Definition of Done

- [ ] `telemetry_events` table created via migration.
- [ ] Edge Function implemented with validation, size cap, and service-role insert.
- [ ] Deployed; URL documented and reconciled with `ChangeGuard` Track M7's default endpoint (no mismatch).
- [ ] Local + deployed manual tests pass (valid payload, invalid version, missing field, oversized payload).
- [ ] End-to-end test against the real CLI once M7 is available.
- [ ] `npm run build` and `npm run lint` still pass for the main Next.js app (this track shouldn't touch it, but confirm no regression).
- [ ] `changeguard ledger status --compact` clean.
- [ ] Registry status updated to Completed.

## Related Documents

- `ChangeGuard/conductor/trackM7/spec.md` — CLI side, schema must match exactly
- `conductor/0011-GitHubTeamIntegration/spec.md` — the UI this track's data feeds (mock-mode toggle/payload viewer)
- `docs/Backend-Notes.md`
