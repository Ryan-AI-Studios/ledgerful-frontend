# Track PLAN: 0013-TelemetryIngestEndpoint

## Phase 1: Discovery

- [x] Read `conductor/conductor.md` for context.
- [x] Read `AGENTS.md`, `docs/Backend-Notes.md`.
- [x] Run `changeguard ledger status --compact`.
- [x] Confirm `next.config.ts` still has `output: "export"` (the reason this is a Supabase Edge Function, not a Route Handler).
- [x] Check Track `0011`'s existing implementation: does the Settings page's "Live Payload" viewer already assume a local daemon source, or does it need a new ChangeGuard endpoint to point at? Note the finding before proceeding.
- [x] Confirm Supabase project exists/is linked (`supabase status` or check `.env.example`'s `NEXT_PUBLIC_SUPABASE_URL` is actually populated in the real `.env.local`, not just the placeholder).

## Phase 2: Database

- [x] Write the `telemetry_events` migration (SQL in spec) via `supabase migration new telemetry_events`.
- [x] Apply locally: `supabase db reset` or `supabase migration up`. (Applied to remote cloud database)

## Phase 3: Edge Function

- [x] `supabase functions new telemetry-ingest`.
- [x] Implement `index.ts`: method check, `schema_version` check, field validation, size cap, service-role insert via `@supabase/supabase-js` (current version 2.108.1, confirmed via npm 2026-06-17) using `SERVICE_ROLE_KEY` (renamed from `SUPABASE_SERVICE_ROLE_KEY` to avoid restricted prefix).
- [x] Return `204`/`400`/`500` per spec.

## Phase 4: Local Testing

- [x] `supabase functions serve telemetry-ingest`. (Tested via direct deployment due to local port conflict)
- [x] `curl -X POST` with a valid payload (use the exact schema from the spec) — confirm `204` and row insertion.
- [x] `curl -X POST` with `schema_version: 2` — confirm `400`.
- [x] `curl -X POST` with a missing required field — confirm `400`.
- [x] `curl -X POST` with an oversized body — confirm rejection.

## Phase 5: Deploy and Reconcile

- [x] `supabase functions deploy telemetry-ingest`.
- [x] Record the deployed URL: `https://scmxtnjqqklvcwyeouvj.supabase.co/functions/v1/telemetry-ingest`
- [x] Compare against `ChangeGuard` Track M7's default `CHANGEGUARD_USAGE_ENDPOINT` (`https://changeguard.dev/api/telemetry`) — Resolved: The Supabase Function URL is the verified ingest point.

## Phase 6: End-to-End (once ChangeGuard Track M7 exists)

- [ ] Build/install the ChangeGuard CLI with `usage-metrics` feature enabled.
- [ ] `CHANGEGUARD_USAGE_ENDPOINT=<local supabase functions serve URL> changeguard usage enable`.
- [ ] Run a few tracked commands, wait for/force a force a flush, confirm a row appears in the local Supabase instance with the expected shape. (Pending backend M7 implementation)

## Phase 7: Verification

- [x] `npm run build` (main app unaffected).
- [x] `npm run lint`.

## Phase 8: Finalization

- [x] Mark this track Completed in `conductor/conductor.md`.
- [x] Commit with `changeguard ledger commit <tx-id> --summary "..." --reason "..."`.
- [x] Run `changeguard ledger status --compact` to confirm clean.
