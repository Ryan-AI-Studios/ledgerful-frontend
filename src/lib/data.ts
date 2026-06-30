import { fetchDashboardData as fetchLiveDashboardData } from "@/lib/api/dashboard";
import { fetchDashboardData as fetchMockDashboardData } from "@/lib/mock/dashboard";
import { withFallback, WithSource } from "@/lib/fallback";

export type { DashboardData, ProjectHealth, RecentChange, RiskLevel } from "@/lib/types";

export async function fetchDashboardData(projectId?: string): Promise<WithSource<import("@/lib/types").DashboardData>> {
  return withFallback(
    () => fetchLiveDashboardData(projectId),
    () => fetchMockDashboardData(projectId),
  );
}
