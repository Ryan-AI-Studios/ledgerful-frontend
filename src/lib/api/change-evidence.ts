import { apiGet, isApiError } from "../api";
import {
  decodeEvidencePacket,
  type BaselineCandidate,
  type EvidenceKey,
  type EvidencePacket,
} from "./change-evidence-decoder";
import type { ExtractQuery } from "./contract-types";

type EvidenceQuery = ExtractQuery<"/api/change-evidence", "get">;
type RequestError = "unauthorized" | "timeout" | "invalid" | "missing" | "budget"
  | "disabled" | "uninitialized" | "unsupported" | "busy" | "scope" | "rate-limited" | "error";

export type EvidenceRequestState =
  | { status: "ready"; packet: EvidencePacket }
  | { status: RequestError };

function problemReason(info: unknown, status: number): unknown {
  if (!info || typeof info !== "object" ||
    !("status" in info) || info.status !== status ||
    !("type" in info) || info.type !== "about:blank" ||
    !("title" in info) || typeof info.title !== "string" ||
    !("reasonCode" in info)) return;
  return info.reasonCode;
}

function requestError(error: unknown): RequestError {
  if (error instanceof Error && error.name === "TimeoutError") return "timeout";
  if (!isApiError(error)) return "error";
  if (error.status === 401 || error.status === 403) return "unauthorized";
  if (error.status === 429) return "rate-limited";
  if (error.status === 200) return "invalid";
  const reason = problemReason(error.info, error.status);
  if (error.status === 404 && reason === "pair-not-found") return "missing";
  if (error.status === 503) {
    switch (reason) {
      case "disabled": return "disabled";
      case "uninitialized": return "uninitialized";
      case "schema-incompatible": return "unsupported";
      case "scope-unavailable": return "scope";
      case "request-budget": return "budget";
      case "storage-busy":
      case "worker-saturated": return "busy";
    }
  }
  return "error";
}

export async function fetchChangeEvidence(
  key: EvidenceKey,
  baseline: BaselineCandidate | undefined,
  signal: AbortSignal,
): Promise<EvidenceRequestState> {
  // Reconstruct the fixed query; never forward additive payload fields.
  const query: EvidenceQuery = {
    repoScope: key.repoScope,
    head: key.head,
    base: key.base,
    baselineName: baseline?.name,
    baselineDigest: baseline?.payloadDigest,
  };

  try {
    const value = await apiGet<unknown>("/change-evidence", query, { signal, strictJson: true });
    const packet = decodeEvidencePacket(value, key, baseline);
    return packet ? { status: "ready", packet } : { status: "invalid" };
  } catch (error) {
    signal.throwIfAborted();
    return { status: requestError(error) };
  }
}
