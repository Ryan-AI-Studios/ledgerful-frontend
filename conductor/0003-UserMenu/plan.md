# Track PLAN: 0003-UserMenu — User Menu and Session Surface

## Phase 1: Discovery

- [x] Read `conductor/conductor.md` for context.
- [x] Read `AGENTS.md`, `docs/product.md`, `docs/design.md`.
- [x] Inspect current `TopNav` and avatar placeholder in `src/components/TopNav.tsx`.
- [x] Run `changeguard ledger status --compact`.
- [x] Run `npm run build` to confirm baseline compiles.

## Phase 2: Design / Spec

- [x] Confirm `spec.md` covers menu items and accessibility requirements.
- [x] Identify files to create and modify (`src/components/UserMenu.tsx`, `src/lib/api/session.ts`).
- [x] Note mock data vs live API boundary.
- [x] Note screenshot updates needed.

## Phase 3: Implementation

- [x] Step 1: Add `UserSession` type to `src/lib/types.ts`.
- [x] Step 2: Create `src/lib/api/session.ts` returning a mock demo session.
- [x] Step 3: Create `src/components/UserMenu.tsx` with native `<details>`/`<menu>` or a custom accessible dropdown.
- [x] Step 4: Replace the TopNav "Y" placeholder with `UserMenu`.
- [x] Step 5: Wire keyboard handlers: arrow keys, Enter/Space, Esc, Tab, focus trap, click outside.

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
