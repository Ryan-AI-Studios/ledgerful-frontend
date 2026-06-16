import { fetchTrends as fetchLiveTrends } from "@/lib/api/trends";
import { fetchTrends as fetchMockTrends } from "@/lib/mock/trends";
import { withFallback } from "@/lib/fallback";

export type { TrendPoint } from "@/lib/types";

export async function fetchTrends(days: number = 90): Promise<import("@/lib/types").TrendPoint[]> {
  return withFallback(() => fetchLiveTrends(days), () => fetchMockTrends(days));
}
