import { apiGet } from "../api";
import { SyncStatus } from "@/lib/types";

// Coverage boundary: not in generated schema — feature-gated (see 0011 deferred). Hand-declared.
interface SyncStatusApiResponse {
  device_id: string | null;
  last_extract_at: string | null;
  last_apply_at: string | null;
  last_run_at: string | null;
}

export async function fetchSyncStatus(): Promise<SyncStatus> {
  const data = await apiGet<SyncStatusApiResponse>("/sync/status");
  if (!data || typeof data !== "object") {
    throw new Error("Invalid sync status response: expected object");
  }
  return {
    deviceId: data.device_id,
    lastExtractAt: data.last_extract_at,
    lastApplyAt: data.last_apply_at,
    lastRunAt: data.last_run_at,
  };
}
