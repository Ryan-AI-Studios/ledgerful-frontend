import { apiGet } from "../api";
import { ChangeEntry } from "@/lib/types";
import { normalizeRiskLevel } from "@/lib/risk";
import type { ExtractResponse } from "./contract-types";
import { decodeEvidenceKey, evidenceKeyId } from "./change-evidence-decoder";

type ChangeWire = ExtractResponse<"/api/changes", "get">;

function toChangeEntry(item: ChangeWire[number], index: number): ChangeEntry {
  const status = item.status ?? "modified";
  const key = decodeEvidenceKey(item.evidenceKey);
  const evidenceKey = key && status === "Committed" && item.id === key.head.slice(0, 8)
    ? key
    : undefined;
  return {
    id: item.id ?? `${item.path}:${index}`,
    filePath: item.path,
    summary: item.summary ?? `${status}: ${item.path}`,
    author: item.author,
    timeAgo: item.timeAgo ?? "now",
    fileCount: item.fileCount ?? 1,
    filesChanged: item.fileCount ?? 1,
    additions: item.additions ?? 0,
    deletions: item.deletions ?? 0,
    ...(evidenceKey ? { evidenceKey } : {}),
    ...(item.evidenceKey != null && !evidenceKey ? { evidenceIdentityInvalid: true } : {}),
    // Missing/null/unknown risk → UNKNOWN (never invent LOW via status)
    risk: normalizeRiskLevel(item.risk),
  };
}

export function changeRowKey(change: ChangeEntry): string {
  return change.evidenceKey
    ? evidenceKeyId(change.evidenceKey)
    : JSON.stringify([change.id, change.summary, change.filePath]);
}

export async function fetchChanges(days = 7): Promise<ChangeEntry[]> {
  const data = await apiGet<ChangeWire>("/changes", { days: String(days) });
  if (!Array.isArray(data)) {
    throw new Error("Invalid changes response: expected array");
  }
  return data.map(toChangeEntry);
}
