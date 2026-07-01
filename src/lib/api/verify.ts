import { apiGet } from "../api";
import {
  VerificationHealth,
  VerificationTrendPoint,
  VerificationStep,
} from "@/lib/types";
import type { ExtractResponse } from "./contract-types";

// Generated VerificationHealthResponse status is `string`; UI narrows to the known states.
type VerificationHealthWire = ExtractResponse<"/api/verify/health", "get">;

type VerificationHistoryWire = ExtractResponse<"/api/verify/history", "get">;

type VerificationStepsWire = ExtractResponse<"/api/verify/steps", "get">;

function normalizeVerificationStatus(status: string): VerificationHealth["status"] {
  if (status === "HEALTHY" || status === "DEGRADED" || status === "FAILING") return status;
  return "DEGRADED";
}

export async function fetchVerificationHealth(): Promise<VerificationHealth> {
  const data = await apiGet<VerificationHealthWire>("/verify/health");
  return {
    status: normalizeVerificationStatus(data.status),
    lastRunAt: data.lastRunAt ?? null,
    message: data.message ?? undefined,
  };
}

export async function fetchVerificationHistory(days = 90): Promise<VerificationTrendPoint[]> {
  const data = await apiGet<VerificationHistoryWire>("/verify/history", { days: String(days) });
  return data.map((point) => ({
    date: point.date,
    passed: point.passed,
    failed: point.failed,
  }));
}

export async function fetchVerificationSteps(): Promise<VerificationStep[]> {
  const data = await apiGet<VerificationStepsWire>("/verify/steps");
  return data.map((step) => ({
    id: step.id,
    name: step.name,
    lastRunAt: step.lastRunAt,
    averageDurationMs: step.averageDurationMs,
    passRatePercent: step.passRatePercent,
    recentFailures: step.recentFailures,
  }));
}
