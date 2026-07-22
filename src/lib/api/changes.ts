import { apiGet } from "../api";
import { ChangeEntry } from "@/lib/types";
import { normalizeRiskLevel } from "@/lib/risk";
import type { ExtractResponse } from "./contract-types";

type ChangeWire = ExtractResponse<"/api/changes", "get">;

function toChangeEntry(item: ChangeWire[number], index: number): ChangeEntry {
  const status = item.status ?? "modified";
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
    // Missing/null/unknown risk → UNKNOWN (never invent LOW via status)
    risk: normalizeRiskLevel(item.risk),
  };
}

export async function fetchChanges(days = 7): Promise<ChangeEntry[]> {
  const data = await apiGet<ChangeWire>("/changes", { days: String(days) });
  if (!Array.isArray(data)) {
    throw new Error("Invalid changes response: expected array");
  }
  return data.map(toChangeEntry);
}
