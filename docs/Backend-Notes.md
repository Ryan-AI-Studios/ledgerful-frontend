# Backend Notes for Ledgerful Frontend

This document captures design decisions, data contracts, and constraints that the Ledgerful/ChangeGuard backend should know when exposing APIs to this frontend. The goal is to avoid conflicts between what the backend provides and what the frontend expects.

## 1. Architecture Philosophy

- **Local-first is the default.** The dashboard is primarily a view into the local ChangeGuard daemon (`http://127.0.0.1:52000` by default). Cloud or team features are layered on later, not assumed.
- **Frontend falls back to mock data** when the daemon is unreachable or `NEXT_PUBLIC_LEDGERFUL_USE_MOCK=true`. Live endpoints and mock services must return the same TypeScript shapes.
- **No secrets in the browser.** Any key that could be abused (Gemini API key, Supabase service role, private Ed25519 keys) must stay server-side or in the daemon. The frontend only receives redacted config.

## 2. API Contract Principles

### 2.1 Base URL and Versioning

- Default daemon URL: `http://127.0.0.1:52000`.
- All endpoints live under `/api/v1/`.
- The frontend will read `NEXT_PUBLIC_LEDGERFUL_API_URL` at runtime.

### 2.2 Required Endpoints

The frontend currently expects these endpoints to exist or be mocked:

| Endpoint | Purpose |
|---|---|
| `GET /api/v1/dashboard` | Summary metrics + recent change feed |
| `GET /api/v1/changes` | Impact packet / change history, paginated |
| `GET /api/v1/ledger/entries` | Transaction table, paginated and filterable |
| `GET /api/v1/ledger/entries/:id` | Single transaction detail |
| `GET /api/v1/ledger/adrs` | ADR list with supersession tree |
| `GET /api/v1/hotspots` | Hotspot rankings |
| `GET /api/v1/trends` | 90-day rolling risk score + change count |
| `GET /api/v1/graph` | Knowledge graph nodes + edges |
| `GET /api/v1/graph/search?q=` | Search graph nodes |
| `GET /api/v1/status` | Overall daemon / project health |
| `GET /api/v1/session` | Current user session |
| `GET /api/v1/compliance/summary` | Audit summary cards |
| `GET /api/v1/compliance/signatures` | Signature validation table |
| `GET /api/v1/compliance/export` | SOC2 evidence ZIP download |
| `GET /api/v1/verify/health` | Current verification health |
| `GET /api/v1/verify/history` | Pass/fail trend over time |
| `GET /api/v1/verify/steps` | Verification step metrics |
| `GET /api/v1/settings/config` | Redacted config view |

Endpoints marked *future* (Compliance, Verify, Session) are used by Tracks 0003, 0006, and 0007.

### 2.3 Response Format

- Return JSON with camelCase keys to match the frontend TypeScript types.
- Dates as ISO 8601 strings (`2026-06-15T12:00:00Z`).
- `txId`, `adrId`, and other identifiers as short alphanumeric strings, ideally matching the CLI display format.
- Risk levels as uppercase strings: `HIGH`, `MEDIUM`, `LOW`, `TRIVIAL`. Do not use numeric-only risk.

### 2.4 Error Handling

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
  id: string;
  txId: string;
  timestamp: string;
  category: "ARCHITECTURE" | "FEATURE" | "INFRA" | "SECURITY" | "REFACTOR" | "BUGFIX" | "DOCS" | "CHORE";
  entity: string;
  summary: string;
  riskLevel: RiskLevel;
  status: "PENDING" | "COMMITTED" | "ROLLED_BACK";
  signed: boolean;
}
```

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
}
```

### 3.4 Graph

```ts
interface GraphNode {
  id: string;
  type: "file" | "change" | "ai";
  label: string;
  riskLevel?: RiskLevel;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: "depends" | "changed" | "ai-edited";
}
```

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
- Do not require authentication for local daemon endpoints in the free/local tier.
- If auth is added for team/SaaS tiers, provide a clear local-auth fallback or dev token path.

## 6. Performance Expectations

- Dashboard summary calls should complete in under 500 ms on a warm daemon.
- Graph endpoints may be slower but should stream or paginate large graphs.
- The frontend shows skeletons during loading; backend does not need to optimize for instant first paint, but should avoid multi-second blocking calls.

## 7. Security and Redaction

- `GET /api/v1/settings/config` must redact secrets, API keys, and private keys before returning JSON.
- Never return raw `.env` contents or the Ed25519 private key.
- Compliance export (`/api/v1/compliance/export`) should produce a ZIP with signed evidence, not raw database files.

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
