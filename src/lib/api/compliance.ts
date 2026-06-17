import { apiGet } from "../api";
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
    throw new Error("Failed to export SOC2 evidence");
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
