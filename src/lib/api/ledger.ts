import { apiGet } from "../api";
import { LedgerEntry, LedgerStatus } from "@/lib/types";
import { normalizeRiskLevel } from "@/lib/risk";
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

function normalizeEntryType(entryType: string): {
  status: LedgerStatus;
  entryTypeRaw?: string;
} {
  const upper = (entryType ?? "").toUpperCase();
  if (upper === "PENDING") return { status: "PENDING" };
  if (upper === "ROLLED_BACK" || upper === "ROLLEDBACK") return { status: "ROLLED_BACK" };
  if (upper === "COMMITTED" || upper === "COMMIT") return { status: "COMMITTED" };
  return { status: "OTHER", entryTypeRaw: entryType || "OTHER" };
}

function toLedgerEntry(item: LedgerWire[number]): LedgerEntry {
  const { status, entryTypeRaw } = normalizeEntryType(item.entry_type);

  return {
    txId: item.tx_id,
    category: item.category,
    status,
    entryTypeRaw,
    summary: item.summary,
    reason: item.reason,
    author: item.author,
    timeAgo: formatTimeAgo(item.committed_at),
    files: [],
    // List endpoint has no detail metrics — null, never invent 0
    hotspotsCrossed: null,
    testsRun: null,
    flakes: null,
    risk: normalizeRiskLevel(item.risk),
    signature: item.signature ?? undefined,
    publicKey: item.public_key ?? undefined,
    verificationStatus: item.verification_status ?? null,
  };
}

function toLedgerEntryDetail(item: LedgerDetailWire): LedgerEntry {
  return {
    ...toLedgerEntry(item),
    files: (item.files ?? []).map((f) => ({
      path: f.path,
      additions: f.additions ?? null,
      deletions: f.deletions ?? null,
      isBinary: f.is_binary ?? false,
    })),
    // Detail may still honestly return 0 when the engine lacks the metric
    hotspotsCrossed: item.hotspots_crossed ?? null,
    testsRun: item.tests_run ?? null,
    flakes: item.flakes ?? null,
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
