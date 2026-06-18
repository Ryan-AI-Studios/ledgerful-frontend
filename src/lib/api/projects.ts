import { apiGet } from "../api";
import { Project } from "@/lib/types";

interface ProjectApiItem {
  id: string;
  name: string;
  path: string;
  status: string;
  last_scan_at: string | null;
  health_score: number;
}

export async function fetchProjects(): Promise<Project[]> {
  const data = await apiGet<ProjectApiItem[]>("/projects");
  if (!Array.isArray(data)) {
    throw new Error("Invalid projects response: expected array");
  }

  return data.map((p) => ({
    id: p.id,
    name: p.name,
    path: p.path,
    status: (p.status === "healthy" || p.status === "warning" || p.status === "critical") ? p.status : "warning",
    lastScanAt: p.last_scan_at,
    healthScore: p.health_score,
  }));
}
