import { apiGet } from "../api";
import { VerificationHealth, VerificationTrendPoint, VerificationStep } from "@/lib/types";

export async function fetchVerificationHealth(): Promise<VerificationHealth> {
  return await apiGet<VerificationHealth>("/verify/health");
}

export async function fetchVerificationHistory(days = 90): Promise<VerificationTrendPoint[]> {
  return await apiGet<VerificationTrendPoint[]>("/verify/history", { days: String(days) });
}

export async function fetchVerificationSteps(): Promise<VerificationStep[]> {
  return await apiGet<VerificationStep[]>("/verify/steps");
}
