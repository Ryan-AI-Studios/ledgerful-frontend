import { apiGet } from "../api";
import { LedgerEntry, LedgerStatus, RiskLevel } from "@/lib/types";
import type { ExtractResponse } from "./contract-types";

type LedgerWire = ExtractResponse<"/api/ledger", "get">;
type LedgerDetailWire = ExtractResponse<"/api/ledger/{tx_id}", "get">;

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

function normalizeRiskLevel(risk: string): RiskLevel {
  const upper = risk.toUpperCase();
  if (upper === "HIGH" || upper === "MEDIUM" || upper === "LOW" || upper === "TRIVIAL") return upper;
  return "LOW";
}

function toLedgerEntry(item: LedgerWire[number]): LedgerEntry {
  const status: LedgerStatus = item.entry_type === "PENDING" ? "PENDING" : "COMMITTED";

  return {
    txId: item.tx_id,
    category: item.category,
    status,
    summary: item.summary,
    reason: item.reason,
    author: item.author,
    timeAgo: formatTimeAgo(item.committed_at),
    files: [],
    hotspotsCrossed: 0,
    testsRun: 0,
    flakes: 0,
    risk: normalizeRiskLevel(item.risk ?? "LOW"),
    signature: item.signature ?? "",
    publicKey: item.public_key ?? "",
  };
}

function toLedgerEntryDetail(item: LedgerDetailWire): LedgerEntry {
  return {
    ...toLedgerEntry(item),
    files: (item.files ?? []).map((f) => ({
      path: f.path,
      additions: f.additions,
      deletions: f.deletions,
    })),
    hotspotsCrossed: item.hotspots_crossed ?? 0,
    testsRun: item.tests_run ?? 0,
    flakes: item.flakes ?? 0,
  };
}

export async function fetchLedger(): Promise<LedgerEntry[]> {
  const data = await apiGet<LedgerWire>("/ledger", { limit: "50" });
  if (!Array.isArray(data)) {
    throw new Error("Invalid ledger response: expected array");
  }
  return data.map(toLedgerEntry);
}

export async function fetchLedgerEntry(txId: string): Promise<LedgerEntry> {
  const data = await apiGet<LedgerDetailWire>(`/ledger/${encodeURIComponent(txId)}`);
  if (!data || typeof data !== "object") {
    throw new Error("Invalid ledger entry response: expected object");
  }
  return toLedgerEntryDetail(data);
}
