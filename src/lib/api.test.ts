import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiGet, apiPost, ApiError, isApiError } from "./api";
import { fetchDashboardData } from "./data";
import { fetchLedgerEntry } from "./ledger-data";
import { resetInMemoryToken } from "./utils";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("apiRequest", () => {
  beforeEach(() => {
    resetInMemoryToken();
    mockFetch.mockReset();
    vi.stubGlobal("window", {
      location: { search: "", pathname: "/", hash: "" },
      history: { replaceState: vi.fn() },
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
    expect(init.headers).toEqual(
      expect.objectContaining({ "Content-Type": "application/json" }),
    );
  });

  it("sends Authorization header from in-memory token", async () => {
    const token = "test-token-123";
    vi.stubGlobal("window", {
      location: { search: `?token=${token}`, pathname: "/", hash: "" },
      history: { replaceState: vi.fn() },
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response);

    await apiGet("/status");
    const init = mockFetch.mock.calls[0][1] as RequestInit;
    expect(init.headers).toEqual(
      expect.objectContaining({ Authorization: `Bearer ${token}` }),
    );
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

  it("does not append token to URL", async () => {
    const token = "url-token-456";
    vi.stubGlobal("window", {
      location: { search: `?token=${token}`, pathname: "/", hash: "" },
      history: { replaceState: vi.fn() },
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response);

    await apiGet("/status");
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).not.toContain("token=");
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

  it("reads token from URL query parameter on first load and sends header", async () => {
    const token = "url-token-456";
    vi.stubGlobal("window", {
      location: { search: `?token=${token}`, pathname: "/", hash: "" },
      history: { replaceState: vi.fn() },
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response);

    await apiGet("/status");
    const init = mockFetch.mock.calls[0][1] as RequestInit;
    expect(init.headers).toEqual(
      expect.objectContaining({ Authorization: `Bearer ${token}` }),
    );
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
    expect(result.data.health.score).toBe(61);
    expect(result.data.recentChanges.length).toBeGreaterThan(0);
  });

  it("falls back to mock on 5xx daemon error", async () => {
    mockFetch.mockRejectedValueOnce(new ApiError(503, "daemon offline"));
    const result = await fetchDashboardData();
    expect(result.source).toBe("mock");
    expect(result.data.health.score).toBe(61);
    expect(result.data.recentChanges.length).toBeGreaterThan(0);
  });

  it("falls back to mock on network TypeError", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const result = await fetchDashboardData();
    expect(result.source).toBe("mock");
    expect(result.data.health.score).toBe(61);
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
