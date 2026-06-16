import { fetchStatus as fetchLiveStatus } from "@/lib/api/status";
import { fetchStatus as fetchMockStatus } from "@/lib/mock/status";
import { shouldUseMock } from "@/lib/fallback";

export type { StatusResponse } from "@/lib/types";

export async function fetchStatus(): Promise<import("@/lib/types").StatusResponse> {
  // Status is a health surface: surfacing daemon failures is more useful than
  // silently substituting healthy mock data, so it stays live except when the
  // explicit mock-data mode is enabled.
  if (shouldUseMock()) return fetchMockStatus();
  return fetchLiveStatus();
}
