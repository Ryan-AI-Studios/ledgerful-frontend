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
    expect(entries[0].boundRuns).toBeUndefined();
    expect(entries[0].boundSnapshot).toBeUndefined();
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
    expect(entry.boundRuns).toEqual([]);
    expect(entry.boundSnapshot).toBeNull();
  });

  it("maps bound git --version detail without copying it onto list fields", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: 8,
        tx_id: "tx-cheap",
        category: "FEATURE",
        entry_type: "COMMITTED",
        entity: "e",
        entity_normalized: "e",
        change_type: "edit",
        summary: "s",
        reason: "r",
        is_breaking: false,
        committed_at: "2026-10-23T12:00:00Z",
        origin: "local",
        author: "c",
        risk: "LOW",
        verification_status: null,
        files: [],
        hotspots_crossed: 0,
        tests_run: 1,
        flakes: 0,
        bound_runs: [
          {
            run_id: 4,
            run_timestamp: "2026-10-23T12:00:00Z",
            overall_pass: true,
            stale: false,
            partial: false,
            commands: [{ command: "git --version", exit_code: 0, duration_ms: 12 }],
          },
        ],
        bound_snapshot: {
          run_timestamp: "2026-10-23T12:00:00Z",
          head: null,
          head_status: "unknown",
        },
      }),
    } as Response);

    const entry = await fetchLedgerEntry("tx-cheap");
    expect(entry.testsRun).toBe(1);
    expect(entry.flakes).toBe(0);
    expect(entry.verificationStatus).toBeNull();
    expect(entry.boundRuns).toEqual([
      {
        runId: 4,
        runTimestamp: "2026-10-23T12:00:00Z",
        overallPass: true,
        stale: false,
        partial: false,
        commands: [{ command: "git --version", exitCode: 0, durationMs: 12 }],
      },
    ]);
    expect(entry.boundSnapshot).toEqual({
      runTimestamp: "2026-10-23T12:00:00Z",
      head: null,
      headStatus: "unknown",
    });
  });
it("maps reason_kind trailer and risk_source category on list", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        {
          id: 4,
          tx_id: "tx-d",
          category: "FEATURE",
          entry_type: "COMMITTED",
          entity: "e",
          entity_normalized: "e",
          change_type: "edit",
          summary: "s",
          reason: "Co-authored-by: Cursor <cursoragent@cursor.com>",
          reason_kind: "trailer",
          is_breaking: false,
          committed_at: "2026-01-01T00:00:00Z",
          origin: "local",
          author: "d",
          risk: "HIGH",
          risk_source: "category",
        },
      ],
    } as Response);

    const entries = await fetchLedger();
    expect(entries[0].reasonKind).toBe("trailer");
    expect(entries[0].riskSource).toBe("category");
  });

  it("omits reasonKind and riskSource when wire keys are missing or null", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        {
          id: 5,
          tx_id: "tx-e",
          category: "FEATURE",
          entry_type: "COMMITTED",
          entity: "e",
          entity_normalized: "e",
          change_type: "edit",
          summary: "s",
          reason: "body why",
          reason_kind: null,
          is_breaking: false,
          committed_at: "2026-01-01T00:00:00Z",
          origin: "local",
          author: "e",
          risk: "HIGH",
          risk_source: null,
        },
      ],
    } as Response);

    const entries = await fetchLedger();
    expect(entries[0].reasonKind).toBeUndefined();
    expect(entries[0].riskSource).toBeUndefined();
  });

  it("omits riskSource when risk is null", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        {
          id: 6,
          tx_id: "tx-f",
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
          author: "f",
          risk: null,
        },
      ],
    } as Response);

    const entries = await fetchLedger();
    expect(entries[0].risk).toBe("UNKNOWN");
    expect(entries[0].riskSource).toBeUndefined();
    expect(entries[0].reasonKind).toBeUndefined();
  });

  it("maps reasonKind and riskSource on detail via toLedgerEntry", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: 7,
        tx_id: "tx-g",
        category: "FEATURE",
        entry_type: "COMMITTED",
        entity: "e",
        entity_normalized: "e",
        change_type: "edit",
        summary: "s",
        reason: "Co-authored-by: Cursor <cursoragent@cursor.com>",
        reason_kind: "trailer",
        is_breaking: false,
        committed_at: "2026-01-01T00:00:00Z",
        origin: "local",
        author: "g",
        risk: "HIGH",
        risk_source: "category",
        files: [{ path: "a.ts", additions: 1, deletions: 0 }],
        hotspots_crossed: 0,
        tests_run: 0,
        flakes: 0,
      }),
    } as Response);

    const entry = await fetchLedgerEntry("tx-g");
    expect(entry.reasonKind).toBe("trailer");
    expect(entry.riskSource).toBe("category");
    expect(entry.files).toHaveLength(1);
  });

  it("omits reasonKind and riskSource on detail when wire omits them", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: 8,
        tx_id: "tx-h",
        category: "DOCS",
        entry_type: "COMMITTED",
        entity: "e",
        entity_normalized: "e",
        change_type: "edit",
        summary: "s",
        reason: "body why",
        is_breaking: false,
        committed_at: "2026-01-01T00:00:00Z",
        origin: "local",
        author: "h",
        risk: "TRIVIAL",
        files: [],
      }),
    } as Response);

    const entry = await fetchLedgerEntry("tx-h");
    expect(entry.reasonKind).toBeUndefined();
    expect(entry.riskSource).toBeUndefined();
  });
});


