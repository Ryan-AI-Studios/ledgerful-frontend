import { RiskLevel, RecentChange } from "./types";

export interface ChangeEntry extends RecentChange {
  filesChanged: number;
  additions: number;
  deletions: number;
}

export const changesData: ChangeEntry[] = [
  {
    id: "dbce9fe7",
    filePath: "src/crypto/key.rs",
    summary: "Added constant-time comparison for HMAC verify",
    author: "bob",
    timeAgo: "3d ago",
    fileCount: 2,
    filesChanged: 2,
    additions: 18,
    deletions: 3,
    risk: "HIGH",
  },
  {
    id: "a3f7c9e1",
    filePath: "src/auth/session.rs",
    summary: "Rate-limiter bypass in 2 paths",
    author: "you",
    timeAgo: "2d ago",
    fileCount: 5,
    filesChanged: 5,
    additions: 127,
    deletions: 42,
    risk: "MEDIUM",
  },
  {
    id: "7b1d2e4f",
    filePath: "src/api/users.rs",
    summary: "Pagination cursor off-by-one",
    author: "alice",
    timeAgo: "4d ago",
    fileCount: 1,
    filesChanged: 1,
    additions: 12,
    deletions: 4,
    risk: "MEDIUM",
  },
  {
    id: "9c4a1b6d",
    filePath: "src/ledger/apply.rs",
    summary: "Refactored WAL flush ordering",
    author: "you",
    timeAgo: "2d ago",
    fileCount: 1,
    filesChanged: 1,
    additions: 45,
    deletions: 12,
    risk: "LOW",
  },
  {
    id: "2e8f5c2a",
    filePath: "src/bridge/ipc.rs",
    summary: "Added Unix socket lifecycle guard",
    author: "alice",
    timeAgo: "3d ago",
    fileCount: 2,
    filesChanged: 2,
    additions: 38,
    deletions: 7,
    risk: "LOW",
  },
  {
    id: "5d1a9b8e",
    filePath: "docs/cli/reference.md",
    summary: "Document ledgerful export formats",
    author: "you",
    timeAgo: "5d ago",
    fileCount: 1,
    filesChanged: 1,
    additions: 24,
    deletions: 0,
    risk: "TRIVIAL",
  },
];

export function fetchChanges(): Promise<ChangeEntry[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...changesData]), 500);
  });
}
