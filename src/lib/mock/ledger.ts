import { LedgerEntry } from "@/lib/types";

export function fetchLedger(): Promise<LedgerEntry[]> {
  return Promise.resolve([
    {
      txId: "tx-001",
      category: "REFACTOR",
      status: "COMMITTED",
      summary: "Refactored token validation",
      reason: "Consolidate session handling",
      author: "alice",
      timeAgo: "2h ago",
      files: [
        { path: "src/lib/auth.ts", additions: 45, deletions: 12 },
        { path: "src/lib/utils.ts", additions: 8, deletions: 4 },
      ],
      hotspotsCrossed: 2,
      testsRun: 12,
      flakes: 0,
      risk: "HIGH",
      signature: "sig-001",
      publicKey: "pk-001",
      prNumber: 142,
      prStatus: "Merged",
    },
    {
      txId: "tx-002",
      category: "FEATURE",
      status: "COMMITTED",
      summary: "Updated dashboard layout",
      reason: "Add new metric cards",
      author: "bob",
      timeAgo: "5h ago",
      files: [{ path: "src/app/page.tsx", additions: 120, deletions: 30 }],
      hotspotsCrossed: 1,
      testsRun: 8,
      flakes: 1,
      risk: "MEDIUM",
      signature: "sig-002",
      publicKey: "pk-002",
      prNumber: 140,
      prStatus: "Merged",
    },
  ]);
}

const GIT_VERSION_DETAIL: LedgerEntry = {
  txId: "tx-001",
  category: "REFACTOR",
  status: "COMMITTED",
  summary: "Refactored token validation",
  reason: "Consolidate session handling",
  author: "alice",
  timeAgo: "2h ago",
  files: [
    { path: "src/lib/auth.ts", additions: 45, deletions: 12 },
    { path: "src/lib/utils.ts", additions: 8, deletions: 4 },
  ],
  hotspotsCrossed: 2,
  testsRun: 1,
  flakes: 0,
  risk: "HIGH",
  signature: "sig-001",
  publicKey: "pk-001",
  verificationStatus: null,
  prNumber: 142,
  prStatus: "Merged",
  boundRuns: [
    {
      runId: 1,
      runTimestamp: "2026-10-23T12:00:00Z",
      overallPass: true,
      stale: false,
      partial: false,
      commands: [{ command: "git --version", exitCode: 0, durationMs: 12 }],
    },
  ],
  boundSnapshot: {
    runTimestamp: "2026-10-23T12:00:00Z",
    head: null,
    headStatus: "unknown",
  },
};

export function fetchLedgerEntry(txId: string): Promise<LedgerEntry | undefined> {
  if (txId === GIT_VERSION_DETAIL.txId) return Promise.resolve(GIT_VERSION_DETAIL);
  return fetchLedger().then((entries) => entries.find((e) => e.txId === txId));
}
