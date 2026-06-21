export type RiskLevel = "HIGH" | "MEDIUM" | "LOW" | "TRIVIAL";

export interface ProjectHealth {
  score: number;
  delta: number;
  verified: boolean;
  driftCount: number;
  pendingCount: number;
  currentRisk: RiskLevel;
}

export interface RecentChange {
  id: string;
  filePath: string;
  summary: string;
  author: string;
  timeAgo: string;
  fileCount: number;
  risk: RiskLevel;
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

export type LedgerStatus = "COMMITTED" | "PENDING" | "ROLLED_BACK";

export interface LedgerEntry {
  txId: string;
  category: string;
  status: LedgerStatus;
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
  prNumber?: number;
  prStatus?: "Open" | "Merged" | "Closed";
}

export interface Hotspot {
  id: string;
  filePath: string;
  riskLevel: RiskLevel;
  riskScore: number;
  lastTouchedAt: string;
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
  githubRepo?: string;
  integrationStatus?: "CONNECTED" | "DISCONNECTED" | "PENDING";
}

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
  lastAuditAt?: string;
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

export interface SlowCommand {
  name: string;
  averageDurationMs: number;
}
