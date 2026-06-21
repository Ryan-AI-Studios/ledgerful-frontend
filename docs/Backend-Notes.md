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

### 2.4 Official Telemetry Ingest Point (Track 0013)

The official ingestion point for opt-in CLI usage metrics is a Supabase Edge Function. Backend Track M7 **must** use this URL for the `CHANGEGUARD_USAGE_ENDPOINT` production default:

**URL:** `https://scmxtnjqqklvcwyeouvj.supabase.co/functions/v1/telemetry-ingest`

*Note: This endpoint expects a POST request with the JSON payload schema defined in Track 0013/M7. It does not require a Supabase JWT (authentication is handled via size caps and strict schema validation).*

### 2.5 Route Shape for Static Export

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

**Implementation status:** All fields in the `LedgerEntry` interface are now returned by the live API — `author` is populated from `git config user.name` at commit time (fallback `user.email`, fallback `"unknown"`). `files`, `hotspotsCrossed`, `testsRun`, and `flakes` are available on `/api/ledger/:txId` (detail view only, not the list view, to keep response size bounded). The mock service in `src/lib/mock/ledger.ts` shows the intended shape.

> **Known limitation (follow-up track):** `files[].additions` and `files[].deletions` are currently always `0`. The `changed_files` table in the ChangeGuard SQLite schema stores file paths and staging status but not per-file diff stats. Adding those columns is tracked as a future track (C1 from the M8 post-review). Do not rely on these fields for non-zero values until that track ships.
>
> **Known limitation (follow-up track):** `hotspotsCrossed` and `testsRun`/`flakes` on the detail view have the same "honest zero" caveat for a different reason: the backend added a `tx_id` column to `verification_runs`/`verification_results` (migration `m45`) so the join *can* work, but nothing in the verify-write path populates that column yet — `changeguard verify` invocations triggered by `ledger commit` don't currently tag their run with the transaction they belong to. So `testsRun`/`flakes` read `0` for every transaction today, not just pre-M8 ones, until a follow-up track wires that write path through. `hotspotsCrossed` is real (no write-path gap) and will be non-zero whenever a changed file appears in the current hotspot ranking.

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
  validityPercent: number;
  lastAuditAt: string | null;     // null in empty state (NOT skip-serialized)
  hotspotDeltaPercent: number;
  // The E2 backend does NOT return the following fields. They are marked
  // optional on the frontend so mock-fallback mode can still render the
  // richer cards; live daemon responses omit them.
  validCount?: number;
  invalidCount?: number;
  skippedCount?: number;
  oldestUnaddressedAdr?: AdrEntry;
}

interface SignatureEntry {
  txId: string;
  entity: string;          // was: signer (E2 renamed)
  summary: string;         // E2 added
  committedAt: string;     // was: timestamp (E2 renamed)
  status: "VALID" | "INVALID" | "SKIPPED";
  category: string;        // E2 added
}
```

**E2 contract notes:** `GET /api/compliance/signatures` returns a bare JSON array, sorted `committedAt DESC`, bounded to the most recent 100 entries. `GET /api/compliance/summary` returns `lastAuditAt: null` (not omitted) in the empty state.

### 3.6 Verification

```ts
interface VerificationHealth {
  status: "HEALTHY" | "DEGRADED" | "FAILING";
  // The backend emits `null` when no verification runs exist (dashboard
  // empty state). The frontend must guard the render against null.
  lastRunAt: string | null;
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

**E1 contract notes:** `GET /api/verify/history` accepts a `?days=N` query parameter (default 30, capped 365) and returns a bare JSON array of `{ date, passed, failed }` (`GROUP BY DATE(timestamp)`, ascending, dates with no runs omitted). The frontend dashboard's trend chart passes `?days=90` to match the "Verification Trend (90 Days)" header. `GET /api/verify/health` emits `lastRunAt: null` (not omitted) when no runs exist; failure precedence over staleness. `GET /api/verify/steps` returns per-command aggregates with a friendly `name` (traceability segments stripped).

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


**Implementation status:** All fields in the `Project` interface are now returned by the live API — `status` ("healthy"/"warning"/"critical"), `lastScanAt` (from latest impact report timestamp), and `healthScore` (0–100). The health score formula (per `conductor/trackM8/spec.md` deviations):

```
risk_penalty = riskLevel: High→60, Medium→30, Low→5, missing/corrupt→40
healthScore  = clamp(100 − risk_penalty − (doctor_failures × 20), 0, 100)
```

Status thresholds: `≥80` → `"healthy"`, `≥50` → `"warning"`, `<50` → `"critical"`. Sibling projects discovered via federation emit `status: "unknown", healthScore: 0` — real sibling health probes are a future track.

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

## 9. Resolved Questions

### Team/Multi-User Sync Protocol

**Decision (2026-06-17):** Team/multi-user sync uses ChangeGuard Track M0's existing local-first, Ed25519-signed, `dir://`-transport sync protocol — already fully implemented (`changeguard sync init/pair/run/status/...`). Supabase remains reserved for the hosted/demo tier only (per `.env.example`'s own comment: "used for hosted demo / team tier; local-first mode does not require this"). Do not introduce a second, competing sync mechanism.

