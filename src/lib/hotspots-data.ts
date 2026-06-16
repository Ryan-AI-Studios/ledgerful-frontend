import { buildApiUrl } from "./utils";

export interface Hotspot {
  rank: number;
  filePath: string;
  score: number;
  trend: number[];
}

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
  const [hotspotsRes, trendRes] = await Promise.all([
    fetch(buildApiUrl("/hotspots", { limit: "20" })),
    fetch(buildApiUrl("/hotspots/trend", { days: "90", limit: "20" })),
  ]);

  if (!hotspotsRes.ok) throw new Error(`Hotspots request failed: ${hotspotsRes.status}`);
  if (!trendRes.ok) throw new Error(`Hotspot trend request failed: ${trendRes.status}`);

  const items: HotspotApiItem[] = await hotspotsRes.json();
  const trend: HotspotTrendResponse = await trendRes.json();

  const trendByPath = new Map(trend.series.map((s) => [s.path, s.scores]));

  return items.map((item, index) => ({
    rank: index + 1,
    filePath: item.path,
    score: item.displayScore ?? item.score,
    trend: trendByPath.get(item.path) ?? trend.series[0]?.scores ?? [],
  }));
}

