import { apiGet } from "../api";
import { SyncStatus } from "@/lib/types";
import type { ExtractResponse } from "./contract-types";

type SyncStatusWire = ExtractResponse<"/api/sync/status", "get">;

export async function fetchSyncStatus(): Promise<SyncStatus> {
  const data = await apiGet<SyncStatusWire>("/sync/status");
  if (!data || typeof data !== "object") {
    throw new Error("Invalid sync status response: expected object");
  }
  return {
    deviceId: data.device_id ?? null,
    lastExtractAt: data.last_extract_at ?? null,
    lastApplyAt: data.last_apply_at ?? null,
    lastRunAt: data.last_run_at ?? null,
  };
}