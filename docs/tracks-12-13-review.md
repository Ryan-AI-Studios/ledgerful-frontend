# Audit Review: Track 0012 (Marketing Asset Cleanup) & Track 0013 (Telemetry Ingest Endpoint)

**Reviewed:** 2026-06-17 (post-hoc audit, after both tracks marked Completed)
**Method:** Read `conductor/conductor.md`, both tracks' `spec.md`/`plan.md`, the actual diffs (`715ca16`, `986cdb2`, `b3e7f40`), current repo state, fresh `npm run build` / `npm run lint`, `changeguard ledger status --compact`, `changeguard scan --impact`.

## Verdict

Both tracks are **functionally implemented with no build/lint regressions and no stub code**. Track 0012 is solid. Track 0013 works end-to-end against its own validation rules, but has **one real unresolved Must-Have item** (cross-repo endpoint reconciliation) that the plan asserts is "Resolved" without actually resolving it, plus a few minor gaps. Neither track's `spec.md` Definition of Done checklist was ever checked off, despite both being marked Completed in the registry.

---

## Track 0012 — Marketing Asset Cleanup

**Registry status:** Completed. **Assessment: Properly implemented, no regressions.**

### Verified
- `public/Banner.png` and `public/Icon.png` (1.74MB) are deleted — confirmed via `git show 715ca16 --stat` (`Bin 906429 -> 0`, `Bin 832984 -> 0`) and a fresh `npm run build`: `out/` now contains a single `dashboard.png` (84KB), total export 2.7MB.
- "Should Have" scaffold-SVG audit was actually done: `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` were all removed in the same commit, and a repo-wide grep for any of those filenames in `*.ts`/`*.tsx` returns zero matches — nothing was left dangling.
- The decision (delete, not re-wire) is documented in the commit message with a one-line rationale, as the spec required.
- `dashboard.png` was wired into `src/app/page.tsx:87` as a real hero-image asset, with a justified `eslint-disable-next-line @next/next/no-img-element` (correct: `next/image` optimization is unavailable under `output: "export"`, per the track's own technical note).
- `npm run build` and `npm run lint` both pass clean (0 errors, 1 pre-existing unrelated warning in `UserMenu.tsx`).
- `changeguard ledger status --compact` → `0 pending, 0 unaudited drift`.

### Findings
1. **(Minor) Commit scope creep.** The commit titled "chore: complete Track 0012 Marketing Asset Cleanup" also rewrites unrelated sections of `docs/Backend-Notes.md` (resolving Track M8 "Open Questions" about sync protocol and GitHub PR data) and edits `conductor/0014-LiveTeamAndSyncData/spec.md`/`plan.md`. None of that is marketing-asset related. It's not incorrect content, but it breaks clean provenance — anyone diffing "what did Track 0012 change" gets unrelated Track 0014/M8 documentation mixed in.
2. **(Minor) Spec DoD never checked off.** `conductor/0012-MarketingAssetCleanup/spec.md`'s Definition of Done section is still 100% `- [ ]` even though `plan.md` is checked and the registry says Completed. The plan and the authoritative DoD checklist are out of sync.
3. **(Informational) M5 cross-repo flag.** The spec asked to "flag to whoever runs ChangeGuard Track M5 that this track is done." No flag exists outside this repo's own conductor files (which the ChangeGuard repo wouldn't read). In practice this is low-risk since M5's own spec instructs it to independently check `ls public/*.png`, which will correctly show the files gone — but the explicit flag-back never happened.

---

## Track 0013 — Telemetry Ingest Endpoint

**Registry status:** Completed. **Assessment: Functionally solid, but one Must-Have item is not actually resolved despite being marked resolved, plus minor gaps.**

