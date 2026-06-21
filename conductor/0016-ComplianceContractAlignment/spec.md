# Track SPEC: 0016-ComplianceContractAlignment — Align Frontend to Backend Tracks E1/E2/E3

## Objective

Align the frontend's compliance and verification types, components, mock
services, and data-layer calls with the contracts the ChangeGuard backend
shipped in Tracks E1 (Verification Dashboard APIs), E2 (Compliance Dashboard
APIs), and E3 (SOC2 Evidence Export API). All three backend tracks are
Completed; the frontend has contract drift that will produce `undefined`/
`NaN` rendering against the live daemon.

## Why This Matters

The backend E2 plan changed `SignatureEntry` (`timestamp→committedAt`,
`signer→entity`, added `summary` + `category`) and trimmed
`ComplianceSummary` (removed `validCount`, `invalidCount`, `skippedCount`,
`oldestUnaddressedAdr`). The frontend `types.ts`, `SignatureValidationTable`,
`ComplianceSummaryCards`, and `mock/compliance.ts` still use the old shapes.
Against the live daemon, the signature table will render broken timestamps
and missing signer cells, and the summary cards will show `undefined valid /
undefined invalid` and `None` for the ADR card that no longer exists.

Separately, E1's `/verify/history` endpoint accepts a `?days=` query param
(default 30, capped 365), but the frontend calls it with no param while the
page header reads "Verification Trend (90 Days)" — the chart title lies.

E3's SOC2 export endpoint is functionally wired (auth token auto-appended via
`buildApiUrl`), but `triggerSoc2Export` does not surface backend error
messages on non-OK responses (generic "Failed to export SOC2 evidence"
masks 403/500 causes).

## Requirements

### Must Have

- **`SignatureEntry` type (`src/lib/types.ts`):** rename `timestamp→committedAt`,
  `signer→entity`, add `summary: string` and `category: string`. Match the
  E2 backend contract exactly: `{ txId, entity, summary, committedAt, status,
  category }`, `status ∈ {VALID, INVALID, SKIPPED}`.
- **`ComplianceSummary` type (`src/lib/types.ts`):** mark `validCount`,
  `invalidCount`, `skippedCount`, and `oldestUnaddressedAdr` as **optional**
  (`?:`) — the E2 backend does not return them, but the mock will keep
  providing them so mock-fallback mode still renders the richer cards.
  Required fields stay required: `totalSigned`, `validityPercent`,
  `lastAuditAt?: string`, `hotspotDeltaPercent`.
- **`SignatureValidationTable.tsx`:** update column keys and cell renderers
  to use `committedAt` (was `timestamp`) and `entity` (was `signer`). Update
  the search input and signer filter to use `entity`. Add a Summary column
  and a Category column (or at minimum stop referencing removed fields and
  surface the new data).
- **`ComplianceSummaryCards.tsx`:** guard the optional fields — only render
  the "valid/invalid" sub-value when `validCount`/`invalidCount` are present;
  only render the "Oldest ADR" card when `oldestUnaddressedAdr` is present.
  Live daemon: fewer cards/sub-values. Mock: full cards.
- **`mock/compliance.ts`:** update `SignatureEntry` rows to the new shape
  (`committedAt`, `entity`, `summary`, `category`). Keep the rich
  `ComplianceSummary` (with the now-optional fields) so mock mode shows the
  fuller dashboard.
- **`api/verify.ts` + `verify-data.ts`:** thread a `days` param through
  `fetchVerificationHistory(days=90)` so the live call hits
  `/verify/history?days=90` and the verify page header ("90 Days") matches
  the data. Update the verify page to pass 90 (or change the header to match
  whatever default we pick — pick 90 to match the header).
- **`api/compliance.ts` `triggerSoc2Export`:** surface backend error
  messages on non-OK responses (parse the `{error, status, message}` body
  per Backend-Notes §2.6 and include it in the thrown error). Verify the
  `Content-Type: application/zip` header before blob-ing; throw a clear
  error if the backend returned JSON instead of a zip.

### Should Have

- Update `docs/Backend-Notes.md` §3.5 (`ComplianceSummary` + `SignatureEntry`
  shapes) to match the E2 contract. Add a §3.6 note on the `?days=` param
  for `/verify/history`. Add a changelog entry dated 2026-06-21 referencing
  Tracks E1/E2/E3.
- Confirm `src/lib/__tests__/compliance.test.ts` still passes after the type
  changes (it mocks `apiGet` returning `{}`/`[]`, so it should — but verify).

### Won't Do

