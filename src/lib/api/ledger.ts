import { apiGet } from "../api";
import { LedgerEntry, LedgerStatus, RiskLevel } from "@/lib/types";

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
  const status: LedgerStatus = item.entry_type === "PENDING" ? "PENDING" : "COMMITTED";

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
  const data = await apiGet<LedgerApiEntry[]>("/ledger", { limit: "50" });
  if (!Array.isArray(data)) {
    throw new Error("Invalid ledger response: expected array");
  }
  return data.map(toLedgerEntry);
}

export async function fetchLedgerEntry(txId: string): Promise<LedgerEntry> {
  const data = await apiGet<LedgerApiEntry>(`/ledger/${encodeURIComponent(txId)}`);
  if (!data || typeof data !== "object") {
    throw new Error("Invalid ledger entry response: expected object");
  }
  return toLedgerEntry(data);
}
