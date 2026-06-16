import { Hotspot } from "@/lib/types";

export function fetchHotspots(_days: number = 90): Promise<Hotspot[]> {
  // Simple mock data matching the new type
  return Promise.resolve([
    {
      id: "h1",
      rank: 1,
      filePath: "src/lib/auth.ts",
      riskLevel: "HIGH",
      riskScore: 84,
      lastTouchedAt: new Date().toISOString(),
      contributor: "Alice",
      changeCount: 42,
    },
    {
      id: "h2",
      rank: 2,
      filePath: "src/app/page.tsx",
      riskLevel: "MEDIUM",
      riskScore: 62,
      lastTouchedAt: new Date(Date.now() - 86400000).toISOString(),
      contributor: "Bob",
      changeCount: 15,
    },
    {
      id: "h3",
      rank: 3,
      filePath: "src/components/DataTable.tsx",
      riskLevel: "LOW",
      riskScore: 47,
      lastTouchedAt: new Date(Date.now() - 172800000).toISOString(),
      contributor: "Charlie",
      changeCount: 8,
    },
  ]);
}
