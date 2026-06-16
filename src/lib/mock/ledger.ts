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
    },
  ]);
}

export function fetchLedgerEntry(txId: string): Promise<LedgerEntry | undefined> {
  return fetchLedger().then((entries) => entries.find((e) => e.txId === txId));
}
