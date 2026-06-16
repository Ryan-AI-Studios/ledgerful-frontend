import { fetchLedger as fetchLiveLedger, fetchLedgerEntry as fetchLiveLedgerEntry } from "@/lib/api/ledger";
import { fetchLedger as fetchMockLedger, fetchLedgerEntry as fetchMockLedgerEntry } from "@/lib/mock/ledger";
import { withFallback } from "@/lib/fallback";

export type { LedgerEntry, LedgerStatus } from "@/lib/types";

export async function fetchLedger(): Promise<import("@/lib/types").LedgerEntry[]> {
  return withFallback(() => fetchLiveLedger(), () => fetchMockLedger());
}

export async function fetchLedgerEntry(txId: string): Promise<import("@/lib/types").LedgerEntry | undefined> {
  return withFallback(
    () => fetchLiveLedgerEntry(txId),
    () => fetchMockLedgerEntry(txId),
    { notFoundReturns: undefined },
  );
}
