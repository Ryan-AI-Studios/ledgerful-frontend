import { apiGet, ApiError } from "../api";
import { ComplianceSummary, SignatureEntry } from "@/lib/types";
import { buildApiUrl } from "../utils";

export async function fetchComplianceSummary(): Promise<ComplianceSummary> {
  return await apiGet<ComplianceSummary>("/compliance/summary");
}

export async function fetchSignatureEntries(): Promise<SignatureEntry[]> {
  return await apiGet<SignatureEntry[]>("/compliance/signatures");
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
