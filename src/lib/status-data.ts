import { fetchStatus as fetchLiveStatus } from "@/lib/api/status";
import { fetchStatus as fetchMockStatus } from "@/lib/mock/status";
import { shouldUseMock, WithSource } from "@/lib/fallback";
import type { StatusResponse } from "@/lib/types";

export type { StatusResponse } from "@/lib/types";

/**
 * Status is a health surface: when mock mode is off, live failures rethrow
 * (fail-loud on 5xx). When mock mode is on, return mock with source tag.
 * DaemonStatusContext only needs connectivity; source is optional there.
 */
export async function fetchStatus(): Promise<WithSource<StatusResponse>> {
  if (shouldUseMock()) {
    return { data: await fetchMockStatus(), source: "mock" };
  }
  return { data: await fetchLiveStatus(), source: "live" };
}
