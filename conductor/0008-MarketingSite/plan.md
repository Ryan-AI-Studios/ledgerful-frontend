# Track PLAN: 0008-MarketingSite — Landing, Pricing, and Docs Shell

## Phase 1: Discovery

- [ ] Read `conductor/conductor.md` for context.
- [ ] Read `AGENTS.md`, `docs/product.md`, `docs/design.md`.
- [ ] Read the monetization roadmap pricing table and tiers.
- [ ] Run `changeguard ledger status --compact`.
- [ ] Run `npm run build` to confirm baseline compiles.

## Phase 2: Design / Spec

- [ ] Confirm `spec.md` covers pages, route group approach, and pricing content.
- [ ] Identify files to create and modify (`src/app/(marketing)/layout.tsx`, `src/app/(marketing)/page.tsx`, `src/app/(marketing)/pricing/page.tsx`, `src/app/(marketing)/docs/page.tsx`).
- [ ] Decide on shared marketing layout vs. full-site root redirect.
- [ ] Note screenshot updates needed.

## Phase 3: Implementation

- [ ] Step 1: Create `src/app/(marketing)/layout.tsx` without sidebar.
- [ ] Step 2: Build landing page with hero, value props, and install/GitHub App CTAs.
- [ ] Step 3: Build `/pricing` page with Free/Pro/Enterprise table.
- [ ] Step 4: Build `/docs` shell with index and quick-start content.
- [ ] Step 5: Add marketing navigation (topnav or simple links).
- [ ] Step 6: Ensure responsive layout across breakpoints.

## Phase 4: Verification

- [ ] `npm run build`
- [ ] `npm run lint`
- [ ] Manual click-through / screenshots
- [ ] Lighthouse accessibility and performance spot-check
- [ ] `changeguard verify` (if backend contract changed)

## Phase 5: Finalization

- [ ] Mark this track Completed in `conductor/conductor.md`.
- [ ] Commit with `changeguard ledger commit <tx-id> --summary "..." --reason "..."`.
- [ ] Run `changeguard ledger status --compact` to confirm clean.
