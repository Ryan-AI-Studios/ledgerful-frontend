# Track PLAN: 0001-DaemonAPIClientLayer — Daemon API Client Layer

## Phase 1: Discovery

- [x] Read `conductor/conductor.md` for context.
- [x] Read `AGENTS.md`, `docs/product.md`, `docs/design.md`.
- [x] Run `changeguard ledger status --compact`.
- [x] Run `npm run build` to confirm baseline compiles.

## Phase 2: Design / Spec

- [x] Finalize `spec.md`.
- [x] Identify files to create and modify.
- [x] Note mock data vs live API boundary.
- [x] Note screenshot updates needed.

## Phase 3: Implementation

- [x] Step 1: Create `src/lib/api.ts` with typed `apiGet`, `apiPost`, and `ApiError`.
- [x] Step 2: Create per-domain clients: `src/lib/api/dashboard.ts`, `changes.ts`, `ledger.ts`, `hotspots.ts`, `graph.ts`, `status.ts`.
- [x] Step 3: Add `.env.example` with `NEXT_PUBLIC_LEDGERFUL_API_URL` and `NEXT_PUBLIC_LEDGERFUL_USE_MOCK`.
- [x] Step 4: Update mock services to export the same shape as live clients so pages can switch sources.
- [x] Step 5: Wire pages in `src/app/**/page.tsx` to use the API client layer, falling back to mock when daemon is unreachable or `NEXT_PUBLIC_LEDGERFUL_USE_MOCK=true`.

## Phase 4: Verification

- [x] `npm run build`
- [x] `npm run lint`
- [x] `npm run test:unit` (if tests touched)
- [x] `npm run test:e2e` (if UI flows touched) — not required for this track
- [x] Manual click-through / screenshots
- [x] `changeguard verify` (if backend contract changed) — frontend contract only

## Phase 5: Finalization

- [x] Mark this track Completed in `conductor/conductor.md`.
- [x] Commit with `changeguard ledger commit <tx-id> --summary "..." --reason "..."`.
- [x] Run `changeguard ledger status --compact` to confirm clean.
