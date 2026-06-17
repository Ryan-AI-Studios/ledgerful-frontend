import { Project } from "@/lib/types";
import { fetchProjects as fetchMockProjects } from "@/lib/mock/projects";
import { withFallback } from "@/lib/fallback";

async function liveGetStatus(projectId: string): Promise<{ status: Project["integrationStatus"], repo?: string }> {
  void projectId;
  throw new Error("Live Github API not implemented");
}

async function mockGetStatus(projectId: string): Promise<{ status: Project["integrationStatus"], repo?: string }> {
  const projects = await fetchMockProjects();
  const project = projects.find((p) => p.id === projectId);
  return {
    status: project?.integrationStatus || "DISCONNECTED",
    repo: project?.githubRepo,
  };
}

export async function getGithubIntegrationStatus(projectId: string): Promise<{ status: Project["integrationStatus"], repo?: string }> {
  return withFallback(() => liveGetStatus(projectId), () => mockGetStatus(projectId));
}

async function liveConnect(projectId: string): Promise<void> {
  void projectId;
  throw new Error("Live Github API not implemented");
}

async function mockConnect(projectId: string): Promise<void> {
  void projectId;
  return new Promise((resolve) => setTimeout(resolve, 1000));
}

export async function connectGithub(projectId: string): Promise<void> {
  return withFallback(() => liveConnect(projectId), () => mockConnect(projectId));
}

async function liveDisconnect(projectId: string): Promise<void> {
  void projectId;
  throw new Error("Live Github API not implemented");
}

async function mockDisconnect(projectId: string): Promise<void> {
  void projectId;
  return new Promise((resolve) => setTimeout(resolve, 1000));
}

export async function disconnectGithub(projectId: string): Promise<void> {
  return withFallback(() => liveDisconnect(projectId), () => mockDisconnect(projectId));
}
