import { 
  fetchVerificationHealth as fetchLiveVerificationHealth,
  fetchVerificationHistory as fetchLiveVerificationHistory,
  fetchVerificationSteps as fetchLiveVerificationSteps
} from "@/lib/api/verify";
import { 
  MOCK_VERIFICATION_HEALTH,
  MOCK_VERIFICATION_HISTORY,
  MOCK_VERIFICATION_STEPS
} from "@/lib/mock/verify";
import { withFallback } from "@/lib/fallback";
import { VerificationHealth, VerificationTrendPoint, VerificationStep } from "@/lib/types";

export async function fetchVerificationHealth(): Promise<VerificationHealth> {
  return withFallback(
    () => fetchLiveVerificationHealth(),
    async () => MOCK_VERIFICATION_HEALTH,
  );
}

export async function fetchVerificationHistory(): Promise<VerificationTrendPoint[]> {
  return withFallback(
    () => fetchLiveVerificationHistory(),
    async () => MOCK_VERIFICATION_HISTORY,
  );
}

export async function fetchVerificationSteps(): Promise<VerificationStep[]> {
  return withFallback(
    () => fetchLiveVerificationSteps(),
    async () => MOCK_VERIFICATION_STEPS,
  );
}
