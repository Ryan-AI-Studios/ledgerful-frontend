import { apiGet } from "../api";
import { VerificationHealth, VerificationTrendPoint, VerificationStep } from "@/lib/types";

export async function fetchVerificationHealth(): Promise<VerificationHealth> {
  return await apiGet<VerificationHealth>("/verify/health");
}

export async function fetchVerificationHistory(): Promise<VerificationTrendPoint[]> {
  return await apiGet<VerificationTrendPoint[]>("/verify/history");
}

export async function fetchVerificationSteps(): Promise<VerificationStep[]> {
  return await apiGet<VerificationStep[]>("/verify/steps");
}
