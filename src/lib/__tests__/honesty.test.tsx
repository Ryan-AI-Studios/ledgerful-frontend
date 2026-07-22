import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { normalizeRiskLevel, normalizeHotspotRiskLevel } from "@/lib/risk";
import { computeUiHealthScore } from "@/lib/health-score";
import { ComplianceSummaryCards } from "@/components/ComplianceSummaryCards";
import type { ComplianceSummary } from "@/lib/types";
import { fetchDashboardData as fetchLiveDashboard } from "@/lib/api/dashboard";
import { ApiError } from "@/lib/api";

// --- Risk normalizer ---

describe("normalizeRiskLevel (shared)", () => {
  it("maps known levels case-insensitively", () => {
    expect(normalizeRiskLevel("high")).toBe("HIGH");
    expect(normalizeRiskLevel("MEDIUM")).toBe("MEDIUM");
    expect(normalizeRiskLevel("low")).toBe("LOW");
    expect(normalizeRiskLevel("trivial")).toBe("TRIVIAL");
  });

  it("returns UNKNOWN for missing/null/empty — never LOW", () => {
    expect(normalizeRiskLevel(null)).toBe("UNKNOWN");
    expect(normalizeRiskLevel(undefined)).toBe("UNKNOWN");
    expect(normalizeRiskLevel("")).toBe("UNKNOWN");
  });

  it("returns UNKNOWN for unrecognized strings", () => {
    expect(normalizeRiskLevel("critical")).toBe("UNKNOWN");
    expect(normalizeRiskLevel("wat")).toBe("UNKNOWN");
  });
});

describe("normalizeHotspotRiskLevel", () => {
  it("maps CRITICAL to HIGH", () => {
    expect(normalizeHotspotRiskLevel("CRITICAL")).toBe("HIGH");
  });

  it("maps missing/unknown to UNKNOWN — never invents MEDIUM", () => {
    expect(normalizeHotspotRiskLevel(null)).toBe("UNKNOWN");
    expect(normalizeHotspotRiskLevel(undefined)).toBe("UNKNOWN");
    expect(normalizeHotspotRiskLevel("")).toBe("UNKNOWN");
    expect(normalizeHotspotRiskLevel("weird")).toBe("UNKNOWN");
  });

  it("passes through known levels", () => {
    expect(normalizeHotspotRiskLevel("HIGH")).toBe("HIGH");
    expect(normalizeHotspotRiskLevel("medium")).toBe("MEDIUM");
    expect(normalizeHotspotRiskLevel("LOW")).toBe("LOW");
  });
});

// --- Health score ---

describe("computeUiHealthScore", () => {
  it("matches the documented formula", () => {
    expect(computeUiHealthScore(0, 0)).toBe(100);
    expect(computeUiHealthScore(3, 2)).toBe(65); // 100 - 15 - 20
    expect(computeUiHealthScore(30, 10)).toBe(0); // clamped
  });
});

// --- ADR three-state (FE-H0) ---

const baseSummary: ComplianceSummary = {
  totalSigned: 10,
  validityPercent: 100,
  hotspotDeltaPercent: -5,
  lastAuditAt: "2026-01-01T00:00:00Z",
};

describe("ComplianceSummaryCards ADR three-state", () => {
  it("omits ADR card when field is absent on live-shaped data", () => {
    const summary = { ...baseSummary };
    // ensure key is truly absent
    delete (summary as { oldestUnaddressedAdr?: unknown }).oldestUnaddressedAdr;

    render(<ComplianceSummaryCards summary={summary} source="live" />);
    expect(screen.queryByText("Oldest ADR")).not.toBeInTheDocument();
    expect(screen.queryByText("All ADRs addressed")).not.toBeInTheDocument();
  });

  it("shows warning card when ADR is present", () => {
    const summary: ComplianceSummary = {
      ...baseSummary,
      oldestUnaddressedAdr: {
        id: "ADR-001",
        title: "Use Cozo",
        createdAt: "2026-01-01",
        status: "PROPOSED",
      },
    };
    render(<ComplianceSummaryCards summary={summary} source="live" />);
    expect(screen.getByText("Oldest ADR")).toBeInTheDocument();
    expect(screen.getByText("ADR-001")).toBeInTheDocument();
    expect(screen.getByText("Use Cozo")).toBeInTheDocument();
  });

  it("shows None (not false success) when key is defined but empty", () => {
    const summary: ComplianceSummary = {
      ...baseSummary,
      oldestUnaddressedAdr: undefined,
    };
    // Object has the key defined as undefined
    expect("oldestUnaddressedAdr" in summary).toBe(true);

    render(<ComplianceSummaryCards summary={summary} source="live" />);
    expect(screen.getByText("Oldest ADR")).toBeInTheDocument();
    expect(screen.getByText("None")).toBeInTheDocument();
    expect(screen.queryByText("All ADRs addressed")).not.toBeInTheDocument();
  });

  it("shows ADR card under mock source even with empty ADR", () => {
    const summary: ComplianceSummary = { ...baseSummary };
    render(<ComplianceSummaryCards summary={summary} source="mock" />);
    expect(screen.getByText("Oldest ADR")).toBeInTheDocument();
  });
});

// --- Dashboard mapper honesty ---

describe("dashboard mapper honesty", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset();
    delete process.env.NEXT_PUBLIC_LEDGERFUL_USE_MOCK;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses shared score, delta null, gateClean not verified, UNKNOWN risk when missing", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        pending_transactions: 2,
        unaudited_drift: 1,
        // overall_risk omitted → UNKNOWN
        recent_changes: [
          { path: "a.ts", author: "x", risk: null },
        ],
      }),
    } as Response);

    const data = await fetchLiveDashboard();
    expect(data.health.score).toBe(computeUiHealthScore(2, 1));
    expect(data.health.delta).toBeNull();
    expect(data.health.scoreDerived).toBe(true);
    expect(data.health.gateClean).toBe(false);
    expect(data.health).not.toHaveProperty("verified");
    expect(data.health.currentRisk).toBe("UNKNOWN");
    expect(data.recentChanges[0].risk).toBe("UNKNOWN");
  });

  it("rethrows on API errors rather than inventing defaults", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "err",
      json: async () => ({ message: "boom" }),
    } as Response);

    await expect(fetchLiveDashboard()).rejects.toBeInstanceOf(ApiError);
  });
});
