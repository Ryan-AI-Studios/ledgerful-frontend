# Track PLAN: 0002-HotspotsAndTrends — Real-Time Hotspots and 90-Day Trends

## Phase 1: Discovery

- [ ] Read `conductor/conductor.md` for context.
- [ ] Read `AGENTS.md`, `docs/product.md`, `docs/design.md`.
- [ ] Read `conductor/0001-DaemonAPIClientLayer/spec.md` for API client boundaries.
- [ ] Run `changeguard ledger status --compact`.
- [ ] Run `npm run build` to confirm baseline compiles.

## Phase 2: Design / Spec

- [ ] Confirm `spec.md` covers data shapes, endpoints, and UI behavior.
- [ ] Identify files to create and modify (`src/lib/api/hotspots.ts`, `src/lib/api/trends.ts`, pages).
- [ ] Note mock data vs live API boundary.
- [ ] Note screenshot updates needed.

## Phase 3: Implementation

- [x] Step 1: Add `TrendPoint` and `Hotspot` types to `src/lib/types.ts`.
- [x] Step 2: Create `src/lib/api/hotspots.ts` and `src/lib/api/trends.ts` wired through `src/lib/api.ts`.
- [x] Step 3: Create or update `/hotspots` page to render the hotspots table with sorting.
- [x] Step 4: Create or update `/trends` page with a 90-day chart and range selector (7/30/90).
- [x] Step 5: Sync mock data services to produce realistic 90-day trend history.

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
