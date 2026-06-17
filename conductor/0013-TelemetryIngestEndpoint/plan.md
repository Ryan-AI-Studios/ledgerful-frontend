# Track PLAN: 0013-TelemetryIngestEndpoint

## Phase 1: Discovery

- [ ] Read `conductor/conductor.md` for context.
- [ ] Read `AGENTS.md`, `docs/Backend-Notes.md`.
- [ ] Run `changeguard ledger status --compact`.
- [ ] Confirm `next.config.ts` still has `output: "export"` (the reason this is a Supabase Edge Function, not a Route Handler).
- [ ] Check Track `0011`'s existing implementation: does the Settings page's "Live Payload" viewer already assume a local daemon source, or does it need a new ChangeGuard endpoint to point at? Note the finding before proceeding.
- [ ] Confirm Supabase project exists/is linked (`supabase status` or check `.env.example`'s `NEXT_PUBLIC_SUPABASE_URL` is actually populated in the real `.env.local`, not just the placeholder).

## Phase 2: Database

- [ ] Write the `telemetry_events` migration (SQL in spec) via `supabase migration new telemetry_events`.
- [ ] Apply locally: `supabase db reset` or `supabase migration up`.

## Phase 3: Edge Function

- [ ] `supabase functions new telemetry-ingest`.
- [ ] Implement `index.ts`: method check, `schema_version` check, field validation, size cap, service-role insert via `@supabase/supabase-js` (current version 2.108.1, confirmed via npm 2026-06-17) using `SUPABASE_SERVICE_ROLE_KEY` (available to Edge Functions as a platform-provided env var, not the `.env.example` browser-facing ones).
- [ ] Return `204`/`400`/`500` per spec.

## Phase 4: Local Testing

- [ ] `supabase functions serve telemetry-ingest`.
- [ ] `curl -X POST` with a valid payload (use the exact schema from the spec) — confirm `204` and row insertion.
- [ ] `curl -X POST` with `schema_version: 2` — confirm `400`.
- [ ] `curl -X POST` with a missing required field — confirm `400`.
- [ ] `curl -X POST` with an oversized body — confirm rejection.

## Phase 5: Deploy and Reconcile

- [ ] `supabase functions deploy telemetry-ingest`.
- [ ] Record the deployed URL.
- [ ] Compare against `ChangeGuard` Track M7's default `CHANGEGUARD_USAGE_ENDPOINT` (`https://changeguard.dev/api/telemetry`) — if these don't match, either set up a redirect/proxy at `changeguard.dev/api/telemetry` → the Supabase function URL, or update M7's default before that track ships. Document whichever resolution is chosen.

## Phase 6: End-to-End (once ChangeGuard Track M7 exists)

- [ ] Build/install the ChangeGuard CLI with `usage-metrics` feature enabled.
- [ ] `CHANGEGUARD_USAGE_ENDPOINT=<local supabase functions serve URL> changeguard usage enable`.
- [ ] Run a few tracked commands, wait for/force a flush, confirm a row appears in the local Supabase instance with the expected shape.

## Phase 7: Verification

- [ ] `npm run build` (main app unaffected).
- [ ] `npm run lint`.

## Phase 8: Finalization

- [ ] Mark this track Completed in `conductor/conductor.md`.
- [ ] Commit with `changeguard ledger commit <tx-id> --summary "..." --reason "..."`.
- [ ] Run `changeguard ledger status --compact` to confirm clean.