The new `GET /api/sync/status` endpoint exposes the current sync state (device ID, last extract/apply timestamps, last run time) from the local M0 state.

### GitHub PR Data

**Decision (2026-06-17):** GitHub PR/webhook data is NOT wired into `/api/ledger`'s `prNumber`/`prStatus` fields in this iteration. Track M4 (the GitHub Action) posts risk-comment summaries to PRs via CI but doesn't persist PR metadata into the local ledger DB. Wiring real PR metadata is future work.

### Real-Time Updates

**Decision deferred:** Still open — to be resolved when real-time requirements are clearer. Options: polling (current), WebSocket from the ChangeGuard daemon, or Supabase Realtime for the hosted tier.

## Related Documents

- `docs/product.md` — product purpose and personas
- `docs/design.md` — visual design system
- `conductor/0001-DaemonAPIClientLayer/spec.md` — API client layer track
- `AGENTS.md` — agent constraints and verification gates

## Changelog

- **2026-06-16** — Finalized data contracts for Tracks 0002-0008 (Hotspots, Trends, Graph, Compliance, Verify, Session); updated data shapes in Section 3 to match `src/lib/types.ts`.
- **2026-06-16** — Reconciled with Track M3 implementation: changed base URL from `/api/v1/*` to `/api/*`, default port from `52000` to `52001`, added ephemeral `?token=` auth, documented snake_case response normalization, and added static-export route shape note (`/ledger/detail?txId=`).
- **2026-06-17** — Track M8: resolved all "Desired backend additions" (author, files, hotspotsCrossed, testsRun, flakes on ledger; status, lastScanAt, healthScore on projects). Added `GET /api/sync/status` endpoint. Resolved Open Questions: team sync uses M0 local-first protocol (not Supabase), GitHub PR data deferred. Updated Section 3.2, 3.8, and Section 9.
- **2026-06-18** — M8 post-review (ChangeGuard v0.1.5): (1) Clarified §2.4 telemetry endpoint — `CHANGEGUARD_USAGE_ENDPOINT` production default is now the Supabase Edge Function URL (`scmxtnjqqklvcwyeouvj.supabase.co/functions/v1/telemetry-ingest`), not a placeholder. (2) Added §3.2 known limitation: `files[].additions` and `files[].deletions` are always `0` until a follow-up track adds diff-stat columns. (3) Corrected §3.8 health_score formula — it uses `riskLevel` enum penalties (High→60, Medium→30, Low→5), not `high_risk_files * 10`.
- **2026-06-18** — M8 review-2: extended the §3.2 known-limitation note to cover `testsRun`/`flakes` as well — the `tx_id` join column exists (migration `m45`) but nothing in the verify-write path populates it yet, so both fields read `0` for every transaction (not just legacy ones) until a follow-up track wires that through. `hotspotsCrossed` has no such gap and is real today.
- **2026-06-21** — Aligned frontend to backend Tracks E1/E2/E3 (all three Completed in the ChangeGuard repo). (1) §3.5 `SignatureEntry` renamed: `timestamp→committedAt`, `signer→entity`, added `summary` + `category`; `ComplianceSummary` count-breakdown + ADR fields marked optional (E2 backend omits them; mock keeps them for richer fallback). (2) §3.6 documented E1 `/verify/history?days=N` param (default 30, capped 365); frontend passes `?days=90` to match the "90 Days" trend header. (3) `triggerSoc2Export` (E3) now surfaces backend error messages and verifies `Content-Type: application/zip` before blob-ing. No new endpoints; pure contract alignment.
