import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import {
  getAuthToken,
  resetInMemoryToken,
  setAuthToken,
} from "@/lib/utils";
import { fetchDashboardData } from "@/lib/data";

// Use the real ProjectProvider instead of the global setup mock
vi.mock("@/lib/ProjectContext", async (importOriginal) => {
  return await importOriginal<typeof import("@/lib/ProjectContext")>();
});

const mockProject = {
  id: "p1",
  name: "Project One",
  path: "C:\\dev\\p1",
  status: "healthy" as const,
  lastScanAt: "now",
  healthScore: 90,
  validationWarnings: [] as string[],
};

const fetchProjects = vi.fn(async () => ({
  data: [mockProject],
  source: "live" as const,
}));

vi.mock("@/lib/projects", () => ({
  fetchProjects: (...args: unknown[]) => fetchProjects(...args),
  activeProject: {
    id: "ledgerful",
    name: "ledgerful",
    path: "C:/dev/ledgerful",
    status: "warning",
    lastScanAt: "2d ago",
    healthScore: 61,
    validationWarnings: [],
  },
}));

const mockFetch = vi.fn();

describe("ProjectContext session lifecycle", () => {
  beforeEach(() => {
    resetInMemoryToken();
    fetchProjects.mockReset();
    fetchProjects.mockResolvedValue({ data: [mockProject], source: "live" });
    mockFetch.mockReset();
    global.fetch = mockFetch;
    delete process.env.NEXT_PUBLIC_LEDGERFUL_USE_MOCK;
  });

  afterEach(() => {
    resetInMemoryToken();
    vi.unstubAllGlobals();
    delete process.env.NEXT_PUBLIC_LEDGERFUL_USE_MOCK;
  });

  it("shows children after mount when setAuthToken was called before render", async () => {
    setAuthToken("pre-set-token");
    const { ProjectProvider } = await import("@/lib/ProjectContext");

    render(
      <ProjectProvider>
        <div>app content</div>
      </ProjectProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("app content")).toBeInTheDocument();
    });
    expect(fetchProjects).toHaveBeenCalled();
  });

  it("shows TokenPrompt when no token is present", async () => {
    const { ProjectProvider } = await import("@/lib/ProjectContext");

    render(
      <ProjectProvider>
        <div>app content</div>
      </ProjectProvider>,
    );

    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.queryByText("app content")).not.toBeInTheDocument();
  });

  it("returns to TokenPrompt on ledgerful:session-invalid", async () => {
    setAuthToken("live-token");
    const { ProjectProvider } = await import("@/lib/ProjectContext");

    render(
      <ProjectProvider>
        <div>app content</div>
      </ProjectProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("app content")).toBeInTheDocument();
    });

    act(() => {
      window.dispatchEvent(new CustomEvent("ledgerful:session-invalid"));
    });

    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.queryByText("app content")).not.toBeInTheDocument();
  });

  it("shows TokenPrompt when a page data hook (fetchDashboardData) receives 401", async () => {
    setAuthToken("will-expire");
    const { ProjectProvider } = await import("@/lib/ProjectContext");

    render(
      <ProjectProvider>
        <div>app content</div>
      </ProjectProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("app content")).toBeInTheDocument();
    });

    // Real dashboard path: data.fetchDashboardData → withFallback → api/dashboard → apiGet("/snapshot")
    // withFallback rethrows 401 (does not mock-mask auth failures).
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: async () => ({ message: "expired" }),
    } as Response);

    await act(async () => {
      await expect(fetchDashboardData()).rejects.toMatchObject({ status: 401 });
    });
    expect(getAuthToken()).toBeNull();

    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.queryByText("app content")).not.toBeInTheDocument();
  });
});
