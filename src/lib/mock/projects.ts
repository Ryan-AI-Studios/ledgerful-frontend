import { Project } from "@/lib/types";

export function fetchProjects(): Promise<Project[]> {
  return Promise.resolve([
    {
      id: "ledgerful",
      name: "ledgerful",
      path: "C:/dev/ledgerful",
      status: "warning",
      lastScanAt: "2d ago",
      healthScore: 61,
      validationWarnings: [],
    },
  ]);
}
