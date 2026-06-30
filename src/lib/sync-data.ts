import { fetchSyncStatus as fetchLiveSyncStatus } from "@/lib/api/sync";
import { fetchSyncStatus as fetchMockSyncStatus } from "@/lib/mock/sync";
import { withFallback, WithSource } from "@/lib/fallback";

export type { SyncStatus } from "@/lib/types";

export async function fetchSyncStatus(): Promise<WithSource<import("@/lib/types").SyncStatus>> {
  return withFallback(() => fetchLiveSyncStatus(), () => fetchMockSyncStatus());
}