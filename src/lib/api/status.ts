import { apiGet } from "../api";
import { StatusResponse } from "@/lib/types";
import type { ExtractResponse } from "./contract-types";

type StatusWire = ExtractResponse<"/api/status", "get">;

export async function fetchStatus(): Promise<StatusResponse> {
  const data = await apiGet<StatusWire>("/status");
  if (!data || typeof data !== "object") {
    throw new Error("Invalid status response: expected object");
  }
  return {
    indexReady: data.index_ready,
    graphReady: data.graph_ready,
    pendingTransactions: data.pending_transactions,
    unauditedDrift: data.unaudited_drift,
    embeddingModelReachable: data.embedding_model_reachable,
    completionModelReachable: data.completion_model_reachable,
  };
}
