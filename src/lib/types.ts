export type RiskLevel = "HIGH" | "MEDIUM" | "LOW" | "TRIVIAL";

/** Risk after shared normalizeRiskLevel — missing/unknown never becomes LOW. */
export type UiRiskLevel = RiskLevel | "UNKNOWN";

export interface ProjectHealth {
  score: number;
  /** Null when no historical baseline is available (never invent 0). */
  delta: number | null;
  /** Gate clean when pending===0 && drift===0 — not crypto "Verified". */
  gateClean: boolean;
  driftCount: number;
  pendingCount: number;
  currentRisk: UiRiskLevel;
  /** Always true: score is computeUiHealthScore, not an engine metric. */
  scoreDerived: true;
}

export interface RecentChange {
  id: string;
  filePath: string;
  summary: string;
  author: string;
  timeAgo: string;
  fileCount: number;
  risk: UiRiskLevel;
  prNumber?: number;
  prStatus?: "Open" | "Merged" | "Closed";
}

export interface ChangeEntry extends RecentChange {
  filesChanged: number;
  additions: number;
  deletions: number;
}

export interface DashboardData {
  health: ProjectHealth;
  recentChanges: RecentChange[];
}

/** Exhaustive status: unknown wire entry_type maps to OTHER (never forced COMMITTED). */
export type LedgerStatus = "COMMITTED" | "PENDING" | "ROLLED_BACK" | "OTHER";

export interface LedgerEntry {
  txId: string;
  category: string;
  status: LedgerStatus;
  /** Raw entry_type from the wire when status is OTHER. */
  entryTypeRaw?: string;
  summary: string;
  reason: string;
  author: string;
  timeAgo: string;
  files: { path: string; additions: number | null; deletions: number | null; isBinary?: boolean }[];
  /** Null when list response has no detail metrics (never invent 0). */
  hotspotsCrossed: number | null;
  testsRun: number | null;
  flakes: number | null;
  risk: UiRiskLevel;
  signature?: string;
  publicKey?: string;
  /** Real verification_status from the engine, not derived from testsRun. */
  verificationStatus?: string | null;
  prNumber?: number;
  prStatus?: "Open" | "Merged" | "Closed";
}

export interface Hotspot {
  id: string;
  filePath: string;
  /** Normalized risk; missing wire risk → UNKNOWN (never invent MEDIUM). */
  riskLevel: UiRiskLevel;
  riskScore: number;
  /** Null when wire omits timestamp — UI shows "—", never invents "now". */
  lastTouchedAt: string | null;
  contributor?: string;
  changeCount: number;
  rank: number;
}

export interface TrendPoint {
  date: string; // ISO date, e.g. "2026-06-15"
  score: number; // 0-100
  changes: number;
  highRiskCount: number;
}

export interface GraphNode {
  id: string;
  type: "file" | "change" | "ai";
  label: string;
  riskLevel?: RiskLevel;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: "depends" | "changed" | "ai-edited";
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface Project {
  id: string;
  name: string;
  path: string;
  status: "healthy" | "warning" | "critical";
  lastScanAt: string | null;
  healthScore: number;
  validationWarnings: string[];
  githubRepo?: string;
  integrationStatus?: "CONNECTED" | "DISCONNECTED" | "PENDING";
}

export type { DataSource } from "./fallback";

export interface SyncStatus {
  deviceId: string | null;
  lastExtractAt: string | null;
  lastApplyAt: string | null;
  lastRunAt: string | null;
}

export interface StatusResponse {
  indexReady: boolean;
  graphReady: boolean;
  pendingTransactions: number;
  unauditedDrift: number;
  embeddingModelReachable: boolean;
  completionModelReachable: boolean;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role?: "admin" | "member" | "viewer";
  avatarUrl?: string;
}

export interface ComplianceSummary {
  totalSigned: number;
  // The E2 backend returns only `totalSigned`, `validityPercent`,
  // `lastAuditAt`, and `hotspotDeltaPercent`. The count breakdown and ADR
  // fields are mock-only; mark them optional so the live contract type-checks
  // while mock-fallback mode can still render the richer cards.
  validCount?: number;
  invalidCount?: number;
  skippedCount?: number;
  validityPercent: number;
  lastAuditAt?: string | null;
  oldestUnaddressedAdr?: AdrEntry;
  hotspotDeltaPercent: number;
}

export interface SignatureEntry {
  txId: string;
  entity: string;
  summary: string;
  committedAt: string;
  status: "VALID" | "INVALID" | "SKIPPED";
  category: string;
}

export interface AdrEntry {
  id: string;
  title: string;
  createdAt: string;
  status: "PROPOSED" | "ACCEPTED" | "DEPRECATED" | "SUPERSEDED";
}

export interface VerificationHealth {
  status: "HEALTHY" | "DEGRADED" | "FAILING";
  // The backend emits `null` when no verification runs exist (dashboard
  // empty state). Render must guard against null before formatting.
  lastRunAt: string | null;
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