### Verified
- `supabase/migrations/20260618004519_create_telemetry_events_table.sql` matches the spec's schema exactly (same columns, types, indexes, RLS enabled).
- `supabase/functions/telemetry-ingest/index.ts` (174 lines): POST-only (405 otherwise), `schema_version !== 1` → 400, all 9 required fields presence-checked, UUID format check on `anonymous_id`, ISO-8601 checks on the three timestamp fields, type checks on `command_counts` (object) and `features_enabled` (string array), service-role insert, `204`/`400`/`500` responses matching spec, generic error messages (no internals leaked).
- Payload size cap is implemented **twice** — a `Content-Length` header pre-check and an actual `byteLength` check after reading the body — correctly defensive against a missing/forged header.
- `verify_jwt = false` in `supabase/config.toml` is the correct, narrowly-scoped choice (anonymous CLI callers have no Supabase auth context) — it's set per-function, not project-wide.
- Service-role key (`SERVICE_ROLE_KEY`, deliberately renamed from `SUPABASE_SERVICE_ROLE_KEY` to dodge Supabase's reserved-prefix restriction — confirmed real Supabase behavior) is only read inside the Edge Function's Deno runtime; never exposed client-side.
- A follow-up migration (`fix_service_role_permissions.sql`) grants explicit `INSERT`/`USAGE` to `service_role` — evidence this was actually deployed and debugged against a real Supabase project, not just written and assumed to work.
- No secrets committed: `supabase/.gitignore` excludes `.env.local`, `.env.*.local`, `.branches`, `.temp`.
- `tsconfig.json` now excludes `supabase` (Deno-style `https://` imports are incompatible with the Next.js TS program) and `.vscode/settings.json` scopes the Deno extension to `supabase/functions` via `deno.enablePaths` — both confirmed necessary and sufficient by a clean `npm run build`/`npm run lint` on current `HEAD`.
- No TODO/FIXME/placeholder/stub strings anywhere under `supabase/`.

### Findings
1. **(Significant — Must Have, not actually resolved) Cross-repo endpoint mismatch.** The spec is explicit: the deployed URL must be reconciled with ChangeGuard Track M7's hardcoded default (`https://changeguard.dev/api/telemetry`), and "these must agree before both tracks ship; ... resolve this explicitly, don't ship a mismatch." `plan.md` line 35 just states *"Resolved: The Supabase Function URL is the verified ingest point"* — but nothing was actually done to make that true:
   - There's no evidence `changeguard.dev/api/telemetry` redirects/proxies to `https://scmxtnjqqklvcwyeouvj.supabase.co/functions/v1/telemetry-ingest`.
   - There's no evidence M7's hardcoded default was changed to the Supabase URL (that's in a different repo this audit can't inspect, but nothing here documents that the change was requested or confirmed).
   - The deployed URL itself is recorded **only** in `conductor/0013-TelemetryIngestEndpoint/plan.md` — not in `docs/Backend-Notes.md` or any other location a ChangeGuard-side agent would reasonably consult.
   - **Risk:** if M7 ships as currently specified, CLI telemetry will be sent to `changeguard.dev/api/telemetry`, which (as far as this repo can show) is not connected to the working ingest function. Telemetry would silently 404 / never arrive. This should be re-opened, not treated as closed.
2. **(Acknowledged gap, not a placeholder) End-to-end CLI test not done.** `plan.md` Phase 6 and the spec's DoD item "End-to-end test against the real CLI once M7 is available" are honestly left unchecked with the note "Pending backend M7 implementation." This is a legitimate external blocker, well-flagged — but it does mean the track was marked Completed with an open DoD item, contrary to `conductor.md`'s stated rule that all DoD items must be checked first.
3. **(Minor) Incomplete type validation on two fields.** `client_version` and `platform` are checked for presence (`field in payload`) but never checked for type, unlike every other field. The spec says validation must check fields are "present and correctly typed." A non-string value here wouldn't be rejected with a precise `400` like the other fields — it would likely fail at insert time and surface as a generic `500`, which is still safe (no leak, no crash) but inconsistent with the spec's intent and with the rigor applied everywhere else in the same function.
4. **(Minor) "Should Have" MAU query never built.** The spec's Should-Have item — "a simple aggregate query (SQL view or one-off script) for distinct `anonymous_id` count in the last 30 days" — doesn't exist. Only a comment referencing the use case (`-- Performance indices for aggregate queries (MAU/DAU)`) is present. Not blocking (it's Should-Have), but `plan.md` doesn't note it as explicitly skipped either — it's just silently absent.
5. **(Minor) Spec DoD never checked off.** Same issue as Track 0012: `conductor/0013-TelemetryIngestEndpoint/spec.md`'s Definition of Done remains fully `- [ ]`.
6. **(Informational) Review-cycle evidence is absent, as expected.** Per repo hygiene rules, scratch/codex-review output files are removed before finishing, so their absence here is not itself a finding — but it does mean this audit cannot independently confirm the subagent-review/codex-review cycle described in `conductor.md`'s workflow actually happened for either track. The follow-up "harden" commit (`b3e7f40`, disabling JWT verification correctly, adding the exhaustive field checks, fixing tsconfig/ESLint hygiene) is consistent with a real review-and-fix cycle having occurred, but it's circumstantial, not direct evidence.

---

## Cross-Cutting Recommendations

1. **Re-open the M7 endpoint reconciliation** before relying on the telemetry pipeline for anything real — either confirm `changeguard.dev/api/telemetry` actually proxies to the Supabase function, or get ChangeGuard's M7 default changed to the direct Supabase URL, and put that URL in `docs/Backend-Notes.md` where both repos' agents will see it.
2. Add type checks for `client_version`/`platform` in `telemetry-ingest/index.ts` (two `typeof === "string"` checks) for consistency with the rest of the validation.
3. Go back and check the boxes in both tracks' `spec.md` Definition of Done sections (or explicitly mark the CLI E2E test and MAU query as deferred with a reason), so the registry's "Completed" status and the spec's own DoD checklist agree.
4. Going forward, keep unrelated documentation/track updates (e.g., the Track M8/0014 `Backend-Notes.md` edits bundled into the 0012 commit) in their own commits for clean provenance.

No regressions found in the main Next.js app from either track: `npm run build` and `npm run lint` both pass clean on current `HEAD` (`b3e7f40`), and `changeguard ledger status --compact` reports 0 pending / 0 unaudited drift.
