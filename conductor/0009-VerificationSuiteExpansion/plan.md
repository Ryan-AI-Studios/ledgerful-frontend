# Plan: Track 0009 — Verification Suite Expansion

## Phase 1: Infrastructure
- [ ] Install `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, and `@vitest/ui`.
- [ ] Update `vitest.config.ts` to support JSDOM.
- [ ] Create `src/test/setup.ts` for Jest-DOM matchers.
- [ ] Verify environment with a simple "Hello World" component test.

## Phase 2: Logic Testing (API & Data)
- [ ] Implement tests for `src/lib/api/trends.ts` and `src/lib/trends-data.ts`.
- [ ] Implement tests for `src/lib/api/hotspots.ts` and `src/lib/hotspots-data.ts`.
- [ ] Implement tests for `src/lib/api/compliance.ts` logic.
- [ ] Implement tests for `src/lib/api/verify.ts` logic.

## Phase 3: Accessibility & Component Testing
- [ ] Implement interaction tests for `src/components/UserMenu.tsx`.
- [ ] Implement responsiveness/overlay tests for `src/components/Sidebar.tsx`.
- [ ] Implement state machine tests for `src/components/Soc2ExportButton.tsx`.

## Phase 4: Final Validation
- [ ] Run `npm run test:unit` and ensure 100% pass rate.
- [ ] Run `npm run lint` and `npm run build`.
- [ ] Close the track in `conductor/conductor.md`.
