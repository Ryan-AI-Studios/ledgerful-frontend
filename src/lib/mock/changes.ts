import { ChangeEntry } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function fetchChanges(_days = 7): Promise<ChangeEntry[]> {
  return Promise.resolve([
    {
      id: "chg-1",
      filePath: "src/lib/auth.ts",
      summary: "Refactored token validation",
      author: "alice",
      timeAgo: "2h ago",
      fileCount: 1,
      filesChanged: 1,
      additions: 45,
      deletions: 12,
      risk: "HIGH",
      prNumber: 142,
      prStatus: "Open",
    },
    {
      id: "chg-2",
      filePath: "src/app/page.tsx",
      summary: "Updated dashboard layout",
      author: "bob",
      timeAgo: "5h ago",
      fileCount: 2,
      filesChanged: 2,
      additions: 120,
      deletions: 30,
      risk: "MEDIUM",
      prNumber: 140,
      prStatus: "Merged",
    },
    {
      id: "chg-3",
      filePath: "README.md",
      summary: "Added setup instructions",
      author: "carol",
      timeAgo: "1d ago",
      fileCount: 1,
      filesChanged: 1,
      additions: 20,
      deletions: 0,
      risk: "LOW",
    },
  ]);
}
