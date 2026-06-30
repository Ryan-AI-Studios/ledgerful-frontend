import { fetchGraph as fetchLiveGraph } from "@/lib/api/graph";
import { fetchGraph as fetchMockGraph } from "@/lib/mock/graph";
import { withFallback, WithSource } from "@/lib/fallback";
import { GraphData } from "@/lib/types";

export type { GraphData, GraphNode, GraphEdge } from "@/lib/types";

export async function fetchGraph(): Promise<WithSource<GraphData>> {
  return withFallback(() => fetchLiveGraph(), () => fetchMockGraph());
}
