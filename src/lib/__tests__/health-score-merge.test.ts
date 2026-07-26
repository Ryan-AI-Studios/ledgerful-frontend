import { describe, it, expect } from "vitest";
import {
  computeUiHealthScore,
  mergeHealthWithDaemonEvent,
  mergeStatusWithDaemonEvent,
} from "@/lib/health-score";
import type { DaemonEvent, ProjectHealth, StatusResponse } from "@/lib/types";

const baseHealth: ProjectHealth = {
  score: 100,
  delta: 2,
  gateClean: true,
  driftCount: 0,
  pendingCount: 0,
  currentRisk: "LOW",
  scoreDerived: true,
};

const event: DaemonEvent = {
  pendingTransactions: 3,
  unauditedDrift: 2,
  indexReady: true,
  graphReady: false,
};

describe("mergeHealthWithDaemonEvent", () => {
  it("returns health unchanged when event is null/undefined", () => {
    expect(mergeHealthWithDaemonEvent(baseHealth, null)).toBe(baseHealth);
    expect(mergeHealthWithDaemonEvent(baseHealth, undefined)).toBe(baseHealth);
  });

  it("overlays pending/drift and recomputes score and gateClean", () => {
    const merged = mergeHealthWithDaemonEvent(baseHealth, event);
    expect(merged.pendingCount).toBe(3);
    expect(merged.driftCount).toBe(2);
    expect(merged.score).toBe(computeUiHealthScore(3, 2));
    expect(merged.gateClean).toBe(false);
    // Preserved from original
    expect(merged.currentRisk).toBe("LOW");
    expect(merged.delta).toBe(2);
    expect(merged.scoreDerived).toBe(true);
  });

  it("sets gateClean true when event clears pending and drift", () => {
    const dirty: ProjectHealth = {
      ...baseHealth,
      pendingCount: 5,
      driftCount: 1,
      gateClean: false,
      score: computeUiHealthScore(5, 1),
    };
    const clear: DaemonEvent = {
      pendingTransactions: 0,
      unauditedDrift: 0,
      indexReady: true,
      graphReady: true,
    };
    const merged = mergeHealthWithDaemonEvent(dirty, clear);
    expect(merged.pendingCount).toBe(0);
    expect(merged.driftCount).toBe(0);
    expect(merged.score).toBe(100);
    expect(merged.gateClean).toBe(true);
  });
});

describe("mergeStatusWithDaemonEvent", () => {
  const baseStatus: StatusResponse = {
    indexReady: true,
    graphReady: true,
    pendingTransactions: 0,
    unauditedDrift: 0,
    embeddingModelReachable: true,
    completionModelReachable: false,
  };

  it("returns status unchanged when event is null", () => {
    expect(mergeStatusWithDaemonEvent(baseStatus, null)).toBe(baseStatus);
  });

  it("overlays ledger counts and readiness; keeps model reachability", () => {
    const merged = mergeStatusWithDaemonEvent(baseStatus, event);
    expect(merged.pendingTransactions).toBe(3);
    expect(merged.unauditedDrift).toBe(2);
    expect(merged.indexReady).toBe(true);
    expect(merged.graphReady).toBe(false);
    expect(merged.embeddingModelReachable).toBe(true);
    expect(merged.completionModelReachable).toBe(false);
  });
});
