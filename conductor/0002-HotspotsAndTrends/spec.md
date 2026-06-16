# Track SPEC: 0002-HotspotsAndTrends — Real-Time Hotspots and 90-Day Trends

## Objective

Evolve the Hotspots and Trends screens from static mock data to live, time-bounded views that surface where risk is accumulating and how it changes over the last 90 days.

## Why This Matters

v1 shows a single snapshot. Managers and developer champions need to see whether risk is growing, shrinking, or shifting across files and contributors. Trend history turns the dashboard from a status report into a decision tool.

## Requirements

### Must Have
- Trend chart on the dashboard or `/trends` page showing a 90-day rolling view of risk-weighted changes.
- Hotspots list ordered by live risk score with file path, last touched date, and risk level.
- Time-range selector: 7, 30, 90 days (default 90).
- Data sourced through the API client layer from Track 0001, with mock fallback.

### Should Have
- Contributor breakdown per hotspot (who touched it most recently).
- Anomaly markers on the trend line for days with spike activity.

### Won't Do
- Real-time WebSocket streaming (deferred to a future track).
- Predictive analytics or ML-based risk forecasting.

## API / Data Contracts

```ts
// src/lib/types.ts additions
export interface TrendPoint {
  date: string; // ISO date, e.g. "2026-06-15"
  score: number; // 0-100
  changes: number;
  highRiskCount: number;
}

export interface Hotspot {
  id: string;
  filePath: string;
  riskLevel: "HIGH" | "MEDIUM" | "LOW" | "TRIVIAL";
  riskScore: number;
  lastTouchedAt: string;
  contributor?: string;
  changeCount: number;
}
```

Live endpoints (relative to `NEXT_PUBLIC_LEDGERFUL_API_URL`):
- `GET /api/v1/trends?days=90`
- `GET /api/v1/hotspots?days=90`

## UI/UX Notes

- Reuse the existing card, table, and risk badge components.
- Trend line uses the mint primary for the score and coral for anomaly markers.
- Maintain multi-cue risk indicators (color + icon + text) per WCAG 1.4.1.
- URL state for selected time range (`?range=90`).

## Testing Strategy

- Unit tests for trend aggregation helpers.
- Manual verification with mock data for each time range.
- Screenshot updates for `/trends` and `/hotspots`.

## Definition of Done

- [ ] `/hotspots` renders live hotspots sorted by risk score.
- [ ] Trend chart renders 90-day history and responds to range selector.
- [ ] `npm run build` passes.
- [ ] `npm run lint` passes.
- [ ] Screenshots updated if visuals changed.
- [ ] `changeguard ledger status` clean.

## Related Documents

- `docs/product.md`
- `docs/design.md`
- `AGENTS.md`
- `conductor/0001-DaemonAPIClientLayer/spec.md`
