import { describe, it, expect, vi, beforeEach } from "vitest";
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

describe("Trends Data — Planned (track 0013)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the planned state synchronously (no fetch fires)", async () => {
    const result = await fetchTrendsData(90);
    expect(result.source).toBe("planned");
    expect(result.data).toEqual([]);
    expect(apiGet).not.toHaveBeenCalled();
  });

  it("returns the planned state regardless of days parameter", async () => {
    const result = await fetchTrendsData(30);
    expect(result.source).toBe("planned");
    expect(result.data).toEqual([]);
    expect(apiGet).not.toHaveBeenCalled();
  });

  it("never fires a request to /api/trends (guaranteed 404)", async () => {
    await fetchTrendsData(7);
    await fetchTrendsData(30);
    await fetchTrendsData(90);
    expect(apiGet).not.toHaveBeenCalled();
  });
});