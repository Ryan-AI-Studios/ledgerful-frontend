import { getGithubIntegrationStatus, connectGithub, disconnectGithub } from "./github";
import * as projectsMock from "../mock/projects";
import { vi, describe, beforeEach, afterAll, it, expect } from "vitest";

vi.mock("../mock/projects", () => ({
  fetchProjects: vi.fn(),
}));

describe("GitHub API", () => {
  const originalEnv = process.env.NEXT_PUBLIC_LEDGERFUL_USE_MOCK;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_LEDGERFUL_USE_MOCK = "true";
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_LEDGERFUL_USE_MOCK = originalEnv;
  });

  it("returns integration status with source for an existing project", async () => {
    (projectsMock.fetchProjects as import("vitest").Mock).mockResolvedValue([
      { id: "proj-1", integrationStatus: "CONNECTED", githubRepo: "acme/frontend" },
    ]);
    const result = await getGithubIntegrationStatus("proj-1");
    expect(result.source).toBe("mock");
    expect(result.data.status).toBe("CONNECTED");
    expect(result.data.repo).toBe("acme/frontend");
  });

  it("returns DISCONNECTED for missing project or missing status", async () => {
    (projectsMock.fetchProjects as import("vitest").Mock).mockResolvedValue([
      { id: "proj-1" }, // missing status
      { id: "proj-2", integrationStatus: "PENDING" },
    ]);
    const res1 = await getGithubIntegrationStatus("proj-1");
    expect(res1.data.status).toBe("DISCONNECTED");
    expect(res1.data.repo).toBeUndefined();

    const res3 = await getGithubIntegrationStatus("proj-3");
    expect(res3.data.status).toBe("DISCONNECTED");
  });

  it("simulates connecting to github", async () => {
    const result = await connectGithub("proj-1");
    expect(result.source).toBe("mock");
  });

  it("simulates disconnecting from github", async () => {
    const result = await disconnectGithub("proj-1");
    expect(result.source).toBe("mock");
  });
});
