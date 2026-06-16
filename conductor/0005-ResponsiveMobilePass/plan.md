# Track PLAN: 0005-ResponsiveMobilePass — Responsive Layout and Mobile Pass

## Phase 1: Discovery

- [ ] Read `conductor/conductor.md` for context.
- [ ] Read `AGENTS.md`, `docs/product.md`, `docs/design.md`.
- [ ] Audit current layout in `src/components/Sidebar.tsx`, `TopNav.tsx`, and page grids.
- [ ] Run `changeguard ledger status --compact`.
- [ ] Run `npm run build` to confirm baseline compiles.

## Phase 2: Design / Spec

- [ ] Confirm `spec.md` covers breakpoints, sidebar behavior, and table handling.
- [ ] Identify files to create and modify.
- [ ] Note screenshot updates needed per breakpoint.

## Phase 3: Implementation

- [ ] Step 1: Add Tailwind responsive classes to `PageLayout` and dashboard grid.
- [ ] Step 2: Convert `Sidebar` to support collapsed overlay mode below `1024px`.
- [ ] Step 3: Add hamburger trigger to `TopNav` and keyboard toggle handler.
- [ ] Step 4: Make `DataTable` horizontally scrollable below `768px`.
- [ ] Step 5: Verify touch targets and spacing across all pages.

## Phase 4: Verification

- [x] `npm run build`
- [x] `npm run lint`
- [x] Manual testing at 375px, 768px, 1024px, 1440px
- [x] Screenshot capture at each breakpoint
- [x] Keyboard/focus testing for mobile sidebar

## Phase 5: Finalization

- [x] Mark this track Completed in `conductor/conductor.md`.
- [x] Commit with `changeguard ledger commit <tx-id> --summary "..." --reason "..."`.
- [x] Run `changeguard ledger status --compact` to confirm clean.
