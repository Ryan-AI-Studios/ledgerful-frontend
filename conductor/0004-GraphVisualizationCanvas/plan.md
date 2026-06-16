# Track PLAN: 0004-GraphVisualizationCanvas — Interactive Knowledge-Graph Canvas

## Phase 1: Discovery

- [ ] Read `conductor/conductor.md` for context.
- [ ] Read `AGENTS.md`, `docs/product.md`, `docs/design.md`.
- [ ] Inspect current `/graph` page and any placeholder components.
- [ ] Run `changeguard ledger status --compact`.
- [ ] Run `npm run build` to confirm baseline compiles.

## Phase 2: Design / Spec

- [ ] Confirm `spec.md` covers node/edge types, interactions, and accessibility.
- [ ] Identify files to create and modify (`src/components/GraphCanvas.tsx`, `src/lib/api/graph.ts`, `/graph/page.tsx`).
- [ ] Choose rendering approach (Canvas/SVG/D3) and document rationale.
- [ ] Note mock data vs live API boundary.
- [ ] Note screenshot updates needed.

## Phase 3: Implementation

- [ ] Step 1: Add `GraphNode`, `GraphEdge`, and `GraphData` types to `src/lib/types.ts`.
- [ ] Step 2: Create or update `src/lib/api/graph.ts` returning mock graph data.
- [ ] Step 3: Create `src/components/GraphCanvas.tsx` with rendering, pan/zoom, and selection state.
- [ ] Step 4: Add detail panel component for selected node.
- [ ] Step 5: Update `/graph/page.tsx` to host the canvas and detail panel.
- [ ] Step 6: Add keyboard controls and accessible labels.

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
