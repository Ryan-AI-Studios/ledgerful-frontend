import { apiGet } from "../api";
import { ChangeEntry, RiskLevel } from "@/lib/types";

interface ChangeApiItem {
  id?: string;
  path: string;
  status: string;
  summary?: string;
  author?: string;
  timeAgo?: string;
  fileCount?: number;
  additions?: number;
  deletions?: number;
  risk?: string;
}

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

function toChangeEntry(item: ChangeApiItem, index: number): ChangeEntry {
  const status = item.status ?? "modified";
  return {
    id: item.id ?? `${item.path}:${index}`,
    filePath: item.path,
    summary: item.summary ?? `${status}: ${item.path}`,
    author: item.author ?? "unknown",
    timeAgo: item.timeAgo ?? "now",
    fileCount: item.fileCount ?? 1,
    filesChanged: item.fileCount ?? 1,
    additions: item.additions ?? 0,
    deletions: item.deletions ?? 0,
    risk: (item.risk ?? inferRisk(status)).toUpperCase() as RiskLevel,
  };
}

export async function fetchChanges(days = 7): Promise<ChangeEntry[]> {
  const data = await apiGet<ChangeApiItem[]>("/changes", { days: String(days) });
  if (!Array.isArray(data)) {
    throw new Error("Invalid changes response: expected array");
  }
  return data.map(toChangeEntry);
}
