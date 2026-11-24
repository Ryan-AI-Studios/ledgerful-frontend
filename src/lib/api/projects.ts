import { apiGet } from "../api";
import { Project } from "@/lib/types";
import type { ExtractResponse } from "./contract-types";
import { decodeCapability } from "./change-evidence-decoder";

type ProjectWire = ExtractResponse<"/api/projects", "get">;

export async function fetchProjects(signal?: AbortSignal): Promise<Project[]> {
  const data = await apiGet<ProjectWire>("/projects", undefined,
    signal ? { signal, strictJson: true } : undefined);
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
    validationWarnings: p.validation_warnings ?? [],
    ...(p.changeEvidence != null ? { changeEvidence: decodeCapability(p.changeEvidence) } : {}),
  }));
}
