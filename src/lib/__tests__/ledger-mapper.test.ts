import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchLedger, fetchLedgerEntry } from "@/lib/api/ledger";

const mockFetch = vi.fn();

describe("ledger mapper honesty (FE-H7)", () => {
  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset();
    delete process.env.NEXT_PUBLIC_LEDGERFUL_USE_MOCK;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps missing risk to UNKNOWN and leaves list metrics null", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        {
          id: 1,
          tx_id: "tx-a",
          category: "FEATURE",
          entry_type: "COMMITTED",
          entity: "e",
          entity_normalized: "e",
          change_type: "edit",
          summary: "s",
          reason: "r",
          is_breaking: false,
          committed_at: "2026-01-01T00:00:00Z",
          origin: "local",
          author: "alice",
          risk: null,
          signature: null,
          public_key: null,
          verification_status: "VALID",
        },
      ],
    } as Response);

    const entries = await fetchLedger();
    expect(entries).toHaveLength(1);
    expect(entries[0].risk).toBe("UNKNOWN");
    expect(entries[0].hotspotsCrossed).toBeNull();
    expect(entries[0].testsRun).toBeNull();
    expect(entries[0].flakes).toBeNull();
    expect(entries[0].signature).toBeUndefined();
    expect(entries[0].publicKey).toBeUndefined();
    expect(entries[0].verificationStatus).toBe("VALID");
    expect(entries[0].status).toBe("COMMITTED");
  });

  it("maps unknown entry_type to OTHER with raw preserved", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        {
          id: 2,
          tx_id: "tx-b",
          category: "ARCHITECTURE",
          entry_type: "Architecture",
          entity: "e",
          entity_normalized: "e",
          change_type: "edit",
          summary: "s",
          reason: "r",
          is_breaking: false,
          committed_at: "2026-01-01T00:00:00Z",
          origin: "local",
          author: "bob",
          risk: "HIGH",
        },
      ],
    } as Response);

    const entries = await fetchLedger();
    expect(entries[0].status).toBe("OTHER");
    expect(entries[0].entryTypeRaw).toBe("Architecture");
    expect(entries[0].risk).toBe("HIGH");
  });

  it("maps detail metrics without inventing verification from testsRun", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: 3,
        tx_id: "tx-c",
        category: "FEATURE",
        entry_type: "PENDING",
        entity: "e",
        entity_normalized: "e",
        change_type: "edit",
        summary: "s",
        reason: "r",
        is_breaking: false,
        committed_at: "2026-01-01T00:00:00Z",
        origin: "local",
        author: "c",
        risk: "LOW",
        signature: "sig",
        public_key: "pk",
        verification_status: null,
        files: [{ path: "a.ts", additions: 1, deletions: 0 }],
        hotspots_crossed: 2,
        tests_run: 5,
        flakes: 0,
      }),
    } as Response);

    const entry = await fetchLedgerEntry("tx-c");
    expect(entry.status).toBe("PENDING");
    expect(entry.testsRun).toBe(5);
    expect(entry.hotspotsCrossed).toBe(2);
    expect(entry.verificationStatus).toBeNull();
    expect(entry.signature).toBe("sig");
  });
});
