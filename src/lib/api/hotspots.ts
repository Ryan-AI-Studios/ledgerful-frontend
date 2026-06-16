import { apiGet } from "../api";
import { Hotspot } from "@/lib/types";

interface HotspotApiItem {
  path: string;
  score: number;
  displayScore?: number;
}

interface HotspotTrendResponse {
  labels: string[];
  series: Array<{ path: string; scores: number[] }>;
}

export async function fetchHotspots(): Promise<Hotspot[]> {
  const [items, trend] = await Promise.all([
    apiGet<HotspotApiItem[]>("/hotspots", { limit: "20" }),
    apiGet<HotspotTrendResponse>("/hotspots/trend", { days: "90", limit: "20" }),
  ]);

  if (!Array.isArray(items)) {
    throw new Error("Invalid hotspots response: expected array");
  }
  if (!trend || typeof trend !== "object" || !Array.isArray(trend.series)) {
    throw new Error("Invalid hotspots trend response");
  }

  const trendByPath = new Map(trend.series.map((s) => [s.path, s.scores]));

  return items.map((item, index) => ({
    rank: index + 1,
    filePath: item.path,
    score: item.displayScore ?? item.score,
    trend: trendByPath.get(item.path) ?? trend.series[0]?.scores ?? [],
  }));
}
