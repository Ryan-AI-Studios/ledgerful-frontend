# Track PLAN: 0016-ComplianceContractAlignment — Align Frontend to Backend Tracks E1/E2/E3

## Phase 1: Discovery

- [x] Read `conductor/conductor.md` for context.
- [x] Read backend `trackE1/plan.md`, `trackE2/plan.md`, `trackE3/plan.md`.
- [x] Read current frontend `types.ts`, `api/compliance.ts`, `api/verify.ts`,
      `mock/compliance.ts`, `SignatureValidationTable.tsx`,
      `ComplianceSummaryCards.tsx`, `verify/page.tsx`.
- [x] Confirmed E1/E2/E3 backend tracks are Completed.
- [x] Confirmed verify data service + compliance data service are wired
      (withFallback) — no new wiring needed, only contract alignment.

## Phase 2: Design / Spec

- [x] Spec finalized: type changes, component updates, mock updates,
      verify `?days=90`, export error surfacing, Backend-Notes update.
- [x] Decision: mark backend-removed ComplianceSummary fields optional
      (not delete) so mock mode keeps the richer dashboard.
- [x] Decision: add Summary + Category columns to the signature table.

## Phase 3: Implementation

- [ ] Step 1: Update `SignatureEntry` in `src/lib/types.ts`
      (`timestamp→committedAt`, `signer→entity`, +`summary`, +`category`).
- [ ] Step 2: Update `ComplianceSummary` in `src/lib/types.ts`
      (mark `validCount`, `invalidCount`, `skippedCount`,
      `oldestUnaddressedAdr` optional).
- [ ] Step 3: Update `src/lib/mock/compliance.ts` to the new shapes
      (rich summary kept; signature rows use new field names + new fields).
- [ ] Step 4: Update `SignatureValidationTable.tsx` — column keys/cells to
      `committedAt`/`entity`; add Summary + Category columns; update search
      + signer filter to `entity`.
- [ ] Step 5: Update `ComplianceSummaryCards.tsx` — guard optional fields
      (conditional sub-values + conditional Oldest ADR card).
- [ ] Step 6: Thread `?days=90` through `fetchVerificationHistory`
      (`api/verify.ts` + `verify-data.ts` + `verify/page.tsx`).
- [ ] Step 7: Improve `triggerSoc2Export` in `api/compliance.ts` — parse
      error body on non-OK, verify `Content-Type: application/zip` before
      blob-ing.
- [ ] Step 8: Update `docs/Backend-Notes.md` §3.5 + §3.6 + changelog.

## Phase 4: Verification

- [x] `npm run build`
- [x] `npm run lint`
- [x] `npm run test:unit` (64/64 pass)
- [x] Manual: mock-fallback render check (daemon down) on /compliance + /verify
      — types align, mock keeps richer data, live contract type-checks
- [~] `codex review --uncommitted` — BLOCKED: Codex CLI hit usage limit
      (resets Jun 24 20:56). Native gates (build/lint/test:unit) all pass.
      Re-run codex review after the limit resets if a cross-model pass is
      still wanted before final close.
- [~] Subagent addresses codex findings — blocked on the above
- [~] Second `codex review` — blocked on the above
- [x] `changeguard verify` — skipped, no backend contract change (frontend-only
      alignment to already-shipped backend E1/E2/E3)

## Phase 5: Finalization

- [ ] Mark this track Completed in `conductor/conductor.md`.
- [ ] Commit with `changeguard ledger commit <tx-id> ...`.
- [ ] Run `changeguard ledger status --compact` to confirm clean.