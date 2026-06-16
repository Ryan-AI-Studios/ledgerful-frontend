import { RiskLevel } from "./types";

export type LedgerStatus = "COMMITTED" | "PENDING" | "ROLLED_BACK";

export interface LedgerEntry {
  txId: string;
  category: string;
  status: LedgerStatus;
  summary: string;
  reason: string;
  author: string;
  timeAgo: string;
  files: { path: string; additions: number; deletions: number }[];
  hotspotsCrossed: number;
  testsRun: number;
  flakes: number;
  risk: RiskLevel;
  signature: string;
  publicKey: string;
}

export const ledgerData: LedgerEntry[] = [
  {
    txId: "dbce9fe7",
    category: "FEATURE",
    status: "PENDING",
    summary: "Add crash-safe write to apply.rs",
    reason:
      "Prevents partial-write on SIGTERM in production. Detected in incident #4217.",
    author: "bob",
    timeAgo: "3d ago",
    files: [
      { path: "src/ledger/apply.rs", additions: 127, deletions: 12 },
      { path: "src/ledger/apply_test.rs", additions: 45, deletions: 0 },
      { path: "src/ledger/mod.rs", additions: 8, deletions: 2 },
    ],
    hotspotsCrossed: 0,
    testsRun: 47,
    flakes: 0,
    risk: "MEDIUM",
    signature: "a7f3c9e2d4b5...",
    publicKey: "5b2c88ef1a2d...",
  },
  {
    txId: "a3f7c9e1",
    category: "BUGFIX",
    status: "COMMITTED",
    summary: "Rate-limiter bypass in 2 paths",
    reason:
      "Fixes off-by-one in session token rotation that allowed double-spend of rate budget.",
    author: "you",
    timeAgo: "2d ago",
    files: [
      { path: "src/auth/session.rs", additions: 18, deletions: 3 },
    ],
    hotspotsCrossed: 1,
    testsRun: 31,
    flakes: 1,
    risk: "MEDIUM",
    signature: "b8e4d0f3c1a6...",
    publicKey: "5b2c88ef1a2d...",
  },
  {
    txId: "1e9d4a82",
    category: "REFACTOR",
    status: "PENDING",
    summary: "Refactor WAL flush ordering",
    reason: "Improves determinism of crash-recovery replay.",
    author: "alice",
    timeAgo: "4d ago",
    files: [{ path: "src/ledger/apply.rs", additions: 45, deletions: 12 }],
    hotspotsCrossed: 0,
    testsRun: 52,
    flakes: 0,
    risk: "LOW",
    signature: "c9f5e1g4h2i7...",
    publicKey: "5b2c88ef1a2d...",
  },
  {
    txId: "5b2c88ef",
    category: "DOCS",
    status: "COMMITTED",
    summary: "Document ledgerful export formats",
    reason: "Required for SOC2 auditor handoff.",
    author: "you",
    timeAgo: "5d ago",
    files: [{ path: "docs/cli/reference.md", additions: 24, deletions: 0 }],
    hotspotsCrossed: 0,
    testsRun: 0,
    flakes: 0,
    risk: "TRIVIAL",
    signature: "d0g6f2h5j3k8...",
    publicKey: "5b2c88ef1a2d...",
  },
];

export function fetchLedger(): Promise<LedgerEntry[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...ledgerData]), 500);
  });
}

export function fetchLedgerEntry(txId: string): Promise<LedgerEntry | undefined> {
  return new Promise((resolve) => {
    setTimeout(
      () => resolve(ledgerData.find((entry) => entry.txId === txId)),
      300
    );
  });
}
