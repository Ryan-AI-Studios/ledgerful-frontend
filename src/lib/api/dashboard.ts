import { apiGet } from "../api";
import { DashboardData, ProjectHealth, RecentChange } from "@/lib/types";
import { normalizeRiskLevel } from "@/lib/risk";
import { computeUiHealthScore } from "@/lib/health-score";
import type { ExtractResponse } from "./contract-types";

type SnapshotWire = ExtractResponse<"/api/snapshot", "get">;

function toRecentChange(
  item: SnapshotWire["recent_changes"][number],
  index: number,
): RecentChange {
  const path = item.path ?? "unknown";
  return {
    id: item.id ?? `${path}:${index}`,
    filePath: path,
    summary: item.summary ?? `${item.status ?? "changed"}: ${path}`,
    author: item.author ?? "unknown",
    timeAgo: item.timeAgo ?? "now",
    fileCount: item.fileCount ?? 1,
    risk: normalizeRiskLevel(item.risk),
  };
}

export async function fetchDashboardData(projectId?: string): Promise<DashboardData> {
  const params: Record<string, string | undefined> = {};
  if (projectId) params.project_id = projectId;

  const data = await apiGet<SnapshotWire>("/snapshot", params);
  if (!data || typeof data !== "object") {
    throw new Error("Invalid dashboard response: expected object");
  }

  const pending = data.pending_transactions ?? 0;
  const drift = data.unaudited_drift ?? 0;
  const risk = normalizeRiskLevel(data.overall_risk);

  const health: ProjectHealth = {
    score: computeUiHealthScore(pending, drift),
    delta: null,
    gateClean: pending === 0 && drift === 0,
    driftCount: drift,
    pendingCount: pending,
    currentRisk: risk,
    scoreDerived: true,
  };

  return { health, recentChanges: (data.recent_changes ?? []).map(toRecentChange) };
}
