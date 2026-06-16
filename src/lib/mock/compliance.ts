import { ComplianceSummary, SignatureEntry } from "@/lib/types";

export function fetchComplianceSummary(): Promise<ComplianceSummary> {
  return Promise.resolve({
    totalSigned: 1240,
    validCount: 1238,
    invalidCount: 2,
    skippedCount: 0,
    validityPercent: 99.8,
    lastAuditAt: "2024-05-15T10:00:00Z",
    hotspotDeltaPercent: -12.5,
    oldestUnaddressedAdr: {
      id: "ADR-0042",
      title: "Use Argon2 for password hashing",
      createdAt: "2024-01-10T09:00:00Z",
      status: "PROPOSED"
    }
  });
}

export function fetchSignatureEntries(): Promise<SignatureEntry[]> {
  return Promise.resolve([
    { txId: "tx-4501", timestamp: "2024-06-01T14:20:00Z", signer: "alice@ledgerful.com", status: "VALID" },
    { txId: "tx-4502", timestamp: "2024-06-01T15:10:00Z", signer: "bob@ledgerful.com", status: "VALID" },
    { txId: "tx-4503", timestamp: "2024-06-02T09:30:00Z", signer: "charlie@ledgerful.com", status: "INVALID" },
    { txId: "tx-4504", timestamp: "2024-06-02T10:15:00Z", signer: "alice@ledgerful.com", status: "VALID" },
    { txId: "tx-4505", timestamp: "2024-06-03T11:45:00Z", signer: "system", status: "SKIPPED" },
    { txId: "tx-4506", timestamp: "2024-06-03T13:20:00Z", signer: "bob@ledgerful.com", status: "VALID" },
    { txId: "tx-4507", timestamp: "2024-06-04T08:50:00Z", signer: "alice@ledgerful.com", status: "VALID" },
    { txId: "tx-4508", timestamp: "2024-06-04T10:05:00Z", signer: "charlie@ledgerful.com", status: "VALID" },
    { txId: "tx-4509", timestamp: "2024-06-05T16:30:00Z", signer: "alice@ledgerful.com", status: "INVALID" },
    { txId: "tx-4510", timestamp: "2024-06-05T17:00:00Z", signer: "bob@ledgerful.com", status: "VALID" },
  ]);
}

export async function triggerSoc2Export(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log("Mock SOC2 Export Triggered");
}
