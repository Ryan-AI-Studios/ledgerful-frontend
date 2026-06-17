import { describe, it, expect } from "vitest";
import { calculatePassRate, getSparklinePoints, getAggregateHealth } from "../verify-utils";
import { VerificationTrendPoint, VerificationStep } from "../types";

describe("verify-logic", () => {
  describe("calculatePassRate", () => {
    it("calculates correct pass rate", () => {
      expect(calculatePassRate(90, 10)).toBe(90);
      expect(calculatePassRate(100, 0)).toBe(100);
      expect(calculatePassRate(0, 100)).toBe(0);
      expect(calculatePassRate(1, 1)).toBe(50);
    });

    it("returns 100 when there are no runs", () => {
      expect(calculatePassRate(0, 0)).toBe(100);
    });
  });

  describe("getSparklinePoints", () => {
    const mockData: VerificationTrendPoint[] = [
      { date: "2026-06-01", passed: 10, failed: 0 },
      { date: "2026-06-02", passed: 20, failed: 5 },
    ];

    it("generates correct points string", () => {
      const width = 100;
      const height = 100;
      const paddingY = 10;
      
      // maxTotal = 20
      // stepX = 100 / (2-1) = 100
      
      // Point 0 (passed: 10): x=0, y = 100 - 10 - (10/20)*(100-20) = 90 - 0.5*80 = 50
      // Point 1 (passed: 20): x=100, y = 100 - 10 - (20/20)*(100-20) = 90 - 1*80 = 10
      
      const points = getSparklinePoints(mockData, "passed", width, height, paddingY);
      expect(points).toBe("0,50 100,10");
    });

    it("returns empty string for empty data", () => {
      expect(getSparklinePoints([], "passed", 100, 100)).toBe("");
    });
  });

  describe("getAggregateHealth", () => {
    it("returns HEALTHY when all steps have high pass rates", () => {
      const steps: VerificationStep[] = [
        { id: "1", name: "S1", lastRunAt: "", averageDurationMs: 0, passRatePercent: 99, recentFailures: 0 },
        { id: "2", name: "S2", lastRunAt: "", averageDurationMs: 0, passRatePercent: 96, recentFailures: 0 },
      ];
      expect(getAggregateHealth(steps)).toBe("HEALTHY");
    });

    it("returns DEGRADED when any step is between 80% and 95%", () => {
      const steps: VerificationStep[] = [
        { id: "1", name: "S1", lastRunAt: "", averageDurationMs: 0, passRatePercent: 99, recentFailures: 0 },
        { id: "2", name: "S2", lastRunAt: "", averageDurationMs: 0, passRatePercent: 90, recentFailures: 0 },
      ];
      expect(getAggregateHealth(steps)).toBe("DEGRADED");
    });

    it("returns FAILING when any step is below 80%", () => {
      const steps: VerificationStep[] = [
        { id: "1", name: "S1", lastRunAt: "", averageDurationMs: 0, passRatePercent: 99, recentFailures: 0 },
        { id: "2", name: "S2", lastRunAt: "", averageDurationMs: 0, passRatePercent: 75, recentFailures: 0 },
      ];
      expect(getAggregateHealth(steps)).toBe("FAILING");
    });

    it("returns HEALTHY for no steps", () => {
      expect(getAggregateHealth([])).toBe("HEALTHY");
    });
  });
});
