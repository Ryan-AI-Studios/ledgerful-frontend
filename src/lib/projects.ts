import { fetchProjects as fetchLiveProjects } from "@/lib/api/projects";
import { fetchProjects as fetchMockProjects } from "@/lib/mock/projects";
import { withFallback, WithSource } from "@/lib/fallback";

export type { Project } from "@/lib/types";

export const projects: import("@/lib/types").Project[] = [
  {
    id: "ledgerful",
    name: "ledgerful",
    path: "C:/dev/ledgerful",
    status: "warning",
    lastScanAt: "2d ago",
    healthScore: 61,
    validationWarnings: [],
  },
];

export async function fetchProjects(): Promise<WithSource<import("@/lib/types").Project[]>> {
  return withFallback(() => fetchLiveProjects(), () => fetchMockProjects());
}

export const activeProject: import("@/lib/types").Project = projects[0];
