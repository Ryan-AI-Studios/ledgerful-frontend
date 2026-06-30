import { fetchSession as fetchLiveSession } from "@/lib/api/session";
import { fetchSession as fetchMockSession } from "@/lib/mock/session";
import { withFallback, WithSource } from "@/lib/fallback";
import { UserSession } from "@/lib/types";

export async function fetchSession(): Promise<WithSource<UserSession>> {
  return withFallback(
    () => fetchLiveSession(),
    () => fetchMockSession(),
  );
}
