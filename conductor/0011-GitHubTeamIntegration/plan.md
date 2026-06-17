# Plan: Track 0011 — GitHub & Team Integration Surface

## Phase 1: Data Model & Types
- [ ] Extend `src/lib/types.ts` with GitHub and multi-user fields.
- [ ] Update `src/lib/mock/*` data to include PR numbers, statuses, and diverse authors.
- [ ] Implement `src/lib/api/github.ts` for integration status and connection triggers.

## Phase 2: Settings Expansion
- [ ] Add "Integrations" tab to `src/app/settings/page.tsx`.
- [ ] Implement GitHub connection UI (Connected/Disconnected states).
- [ ] Add "Privacy & Telemetry" section with toggle and payload preview.

## Phase 3: Collaborative Tables
- [ ] Update `src/components/DataTable.tsx` or specific table components to handle PR badges.
- [ ] Add Author avatar/initial column to `Ledger` and `Changes` tables.
- [ ] Implement filtering by Author in relevant table views.
- [ ] Update `Compliance Hub` to show signer identity in the signature table.

## Phase 4: Polish & Accessibility
- [ ] Ensure all new buttons and toggles meet 44x44px touch target minimums.
- [ ] Add descriptive ARIA labels to GitHub status indicators and telemetry toggles.
- [ ] Verify keyboard navigation for the new Settings tabs.

## Phase 5: Verification & Testing
- [ ] Add unit tests for `src/lib/api/github.ts`.
- [ ] Add component tests for the new Settings sections.
- [ ] Run `npm run test:unit`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Commit with `changeguard ledger commit`.
