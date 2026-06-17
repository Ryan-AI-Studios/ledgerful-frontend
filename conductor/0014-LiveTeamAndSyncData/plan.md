# Track PLAN: 0014-LiveTeamAndSyncData

## Phase 1: Discovery

- [ ] Read `conductor/conductor.md` for context.
- [ ] Read `AGENTS.md`, `docs/Backend-Notes.md`.
- [ ] Run `changeguard ledger status --compact`.
- [ ] Verify ChangeGuard `main` has Track M3 (`git log --oneline -1 -- src/commands/web/server.rs`) and Track M8 (`grep -n "author" src/commands/web/server.rs`). If either is missing, stop — do not guess at unshipped field shapes.
- [ ] Diff the actual M8-shipped API response shapes against this spec's proposed `LedgerEntry`/`Project`/`SyncStatus` contracts; note any discrepancies before writing code.

## Phase 2: Design / Spec

- [ ] Finalize field-name mapping (snake_case backend → camelCase frontend) for any new fields, following the existing convention in `src/lib/*-data.ts`.
- [ ] Identify every call site currently synthesizing defaults for `author`, `status`, `lastScanAt`, `healthScore` (search `src/lib/*-data.ts` and any component-level fallback logic).

## Phase 3: Implementation

- [ ] Update `src/lib/types.ts` with confirmed real field types.
- [ ] Update the ledger/changes data service to map real `author` through instead of a placeholder.
- [ ] Update the project data service to map real `status`/`lastScanAt`/`healthScore` through instead of hardcoded defaults.
- [ ] Add a sync-status fetch + display (Settings or Team section) reading `/api/sync/status`.
- [ ] Confirm GitHub PR-column UI is explicitly labeled/flagged as still-mocked (e.g. a small "Coming soon" or disabled state) rather than silently left wired to nothing.
- [ ] Confirm the existing mock-fallback contract (`NEXT_PUBLIC_LEDGERFUL_USE_MOCK` / daemon-unreachable detection) covers these new fields/endpoint the same way it covers existing ones.

## Phase 4: Verification

- [ ] `npm run build`
- [ ] `npm run lint`
- [ ] Manual: real daemon (post-M8 build) running, confirm live data renders correctly.
- [ ] Manual: daemon stopped, confirm graceful fallback, no crash/blank screen.
- [ ] Update `docs/Backend-Notes.md` if M8 didn't already reconcile it from its side (check first to avoid duplicate edits).

## Phase 5: Finalization

- [ ] Mark this track Completed in `conductor/conductor.md`.
- [ ] Commit with `changeguard ledger commit <tx-id> --summary "..." --reason "..."`.
- [ ] Run `changeguard ledger status --compact` to confirm clean.
