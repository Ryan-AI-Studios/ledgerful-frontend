import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { fetchComplianceSummary, fetchSignatureEntries } from "../api/compliance";
import { fetchComplianceSummary as fetchComplianceSummaryData } from "../compliance-data";
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

describe("Compliance API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetchComplianceSummary calls the correct endpoint", async () => {
    (apiGet as Mock).mockResolvedValueOnce({});
    await fetchComplianceSummary();
    expect(apiGet).toHaveBeenCalledWith("/compliance/summary");
  });

  it("fetchSignatureEntries calls the correct endpoint", async () => {
    (apiGet as Mock).mockResolvedValueOnce([]);
    await fetchSignatureEntries();
    expect(apiGet).toHaveBeenCalledWith("/compliance/signatures");
  });
});

describe("Compliance Data Logic", () => {
  it("fetchComplianceSummaryData handles success", async () => {
    const mockSummary = { validityPercent: 95 };
    (apiGet as Mock).mockResolvedValueOnce(mockSummary);
    const data = await fetchComplianceSummaryData();
    expect(data.validityPercent).toBe(95);
  });

  it("fetchComplianceSummaryData handles fallback", async () => {
    const { ApiError } = await import("../api");
    (apiGet as Mock).mockRejectedValueOnce(new ApiError(500, "Timeout"));
    const data = await fetchComplianceSummaryData();
    expect(data).toHaveProperty("validityPercent");
  });
});
