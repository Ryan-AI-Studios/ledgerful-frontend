import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { fetchTrends } from "../api/trends";
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

  it("fetchTrends calls the correct endpoint with default days", async () => {
    (apiGet as Mock).mockResolvedValueOnce([]);
    await fetchTrends();
    expect(apiGet).toHaveBeenCalledWith("/trends", { days: "90" });
  });

  it("fetchTrends calls the correct endpoint with custom days", async () => {
    (apiGet as Mock).mockResolvedValueOnce([]);
    await fetchTrends(30);
    expect(apiGet).toHaveBeenCalledWith("/trends", { days: "30" });
  });
});

describe("Trends Data Fallback", () => {
  it("fetchTrendsData returns live data with source", async () => {
    const mockData = [{ date: "2026-06-16", score: 85, changes: 5, highRiskCount: 0 }];
    (apiGet as Mock).mockResolvedValueOnce(mockData);
    
    const result = await fetchTrendsData(30);
    expect(result.source).toBe("live");
    expect(result.data).toEqual(mockData);
  });

  it("fetchTrendsData falls back to mock data with source", async () => {
    const { ApiError } = await import("../api");
    (apiGet as Mock).mockRejectedValueOnce(new ApiError(500, "Network Error"));
    
    const result = await fetchTrendsData(30);
    expect(result.source).toBe("mock");
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0]).toHaveProperty("score");
  });
});
