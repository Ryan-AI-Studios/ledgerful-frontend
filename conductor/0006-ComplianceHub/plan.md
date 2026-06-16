# Track PLAN: 0006-ComplianceHub — SOC2 Evidence Export and Signature Validation

## Phase 1: Discovery

- [ ] Read `conductor/conductor.md` for context.
- [ ] Read `AGENTS.md`, `docs/product.md`, `docs/design.md`.
- [ ] Read `conductor/0001-DaemonAPIClientLayer/spec.md` for API client boundaries.
- [ ] Review `changeguard ledger audit --json` output shape from backend if available.
- [ ] Run `changeguard ledger status --compact`.
- [ ] Run `npm run build` to confirm baseline compiles.

## Phase 2: Design / Spec

- [ ] Confirm `spec.md` covers data shapes, endpoints, and UI behavior.
- [ ] Identify files to create and modify (`src/app/compliance/page.tsx`, `src/lib/api/compliance.ts`, `src/components/ComplianceCards.tsx`, `src/components/SignatureTable.tsx`).
- [ ] Note mock data vs live API boundary.
- [ ] Note screenshot updates needed.

## Phase 3: Implementation

- [ ] Step 1: Add compliance types to `src/lib/types.ts`.
- [ ] Step 2: Create `src/lib/api/compliance.ts` wired through `src/lib/api.ts`.
- [ ] Step 3: Create summary card components for the compliance hub.
- [ ] Step 4: Create signature validation table with sorting/filtering.
- [ ] Step 5: Implement SOC2 ZIP export button with loading and error states.
- [ ] Step 6: Create `/compliance/page.tsx` hosting the cards, table, and export button.
- [ ] Step 7: Add "Compliance" link to `Sidebar`.

## Phase 4: Verification

- [x] `npm run build`
- [x] `npm run lint`
- [x] `npm run test:unit` (if tests touched)
- [x] `npm run test:e2e` (if UI flows touched)
- [x] Manual click-through / screenshots
- [x] `changeguard verify` (if backend contract changed)

## Phase 5: Finalization

- [x] Mark this track Completed in `conductor/conductor.md`.
- [x] Commit with `changeguard ledger commit <tx-id> --summary "..." --reason "..."`.
- [x] Run `changeguard ledger status --compact` to confirm clean.
