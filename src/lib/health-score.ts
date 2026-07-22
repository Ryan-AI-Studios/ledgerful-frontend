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
