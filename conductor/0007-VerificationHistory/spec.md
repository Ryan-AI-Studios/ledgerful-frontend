# Track SPEC: 0007-VerificationHistory — Verification Pass/Fail Trends and Health

## Objective

Add a `/verify` (or `/verification`) page that surfaces verification history: pass/fail rates per step over time, current health status, slowest commands, and a correlation view linking changes to failures.

## Why This Matters

`docs/Product.md` calls this out as a dedicated screen. Verification history turns ChangeGuard from "what changed" into "did our checks catch it." It's the natural home for developer champions and CI-conscious teams.

## Requirements

### Must Have
- A new top-level page reachable from the sidebar: **Verify**.
- Current health status card (healthy / degraded / failing) with last run time.
- Pass/fail rate sparkline over the last 90 days.
- Table of verification steps: name, last run, avg duration, pass rate, recent failures.
- Data sourced via the API client layer from Track 0001, with mock fallback.

### Should Have
- "Slowest commands" list.
- Correlation explorer: select a failure → see the transaction(s) most likely linked to it.
- Re-run verification button (if daemon supports it).

### Won't Do
- Real-time CI integration in the frontend (deferred to GitHub App track).
- Verification step editor (belongs in Settings).

## API / Data Contracts

```ts
// src/lib/types.ts additions
export interface VerificationHealth {
  status: "HEALTHY" | "DEGRADED" | "FAILING";
  lastRunAt: string;
  message?: string;
}

export interface VerificationTrendPoint {
  date: string;
  passed: number;
  failed: number;
}

export interface VerificationStep {
  id: string;
  name: string;
  lastRunAt: string;
  averageDurationMs: number;
  passRatePercent: number;
  recentFailures: number;
}

export interface SlowCommand {
  name: string;
  averageDurationMs: number;
}
```

Live endpoints:
- `GET /api/v1/verify/health`
- `GET /api/v1/verify/history`
- `GET /api/v1/verify/steps`

## UI/UX Notes

- Health status uses the existing status dot + text pattern.
- Pass/fail sparkline uses mint for passed and danger for failed.
- Tables are dense and sortable by duration and pass rate.

## Testing Strategy

- Unit tests for pass-rate and trend aggregation helpers.
- Manual verification with mock verification data.
- Screenshot of verification page default state.

## Definition of Done

- [ ] No placeholders or stubs remain in the implementation.
- [ ] `/verify` page exists and is reachable from the sidebar.
- [ ] Health status, trend sparkline, and steps table render correctly.
- [ ] Implementation reviewed by a subagent.
- [ ] Review findings addressed and verified by a subagent.
- [ ] `codex review` run on the uncommitted diff; findings addressed.
- [ ] Second `codex review` confirms no new critical/high findings.
- [ ] Manual end-to-end test of verification history page passed.
- [ ] `npm run build` passes.
- [ ] `npm run lint` passes.
- [ ] Screenshots captured.
- [ ] `changeguard ledger status --compact` clean.

## Related Documents

- `docs/product.md`
- `docs/design.md`
- `AGENTS.md`
- `conductor/0001-DaemonAPIClientLayer/spec.md`
