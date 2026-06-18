import { SyncStatus } from "@/lib/types";

export async function fetchSyncStatus(): Promise<SyncStatus> {
  return {
    deviceId: "mock-device-id",
    lastExtractAt: new Date(Date.now() - 3600000).toISOString(),
    lastApplyAt: new Date(Date.now() - 7200000).toISOString(),
    lastRunAt: new Date(Date.now() - 1800000).toISOString(),
  };
}