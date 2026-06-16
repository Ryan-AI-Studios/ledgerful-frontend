# Track PLAN: 0003-UserMenu — User Menu and Session Surface

## Phase 1: Discovery

- [ ] Read `conductor/conductor.md` for context.
- [ ] Read `AGENTS.md`, `docs/product.md`, `docs/design.md`.
- [ ] Inspect current `TopNav` and avatar placeholder in `src/components/TopNav.tsx`.
- [ ] Run `changeguard ledger status --compact`.
- [ ] Run `npm run build` to confirm baseline compiles.

## Phase 2: Design / Spec

- [ ] Confirm `spec.md` covers menu items and accessibility requirements.
- [ ] Identify files to create and modify (`src/components/UserMenu.tsx`, `src/lib/api/session.ts`).
- [ ] Note mock data vs live API boundary.
- [ ] Note screenshot updates needed.

## Phase 3: Implementation

- [ ] Step 1: Add `UserSession` type to `src/lib/types.ts`.
- [ ] Step 2: Create `src/lib/api/session.ts` returning a mock demo session.
- [ ] Step 3: Create `src/components/UserMenu.tsx` with native `<details>`/`<menu>` or a custom accessible dropdown.
- [ ] Step 4: Replace the TopNav "Y" placeholder with `UserMenu`.
- [ ] Step 5: Wire keyboard handlers: arrow keys, Enter/Space, Esc, Tab, focus trap, click outside.

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
