import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiGet, apiPost, apiFetch, ApiError, isApiError } from "./api";
import { triggerSoc2Export } from "./api/compliance";
import { fetchDashboardData } from "./data";
import { fetchLedgerEntry } from "./ledger-data";
import {
  getAuthToken,
  resetInMemoryToken,
  setAuthToken,
} from "./utils";

const mockFetch = vi.fn();
global.fetch = mockFetch;

function authHeader(init: RequestInit | undefined): string | null {
  if (!init?.headers) return null;
  return new Headers(init.headers as HeadersInit).get("Authorization");
}

function contentTypeHeader(init: RequestInit | undefined): string | null {
  if (!init?.headers) return null;
  return new Headers(init.headers as HeadersInit).get("Content-Type");
}

function sessionInvalidCalls(dispatchSpy: ReturnType<typeof vi.spyOn>): Event[] {
  return dispatchSpy.mock.calls
    .map((c) => c[0] as Event)
    .filter((e) => e instanceof Event && e.type === "ledgerful:session-invalid");
}

describe("apiRequest", () => {
  beforeEach(() => {
    resetInMemoryToken();
    mockFetch.mockReset();
    vi.stubGlobal("window", {
      location: { search: "", pathname: "/", hash: "" },
      history: { replaceState: vi.fn() },
      dispatchEvent: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.NEXT_PUBLIC_LEDGERFUL_USE_MOCK;
  });

  it("returns parsed JSON for GET", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: "ok" }),
    } as Response);

    const result = await apiGet<{ message: string }>("/status");
    expect(result).toEqual({ message: "ok" });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/api/status");
    const init = mockFetch.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe("GET");
  });

  it("throws ApiError with parsed message on 4xx", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: async () => ({ error: true, message: "bad token" }),
    } as Response);

    let threw = false;
    try {
      await apiGet("/status");
    } catch (err) {
      threw = true;
      expect(isApiError(err)).toBe(true);
      expect((err as ApiError).status).toBe(401);
      expect((err as ApiError).message).toBe("bad token");
    }
    expect(threw).toBe(true);
  });

  it("throws ApiError with parsed message on 5xx", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      json: async () => ({ error: true, message: "daemon offline" }),
    } as Response);

    await expect(apiGet("/status")).rejects.toThrow("daemon offline");
  });

  it("throws ApiError with statusText when JSON parse fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => {
        throw new Error("fail");
      },
    } as unknown as Response);

    await expect(apiGet("/status")).rejects.toThrow("Internal Server Error");
  });

  it("sends correct method, headers, and body for POST", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ id: "1" }),
    } as Response);

    await apiPost<{ id: string }>("/ledger", { txId: "tx-1" });

    const init = mockFetch.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ txId: "tx-1" }));
    expect(contentTypeHeader(init)).toBe("application/json");
  });

  it("sends Authorization header from setAuthToken", async () => {
    const token = "test-token-123";
    setAuthToken(token);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response);

    await apiGet("/status");
    const init = mockFetch.mock.calls[0][1] as RequestInit;
    expect(authHeader(init)).toBe(`Bearer ${token}`);
  });

  it("does not authenticate from ?token= in location.search alone", async () => {
    const token = "url-only-token";
    vi.stubGlobal("window", {
      location: { search: `?token=${token}`, pathname: "/", hash: "" },
      history: { replaceState: vi.fn() },
      dispatchEvent: vi.fn(),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response);

    expect(getAuthToken()).toBeNull();
    await apiGet("/status");
    const init = mockFetch.mock.calls[0][1] as RequestInit;
    expect(authHeader(init)).toBeNull();
  });

  it("does not send a body for GET", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response);

    await apiGet("/status");
    const init = mockFetch.mock.calls[0][1] as RequestInit;
    expect(init.body).toBeUndefined();
  });

  it("keeps falsy but defined query parameters", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response);

    await apiGet("/changes", { days: "0", limit: "" });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("days=0");
    expect(url).not.toContain("limit=");
  });

  it("does not append token to URL when setAuthToken is used", async () => {
    setAuthToken("memory-token-456");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response);

    await apiGet("/status");
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).not.toContain("token=");
    expect(authHeader(mockFetch.mock.calls[0][1] as RequestInit)).toBe(
      "Bearer memory-token-456",
    );
  });
});

