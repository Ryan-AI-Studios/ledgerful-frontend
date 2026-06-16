import { DashboardData, RiskLevel } from "./types";

export const healthyData: DashboardData = {
  health: {
    score: 94,
    delta: 2,
    verified: true,
    driftCount: 0,
    pendingCount: 0,
    currentRisk: "LOW",
  },
  recentChanges: [
    {
      id: "a3f7c9e1",
      filePath: "src/ledger/apply.rs",
      summary: "Refactored WAL flush ordering",
      author: "you",
      timeAgo: "2d ago",
      fileCount: 1,
      risk: "LOW",
    },
    {
      id: "5b2c88ef",
      filePath: "src/bridge/ipc.rs",
      summary: "Added Unix socket lifecycle guard",
      author: "alice",
      timeAgo: "3d ago",
      fileCount: 2,
      risk: "LOW",
    },
    {
      id: "1e9d4a82",
      filePath: "src/state/storage.rs",
      summary: "Normalized hotspot score calculation",
      author: "you",
      timeAgo: "4d ago",
      fileCount: 1,
      risk: "TRIVIAL",
    },
  ],
};

export const riskyData: DashboardData = {
  health: {
    score: 61,
    delta: -5,
    verified: false,
    driftCount: 2,
    pendingCount: 3,
    currentRisk: "HIGH",
  },
  recentChanges: [
    {
      id: "dbce9fe7",
      filePath: "src/crypto/key.rs",
      summary: "Added constant-time comparison for HMAC verify",
      author: "bob",
      timeAgo: "3d ago",
      fileCount: 2,
      risk: "HIGH",
    },
    {
      id: "a3f7c9e1",
      filePath: "src/auth/session.rs",
      summary: "Rate-limiter bypass in 2 paths",
      author: "you",
      timeAgo: "2d ago",
      fileCount: 5,
      risk: "MEDIUM",
    },
    {
      id: "7b1d2e4f",
      filePath: "src/api/users.rs",
      summary: "Pagination cursor off-by-one",
      author: "alice",
      timeAgo: "4d ago",
      fileCount: 1,
      risk: "MEDIUM",
    },
    {
      id: "9c4a1b6d",
      filePath: "src/ledger/apply.rs",
      summary: "Refactored WAL flush ordering",
      author: "you",
      timeAgo: "2d ago",
      fileCount: 1,
      risk: "LOW",
    },
  ],
};

export function fetchDashboardData(projectId?: string): Promise<DashboardData> {
  return new Promise((resolve) => {
    // Mock: ledgerful-frontend is the healthy demo project; everything else is risky.
    const data = projectId === "ledgerful-frontend" ? healthyData : riskyData;
    setTimeout(() => resolve(data), 600);
  });
}
