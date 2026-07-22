import type { RiskLevel } from "./types";

/** Dashboard/ledger/changes risk after normalization. Missing/unknown ≠ LOW. */
export type NormalizedRisk = RiskLevel | "UNKNOWN";

/**
 * Shared risk normalizer for changes, dashboard, and ledger mappers.
 * Null/empty/unrecognized strings become `"UNKNOWN"` — never silently LOW.
 */
export function normalizeRiskLevel(
  risk: string | null | undefined,
): NormalizedRisk {
  if (risk == null || risk === "") return "UNKNOWN";
  const upper = risk.trim().toUpperCase();
  if (
    upper === "HIGH" ||
    upper === "MEDIUM" ||
    upper === "LOW" ||
    upper === "TRIVIAL"
  ) {
    return upper;
  }
  return "UNKNOWN";
}

/**
 * Hotspot wire may emit CRITICAL (not in dashboard RiskLevel).
 * Maps CRITICAL → HIGH; missing/unrecognized → UNKNOWN (never invent MEDIUM).
 */
export function normalizeHotspotRiskLevel(
  risk: string | null | undefined,
): NormalizedRisk {
  if (risk == null || risk === "") return "UNKNOWN";
  const upper = risk.trim().toUpperCase();
  if (upper === "CRITICAL") return "HIGH";
  return normalizeRiskLevel(risk);
}
