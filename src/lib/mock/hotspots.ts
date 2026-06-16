import { Hotspot } from "@/lib/types";

export function fetchHotspots(): Promise<Hotspot[]> {
  return Promise.resolve([
    {
      rank: 1,
      filePath: "src/lib/auth.ts",
      score: 8.4,
      trend: [6.1, 6.5, 7.0, 7.2, 7.8, 8.1, 8.4],
    },
    {
      rank: 2,
      filePath: "src/app/page.tsx",
      score: 6.2,
      trend: [4.0, 4.5, 5.1, 5.4, 5.8, 6.0, 6.2],
    },
    {
      rank: 3,
      filePath: "src/components/DataTable.tsx",
      score: 4.7,
      trend: [3.0, 3.2, 3.5, 4.0, 4.2, 4.5, 4.7],
    },
  ]);
}
