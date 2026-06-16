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
  rank: number;
  filePath: string;
  score: number;
  trend: number[];
}

export interface GraphNode {
  id: string;
  symbol: string;
  filePath: string;
  risk: RiskLevel;
  edges: number;
  complexity: number;
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
