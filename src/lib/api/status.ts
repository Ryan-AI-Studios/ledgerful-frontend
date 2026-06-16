import { apiGet } from "../api";
import { StatusResponse } from "@/lib/types";

interface StatusApiResponse {
  index_ready: boolean;
  graph_ready: boolean;
  pending_transactions: number;
  unaudited_drift: number;
  embedding_model_reachable: boolean;
  completion_model_reachable: boolean;
}

export async function fetchStatus(): Promise<StatusResponse> {
  const data = await apiGet<StatusApiResponse>("/status");
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
