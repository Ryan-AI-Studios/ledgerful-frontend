import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { fetchHotspots } from "../api/hotspots";
import { fetchHotspots as fetchHotspotsData } from "../hotspots-data";
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

describe("Hotspots API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetchHotspots populates ranks if missing", async () => {
    const mockHotspots = [
      { id: "1", filePath: "src/a.ts", riskScore: 90 },
      { id: "2", filePath: "src/b.ts", riskScore: 80 },
    ];
    (apiGet as Mock).mockResolvedValueOnce(mockHotspots);
    
    const data = await fetchHotspots();
    expect(data[0].rank).toBe(1);
    expect(data[1].rank).toBe(2);
  });

  it("fetchHotspots preserves existing ranks", async () => {
    const mockHotspots = [
      { id: "1", filePath: "src/a.ts", riskScore: 90, rank: 5 },
    ];
    (apiGet as Mock).mockResolvedValueOnce(mockHotspots);
    
    const data = await fetchHotspots();
    expect(data[0].rank).toBe(5);
  });
});

describe("Hotspots Data Fallback", () => {
  it("fetchHotspotsData returns mock data on failure", async () => {
    const { ApiError } = await import("../api");
    (apiGet as Mock).mockRejectedValueOnce(new ApiError(500, "API Down"));
    const data = await fetchHotspotsData();
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty("riskScore");
  });
});
