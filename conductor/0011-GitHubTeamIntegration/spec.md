# Track 0011: GitHub & Team Integration Surface

## Objective
Provide the user interface for connecting local Ledgerful instances to GitHub and transitioning the dashboard from a single-user tool to a collaborative team surface. This directly addresses Roadmap Priorities #2 (GitHub App) and #7 (Team Sharing).

## Requirements

### 1. GitHub Integration UI (Priority #2)
- [ ] **GitHub Tab in Settings**: A new "Integrations" or "GitHub" section in `/settings`.
    - Display connection status (Connected/Disconnected).
    - Provide a "Connect to GitHub" button (links to GitHub App installation flow).
    - Display linked repository name (e.g., `org/repo`).
- [ ] **PR Visibility in Tables**:
    - Update `Ledger` table to show a "PR" column with linked Pull Request number and status (Open, Merged, Closed).
    - Update `Recent Changes` table to include PR links where available.

### 2. Team Ledger & Multi-User Support (Priority #7)
- [ ] **Author Attribution**:
    - Display author avatars or initials in the `Ledger` and `Changes` lists.
    - Add an "Author" filter to the `Ledger` and `Compliance` tables.
- [ ] **Team Signature Table**:
    - Update the `Compliance Hub` signature table to clearly identify which team member signed each transaction.

### 3. Privacy & Telemetry Management (Priority #8)
- [ ] **Privacy Section in Settings**:
    - Toggle for "Anonymous Usage Metrics".
    - A "Live Payload" view showing exactly what is sent to the `/telemetry` endpoint (JSON format).

### 4. Data Extensions (`src/lib/types.ts`)
- [ ] Add `prNumber` and `prStatus` to `LedgerEntry` and `RecentChange`.
- [ ] Add `githubRepo` and `integrationStatus` to `Project`.

## Design Constraints
- Follow the dark-first, mint-accented design system in `docs/design.md`.
- Use `lucide-react` icons (e.g., `Github`, `Users`, `ShieldCheck`).
- Ensure all new elements are WCAG 2.5.8 compliant (min 44x44px touch targets).

## Definition of Done
- [ ] GitHub Integration tab is functional (in mock mode).
- [ ] Ledger and Changes tables display PR metadata and author avatars.
- [ ] Telemetry toggle and payload viewer are implemented in Settings.
- [ ] All new tests in `Track 0011` pass.
- [ ] `npm run build` and `npm run lint` pass cleanly.
- [ ] Transaction committed to the Ed25519 signed ledger.
