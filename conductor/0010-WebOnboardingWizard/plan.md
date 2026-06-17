# Plan: Track 0010 — Web Onboarding Wizard

## Phase 1: Detection & UI Shell
- [ ] Update `DashboardPage` to check if `projects.length === 0`.
- [ ] Scaffold `src/components/OnboardingWizard.tsx`.
- [ ] Implement state management for current step (1-4).

## Phase 2: Content & Interactions
- [ ] Build Step 1: Welcome & Value Prop.
- [ ] Build Step 2: CLI Guide (`ledger init`).
- [ ] Build Step 3: Indexing Feedback.
- [ ] Build Step 4: Ledger Introduction.

## Phase 3: Polish & Persistence
- [ ] Add animations for step transitions.
- [ ] Add "Skip Onboarding" and "Dismiss" logic.
- [ ] Save completion status to `localStorage`.

## Phase 4: Final Validation
- [ ] Manual end-to-end walkthrough in a "clean" session (clear localStorage).
- [ ] `npm run build` and `npm run lint`.
- [ ] Close the track in `conductor/conductor.md`.
