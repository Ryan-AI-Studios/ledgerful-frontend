# Track PLAN: 0014-LiveTeamAndSyncData

## Phase 1: Discovery

- [x] Read `conductor/conductor.md` for context.
- [x] Read `AGENTS.md`, `docs/Backend-Notes.md`.
- [x] Run `changeguard ledger status --compact`.
- [x] Verify ChangeGuard `main` has Track M3 (`git log --oneline -1 -- src/commands/web/server.rs`) and Track M8 (`grep -n "author" src/commands/web/server.rs`). If either is missing, stop — do not guess at unshipped field shapes.
- [x] Diff the actual M8-shipped API response shapes against this spec's proposed `LedgerEntry`/`Project`/`SyncStatus` contracts; note any discrepancies before writing code.

## Phase 2: Design / Spec

- [x] Finalize field-name mapping (snake_case backend → camelCase frontend) for any new fields, following the existing convention in `src/lib/*-data.ts`.
- [x] Identify every call site currently synthesizing defaults for `author`, `status`, `lastScanAt`, `healthScore` (search `src/lib/*-data.ts` and any component-level fallback logic).

## Phase 3: Implementation

- [x] Update `src/lib/types.ts` with confirmed real field types.
- [x] Update the ledger/changes data service to map real `author` through instead of a placeholder.
- [x] Update the project data service to map real `status`/`lastScanAt`/`healthScore` through instead of hardcoded defaults.
- [x] Add a sync-status fetch + display (Settings or Team section) reading `/api/sync/status`. Verify `lastExtractAt`/`lastApplyAt` are real ISO 8601 strings from M8 before wiring up date formatting — if M8 shipped raw HLC strings instead, stop and flag it back rather than working around it client-side.
- [x] Confirm GitHub PR-column UI is explicitly labeled/flagged as still-mocked: add a tooltip or inline caption near the PR column explaining it's not wired up yet (not just a silently-empty `-` cell on every row).
- [x] Confirm the existing mock-fallback contract (`NEXT_PUBLIC_LEDGERFUL_USE_MOCK` / daemon-unreachable detection) covers these new fields/endpoint the same way it covers existing ones.
- [x] In `src/app/settings/page.tsx` (~lines 61-67), distinguish "daemon unreachable" from "integration not configured" in the GitHub status `.catch()` instead of collapsing both into `"DISCONNECTED"` — reuse whatever daemon-reachability signal this track is already adding for the sync section.

## Phase 4: Verification

- [x] `npm run build`
- [x] `npm run lint`
- [x] Manual: real daemon (post-M8 build) running, confirm live data renders correctly.
- [x] Manual: daemon stopped, confirm graceful fallback, no crash/blank screen.
- [x] Update `docs/Backend-Notes.md` if M8 didn't already reconcile it from its side (check first to avoid duplicate edits).

## Phase 5: Finalization

- [x] Mark this track Completed in `conductor/conductor.md`.
- [x] Commit with `changeguard ledger commit <tx-id> --summary "..." --reason "..."`.
- [x] Run `changeguard ledger status --compact` to confirm clean.