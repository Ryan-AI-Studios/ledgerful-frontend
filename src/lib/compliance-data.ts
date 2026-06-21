import {
  fetchComplianceSummary as fetchLiveComplianceSummary,
  fetchSignatureEntries as fetchLiveSignatureEntries,
  triggerSoc2Export as triggerLiveSoc2Export
} from "@/lib/api/compliance";
import {
  fetchComplianceSummary as fetchMockComplianceSummary,
  fetchSignatureEntries as fetchMockSignatureEntries,
  triggerSoc2Export as triggerMockSoc2Export
} from "@/lib/mock/compliance";
import { withFallback, shouldUseMock } from "@/lib/fallback";
import { ComplianceSummary, SignatureEntry } from "@/lib/types";

export async function fetchComplianceSummary(): Promise<ComplianceSummary> {
  return withFallback(
    () => fetchLiveComplianceSummary(),
    () => fetchMockComplianceSummary(),
  );
}

export async function fetchSignatureEntries(): Promise<SignatureEntry[]> {
  return withFallback(
    () => fetchLiveSignatureEntries(),
    () => fetchMockSignatureEntries(),
  );
}

export async function triggerSoc2Export(): Promise<void> {
  if (shouldUseMock()) {
    return triggerMockSoc2Export();
  }
  try {
    return await triggerLiveSoc2Export();
  } catch (err) {
    if (err instanceof TypeError) {
      return triggerMockSoc2Export();
    }
    throw err;
  }
}
