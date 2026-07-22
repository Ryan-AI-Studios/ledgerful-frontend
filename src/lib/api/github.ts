import { Project } from "@/lib/types";
import { fetchProjects as fetchMockProjects } from "@/lib/mock/projects";
import { WithSource, shouldUseMock } from "@/lib/fallback";
import { ApiError } from "../api";

async function mockGetStatus(
  projectId: string,
): Promise<{ status: Project["integrationStatus"]; repo?: string }> {
  const projects = await fetchMockProjects();
  const project = projects.find((p) => p.id === projectId);
  return {
    status: project?.integrationStatus || "DISCONNECTED",
    repo: project?.githubRepo,
  };
}

/**
 * GitHub integration is 501-by-design on the live daemon.
 * When mock mode is off, short-circuit to source:"planned" (do not withFallback
 * to mock CONNECTED theater). Only use mock when shouldUseMock() is true.
 */
export async function getGithubIntegrationStatus(
  projectId: string,
): Promise<WithSource<{ status: Project["integrationStatus"]; repo?: string }>> {
  if (shouldUseMock()) {
    return { data: await mockGetStatus(projectId), source: "mock" };
  }
  return {
    data: { status: "DISCONNECTED" },
    source: "planned",
  };
}

export async function connectGithub(projectId: string): Promise<void> {
  void projectId;
  if (shouldUseMock()) {
    return new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new ApiError(501, "GitHub integration is planned; connect via CLI when available");
}

export async function disconnectGithub(projectId: string): Promise<void> {
  void projectId;
  if (shouldUseMock()) {
    return new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new ApiError(501, "GitHub integration is planned; disconnect via CLI when available");
}