describe("session invalidation (apiFetch / apiRequest)", () => {
  let dispatchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    resetInMemoryToken();
    mockFetch.mockReset();
    dispatchSpy = vi.fn();
    vi.stubGlobal("window", {
      location: { search: "", pathname: "/", hash: "" },
      history: { replaceState: vi.fn() },
      dispatchEvent: dispatchSpy,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("clears token and dispatches session-invalid on 401 with active token", async () => {
    setAuthToken("active-token");
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: async () => ({ message: "expired" }),
    } as Response);

    await expect(apiGet("/status")).rejects.toMatchObject({ status: 401 });
    expect(getAuthToken()).toBeNull();
    expect(sessionInvalidCalls(dispatchSpy)).toHaveLength(1);
  });

  it("clears token and dispatches session-invalid on 403 with active token", async () => {
    setAuthToken("active-token");
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: "Forbidden",
      json: async () => ({ message: "revoked" }),
    } as Response);

    await expect(apiFetch("/compliance/export")).resolves.toMatchObject({
      status: 403,
    });
    expect(getAuthToken()).toBeNull();
    expect(sessionInvalidCalls(dispatchSpy)).toHaveLength(1);
  });

  it("does not invalidate on non-401/403 errors", async () => {
    setAuthToken("still-good");
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => ({ message: "boom" }),
    } as Response);

    await expect(apiGet("/status")).rejects.toThrow("boom");
    expect(getAuthToken()).toBe("still-good");
    expect(sessionInvalidCalls(dispatchSpy)).toHaveLength(0);
  });

  it("does not invalidate when request had no token", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: async () => ({ message: "need auth" }),
    } as Response);

    await expect(apiGet("/status")).rejects.toMatchObject({ status: 401 });
    expect(getAuthToken()).toBeNull();
    expect(sessionInvalidCalls(dispatchSpy)).toHaveLength(0);
  });

  it("does not clear a newer token when a straggler 401 resolves (race)", async () => {
    setAuthToken("token-A");
    let resolveFetch!: (value: Response) => void;
    const pending = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    mockFetch.mockReturnValueOnce(pending);

    const requestPromise = apiGet("/status").then(
      () => null,
      (err: unknown) => err,
    );

    // User re-auths before the straggler resolves
    setAuthToken("token-B");

    resolveFetch({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: async () => ({ message: "stale" }),
    } as Response);

    const err = await requestPromise;
    expect(isApiError(err)).toBe(true);
    expect(getAuthToken()).toBe("token-B");
    expect(sessionInvalidCalls(dispatchSpy)).toHaveLength(0);
  });

  it("dedupes concurrent same-token 401 burst to a single reset", async () => {
    setAuthToken("same-token");
    const unauthorized = {
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: async () => ({ message: "expired" }),
    } as Response;
    mockFetch
      .mockResolvedValueOnce(unauthorized)
      .mockResolvedValueOnce(unauthorized);

    await Promise.all([
      apiGet("/a").catch(() => undefined),
      apiGet("/b").catch(() => undefined),
    ]);

    expect(getAuthToken()).toBeNull();
    expect(sessionInvalidCalls(dispatchSpy)).toHaveLength(1);
  });
});