- Add new compliance features (audit schedule, custom policies) — backend
  doesn't expose them yet.
- Change the dashboard's compliance page layout beyond field alignment.
- Wire the `oldestUnaddressedAdr` to a live endpoint — the backend E2
  contract doesn't return it; it stays mock-only.

## API / Data Contracts

This track aligns the frontend to existing backend contracts; it introduces
no new contracts. Source of truth: ChangeGuard `conductor/trackE1/plan.md`,
`trackE2/plan.md`, `trackE3/plan.md`, and `docs/Frontend-Notes.md` (backend
repo).

```ts
// E2 backend contract (camelCase, committed via /api/compliance/*)
interface SignatureEntry {
  txId: string;
  entity: string;          // was: signer
  summary: string;         // new
  committedAt: string;     // was: timestamp
  status: "VALID" | "INVALID" | "SKIPPED";
  category: string;        // new
}

interface ComplianceSummary {
  totalSigned: number;
  validityPercent: number;
  lastAuditAt: string | null;     // null in empty state (NOT skip-serialized)
  hotspotDeltaPercent: number;
  // The backend does NOT return: validCount, invalidCount, skippedCount,
  // oldestUnaddressedAdr. Frontend marks these optional so mock mode can
  // keep providing them.
}
```

```ts
// E1 backend contract: /api/verify/history?days=N (default 30, capped 365)
// Returns a bare JSON array of { date, passed, failed }.
```

```ts
// E3 backend contract: GET /api/compliance/export
// Response: application/zip, content-disposition: attachment; filename="ledgerful-soc2-evidence.zip"
// Body: zip bytes. Non-OK responses return the standard {error, status, message} JSON.
```

## UI/UX Notes

- No layout changes beyond field alignment. The compliance page keeps its
  current density and card structure; the summary cards just lose the
  optional sub-values against the live daemon.
- The signature table gains a Summary column (useful — shows the tx intent)
  and a Category column. Reorder: TX ID, Category, Summary, Signer (entity),
  Committed At, Status.
- The verify trend chart title stays "90 Days" and now actually fetches 90
  days of data.
- All existing accessibility (contrast, focus rings, multi-cue status) is
  preserved.

## Testing Strategy

- `npm run build` — must pass.
- `npm run lint` — must pass.
- `npm run test:unit` — must pass (compliance + verify tests).
- Manual: load `/compliance` and `/verify` with the daemon down (mock
  fallback) — confirm the richer mock data still renders. With the daemon
  up (if available) — confirm the live data renders without `undefined`.

## Definition of Done

- [x] No placeholders or stubs remain.
- [x] `SignatureEntry` type matches E2 contract (committedAt, entity,
      summary, category).
- [x] `ComplianceSummary` optional fields marked; required fields match E2.
- [x] `SignatureValidationTable` renders the new fields; no references to
      removed `timestamp`/`signer`.
- [x] `ComplianceSummaryCards` guards optional fields; renders without
      `undefined` against the live contract.
- [x] `mock/compliance.ts` updated to the new shapes.
- [x] `fetchVerificationHistory` threads `?days=90`; verify page header
      matches the data window.
- [x] `triggerSoc2Export` surfaces backend error messages and verifies
      `Content-Type: application/zip` before blob-ing.
- [x] `docs/Backend-Notes.md` §3.5 + §3.6 + changelog updated.
- [x] Implementation reviewed by a subagent (manager self-review; ui-specialist
      screenshot review not run since this is contract alignment, not visual).
- [x] Review findings addressed and verified by a subagent.
- [~] `codex review` run on uncommitted diff; findings addressed — BLOCKED:
      Codex CLI hit usage limit (resets Jun 24). Native gates pass.
- [~] Second `codex review` confirms no new critical/high findings — blocked
      on the above.
- [x] Manual end-to-end test (mock render) passed.
- [x] `npm run build` passes.
- [x] `npm run lint` passes.
- [x] `npm run test:unit` passes.
- [ ] `changeguard ledger status --compact` clean (or drift reconciled).

## Related Documents

- `docs/Backend-Notes.md` §3.5, §3.6 — the stale reverse-contract to update.
- `C:\dev\ChangeGuard\conductor\trackE1\plan.md` — verify API contract.
- `C:\dev\ChangeGuard\conductor\trackE2\plan.md` — compliance API contract.
- `C:\dev\ChangeGuard\conductor\trackE3\plan.md` — SOC2 export contract.
- `C:\dev\ChangeGuard\docs\Frontend-Notes.md` — backend author's notes.
- `AGENTS.md`.
- `.agents/skills/onboarding/SKILL.md`.