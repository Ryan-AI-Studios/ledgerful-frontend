import type { DaemonEvent, ProjectHealth, StatusResponse } from "@/lib/types";

/**
 * UI-derived gate score from pending transactions and unaudited drift.
 * Not cryptographic verification — label as "UI-derived" in the product UI.
 */
export function computeUiHealthScore(pending: number, drift: number): number {
  return Math.max(0, 100 - pending * 5 - drift * 10);
}

/** Formula text aligned with computeUiHealthScore for the explain modal. */
export const UI_HEALTH_SCORE_FORMULA = [
  "score = 100",
  "  - (pending_transactions × 5)",
  "  - (unaudited_drift × 10)",
  "clamped to [0, 100]",
  "",
  "This is a UI-derived gate posture score, not cryptographic verification.",
] as const;

/**
 * Overlay SSE DaemonEvent pending/drift onto REST-fetched ProjectHealth.
 * Keeps currentRisk, delta, and scoreDerived from the original snapshot
 * (event has no risk/delta fields). Score and gateClean are recomputed.
 */
export function mergeHealthWithDaemonEvent(
  health: ProjectHealth,
  event: DaemonEvent | null | undefined,
): ProjectHealth {
  if (!event) return health;
  const pendingCount = event.pendingTransactions;
  const driftCount = event.unauditedDrift;
  return {
    ...health,
    pendingCount,
    driftCount,
    score: computeUiHealthScore(pendingCount, driftCount),
    gateClean: pendingCount === 0 && driftCount === 0,
  };
}

/**
 * Overlay SSE DaemonEvent ledger/readiness fields onto REST StatusResponse.
 * Model reachability stays from the last REST fetch (not on DaemonEvent).
 */
export function mergeStatusWithDaemonEvent(
  data: StatusResponse,
  event: DaemonEvent | null | undefined,
): StatusResponse {
  if (!event) return data;
  return {
    ...data,
    pendingTransactions: event.pendingTransactions,
    unauditedDrift: event.unauditedDrift,
    indexReady: event.indexReady,
    graphReady: event.graphReady,
  };
}
