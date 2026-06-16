# Track PLAN: {TRACK_ID} — {TITLE}

> Copy this template into `conductor/{trackId}/plan.md` and fill in the checklist.

## Phase 1: Discovery

- [ ] Read `conductor/conductor.md` for context.
- [ ] Read `AGENTS.md`, `docs/product.md`, `docs/design.md`.
- [ ] Run `changeguard ledger status --compact`.
- [ ] Run `npm run build` to confirm baseline compiles.

## Phase 2: Design / Spec

- [ ] Finalize `spec.md` if not already done.
- [ ] Identify files to create and modify.
- [ ] Note mock data vs live API boundary.
- [ ] Note screenshot updates needed.

## Phase 3: Implementation

- [ ] Step 1: ...
- [ ] Step 2: ...
- [ ] Step 3: ...

## Phase 4: Verification

- [ ] `npm run build`
- [ ] `npm run lint`
- [ ] `npm run test:unit` (if tests touched)
- [ ] `npm run test:e2e` (if UI flows touched)
- [ ] Manual click-through / screenshots
- [ ] `changeguard verify` (if backend contract changed)

## Phase 5: Finalization

- [ ] Mark this track Completed in `conductor/conductor.md`.
- [ ] Commit with `changeguard ledger commit <tx-id> --summary "..." --reason "..."`.
- [ ] Run `changeguard ledger status --compact` to confirm clean.
