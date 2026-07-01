import { apiGet, ApiError } from "../api";
import { ComplianceSummary, SignatureEntry } from "@/lib/types";
import { buildApiUrl } from "../utils";
import type { ExtractResponse } from "./contract-types";

// ComplianceSummaryResponse matches the UI type directly (some mock-only fields are absent live).
type ComplianceSummaryWire = ExtractResponse<"/api/compliance/summary", "get">;

type SignatureEntriesWire = ExtractResponse<"/api/compliance/signatures", "get">;

export async function fetchComplianceSummary(): Promise<ComplianceSummary> {
  return await apiGet<ComplianceSummaryWire>("/compliance/summary");
}

function normalizeSignatureStatus(status: string): SignatureEntry["status"] {
  if (status === "VALID" || status === "INVALID" || status === "SKIPPED") return status;
  return "INVALID";
}

export async function fetchSignatureEntries(): Promise<SignatureEntry[]> {
  const data = await apiGet<SignatureEntriesWire>("/compliance/signatures");
  return data.map((entry) => ({
    txId: entry.txId,
    entity: entry.entity,
    summary: entry.summary,
    committedAt: entry.committedAt,
    status: normalizeSignatureStatus(entry.status),
    category: entry.category,
  }));
}

export async function triggerSoc2Export(): Promise<void> {
  const response = await fetch(buildApiUrl("/compliance/export"));
  if (!response.ok) {
    let message = `SOC2 export failed (HTTP ${response.status})`;
    try {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const body = (await response.json()) as { message?: string };
        if (body.message) message = body.message;
      }
    } catch {
      // keep the status-based message
    }
    throw new ApiError(response.status, message);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/zip")) {
    throw new ApiError(
      response.status,
      `Unexpected response type: expected application/zip, got ${contentType || "unknown"}`,
    );
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `soc2-evidence-${new Date().toISOString().split("T")[0]}.zip`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
