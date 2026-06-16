export type RiskLevel = "HIGH" | "MEDIUM" | "LOW" | "TRIVIAL";

export interface ProjectHealth {
  score: number;
  delta: number; // positive = up
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

export interface DashboardData {
  health: ProjectHealth;
  recentChanges: RecentChange[];
}
