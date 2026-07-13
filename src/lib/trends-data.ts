import { fetchTrends as fetchLiveTrends } from "@/lib/api/trends";
import { fetchMockTrends } from "@/lib/mock/trends";
import { withFallback, WithSource } from "@/lib/fallback";
import { ApiError } from "@/lib/api";

export type { TrendPoint } from "@/lib/types";

export async function fetchTrends(days = 90): Promise<WithSource<import("@/lib/types").TrendPoint[]>> {
  try {
    return await withFallback(
      () => fetchLiveTrends(days),
      () => fetchMockTrends(days),
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return { data: await fetchMockTrends(days), source: "mock" };
    }
    throw err;
  }
}