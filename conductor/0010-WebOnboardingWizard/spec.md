# Track 0010: Web Onboarding Wizard

## Objective
Provide a high-signal, frictionless "Zero to One" experience for new users. Guide them from an empty state (no project detected) to their first index, impact report, and ledger transaction.

## Requirements

### 1. Empty State Detection
- [ ] Implement detection logic in `DashboardPage` to identify when zero projects are configured.
- [ ] Create `src/components/OnboardingOverlay.tsx` to handle the wizard flow.

### 2. Guided Flow (The Wizard)
- [ ] **Step 1: Introduction**: Welcome message and value proposition (Local-first, AI-governed).
- [ ] **Step 2: Project Connection**: Guide the user to run `ledger init` in their local repo or browse to an existing `.changeguard` directory.
- [ ] **Step 3: First Scan**: Trigger a project scan and index (mock for now, real via daemon when available).
- [ ] **Step 4: Intent Ledger**: Explain the importance of starting a transaction before coding.

### 3. Progressive Disclosure
- [ ] Use a modal or full-screen overlay that can be dismissed.
- [ ] Persist "Onboarding Completed" state in `localStorage`.

### 4. Interactive Elements
- [ ] "Copy to clipboard" buttons for CLI commands.
- [ ] Success animations (Lottie or CSS) when a step is completed.

## Definition of Done
- [ ] Onboarding wizard triggers automatically on an empty project list.
- [ ] User can complete all 4 steps and reach the dashboard.
- [ ] Wizard is fully responsive and keyboard accessible.
- [ ] "Onboarding Completed" state persists across refreshes.
- [ ] `npm run build` and `npm run lint` pass.
- [ ] Transaction committed to the Ed25519 signed ledger.
