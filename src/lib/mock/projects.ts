import { Project } from "@/lib/types";

export function fetchProjects(): Promise<Project[]> {
  return Promise.resolve([
    {
      id: "changeguard",
      name: "changeguard",
      path: "C:/dev/changeguard",
      status: "warning",
      lastScanAt: "2d ago",
      healthScore: 61,
    },
  ]);
}
