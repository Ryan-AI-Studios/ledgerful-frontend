import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StrictMode } from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import {
  getAuthToken,
  resetInMemoryToken,
  setAuthToken,
} from "@/lib/utils";
import { resetHandoffExchangeState } from "@/lib/session-handoff";
import { fetchDashboardData } from "@/lib/data";
import { SESSION_INVALID_EVENT } from "@/lib/events";

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
const HANDOFF_CODE = "c".repeat(64);
const SESSION_TOKEN = "d".repeat(64);

describe("ProjectContext session lifecycle", () => {
  beforeEach(() => {
    resetInMemoryToken();
    resetHandoffExchangeState();
    fetchProjects.mockReset();
    fetchProjects.mockResolvedValue({ data: [mockProject], source: "live" });
    mockFetch.mockReset();
    global.fetch = mockFetch;
    delete process.env.NEXT_PUBLIC_LEDGERFUL_USE_MOCK;
    delete process.env.NEXT_PUBLIC_LEDGERFUL_API_URL;
    window.history.replaceState(null, "", "/");
  });

  afterEach(() => {
    resetInMemoryToken();
    resetHandoffExchangeState();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete process.env.NEXT_PUBLIC_LEDGERFUL_USE_MOCK;
    delete process.env.NEXT_PUBLIC_LEDGERFUL_API_URL;
    window.history.replaceState(null, "", "/");
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

  it("returns to TokenPrompt on SESSION_INVALID_EVENT", async () => {
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
      window.dispatchEvent(new CustomEvent(SESSION_INVALID_EVENT));
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

describe("ProjectContext handoff bootstrap (#c=)", () => {
  beforeEach(() => {
    resetInMemoryToken();
    resetHandoffExchangeState();
    fetchProjects.mockReset();
    fetchProjects.mockResolvedValue({ data: [mockProject], source: "live" });
    mockFetch.mockReset();
    global.fetch = mockFetch;
    delete process.env.NEXT_PUBLIC_LEDGERFUL_USE_MOCK;
    // Same-origin with jsdom so bootstrap is eligible
    process.env.NEXT_PUBLIC_LEDGERFUL_API_URL = window.location.origin;
    window.history.replaceState(null, "", "/");
  });

  afterEach(() => {
    resetInMemoryToken();
    resetHandoffExchangeState();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete process.env.NEXT_PUBLIC_LEDGERFUL_USE_MOCK;
    delete process.env.NEXT_PUBLIC_LEDGERFUL_API_URL;
    window.history.replaceState(null, "", "/");
  });

  it("happy path: hash present → token set, TokenPrompt never rendered", async () => {
    window.location.hash = `#c=${HANDOFF_CODE}`;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ token: SESSION_TOKEN }),
    } as Response);

    const { ProjectProvider } = await import("@/lib/ProjectContext");

    render(
      <ProjectProvider>
        <div>app content</div>
      </ProjectProvider>,
    );

    // Must never show the sign-in heading on the happy path
    expect(screen.queryByRole("heading", { name: "Sign in" })).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("app content")).toBeInTheDocument();
    });

    expect(getAuthToken()).toBe(SESSION_TOKEN);
    expect(window.location.hash).toBe("");
    expect(screen.queryByRole("heading", { name: "Sign in" })).not.toBeInTheDocument();

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/api\/session\/exchange$/);
    expect(url).not.toContain(HANDOFF_CODE);
    expect(url).not.toContain(SESSION_TOKEN);
    expect(init.body).toBe(JSON.stringify({ code: HANDOFF_CODE }));
  });

  it("ordering: replaceState is called before the exchange promise resolves", async () => {
    window.location.hash = `#c=${HANDOFF_CODE}`;
    const order: string[] = [];

    vi.spyOn(window.history, "replaceState").mockImplementation(function (
      this: History,
      data: unknown,
      unused: string,
      url?: string | URL | null,
    ) {
      order.push("replaceState");
      return History.prototype.replaceState.call(this, data, unused, url);
    });

    let resolveFetch!: (value: Response) => void;
    const pending = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    mockFetch.mockImplementation(() => {
      order.push("fetch");
      return pending;
    });

    const { ProjectProvider } = await import("@/lib/ProjectContext");

    render(
      <ProjectProvider>
        <div>app content</div>
      </ProjectProvider>,
    );

    await waitFor(() => {
      expect(order).toContain("replaceState");
      expect(order).toContain("fetch");
    });

    // DoD-6: strip-before-await — replaceState index strictly before fetch
    expect(order.indexOf("replaceState")).toBeLessThan(order.indexOf("fetch"));
    expect(window.location.hash).toBe("");

    // Still bootstrapping — TokenPrompt must not flash
    expect(screen.queryByRole("heading", { name: "Sign in" })).not.toBeInTheDocument();
    expect(screen.queryByText("app content")).not.toBeInTheDocument();

    await act(async () => {
      resolveFetch({
        ok: true,
        status: 200,
        json: async () => ({ token: SESSION_TOKEN }),
      } as Response);
    });

    await waitFor(() => {
      expect(screen.getByText("app content")).toBeInTheDocument();
    });
    expect(getAuthToken()).toBe(SESSION_TOKEN);
  });

  it("failure → TokenPrompt with explanatory message", async () => {
    window.location.hash = `#c=${HANDOFF_CODE}`;
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: "Forbidden",
      json: async () => ({ message: "expired" }),
    } as Response);

    const { ProjectProvider } = await import("@/lib/ProjectContext");

    render(
      <ProjectProvider>
        <div>app content</div>
      </ProjectProvider>,
    );

    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByTestId("handoff-failed-message")).toHaveTextContent(
      /Automatic sign-in expired/i,
    );
    expect(screen.queryByText("app content")).not.toBeInTheDocument();
    expect(getAuthToken()).toBeNull();
  });

  it("no hash → today's behaviour (TokenPrompt, no exchange fetch)", async () => {
    window.location.hash = "";
    const { ProjectProvider } = await import("@/lib/ProjectContext");

    render(
      <ProjectProvider>
        <div>app content</div>
      </ProjectProvider>,
    );

    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.queryByText("app content")).not.toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("cross-origin API base → bootstrap skipped, no fetch issued", async () => {
    process.env.NEXT_PUBLIC_LEDGERFUL_API_URL = "https://api.example.com";
    window.location.hash = `#c=${HANDOFF_CODE}`;

    const { ProjectProvider } = await import("@/lib/ProjectContext");

    render(
      <ProjectProvider>
        <div>app content</div>
      </ProjectProvider>,
    );

    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
    // Hash left in place when bootstrap is skipped (cross-origin guard)
    expect(window.location.hash).toBe(`#c=${HANDOFF_CODE}`);
  });

  it("Strict Mode remount: deferred exchange still sets token; TokenPrompt never permanent", async () => {
    window.location.hash = `#c=${HANDOFF_CODE}`;

    let resolveFetch!: (value: Response) => void;
    const pending = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    mockFetch.mockImplementation(() => pending);

    const { ProjectProvider } = await import("@/lib/ProjectContext");

    render(
      <StrictMode>
        <ProjectProvider>
          <div>app content</div>
        </ProjectProvider>
      </StrictMode>,
    );

    // While exchange is in flight (including after Strict Mode remount), never
    // leave the user on a permanent TokenPrompt — shell or nothing, not Sign in.
    expect(screen.queryByRole("heading", { name: "Sign in" })).not.toBeInTheDocument();
    expect(screen.queryByText("app content")).not.toBeInTheDocument();

    // Single exchange despite double-mount (hash stripped on first take)
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(window.location.hash).toBe("");

    await act(async () => {
      resolveFetch({
        ok: true,
        status: 200,
        json: async () => ({ token: SESSION_TOKEN }),
      } as Response);
    });

    await waitFor(() => {
      expect(screen.getByText("app content")).toBeInTheDocument();
    });
    expect(getAuthToken()).toBe(SESSION_TOKEN);
    expect(screen.queryByRole("heading", { name: "Sign in" })).not.toBeInTheDocument();
  });
});
