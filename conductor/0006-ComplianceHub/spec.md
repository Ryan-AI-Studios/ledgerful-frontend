# Track SPEC: 0006-ComplianceHub — SOC2 Evidence Export and Signature Validation

## Objective

Add a `/compliance` (or `/audit`) page that gives managers and auditors a read-only compliance hub: signed transaction counts, signature validity, last audit date, oldest unaddressed ADR, and a one-click SOC2 evidence export.

## Why This Matters

The monetization roadmap and `docs/Product.md` identify the compliance hub as the screen CISOs and engineering managers screenshot for audits. It is the clearest Enterprise-tier value surface. Without it, the dashboard is a developer tool; with it, the dashboard becomes an audit artifact.

## Requirements

### Must Have
- A new top-level page reachable from the sidebar: **Compliance**.
- Summary cards:
  - Total signed transactions
  - Signature validity percentage
  - Last audit date
  - Oldest unaddressed ADR
- Signature validation table: transaction ID, timestamp, signer, valid/invalid/skipped status.
- "Export SOC2 evidence" button that downloads a ZIP from the backend.
- Data sourced via the API client layer from Track 0001, with mock fallback.

### Should Have
- Hotspot delta since last audit.
- Commit velocity sparkline over the last 90 days.
- Filter validation table by status and date range.

### Won't Do
- Full audit-report generation in the frontend (backend produces the ZIP; frontend triggers download).
- Policy editor or compliance rule configuration (deferred to settings/enterprise tracks).

## API / Data Contracts

```ts
// src/lib/types.ts additions
export interface ComplianceSummary {
  totalSigned: number;
  validCount: number;
  invalidCount: number;
  skippedCount: number;
  validityPercent: number;
  lastAuditAt?: string;
  oldestUnaddressedAdr?: AdrEntry;
  hotspotDeltaPercent: number;
}

export interface SignatureEntry {
  txId: string;
  timestamp: string;
  signer: string;
  status: "VALID" | "INVALID" | "SKIPPED";
}

export interface AdrEntry {
  id: string;
  title: string;
  createdAt: string;
  status: "PROPOSED" | "ACCEPTED" | "DEPRECATED" | "SUPERSEDED";
}
```

Live endpoints:
- `GET /api/v1/compliance/summary`
- `GET /api/v1/compliance/signatures`
- `GET /api/v1/compliance/export` — returns a ZIP file

## UI/UX Notes

- Read-only visual treatment: no primary action colors except the export button.
- Use risk multi-cue indicators for signature status (color + icon + text).
- Transaction IDs are selectable/copyable.
- Export button shows download progress and error state.

## Testing Strategy

- Unit tests for validity percentage calculation.
- Manual verification of ZIP download with mock blob.
- Screenshot of compliance hub default state.

## Definition of Done

- [ ] No placeholders or stubs remain in the implementation.
- [ ] `/compliance` page exists and is reachable from the sidebar.
- [ ] Summary cards render live or mock data correctly.
- [ ] Signature validation table renders with multi-cue status.
- [ ] Export button triggers backend ZIP download.
- [ ] Implementation reviewed by a subagent.
- [ ] Review findings addressed and verified by a subagent.
- [ ] `codex review` run on the uncommitted diff; findings addressed.
- [ ] Second `codex review` confirms no new critical/high findings.
- [ ] Manual end-to-end test of compliance summary and export passed.
- [ ] `npm run build` passes.
- [ ] `npm run lint` passes.
- [ ] Screenshots captured.
- [ ] `changeguard ledger status --compact` clean.

## Related Documents

- `docs/product.md`
- `docs/design.md`
- `AGENTS.md`
- `conductor/0001-DaemonAPIClientLayer/spec.md`