describe("triggerSoc2Export via apiFetch", () => {
  beforeEach(() => {
    resetInMemoryToken();
    mockFetch.mockReset();
    vi.stubGlobal("window", {
      location: { search: "", pathname: "/", hash: "" },
      history: { replaceState: vi.fn() },
      dispatchEvent: vi.fn(),
      URL: {
        createObjectURL: vi.fn(() => "blob:mock-url"),
        revokeObjectURL: vi.fn(),
      },
      document: {
        createElement: vi.fn(() => ({
          href: "",
          download: "",
          click: vi.fn(),
        })),
        body: {
          appendChild: vi.fn(),
          removeChild: vi.fn(),
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends Authorization header when token is present", async () => {
    setAuthToken("export-token");
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: {
        get: (name: string) =>
          name.toLowerCase() === "content-type" ? "application/zip" : null,
      },
      blob: async () => new Blob(["zip-bytes"]),
    } as unknown as Response);

    await triggerSoc2Export();
    const init = mockFetch.mock.calls[0][1] as RequestInit;
    expect(authHeader(init)).toBe("Bearer export-token");
    expect(mockFetch.mock.calls[0][0] as string).toContain("/api/compliance/export");
  });

  it("surfaces ApiError on 401 without hanging", async () => {
    setAuthToken("bad-token");
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      headers: {
        get: () => "application/json",
      },
      json: async () => ({ message: "invalid token" }),
    } as unknown as Response);

    await expect(triggerSoc2Export()).rejects.toMatchObject({
      status: 401,
      message: "invalid token",
    });
    expect(getAuthToken()).toBeNull();
  });
});

describe("buildApiUrl", () => {
  beforeEach(() => {
    resetInMemoryToken();
    mockFetch.mockReset();
    delete process.env.NEXT_PUBLIC_LEDGERFUL_API_URL;
    vi.stubGlobal("window", {
      location: { search: "", pathname: "/", hash: "" },
      history: { replaceState: vi.fn() },
      dispatchEvent: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.NEXT_PUBLIC_LEDGERFUL_API_URL;
  });

  it("prepends NEXT_PUBLIC_LEDGERFUL_API_URL when set", async () => {
    process.env.NEXT_PUBLIC_LEDGERFUL_API_URL = "http://127.0.0.1:52001";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response);

    await apiGet("/status");
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("http://127.0.0.1:52001/api/status");
  });

  it("ignores ?token= query string for authentication", async () => {
    const token = "url-token-456";
    vi.stubGlobal("window", {
      location: { search: `?token=${token}`, pathname: "/", hash: "" },
      history: { replaceState: vi.fn() },
      dispatchEvent: vi.fn(),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response);

    await apiGet("/status");
    const init = mockFetch.mock.calls[0][1] as RequestInit;
    expect(authHeader(init)).toBeNull();
    expect(getAuthToken()).toBeNull();
  });
});

describe("domain wrappers with fallback", () => {
  beforeEach(() => {
    resetInMemoryToken();
    mockFetch.mockReset();
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_LEDGERFUL_USE_MOCK;
  });

  it("returns mock data with source=mock when NEXT_PUBLIC_LEDGERFUL_USE_MOCK is true", async () => {
    process.env.NEXT_PUBLIC_LEDGERFUL_USE_MOCK = "true";
    const result = await fetchDashboardData();
    expect(result.source).toBe("mock");
    // UI-derived: 100 - 3*5 - 2*10 = 65
    expect(result.data.health.score).toBe(65);
    expect(result.data.health.scoreDerived).toBe(true);
    expect(result.data.health.delta).toBeNull();
    expect(result.data.health.gateClean).toBe(false);
    expect(result.data.recentChanges.length).toBeGreaterThan(0);
  });

  it("falls back to mock on 5xx daemon error", async () => {
    mockFetch.mockRejectedValueOnce(new ApiError(503, "daemon offline"));
    const result = await fetchDashboardData();
    expect(result.source).toBe("mock");
    expect(result.data.health.score).toBe(65);
    expect(result.data.recentChanges.length).toBeGreaterThan(0);
  });

  it("falls back to mock on network TypeError", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const result = await fetchDashboardData();
    expect(result.source).toBe("mock");
    expect(result.data.health.score).toBe(65);
  });

  it("returns undefined with source=unavailable for a 404 ledger entry", async () => {
    mockFetch.mockRejectedValueOnce(new ApiError(404, "not found"));
    const result = await fetchLedgerEntry("missing-tx");
    expect(result.source).toBe("unavailable");
    expect(result.data).toBeUndefined();
  });

  it("does not fall back to mock on 4xx client errors", async () => {
    mockFetch.mockRejectedValueOnce(new ApiError(401, "bad token"));
    await expect(fetchDashboardData()).rejects.toThrow("bad token");
  });
});
