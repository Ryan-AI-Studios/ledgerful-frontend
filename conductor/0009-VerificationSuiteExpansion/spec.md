# Track 0009: Verification Suite Expansion

## Objective
Establish a comprehensive unit testing suite for all post-v1 features (Tracks 0002–0008). Ensure that business logic, data aggregation, and accessible UI interactions are verified and regression-proof.

## Requirements

### 1. Testing Infrastructure
- [ ] Add `jsdom` environment support for component testing.
- [ ] Add `@testing-library/react` and `@testing-library/jest-dom` for accessible UI assertions.
- [ ] Configure `vitest` to support both Node (API) and Browser (Component) testing environments.

### 2. Track 0002: Trends & Hotspots
- [ ] Test trend data aggregation (rolling 90-day health).
- [ ] Verify hotspot risk scoring logic.
- [ ] Test `withFallback` behavior for trends/hotspots.

### 3. Track 0003 & 0005: Accessibility & Interactivity
- [ ] Test `UserMenu` keyboard navigation (ArrowDown, ArrowUp, Esc, Tab-trap).
- [ ] Test Sidebar focus management in mobile/overlay state.
- [ ] Verify touch target compliance logic (test utility to check computed styles or props).

### 4. Track 0004: Graph Logic
- [ ] Test graph viewport math (zoom/pan clamping).
- [ ] Verify node/edge data normalization.

### 5. Track 0006 & 0007: Compliance & Verification
- [ ] Test signature validity percentage calculations.
- [ ] Test verification pass-rate aggregation and sparkline data generation.
- [ ] Verify SOC2 export button state machine (idle -> loading -> success).

## Testing Strategy
- **Unit Tests**: Pure logic (aggregation, math) using `vitest`.
- **Component Tests**: Accessibility and UI state using `react-testing-library`.
- **Mocking**: Use existing `src/lib/mock/*` data as the source of truth for tests.

## Definition of Done
- [ ] `jsdom` and testing library properly configured.
- [ ] New tests created in `src/lib/__tests__` or alongside components.
- [ ] All new tests pass with `npm run test:unit`.
- [ ] Test coverage for Tracks 0002-0008 business logic exceeds 80%.
- [ ] Accessibility interaction tests pass for `UserMenu` and `Sidebar`.
- [ ] `npm run build` and `npm run lint` pass.
- [ ] Transaction committed to the Ed25519 signed ledger.
