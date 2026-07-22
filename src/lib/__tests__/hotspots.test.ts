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
      { id: "1", filePath: "src/a.ts", riskScore: 90, riskLevel: "HIGH", changeCount: 1 },
      { id: "2", filePath: "src/b.ts", riskScore: 80, riskLevel: "MEDIUM", changeCount: 1 },
    ];
    (apiGet as Mock).mockResolvedValueOnce(mockHotspots);

    const data = await fetchHotspots();
    expect(data[0].rank).toBe(1);
    expect(data[1].rank).toBe(2);
  });

  it("fetchHotspots preserves existing ranks", async () => {
    const mockHotspots = [
      { id: "1", filePath: "src/a.ts", riskScore: 90, riskLevel: "HIGH", rank: 5, changeCount: 1 },
    ];
    (apiGet as Mock).mockResolvedValueOnce(mockHotspots);

    const data = await fetchHotspots();
    expect(data[0].rank).toBe(5);
  });

  it("maps missing risk to UNKNOWN and preserves null lastTouchedAt", async () => {
    const mockHotspots = [
      {
        id: "1",
        filePath: "src/a.ts",
        riskScore: 90,
        // riskLevel omitted / empty
        riskLevel: "",
        lastTouchedAt: null,
        changeCount: 3,
      },
    ];
    (apiGet as Mock).mockResolvedValueOnce(mockHotspots);

    const data = await fetchHotspots();
    expect(data[0].riskLevel).toBe("UNKNOWN");
    expect(data[0].lastTouchedAt).toBeNull();
  });

  it("maps CRITICAL risk to HIGH", async () => {
    (apiGet as Mock).mockResolvedValueOnce([
      {
        id: "1",
        filePath: "src/a.ts",
        riskScore: 99,
        riskLevel: "CRITICAL",
        lastTouchedAt: "2026-01-01T00:00:00Z",
        changeCount: 10,
      },
    ]);

    const data = await fetchHotspots();
    expect(data[0].riskLevel).toBe("HIGH");
    expect(data[0].lastTouchedAt).toBe("2026-01-01T00:00:00Z");
  });
});

describe("Hotspots Data Fallback", () => {
  it("fetchHotspotsData returns mock data with source on failure", async () => {
    const { ApiError } = await import("../api");
    (apiGet as Mock).mockRejectedValueOnce(new ApiError(500, "API Down"));
    const result = await fetchHotspotsData();
    expect(result.source).toBe("mock");
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0]).toHaveProperty("riskScore");
  });
});
