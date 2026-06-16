# Track PLAN: 0007-VerificationHistory — Verification Pass/Fail Trends and Health

## Phase 1: Discovery

- [ ] Read `conductor/conductor.md` for context.
- [ ] Read `AGENTS.md`, `docs/product.md`, `docs/design.md`.
- [ ] Read `conductor/0001-DaemonAPIClientLayer/spec.md` for API client boundaries.
- [ ] Review `changeguard verify --health` and `changeguard verify --explain` output shapes.
- [ ] Run `changeguard ledger status --compact`.
- [ ] Run `npm run build` to confirm baseline compiles.

## Phase 2: Design / Spec

- [ ] Confirm `spec.md` covers data shapes, endpoints, and UI behavior.
- [ ] Identify files to create and modify (`src/app/verify/page.tsx`, `src/lib/api/verify.ts`, `src/components/VerificationHealthCard.tsx`, `src/components/VerificationStepsTable.tsx`).
- [ ] Note mock data vs live API boundary.
- [ ] Note screenshot updates needed.

## Phase 3: Implementation

- [x] Step 1: Add verification types to `src/lib/types.ts`.
- [x] Step 2: Create `src/lib/api/verify.ts` wired through `src/lib/api.ts`.
- [x] Step 3: Create health status card with status dot + text.
- [x] Step 4: Create pass/fail trend sparkline component.
- [x] Step 5: Create verification steps table with sorting.
- [x] Step 6: Create `/verify/page.tsx` hosting the components.
- [x] Step 7: Add "Verify" link to `Sidebar`.

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
