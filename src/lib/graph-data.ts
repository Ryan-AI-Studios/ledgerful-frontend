import { RiskLevel } from "./types";
import { buildApiUrl } from "./utils";

export interface GraphNode {
  id: string;
  symbol: string;
  filePath: string;
  risk: RiskLevel;
  edges: number;
  complexity: number;
}

interface KnowledgeGraphResponse {
  nodes: Array<{
    id: string;
    label: string;
    kind?: string;
    risk_score?: number;
    file_path?: string;
    complexity?: number;
  }>;
  edges: Array<{ source: string; target: string }>;
  truncated?: boolean;
}

function riskFromScore(score?: number): RiskLevel {
  if (score === undefined) return "LOW";
  if (score >= 7.0) return "HIGH";
  if (score >= 4.0) return "MEDIUM";
  if (score >= 1.0) return "LOW";
  return "TRIVIAL";
}

export async function fetchGraph(): Promise<GraphNode[]> {
  const res = await fetch(buildApiUrl("/knowledge-graph", { limit: "200" }));
  if (!res.ok) throw new Error(`Knowledge graph request failed: ${res.status}`);
  const data: KnowledgeGraphResponse = await res.json();

  const edgeCounts = new Map<string, number>();
  for (const edge of data.edges) {
    edgeCounts.set(edge.source, (edgeCounts.get(edge.source) ?? 0) + 1);
    edgeCounts.set(edge.target, (edgeCounts.get(edge.target) ?? 0) + 1);
  }

  return data.nodes.map((node) => ({
    id: node.id,
    symbol: node.label,
    filePath: node.file_path ?? "",
    risk: riskFromScore(node.risk_score),
    edges: edgeCounts.get(node.id) ?? 0,
    complexity: node.complexity ?? 0,
  }));
}

