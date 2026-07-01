import { apiGet } from "../api";
import { DashboardData, ProjectHealth, RecentChange, RiskLevel } from "@/lib/types";
import type { ExtractResponse } from "./contract-types";

type SnapshotWire = ExtractResponse<"/api/snapshot", "get">;

type RecentChangeWire = SnapshotWire["recent_changes"][number];

function toRecentChange(item: RecentChangeWire, index: number): RecentChange {
  // recent_changes is `readonly unknown[]` in the generated schema because the
  // backend declares the items as opaque `{}`. Guard and cast the fields the
  // UI expects, falling back when they are missing.
  const record = item as Partial<{
    id?: string;
    path?: string;
    status?: string;
    summary?: string;
    author?: string;
    timeAgo?: string;
    fileCount?: number;
    risk?: string;
  }>;
  const path = record.path ?? "unknown";
  return {
    id: record.id ?? `${path}:${index}`,
    filePath: path,
    summary: record.summary ?? `${record.status ?? "changed"}: ${path}`,
    author: record.author ?? "unknown",
    timeAgo: record.timeAgo ?? "now",
    fileCount: record.fileCount ?? 1,
    risk: (record.risk ?? "LOW").toUpperCase() as RiskLevel,
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
