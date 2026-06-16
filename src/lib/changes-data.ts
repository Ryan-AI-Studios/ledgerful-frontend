import { RiskLevel, RecentChange } from "./types";
import { buildApiUrl } from "./utils";

export interface ChangeEntry extends RecentChange {
  filesChanged: number;
  additions: number;
  deletions: number;
}

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

export async function fetchChanges(days = 7): Promise<ChangeEntry[]> {
  const res = await fetch(buildApiUrl("/changes", { days: String(days) }));
  if (!res.ok) throw new Error(`Changes request failed: ${res.status}`);
  const data: ChangeApiItem[] = await res.json();

  return data.map((item, index) => ({
    id: item.id ?? `${item.path}:${index}`,
    filePath: item.path,
    summary: item.summary ?? `${item.status}: ${item.path}`,
    author: item.author ?? "unknown",
    timeAgo: item.timeAgo ?? "now",
    fileCount: item.fileCount ?? 1,
    filesChanged: item.fileCount ?? 1,
    additions: item.additions ?? 0,
    deletions: item.deletions ?? 0,
    risk: (item.risk ?? inferRisk(item.status)).toUpperCase() as RiskLevel,
  }));
}

