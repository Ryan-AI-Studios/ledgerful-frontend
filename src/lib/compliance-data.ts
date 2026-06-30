import {
  fetchComplianceSummary as fetchLiveComplianceSummary,
  fetchSignatureEntries as fetchLiveSignatureEntries,
  triggerSoc2Export as triggerLiveSoc2Export
} from "@/lib/api/compliance";
import {
  fetchComplianceSummary as fetchMockComplianceSummary,
  fetchSignatureEntries as fetchMockSignatureEntries
} from "@/lib/mock/compliance";
import { withFallback, shouldUseMock, WithSource } from "@/lib/fallback";
import { ComplianceSummary, SignatureEntry } from "@/lib/types";

export async function fetchComplianceSummary(): Promise<WithSource<ComplianceSummary>> {
  return withFallback(
    () => fetchLiveComplianceSummary(),
    () => fetchMockComplianceSummary(),
  );
}

export async function fetchSignatureEntries(): Promise<WithSource<SignatureEntry[]>> {
  return withFallback(
    () => fetchLiveSignatureEntries(),
    () => fetchMockSignatureEntries(),
  );
}

export async function triggerSoc2Export(): Promise<void> {
  if (shouldUseMock()) {
    throw new Error("SOC2 export is not available in mock mode");
  }
  return triggerLiveSoc2Export();
}
