import { buildApiUrl } from "./utils";

export interface Project {
  id: string;
  name: string;
  path: string;
  status: "healthy" | "warning" | "critical";
  lastScanAt: string;
  healthScore: number;
}

interface ProjectApiItem {
  id: string;
  name: string;
  path: string;
}

export const projects: Project[] = [];

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(buildApiUrl("/projects"));
  if (!res.ok) throw new Error(`Projects request failed: ${res.status}`);
  const data: ProjectApiItem[] = await res.json();

  return data.map((p) => ({
    id: p.id,
    name: p.name,
    path: p.path,
    status: "healthy",
    lastScanAt: "now",
    healthScore: 100,
  }));
}

export const activeProject: Project = {
  id: "changeguard",
  name: "changeguard",
  path: "C:/dev/changeguard",
  status: "warning",
  lastScanAt: "2d ago",
  healthScore: 61,
};
