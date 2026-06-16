import { fetchChanges as fetchLiveChanges } from "@/lib/api/changes";
import { fetchChanges as fetchMockChanges } from "@/lib/mock/changes";
import { withFallback } from "@/lib/fallback";

export type { ChangeEntry } from "@/lib/types";

export async function fetchChanges(days = 7): Promise<import("@/lib/types").ChangeEntry[]> {
  return withFallback(
    () => fetchLiveChanges(days),
    () => fetchMockChanges(days),
  );
}
