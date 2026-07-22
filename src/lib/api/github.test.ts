import { getGithubIntegrationStatus, connectGithub, disconnectGithub } from "./github";
import * as projectsMock from "../mock/projects";
import { vi, describe, beforeEach, afterAll, it, expect } from "vitest";
import { ApiError } from "../api";

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

  it("returns integration status with source=mock for an existing project under mock mode", async () => {
    (projectsMock.fetchProjects as import("vitest").Mock).mockResolvedValue([
      { id: "proj-1", integrationStatus: "CONNECTED", githubRepo: "acme/frontend" },
    ]);
    const result = await getGithubIntegrationStatus("proj-1");
    expect(result.source).toBe("mock");
    expect(result.data.status).toBe("CONNECTED");
    expect(result.data.repo).toBe("acme/frontend");
  });

  it("returns DISCONNECTED for missing project or missing status under mock mode", async () => {
    (projectsMock.fetchProjects as import("vitest").Mock).mockResolvedValue([
      { id: "proj-1" },
      { id: "proj-2", integrationStatus: "PENDING" },
    ]);
    const res1 = await getGithubIntegrationStatus("proj-1");
    expect(res1.data.status).toBe("DISCONNECTED");
    expect(res1.data.repo).toBeUndefined();

    const res3 = await getGithubIntegrationStatus("proj-3");
    expect(res3.data.status).toBe("DISCONNECTED");
  });

  it("short-circuits to source=planned when not in mock mode (no CONNECTED theater)", async () => {
    process.env.NEXT_PUBLIC_LEDGERFUL_USE_MOCK = "false";
    const result = await getGithubIntegrationStatus("proj-1");
    expect(result.source).toBe("planned");
    expect(result.data.status).toBe("DISCONNECTED");
  });

  it("allows connect under mock mode", async () => {
    await connectGithub("proj-1");
  });

  it("allows disconnect under mock mode", async () => {
    await disconnectGithub("proj-1");
  });

  it("rejects connect/disconnect with 501 when not in mock mode", async () => {
    process.env.NEXT_PUBLIC_LEDGERFUL_USE_MOCK = "false";
    await expect(connectGithub("proj-1")).rejects.toBeInstanceOf(ApiError);
    await expect(disconnectGithub("proj-1")).rejects.toBeInstanceOf(ApiError);
  });
});
