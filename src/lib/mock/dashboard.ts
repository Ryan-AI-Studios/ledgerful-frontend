import { DashboardData } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function fetchDashboardData(_projectId?: string): Promise<DashboardData> {
  return Promise.resolve({
    health: {
      score: 61,
      delta: 0,
      verified: false,
      driftCount: 2,
      pendingCount: 3,
      currentRisk: "MEDIUM",
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
