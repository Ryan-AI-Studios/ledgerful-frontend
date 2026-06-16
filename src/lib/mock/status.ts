import { StatusResponse } from "@/lib/types";

export function fetchStatus(): Promise<StatusResponse> {
  return Promise.resolve({
    indexReady: true,
    graphReady: true,
    pendingTransactions: 2,
    unauditedDrift: 1,
    embeddingModelReachable: true,
    completionModelReachable: true,
  });
}
