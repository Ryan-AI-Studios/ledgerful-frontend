import { fetchHotspots as fetchLiveHotspots } from "@/lib/api/hotspots";
import { fetchHotspots as fetchMockHotspots } from "@/lib/mock/hotspots";
import { withFallback } from "@/lib/fallback";

export type { Hotspot } from "@/lib/types";

export async function fetchHotspots(): Promise<import("@/lib/types").Hotspot[]> {
  return withFallback(() => fetchLiveHotspots(), () => fetchMockHotspots());
}
