import { DashboardData } from "@/lib/types";
import { computeUiHealthScore } from "@/lib/health-score";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function fetchDashboardData(_projectId?: string): Promise<DashboardData> {
  const pendingCount = 3;
  const driftCount = 2;
  return Promise.resolve({
    health: {
      score: computeUiHealthScore(pendingCount, driftCount),
      delta: null,
      gateClean: false,
      driftCount,
      pendingCount,
      currentRisk: "MEDIUM",
      scoreDerived: true,
    },
    recentChanges: [
      {
        id: "tx-001",
        filePath: "src/lib/auth.ts",
        summary: "Refactored token validation",
        author: "alice",
        timeAgo: "2h ago",
        fileCount: 1,
        risk: "HIGH",
      },
      {
        id: "tx-002",
        filePath: "src/app/page.tsx",
        summary: "Updated dashboard layout",
        author: "bob",
        timeAgo: "5h ago",
        fileCount: 2,
        risk: "MEDIUM",
      },
    ],
  });
}
