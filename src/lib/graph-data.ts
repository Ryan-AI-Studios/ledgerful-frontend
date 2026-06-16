import { fetchGraph as fetchLiveGraph } from "@/lib/api/graph";
import { fetchGraph as fetchMockGraph } from "@/lib/mock/graph";
import { withFallback } from "@/lib/fallback";

export type { GraphNode } from "@/lib/types";

export async function fetchGraph(): Promise<import("@/lib/types").GraphNode[]> {
  return withFallback(() => fetchLiveGraph(), () => fetchMockGraph());
}
