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
    { txId: "tx-4501", entity: "alice@ledgerful.com", summary: "Refactor session token validation", committedAt: "2024-06-01T14:20:00Z", status: "VALID", category: "SECURITY" },
    { txId: "tx-4502", entity: "bob@ledgerful.com", summary: "Add /api/sync/status endpoint", committedAt: "2024-06-01T15:10:00Z", status: "VALID", category: "FEATURE" },
    { txId: "tx-4503", entity: "charlie@ledgerful.com", summary: "Hotfix: ledger audit crash on empty DB", committedAt: "2024-06-02T09:30:00Z", status: "INVALID", category: "BUGFIX" },
    { txId: "tx-4504", entity: "alice@ledgerful.com", summary: "Wire Ed25519 signing into commit-msg hook", committedAt: "2024-06-02T10:15:00Z", status: "VALID", category: "ARCHITECTURE" },
    { txId: "tx-4505", entity: "system", summary: "Auto-generated tx for sync extract", committedAt: "2024-06-03T11:45:00Z", status: "SKIPPED", category: "CHORE" },
    { txId: "tx-4506", entity: "bob@ledgerful.com", summary: "Compliance summary handler + hotspot delta", committedAt: "2024-06-03T13:20:00Z", status: "VALID", category: "FEATURE" },
    { txId: "tx-4507", entity: "alice@ledgerful.com", summary: "SOC2 export zip + manifest signing", committedAt: "2024-06-04T08:50:00Z", status: "VALID", category: "FEATURE" },
    { txId: "tx-4508", entity: "charlie@ledgerful.com", summary: "Verify steps SQL aggregation", committedAt: "2024-06-04T10:05:00Z", status: "VALID", category: "FEATURE" },
    { txId: "tx-4509", entity: "alice@ledgerful.com", summary: "Tampered summary (signature mismatch)", committedAt: "2024-06-05T16:30:00Z", status: "INVALID", category: "SECURITY" },
    { txId: "tx-4510", entity: "bob@ledgerful.com", summary: "Frontend contract alignment for E2", committedAt: "2024-06-05T17:00:00Z", status: "VALID", category: "REFACTOR" },
  ]);
}

export async function triggerSoc2Export(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 2000));
}
