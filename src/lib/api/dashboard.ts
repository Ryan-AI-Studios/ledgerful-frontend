import { apiGet } from "../api";
import { DashboardData, ProjectHealth, RecentChange, RiskLevel } from "@/lib/types";

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

function toRecentChange(
  item: SnapshotResponse["recent_changes"][number],
  index: number,
): RecentChange {
  return {
    id: item.id ?? `${item.path}:${index}`,
    filePath: item.path,
    summary: item.summary ?? `${item.status ?? "changed"}: ${item.path}`,
    author: item.author ?? "unknown",
    timeAgo: item.timeAgo ?? "now",
    fileCount: item.fileCount ?? 1,
    risk: (item.risk ?? "LOW").toUpperCase() as RiskLevel,
  };
}

export async function fetchDashboardData(projectId?: string): Promise<DashboardData> {
  const params: Record<string, string | undefined> = {};
  if (projectId) params.project_id = projectId;

  const data = await apiGet<SnapshotResponse>("/snapshot", params);
  if (!data || typeof data !== "object") {
    throw new Error("Invalid dashboard response: expected object");
  }

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

  return { health, recentChanges: (data.recent_changes ?? []).map(toRecentChange) };
}
