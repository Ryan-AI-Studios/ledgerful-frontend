import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiGet, apiPost, ApiError, isApiError } from "./api";
import { fetchDashboardData } from "./data";
import { fetchLedgerEntry } from "./ledger-data";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("apiRequest", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal("window", {
      sessionStorage: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      location: { search: "" },
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
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/status"),
      { method: "GET" },
    );
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

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/ledger"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txId: "tx-1" }),
      },
    );
  });

  it("appends token from sessionStorage when present", async () => {
    const token = "test-token-123";
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(token);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response);

    await apiGet("/status");
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("token=test-token-123");
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
});

describe("buildApiUrl", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    delete process.env.NEXT_PUBLIC_LEDGERFUL_API_URL;
    vi.stubGlobal("window", {
      sessionStorage: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      location: { search: "" },
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

  it("reads token from URL query parameter on first load", async () => {
    const token = "url-token-456";
    vi.stubGlobal("window", {
      sessionStorage: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      location: { search: `?token=${token}` },
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response);

    await apiGet("/status");
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain(`token=${token}`);
  });
});

describe("domain wrappers with fallback", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_LEDGERFUL_USE_MOCK;
  });

  it("returns mock data when NEXT_PUBLIC_LEDGERFUL_USE_MOCK is true", async () => {
    process.env.NEXT_PUBLIC_LEDGERFUL_USE_MOCK = "true";
    const data = await fetchDashboardData();
    expect(data.health.score).toBe(61);
    expect(data.recentChanges.length).toBeGreaterThan(0);
  });

  it("falls back to mock on 5xx daemon error", async () => {
    mockFetch.mockRejectedValueOnce(new ApiError(503, "daemon offline"));
    const data = await fetchDashboardData();
    expect(data.health.score).toBe(61);
    expect(data.recentChanges.length).toBeGreaterThan(0);
  });

  it("falls back to mock on network TypeError", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const data = await fetchDashboardData();
    expect(data.health.score).toBe(61);
  });

  it("returns undefined for a 404 ledger entry", async () => {
    mockFetch.mockRejectedValueOnce(new ApiError(404, "not found"));
    const entry = await fetchLedgerEntry("missing-tx");
    expect(entry).toBeUndefined();
  });

  it("does not fall back to mock on 4xx client errors", async () => {
    mockFetch.mockRejectedValueOnce(new ApiError(401, "bad token"));
    await expect(fetchDashboardData()).rejects.toThrow("bad token");
  });
});
