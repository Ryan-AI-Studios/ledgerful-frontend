import { apiGet } from "../api";
import { GraphData, GraphNode, GraphEdge, RiskLevel } from "@/lib/types";
import type { ExtractResponse } from "./contract-types";

type GraphWire = ExtractResponse<"/api/knowledge-graph", "get">;

function riskFromScore(score?: number): RiskLevel {
  if (score === undefined) return "LOW";
  if (score >= 7.0) return "HIGH";
  if (score >= 4.0) return "MEDIUM";
  if (score >= 1.0) return "LOW";
  return "TRIVIAL";
}

export async function fetchGraph(): Promise<GraphData> {
  const data = await apiGet<GraphWire>("/graph", { limit: "200" });
  if (!data || typeof data !== "object" || !Array.isArray(data.nodes)) {
    throw new Error("Invalid graph response: expected nodes array");
  }

  const nodes: GraphNode[] = data.nodes.map((node) => ({
    id: node.id,
    type: node.category as GraphNode["type"],
    label: node.label,
    riskLevel: riskFromScore(node.risk_score),
  }));

  const edges: GraphEdge[] = data.edges.map((edge, index) => ({
    id: edge.provenance_id ?? `e${index}`,
    source: edge.source,
    target: edge.target,
    type: edge.relation as GraphEdge["type"],
  }));

  return { nodes, edges };
}
