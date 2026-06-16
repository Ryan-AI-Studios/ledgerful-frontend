import { GraphData } from "@/lib/types";

export function fetchGraph(): Promise<GraphData> {
  return Promise.resolve({
    nodes: [
      { id: "f1", type: "file", label: "src/lib/auth.ts", riskLevel: "HIGH", x: 200, y: 200 },
      { id: "f2", type: "file", label: "src/app/page.tsx", riskLevel: "MEDIUM", x: 400, y: 300 },
      { id: "f3", type: "file", label: "src/components/DataTable.tsx", riskLevel: "LOW", x: 600, y: 200 },
      { id: "f4", type: "file", label: "src/lib/api.ts", riskLevel: "LOW", x: 400, y: 100 },
      { id: "c1", type: "change", label: "Update auth logic", x: 100, y: 300 },
      { id: "c2", type: "change", label: "Fix table rendering", x: 700, y: 300 },
      { id: "a1", type: "ai", label: "AI Suggestion: Refactor Auth", x: 300, y: 400 },
    ],
    edges: [
      { id: "e1", source: "f2", target: "f1", type: "depends" },
      { id: "e2", source: "f2", target: "f3", type: "depends" },
      { id: "e3", source: "f1", target: "f4", type: "depends" },
      { id: "e4", source: "c1", target: "f1", type: "changed" },
      { id: "e5", source: "c2", target: "f3", type: "changed" },
      { id: "e6", source: "a1", target: "f1", type: "ai-edited" },
      { id: "e7", source: "a1", target: "c1", type: "ai-edited" },
    ],
  });
}
