# Backend Notes for Ledgerful Frontend

This document captures design decisions, data contracts, and constraints that the Ledgerful/ChangeGuard backend should know when exposing APIs to this frontend. The goal is to avoid conflicts between what the backend provides and what the frontend expects.

## 1. Architecture Philosophy

- **Local-first is the default.** The dashboard is primarily a view into the local ChangeGuard daemon (`http://127.0.0.1:52001` by default). Cloud or team features are layered on later, not assumed.
- **Frontend falls back to mock data** when the daemon is unreachable or `NEXT_PUBLIC_LEDGERFUL_USE_MOCK=true`. Live endpoints and mock services must return the same TypeScript shapes.
- **No secrets in the browser.** Any key that could be abused (Gemini API key, Supabase service role, private Ed25519 keys) must stay server-side or in the daemon. The frontend only receives redacted config.
- **Ephemeral session-token auth.** The daemon issues a short-lived token. The frontend reads it from the `?token=` query parameter on first load and stores it in `sessionStorage`. Subsequent API calls append `?token=<token>` to each request.

## 2. API Contract Principles

### 2.1 Base URL and Versioning

- Default daemon URL: `http://127.0.0.1:52001`.
- All endpoints live under `/api/*` (no `/api/v1` prefix in the current Track M3 implementation).
- The frontend will read `NEXT_PUBLIC_LEDGERFUL_API_URL` at runtime, but the dev server rewrites `/api/*` to the daemon via `next.config.ts`.

### 2.2 Authentication

Every API request must include the ephemeral session token as a query parameter:

```
GET /api/snapshot?token=<ephemeral-token>
```

The token is obtained from the daemon's login redirect (`?token=...`) and stored in `sessionStorage` under the key `ledgerful:token`. The frontend helper `buildApiUrl()` in `src/lib/utils.ts` appends it automatically.

### 2.3 Required Endpoints

The frontend expects these endpoints to exist or be mocked:

| Endpoint | Purpose |
|---|---|
| `GET /api/snapshot` | Summary metrics + recent change feed |
| `GET /api/changes` | Impact packet / change history |
| `GET /api/ledger` | Transaction table, paginated |
| `GET /api/ledger/:txId` | Single transaction detail |
| `GET /api/hotspots` | Hotspot rankings |
| `GET /api/graph` | Knowledge graph nodes + edges |
| `GET /api/status` | Overall daemon / project health |
| `GET /api/settings` | Daemon settings |
| `GET /api/projects` | Project list |
| `GET /api/project` | Active project state |
| `GET /api/session` | Current user session |
| `GET /api/trends` | 90-day rolling risk score + change count |
| `GET /api/ledger/adrs` | ADR list with supersession tree |
| `GET /api/graph/search?q=` | Search graph nodes |
| `GET /api/compliance/summary` | Audit summary cards |
| `GET /api/compliance/signatures` | Signature validation table |
| `GET /api/compliance/export` | SOC2 evidence ZIP download |
| `GET /api/verify/health` | Current verification health |
| `GET /api/verify/history` | Pass/fail trend over time |
| `GET /api/verify/steps` | Verification step metrics |

All endpoints listed above are fully implemented and integrated.

### 2.4 Route Shape for Static Export

Because `next.config.ts` uses `output: "export"`, dynamic route parameters cannot be used for detail pages. The ledger detail page is served at `/ledger/detail?txId=<txId>` instead of `/ledger/[txId]`. Backend links into the dashboard should use this query-based URL.

### 2.5 Response Format

- The shipped backend currently returns **snake_case** keys (e.g., `tx_id`, `project_id`, `overall_risk`). The frontend data services map these to camelCase TypeScript types.
- Prefer camelCase for future endpoints to reduce frontend mapping code.
- Dates as ISO 8601 strings (`2026-06-15T12:00:00Z`).
- `txId`, `adrId`, and other identifiers as short alphanumeric strings, ideally matching the CLI display format.
- Risk levels as uppercase strings: `HIGH`, `MEDIUM`, `LOW`, `TRIVIAL`. Do not use numeric-only risk.

### 2.6 Error Handling

- Return standard HTTP status codes: `200`, `400`, `401`, `403`, `404`, `500`.
- Error bodies should include:
  ```json
  {
    "error": true,
    "status": 500,
    "message": "Daemon index is stale; run 'changeguard index --incremental'"
  }
  ```
- The frontend will surface backend messages in an error card. Keep messages actionable.

## 3. Data Shapes to Preserve

These shapes are defined in `src/lib/types.ts` and are shared between mock and live services. Backend changes to these shapes break the UI.

### 3.1 Risk Levels

```ts
type RiskLevel = "HIGH" | "MEDIUM" | "LOW" | "TRIVIAL";
```

- Maps to color + icon + text in the UI.
- `HIGH` is red triangle, `MEDIUM` yellow circle, `LOW` green empty circle, `TRIVIAL` gray mid-dot.

### 3.2 Transaction / Ledger Entry

```ts
interface LedgerEntry {
  txId: string;
  category: string;
  status: "COMMITTED" | "PENDING" | "ROLLED_BACK";
  summary: string;
  reason: string;
  author: string;
  timeAgo: string;
  files: { path: string; additions: number; deletions: number }[];
  hotspotsCrossed: number;
  testsRun: number;
  flakes: number;
  risk: RiskLevel;
  signature: string;
  publicKey: string;
}
```

