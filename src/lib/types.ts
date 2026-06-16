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
  lastScanAt: string;
  healthScore: number;
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
