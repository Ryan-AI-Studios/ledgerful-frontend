import { RiskLevel } from "./types";
import { buildApiUrl } from "./utils";

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

interface LedgerApiEntry {
  tx_id: string;
  category: string;
  entry_type: string;
  summary: string;
  reason: string;
  committed_at: string;
  risk?: string;
  signature?: string;
  public_key?: string;
}

function formatTimeAgo(committedAt: string): string {
  const date = new Date(committedAt);
  if (isNaN(date.getTime())) return committedAt;
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function toLedgerEntry(item: LedgerApiEntry): LedgerEntry {
  const status = item.entry_type === "PENDING" ? "PENDING" : "COMMITTED";
  return {
    txId: item.tx_id,
    category: item.category,
    status,
    summary: item.summary,
    reason: item.reason,
    author: "unknown",
    timeAgo: formatTimeAgo(item.committed_at),
    files: [],
    hotspotsCrossed: 0,
    testsRun: 0,
    flakes: 0,
    risk: (item.risk ?? "LOW").toUpperCase() as RiskLevel,
    signature: item.signature ?? "",
    publicKey: item.public_key ?? "",
  };
}

export async function fetchLedger(): Promise<LedgerEntry[]> {
  const res = await fetch(buildApiUrl("/ledger", { limit: "50" }));
  if (!res.ok) throw new Error(`Ledger request failed: ${res.status}`);
  const data: LedgerApiEntry[] = await res.json();
  return data.map(toLedgerEntry);
}

export async function fetchLedgerEntry(txId: string): Promise<LedgerEntry | undefined> {
  const res = await fetch(buildApiUrl(`/ledger/${encodeURIComponent(txId)}`));
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`Ledger entry request failed: ${res.status}`);
  const data: LedgerApiEntry = await res.json();
  return toLedgerEntry(data);
}

