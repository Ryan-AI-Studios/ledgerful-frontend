export interface Project {
  id: string;
  name: string;
  path: string;
  status: "healthy" | "warning" | "critical";
  lastScanAt: string;
  healthScore: number;
}

export const projects: Project[] = [
  {
    id: "changeguard",
    name: "changeguard",
    path: "C:/dev/changeguard",
    status: "warning",
    lastScanAt: "2d ago",
    healthScore: 61,
  },
  {
    id: "ledgerful-frontend",
    name: "ledgerful-frontend",
    path: "C:/dev/ledgerful-frontend",
    status: "healthy",
    lastScanAt: "5m ago",
    healthScore: 94,
  },
  {
    id: "internal-api",
    name: "internal-api",
    path: "C:/dev/internal-api",
    status: "critical",
    lastScanAt: "1w ago",
    healthScore: 34,
  },
];

export const activeProject = projects[0];
