import { apiGet } from "../api";
import { ChangeEntry, RiskLevel } from "@/lib/types";
import type { ExtractResponse } from "./contract-types";

type ChangeWire = ExtractResponse<"/api/changes", "get">;

function inferRisk(status: string): RiskLevel {
  switch (status.toLowerCase()) {
    case "deleted":
      return "HIGH";
    case "added":
      return "MEDIUM";
    default:
      return "LOW";
  }
}

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
    risk: (item.risk ?? inferRisk(status)).toUpperCase() as RiskLevel,
  };
}

export async function fetchChanges(days = 7): Promise<ChangeEntry[]> {
  const data = await apiGet<ChangeWire>("/changes", { days: String(days) });
  if (!Array.isArray(data)) {
    throw new Error("Invalid changes response: expected array");
  }
  return data.map(toChangeEntry);
}
