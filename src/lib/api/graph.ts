import { apiGet } from "../api";
import { GraphData, GraphNode, GraphEdge, RiskLevel } from "@/lib/types";

interface GraphResponse {
  nodes: Array<{
    id: string;
    label: string;
    kind?: "file" | "change" | "ai";
    risk_score?: number;
    file_path?: string;
    x?: number;
    y?: number;
  }>;
  edges: Array<{
    id?: string;
    source: string;
    target: string;
    kind?: "depends" | "changed" | "ai-edited";
  }>;
  truncated?: boolean;
}

function riskFromScore(score?: number): RiskLevel {
  if (score === undefined) return "LOW";
  if (score >= 7.0) return "HIGH";
  if (score >= 4.0) return "MEDIUM";
  if (score >= 1.0) return "LOW";
  return "TRIVIAL";
}

export async function fetchGraph(): Promise<GraphData> {
  const data = await apiGet<GraphResponse>("/graph", { limit: "200" });
  if (!data || typeof data !== "object" || !Array.isArray(data.nodes)) {
    throw new Error("Invalid graph response: expected nodes array");
  }

  const nodes: GraphNode[] = data.nodes.map((node) => ({
    id: node.id,
    type: node.kind ?? "file",
    label: node.label,
    riskLevel: riskFromScore(node.risk_score),
    x: node.x,
    y: node.y,
  }));

  const edges: GraphEdge[] = data.edges.map((edge, index) => ({
    id: edge.id ?? `e${index}`,
    source: edge.source,
    target: edge.target,
    type: edge.kind ?? "depends",
  }));

  return { nodes, edges };
}