**Desired backend additions:** The current `/api/ledger` and `/api/ledger/:txId` endpoints do not return `author`, `files`, `hotspotsCrossed`, `testsRun`, or `flakes`. The frontend currently synthesizes defaults for these so the UI renders, but richer live data requires backend support. The mock service in `src/lib/mock/ledger.ts` shows the intended shape.

### 3.3 Hotspot

```ts
interface Hotspot {
  id: string;
  filePath: string;
  riskLevel: RiskLevel;
  riskScore: number;
  lastTouchedAt: string;
  contributor?: string;
  changeCount: number;
  rank: number;
}
```

### 3.4 Graph

```ts
interface GraphNode {
  id: string;
  type: "file" | "change" | "ai";
  label: string;
  riskLevel?: RiskLevel;
  x?: number;
  y?: number;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: "depends" | "changed" | "ai-edited";
}
```

### 3.5 Compliance

```ts
interface ComplianceSummary {
  totalSigned: number;
  validCount: number;
  invalidCount: number;
  skippedCount: number;
  validityPercent: number;
  lastAuditAt?: string;
  hotspotDeltaPercent: number;
}

interface SignatureEntry {
  txId: string;
  timestamp: string;
  signer: string;
  status: "VALID" | "INVALID" | "SKIPPED";
}
```

### 3.6 Verification

```ts
interface VerificationHealth {
  status: "HEALTHY" | "DEGRADED" | "FAILING";
  lastRunAt: string;
  message?: string;
}

interface VerificationTrendPoint {
  date: string;
  passed: number;
  failed: number;
}

interface VerificationStep {
  id: string;
  name: string;
  lastRunAt: string;
  averageDurationMs: number;
  passRatePercent: number;
  recentFailures: number;
}
```

### 3.7 Status Response

```ts
interface StatusResponse {
  indexReady: boolean;
  graphReady: boolean;
  pendingTransactions: number;
  unauditedDrift: number;
  embeddingModelReachable: boolean;
  completionModelReachable: boolean;
}
```

Backend returns snake_case keys; the frontend maps them to camelCase.

### 3.8 Project

```ts
interface Project {
  id: string;
  name: string;
  path: string;
  status: "healthy" | "warning" | "critical";
  lastScanAt: string;
  healthScore: number;
}
```


**Desired backend additions:** The current `/api/projects` endpoint returns only `id`, `name`, and `path`. The frontend currently defaults `status` to `"healthy"`, `lastScanAt` to `"now"`, and `healthScore` to `100`. Richer project switching requires backend support for status, last scan time, and health score.

## 4. CLI / UI Parity

- The dashboard is the manager-friendly version of the CLI. Any risk language, badge colors, or category names should match the CLI exactly.
- If the CLI renames a category or risk level, the frontend must be updated in the same release.
- CLI commands that produce JSON output should be the source of truth for backend API implementations:
  - `changeguard ledger audit --json`
  - `changeguard impact --json`
  - `changeguard hotspots --json`
  - `changeguard verify --health`
  - `changeguard ledger audit --json --sections`

## 5. CORS and Local Development

- The daemon must allow CORS from `http://localhost:52001` in development mode.
- The Next.js dev server rewrites `/api/*` to `http://127.0.0.1:52001/api/*` via `next.config.ts`, which avoids most CORS issues for local development.
- Local daemon endpoints require the ephemeral session token (`?token=`) even in the free/local tier. The daemon issues this token on first contact/login and validates it per request.
- If auth is added for team/SaaS tiers, preserve a clear local-auth fallback path.

## 6. Performance Expectations

- Dashboard summary calls should complete in under 500 ms on a warm daemon.
- Graph endpoints may be slower but should stream or paginate large graphs.
- The frontend shows skeletons during loading; backend does not need to optimize for instant first paint, but should avoid multi-second blocking calls.

## 7. Security and Redaction

- `GET /api/settings` must redact secrets, API keys, and private keys before returning JSON.
- Never return raw `.env` contents or the Ed25519 private key.
- Do not leak the ephemeral session token in responses or logs.
- Compliance export (`/api/compliance/export`) should produce a ZIP with signed evidence, not raw database files.

## 8. Frontend-Backend Release Coordination

- API contract changes require updating both backend and frontend in a coordinated way.
- When the backend adds a new endpoint, add a matching mock service in `src/lib/*-data.ts` so the dashboard works offline.
- When the frontend adds a new screen, document the required endpoints here and in the relevant track `spec.md`.

## 9. Open Questions

- Will team/multi-user mode require a separate backend sync protocol, or will it layer on top of the daemon via Supabase?
- Should the GitHub App eventually push data into the daemon, or into a shared Postgres via Supabase?
- What is the long-term plan for real-time updates: polling, Supabase Realtime, WebSocket from the daemon?

## Related Documents

- `docs/product.md` — product purpose and personas
- `docs/design.md` — visual design system
- `conductor/0001-DaemonAPIClientLayer/spec.md` — API client layer track
- `AGENTS.md` — agent constraints and verification gates

## Changelog

- **2026-06-16** — Finalized data contracts for Tracks 0002-0008 (Hotspots, Trends, Graph, Compliance, Verify, Session); updated data shapes in Section 3 to match `src/lib/types.ts`.
- **2026-06-16** — Reconciled with Track M3 implementation: changed base URL from `/api/v1/*` to `/api/*`, default port from `52000` to `52001`, added ephemeral `?token=` auth, documented snake_case response normalization, and added static-export route shape note (`/ledger/detail?txId=`).
