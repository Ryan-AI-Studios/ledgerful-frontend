# Track SPEC: 0014-LiveTeamAndSyncData — Replace Mock Mode With Real Backend Data

## Objective

Replace Track `0011-GitHubTeamIntegration`'s "mock mode" with real data once the corresponding ChangeGuard backend work lands: real `author`/`files`/`hotspotsCrossed`/`testsRun`/`flakes` on ledger entries, real `status`/`lastScanAt`/`healthScore` on projects, and real sync state for the Team section.

## Hard Dependencies — Read Before Starting

This track is blocked on **both**, on the `ChangeGuard` (Rust CLI) repo's `main` branch:
1. **Track M3** (`ledgerful web` Local Dashboard MVP) — merged.
2. **Track M8** (Real Ledger/Project Enrichment + Sync Status API) — merged. This is the track that actually adds the fields/endpoint this track consumes.

Check before starting:
```bash
# from the ChangeGuard repo
git log --oneline -1 -- src/commands/web/server.rs   # M3 on main
grep -n "author" src/commands/web/server.rs            # M8's new field, should appear if M8 landed
```

If M8 hasn't landed yet, **do not start this track** — there's nothing real to wire up to yet, and guessing at field shapes risks rework when M8 actually ships with slightly different names/types than guessed.

## Why This Matters

Track `0011`'s own Definition of Done says "GitHub Integration tab is functional **(in mock mode)**" — that parenthetical is the gap. The roadmap's Priority #7 (team ledger sharing) only becomes real, demonstrable value once this dashboard shows actual teammates' actual pending transactions, not placeholder data.

## Requirements

### Must Have

- Replace `0011`'s mocked author avatars/initials in `Ledger` and `Changes` lists with the real `author` field from `/api/ledger` (Track M8).
- Replace any hardcoded/default `Project.status` / `lastScanAt` / `healthScore` values in `src/lib/*-data.ts` with the real fields from `/api/projects` (Track M8) — remove the synthesis logic noted in `docs/Backend-Notes.md` ("the frontend currently defaults `status` to `'healthy'`...") once the real fields are confirmed present.
- Add a "Sync" section (or extend the existing Settings/Team area from `0011`) reading `GET /api/sync/status` (Track M8) — show device ID, last sync time, never-synced empty state.
- Update `src/lib/types.ts` if any field names/types from M8 differ from what `0011` originally guessed (check M8's actual shipped shape, don't assume the spec's proposed names survived implementation unchanged).
- Update `docs/Backend-Notes.md`'s data shapes (section 3.2, 3.8) to match what's actually live, removing the "Desired backend additions" notes (Track M8 should have already done this from its side — if it didn't, do it here, but check first to avoid duplicate/conflicting edits).
- Per `ChangeGuard` Track M8's explicit non-goal: **GitHub PR/webhook data (`prNumber`/`prStatus`) is still not available** — keep `0011`'s PR-column UI in its current mocked/placeholder state for this track. Don't just leave the cell silently rendering `-` for every row with no explanation: add a tooltip or small inline note (e.g. on hover over the PR column header, or a one-line caption under the table) stating PR linking isn't wired up yet. Without this, every row will show an unexplained empty PR column and users will reasonably read that as broken rather than "not yet built."
- `SyncStatus.lastExtractAt`/`lastApplyAt`: confirm at integration time that Track M8 converted these to ISO 8601 strings at the API boundary (its spec requires this — the backing Rust type is a Hybrid Logical Clock, not a timestamp, and naively stringifying it would produce a confusing composite value like `"1750000000000-0042-laptop-abc123"`). If M8 shipped the raw HLC string instead, do not parse/display it as a date — flag it back to M8 rather than working around it client-side.

### Should Have

- A loading/error state for the new live endpoints distinct from the existing mock-data path, so a daemon that's unreachable degrades visibly rather than silently showing stale mock data (per `docs/Backend-Notes.md` ยง1's "Frontend falls back to mock data when the daemon is unreachable" — confirm this track's new fields participate in that same fallback contract, not a special case).
- While touching daemon-connectivity states for the Sync section, also fix the adjacent pre-existing issue in `src/app/settings/page.tsx` (lines ~61-67): `getGithubIntegrationStatus(...).catch(() => setGithubStatus("DISCONNECTED"))` collapses every failure mode — daemon unreachable, network error, genuinely-not-configured — into the same "Disconnected" label. Once this track is already distinguishing "daemon down" from "real empty state" for the new sync data, apply the same distinction here (e.g. a separate `"UNREACHABLE"` status or a `degraded: boolean` flag from `getGithubIntegrationStatus`) so users don't file "I configured GitHub but it still says Disconnected" reports when the real cause is just a stopped daemon. Small, optional, but cheap to do while already in this exact code path.

### Won't Do

- No changes to the telemetry toggle UI (`0011`/`0013` cover that independently) — this track is scoped to ledger/project/sync data only.
- No GitHub OAuth/webhook implementation — still out of scope per M8.

## API / Data Contracts

Confirm against the actual M8 implementation before coding (do not trust this block blindly — it's what M8's spec proposed, verify the shipped reality):

```ts
interface LedgerEntry {
  // ...existing fields...
  author: string; // was missing, now real
}

interface Project {
  id: string;
  name: string;
  path: string;
  status: "healthy" | "warning" | "critical"; // was hardcoded default
  lastScanAt: string; // was hardcoded "now"
  healthScore: number; // was hardcoded 100
}

interface SyncStatus {
  deviceId: string | null;
  lastExtractAt: string | null;
  lastApplyAt: string | null;
  lastRunAt: string | null;
}
```

## Testing Strategy

- Manual: point the dashboard at a real local ChangeGuard daemon (built from `main` post-M8) with real ledger history; confirm author/files/health data renders correctly, not as obvious placeholders.
- Manual: stop the daemon, confirm graceful fallback to mock data (per the existing fallback contract), not a crash or blank screen.
- `npm run build`, `npm run lint`.

## Definition of Done

- [x] Confirmed M3 + M8 are on ChangeGuard's `main` before starting.
- [x] Real `author` rendering in Ledger/Changes lists.
- [x] Real `status`/`lastScanAt`/`healthScore` in project switching UI.
- [x] Sync status section reads real `/api/sync/status` data.
- [x] `docs/Backend-Notes.md` reconciled (no stale "desired additions" notes once this track confirms they're live).
- [x] GitHub PR-column UI explicitly still marked as a known mock-data gap (not silently presented as live).
- [x] Daemon-unreachable fallback confirmed working for all new fields.
- [x] `npm run build` and `npm run lint` pass.
- [x] `changeguard ledger status --compact` clean.
- [x] Registry status updated to Completed.

## Related Documents

- `conductor/0011-GitHubTeamIntegration/spec.md` — the mock-mode UI this track makes real
- `ChangeGuard/conductor/trackM8/spec.md` — the backend data this track consumes
- `docs/Backend-Notes.md`
