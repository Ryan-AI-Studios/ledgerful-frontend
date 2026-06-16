import { DashboardData, ProjectHealth, RecentChange, RiskLevel } from "./types";
import { buildApiUrl } from "./utils";

interface SnapshotResponse {
  project_id: string;
  overall_risk: string;
  pending_transactions: number;
  unaudited_drift: number;
  recent_changes: Array<{
    id?: string;
    path: string;
    status?: string;
    summary?: string;
    author?: string;
    timeAgo?: string;
    fileCount?: number;
    risk?: string;
  }>;
}

export async function fetchDashboardData(_projectId?: string): Promise<DashboardData> {
  const res = await fetch(buildApiUrl("/snapshot"));
  if (!res.ok) throw new Error(`Snapshot request failed: ${res.status}`);
  const data: SnapshotResponse = await res.json();

  const pending = data.pending_transactions ?? 0;
  const drift = data.unaudited_drift ?? 0;
  const risk = (data.overall_risk ?? "LOW").toUpperCase() as RiskLevel;

  const health: ProjectHealth = {
    score: Math.max(0, 100 - pending * 5 - drift * 10),
    delta: 0,
    verified: pending === 0 && drift === 0,
    driftCount: drift,
    pendingCount: pending,
    currentRisk: risk,
  };

  const recentChanges: RecentChange[] = (data.recent_changes ?? []).map((item, index) => ({
    id: item.id ?? `${item.path}:${index}`,
    filePath: item.path,
    summary: item.summary ?? `${item.status ?? "changed"}: ${item.path}`,
    author: item.author ?? "unknown",
    timeAgo: item.timeAgo ?? "now",
    fileCount: item.fileCount ?? 1,
    risk: (item.risk ?? "LOW").toUpperCase() as RiskLevel,
  }));

  return { health, recentChanges };
}

