import { GraphNode } from "@/lib/types";

export function fetchGraph(): Promise<GraphNode[]> {
  return Promise.resolve([
    { id: "n1", symbol: "AuthService", filePath: "src/lib/auth.ts", risk: "HIGH", edges: 5, complexity: 24 },
    { id: "n2", symbol: "DashboardPage", filePath: "src/app/page.tsx", risk: "MEDIUM", edges: 3, complexity: 18 },
    { id: "n3", symbol: "DataTable", filePath: "src/components/DataTable.tsx", risk: "LOW", edges: 2, complexity: 12 },
  ]);
}
