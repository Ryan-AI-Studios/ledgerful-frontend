import { Project } from "@/lib/types";
import { fetchProjects as fetchMockProjects } from "@/lib/mock/projects";
import { withFallback, WithSource, shouldUseMock } from "@/lib/fallback";
import { ApiError } from "../api";

async function liveGetStatus(projectId: string): Promise<{ status: Project["integrationStatus"], repo?: string }> {
  void projectId;
  throw new ApiError(501, "Live GitHub API not implemented");
}

async function mockGetStatus(projectId: string): Promise<{ status: Project["integrationStatus"], repo?: string }> {
  const projects = await fetchMockProjects();
  const project = projects.find((p) => p.id === projectId);
  return {
    status: project?.integrationStatus || "DISCONNECTED",
    repo: project?.githubRepo,
  };
}

export async function getGithubIntegrationStatus(projectId: string): Promise<WithSource<{ status: Project["integrationStatus"], repo?: string }>> {
  return withFallback(() => liveGetStatus(projectId), () => mockGetStatus(projectId));
}

export async function connectGithub(projectId: string): Promise<void> {
  void projectId;
  if (shouldUseMock()) {
    return new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new ApiError(501, "Live GitHub API not implemented");
}

export async function disconnectGithub(projectId: string): Promise<void> {
  void projectId;
  if (shouldUseMock()) {
    return new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new ApiError(501, "Live GitHub API not implemented");
}
