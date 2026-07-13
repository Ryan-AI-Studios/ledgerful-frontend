import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { fetchTrends as fetchLiveTrends } from "../api/trends";
import { fetchTrends as fetchTrendsData } from "../trends-data";
import { apiGet } from "../api";

vi.mock("../api", () => ({
  apiGet: vi.fn(),
  ApiError: class extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

describe("Trends API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetchTrends unwraps data array from TrendsResponse", async () => {
    const mockResponse = {
      data: [
        { date: "2026-07-01", score: 65, changes: 5, highRiskCount: 0 },
        { date: "2026-07-02", score: 72, changes: 8, highRiskCount: 1 },
      ],
    };
    (apiGet as Mock).mockResolvedValueOnce(mockResponse);

    const result = await fetchLiveTrends(90);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ date: "2026-07-01", score: 65, changes: 5, highRiskCount: 0 });
    expect(apiGet).toHaveBeenCalledWith("/trends", { days: "90" });
  });

  it("fetchTrends passes days parameter to the API", async () => {
    (apiGet as Mock).mockResolvedValueOnce({ data: [] });

    await fetchLiveTrends(30);
    expect(apiGet).toHaveBeenCalledWith("/trends", { days: "30" });
  });

  it("fetchTrends returns empty array when API returns empty data", async () => {
    (apiGet as Mock).mockResolvedValueOnce({ data: [] });

    const result = await fetchLiveTrends(7);
    expect(result).toEqual([]);
  });
});

describe("Trends Data Fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns live data with source 'live' on success", async () => {
    const mockResponse = {
      data: [
        { date: "2026-07-01", score: 50, changes: 3, highRiskCount: 0 },
      ],
    };
    (apiGet as Mock).mockResolvedValueOnce(mockResponse);

    const result = await fetchTrendsData(90);
    expect(result.source).toBe("live");
    expect(result.data).toHaveLength(1);
    expect(result.data[0].score).toBe(50);
  });

  it("returns mock data with source 'mock' on 500 error", async () => {
    const { ApiError } = await import("../api");
    (apiGet as Mock).mockRejectedValueOnce(new ApiError(500, "Server error"));

    const result = await fetchTrendsData(90);
    expect(result.source).toBe("mock");
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0]).toHaveProperty("score");
    expect(result.data[0]).toHaveProperty("date");
  });

  it("returns mock data on network error (TypeError)", async () => {
    (apiGet as Mock).mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const result = await fetchTrendsData(90);
    expect(result.source).toBe("mock");
    expect(result.data.length).toBeGreaterThan(0);
  });

  it("rethrows auth errors (401) without masking", async () => {
    const { ApiError } = await import("../api");
    (apiGet as Mock).mockRejectedValueOnce(new ApiError(401, "Unauthorized"));

    await expect(fetchTrendsData(90)).rejects.toThrow("Unauthorized");
  });

  it("returns mock data with correct count for days parameter", async () => {
    const { ApiError } = await import("../api");
    (apiGet as Mock).mockRejectedValueOnce(new ApiError(500, "Server error"));

    const result7 = await fetchTrendsData(7);
    expect(result7.data.length).toBeLessThanOrEqual(7);
    expect(result7.source).toBe("mock");
  });

  it("returns empty live data when API returns empty array", async () => {
    (apiGet as Mock).mockResolvedValueOnce({ data: [] });

    const result = await fetchTrendsData(90);
    expect(result.source).toBe("live");
    expect(result.data).toEqual([]);
  });

  it("returns mock data on 404 (endpoint not found / older daemon)", async () => {
    const { ApiError } = await import("../api");
    (apiGet as Mock).mockRejectedValueOnce(new ApiError(404, "Not Found"));

    const result = await fetchTrendsData(90);
    expect(result.source).toBe("mock");
    expect(result.data.length).toBeGreaterThan(0);
  });
});