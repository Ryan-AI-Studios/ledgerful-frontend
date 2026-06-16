import { apiGet } from "../api";
import { Project } from "@/lib/types";

interface ProjectApiItem {
  id: string;
  name: string;
  path: string;
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
    status: "healthy",
    lastScanAt: "now",
    healthScore: 100,
  }));
}
