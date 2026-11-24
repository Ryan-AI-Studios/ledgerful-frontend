import { afterEach, describe, expect, it, vi } from "vitest";
import captured from "../../test/fixtures/change-evidence-v1.json";
import { changeRowKey, fetchChanges } from "./changes";
import { fetchChangeEvidence } from "./change-evidence";
import { decodeCapability, decodeEvidenceKey, decodeEvidencePacket } from "./change-evidence-decoder";

const key = decodeEvidenceKey(captured)!;
const baseline = captured.baselineCandidates.items[0];
const unselected = {
  ...captured,
  baselineName: undefined,
  baselineDigest: undefined,
  comparison: { status: "selection-required" },
};

afterEach(() => vi.unstubAllGlobals());

describe("revision-bound producer packets", () => {
  it("recognizes a primary v1 capability and older daemon absence", () => {
    expect(decodeCapability(undefined)).toBeUndefined();
    expect(decodeCapability(null)).toBeUndefined();
    expect(decodeCapability({ schemaVersion: 2, status: "ready" })).toEqual({ status: "unsupported" });
    expect(decodeCapability({ schemaVersion: 1, status: "disabled" })).toEqual({ status: "disabled" });
    expect(decodeCapability({ schemaVersion: 1, status: "uninitialized", reasonCode: "uninitialized" }))
      .toEqual({ status: "uninitialized" });
    expect(decodeCapability({ schemaVersion: 1, status: "incompatible", reasonCode: "request-budget" }))
      .toEqual({ status: "incompatible", reasonCode: "request-budget" });
    expect(decodeCapability({ schemaVersion: 1, status: "ready", repoScope: key.repoScope, displayName: captured.displayName }))
      .toEqual({ status: "ready", repoScope: key.repoScope, displayName: captured.displayName });
    expect(decodeCapability({ schemaVersion: 1, status: "ready", repoScope: "other", displayName: captured.displayName }))
      .toEqual({ status: "invalid" });
  });

  it("accepts the exact native producer packet and retains measured call weights and exit results", () => {
    const result = decodeEvidencePacket(captured, key, baseline);
    expect(result?.git).toEqual(captured.git);
    expect(result?.comparison).toEqual(captured.comparison);
    expect(result?.baselineCandidates).toEqual(captured.baselineCandidates);
    expect(result?.verification?.status).toBe("recorded");
    if (result?.verification?.status !== "recorded") throw new Error("expected verification attempts");
    expect(result.verification.invalidAttempts).toBe(false);
    expect(result.verification.attempts.map((attempt) => attempt.selectionInvalid)).toEqual([false, false, false, false]);
    expect(result.verification.attempts[0].outcomes?.[0].exitCode).toBe(0);
    expect(result.verification.attempts[1].outcomes).toEqual([]);
    expect(result.verification.attempts[2].outcomes?.[0].exitCode).toBe(128);
    expect(result.verification.attempts[3].outcomes?.[1]).toMatchObject({ index: 1, exitCode: 124, timedOut: true });
  });

  it.each([
    { schemaVersion: 2 },
    { repoScope: "f2e82a2e-3f27-48bc-a294-209acef87a64" },
    { head: key.head.slice(0, 8) },
    { head: key.base },
    { base: "3".repeat(40) },
    { baselineName: "other-parent" },
    { baselineDigest: "blake3:" + "f".repeat(64) },
  ])("rejects a conflicting protocol identity %j", (overrides) => {
    expect(decodeEvidencePacket({ ...captured, ...overrides }, key, baseline)).toBeUndefined();
  });

  it("rejects an unsolicited selection and an invalid candidate binding", () => {
    expect(decodeEvidencePacket(captured, key)).toBeUndefined();
    expect(decodeEvidencePacket(captured, key, { ...baseline, base: key.head })).toBeUndefined();
    const incompatible = { ...unselected.baselineCandidates, items: [{ ...baseline, base: key.head }] };
    expect(decodeEvidencePacket({ ...unselected, baselineCandidates: incompatible }, key)?.baselineCandidates)
      .toBeUndefined();
    expect(decodeEvidencePacket(unselected, key)?.comparison).toEqual({ status: "selection-required" });
  });

  it("never turns missing, incomplete, or invalid data into a complete empty result", () => {
    const baselineCandidates = { status: "ready", complete: false, items: [] };
    const comparison = { status: "unavailable", reasonCode: "live-proof-unavailable" };
    expect(decodeEvidencePacket({ ...unselected, baselineCandidates, comparison }, key)?.baselineCandidates)
      .toEqual(baselineCandidates);
    expect(decodeEvidencePacket({ ...unselected, git: undefined, verification: undefined }, key))
      .toMatchObject({ git: undefined, verification: undefined });
    const empty = {
      ...captured.comparison,
      counts: { added: 0, removed: 0, worsened: 0, improved: 0, unchanged: 2 },
      regression: "none",
      notes: [],
      items: [],
    };
    expect(decodeEvidencePacket({ ...captured, comparison: empty }, key, baseline)?.comparison).toEqual(empty);
    const capped = {
      ...captured.comparison,
      items: captured.comparison.items.slice(0, 1),
      sample: { complete: false, omitted: 2 },
    };
    expect(decodeEvidencePacket({ ...captured, comparison: capped }, key, baseline)?.comparison).toEqual(capped);
  });

  it("enforces the producer's section and per-attempt caps", () => {
    const files = Array.from({ length: 101 }, (_, index) => ({ kind: "added", path: "src/file-" + index + ".rs" }));
    const git = { status: "ready", files, total: files.length, omitted: 0 };
    const baselineCandidates = {
      ...captured.baselineCandidates,
      items: Array.from({ length: 33 }, (_, index) => ({ ...baseline, name: "parent-" + index })),
    };
    const items = files.map(({ path }) => ({ class: "added", currentWeight: 1, edgeKey: { srcPath: path, dstPath: "src/target.rs" } }));
    const comparison = {
      ...captured.comparison, items,
      counts: { ...captured.comparison.counts, added: items.length, removed: 0, worsened: 0 },
    };
    const verification = {
      ...captured.verification,
      attempts: Array.from({ length: 9 }, (_, index) => ({
        ...captured.verification.attempts[0], runId: index + 1,
        attemptId: "059af3e8-09c2-4bd6-b45d-" + String(index).padStart(12, "0"),
      })),
    };
    const result = decodeEvidencePacket({ ...captured, git, baselineCandidates, comparison, verification }, key, baseline);
    expect(result).toMatchObject({ git: undefined, baselineCandidates: undefined, comparison: undefined, verification: undefined });
    const source = captured.verification.attempts[1];
    const steps = Array.from({ length: 33 }, (_, index) => ({
      index, command: "withheld", kind: "non-test", state: "planned",
    }));
    const oversized = {
      ...captured.verification, attempts: [{ ...source, selectionEvidence: { ...source.selectionEvidence, steps } }],
    };
    expect(decodeEvidencePacket({ ...captured, verification: oversized }, key, baseline)?.verification)
      .toMatchObject({ attempts: [{ selectionEvidence: undefined, selectionInvalid: true, outcomes: [] }] });
  });

  it.each([
    { indexHeadHash: undefined },
    { indexHeadHash: key.base },
    { scope: { kind: "another-scope" } },
    { inputCompleteness: { state: "COMPLETE", reasons: ["CONTENT_DRIFT"] } },
    { parserVersion: "other" },
    { edgeSources: ["native", "scip"] },
    { edgeSources: ["other"] },
  ])("withholds the comparison when current identity has %j", (overrides) => {
    const comparison = {
      ...captured.comparison,
      currentIdentity: { ...captured.comparison.currentIdentity, ...overrides },
    };
    const result = decodeEvidencePacket({ ...captured, comparison }, key, baseline);
    expect(result?.comparison).toBeUndefined();
    expect(result?.git).toEqual(captured.git);
    expect(result?.verification?.status).toBe("recorded");
  });

  it("preserves significant path spelling, rename sides, and explicit unknown stats", () => {
    const files = [{ kind: "rewrite", path: "src/A-B.rs", oldPath: "Src/A_B.rs", additions: null, deletions: 0 }];
    const git = { status: "ready", files, total: 1, omitted: 0 };
    expect(decodeEvidencePacket({ ...unselected, git }, key)?.git).toEqual(git);
    expect(decodeEvidencePacket({ ...unselected, git: { ...git, total: 2 } }, key)?.git).toBeUndefined();
    expect(decodeEvidencePacket({ ...unselected, git: { ...git, files: [{ ...files[0], path: "../outside" }] } }, key)?.git)
      .toBeUndefined();
  });

  it.each([
    "baseline-unattested", "baseline-wrong-parent", "baseline-missing", "index-stale", "dirty-worktree",
    "historical-head", "index-input-hash-mismatch",
  ])("preserves distinct producer unavailability %s", (reasonCode) => {
    const comparison = { status: "unavailable", reasonCode };
    expect(decodeEvidencePacket({ ...captured, comparison }, key, baseline)?.comparison).toEqual(comparison);
  });

  it("requires incomparable sections to omit counts and relationship rows", () => {
    const comparison = {
      status: "incomparable",
      baselineIdentity: captured.comparison.baselineIdentity,
      incomparableReasons: ["CURRENT_INCOMPLETE"],
      currentInputReasons: ["CONTENT_DRIFT"],
      notes: [],
    };
    expect(decodeEvidencePacket({ ...captured, comparison }, key, baseline)?.comparison).toEqual(comparison);
    const contradictory = { ...comparison, items: [], counts: captured.comparison.counts };
    expect(decodeEvidencePacket({ ...captured, comparison: contradictory }, key, baseline)?.comparison)
      .toBeUndefined();
  });

  it("supports fewer resolved calls with an unknown overall result and preserved coverage limit", () => {
    const item = { ...captured.comparison.items[1], class: "improved", baselineWeight: 2, currentWeight: 1 };
    const comparison = {
      ...captured.comparison,
      currentCoverage: { ...captured.comparison.currentCoverage, edgesUnresolved: 1 },
      regression: "unknown",
      regressionReasons: ["UNRESOLVED_GREW"],
      counts: { added: 0, removed: 0, worsened: 0, improved: 1, unchanged: 1 },
      notes: [],
      items: [item],
    };
    expect(decodeEvidencePacket({ ...captured, comparison }, key, baseline)?.comparison).toEqual(comparison);
  });

  it.each([
    [1, 0, "none", []],
    [0, 1, "none", []],
    [1, 1, "unknown", ["AMBIGUOUS_GREW"]],
    [1, 0, "unknown", ["UNRESOLVED_GREW"]],
    [1, 1, "unknown", ["UNRESOLVED_GREW", "AMBIGUOUS_GREW"]],
    [0, 0, "unknown", ["AMBIGUOUS_GREW"]],
  ] as const)("withholds a contradictory coverage verdict for ambiguity %s and unresolved %s", (
    edgesAmbiguous, edgesUnresolved, regression, regressionReasons,
  ) => {
    const comparison = {
      ...captured.comparison,
      currentCoverage: { ...captured.comparison.currentCoverage, edgesAmbiguous, edgesUnresolved },
      counts: { added: 0, removed: 0, worsened: 0, improved: 0, unchanged: 1 },
      notes: [],
      items: [],
      regression,
      regressionReasons,
    };
    const result = decodeEvidencePacket({ ...captured, comparison }, key, baseline);
    expect(result?.comparison).toBeUndefined();
    expect(result?.git).toEqual(captured.git);
    expect(result?.baselineCandidates).toEqual(captured.baselineCandidates);
    expect(result?.verification).toMatchObject({
      status: "recorded",
      attempts: captured.verification.attempts.map(({ attemptId, outcomes }) => ({ attemptId, outcomes })),
    });
  });

  it("checks coverage families separately when growth in one offsets a decrease in the other", () => {
    const comparison = {
      ...captured.comparison,
      baselineCoverage: { ...captured.comparison.baselineCoverage, edgesUnresolved: 2 },
      currentCoverage: { ...captured.comparison.currentCoverage, edgesAmbiguous: 2 },
      counts: { added: 0, removed: 0, worsened: 0, improved: 0, unchanged: 1 },
      notes: [],
      items: [],
      regression: "unknown",
      regressionReasons: ["AMBIGUOUS_GREW"],
    };
    expect(decodeEvidencePacket({ ...captured, comparison }, key, baseline)?.comparison).toEqual(comparison);
    const contradictory = { ...comparison, regression: "none", regressionReasons: [] };
    expect(decodeEvidencePacket({ ...captured, comparison: contradictory }, key, baseline)?.comparison)
      .toBeUndefined();
    const bothGrow = {
      ...comparison,
      currentCoverage: { ...comparison.currentCoverage, edgesUnresolved: 3 },
      regressionReasons: ["AMBIGUOUS_GREW", "UNRESOLVED_GREW"],
    };
    expect(decodeEvidencePacket({ ...captured, comparison: bothGrow }, key, baseline)?.comparison)
      .toEqual(bothGrow);
  });

  it.each(["added", "worsened"] as const)("keeps the producer's %s relationship precedence over coverage reasons", (kind) => {
    const comparison = {
      ...captured.comparison,
      currentCoverage: { ...captured.comparison.currentCoverage, edgesAmbiguous: 1, edgesUnresolved: 1 },
      counts: { added: 0, removed: 0, worsened: 0, improved: 0, unchanged: 1, [kind]: 1 },
      notes: [],
      items: captured.comparison.items.filter((item) => item.class === kind),
    };
    expect(decodeEvidencePacket({ ...captured, comparison }, key, baseline)?.comparison).toEqual(comparison);
  });

  it.each([
    { basis: "refused" },
    { omissions: ["unknown-omission"] },
    { limitationCodes: [] },
    { limitationCodes: ["selection-soundness-not-established", "unknown-limit"] },
    { steps: [{ ...captured.verification.attempts[2].selectionEvidence.steps[0], state: "unknown" }] },
  ])("withholds selection claims while retaining independently verified failures %j", (overrides) => {
    const source = captured.verification.attempts[2];
    const selectionEvidence = { ...source.selectionEvidence, ...overrides };
    const verification = { ...captured.verification, attempts: [{ ...source, selectionEvidence }] };
    const result = decodeEvidencePacket({ ...captured, verification }, key, baseline)?.verification;
    expect(result).toMatchObject({
      status: "recorded",
      attempts: [{ selectionEvidence: undefined, selectionInvalid: true, outcomes: source.outcomes }],
    });
  });

  it("shows a stale exact legacy command result even when selection was never captured", () => {
    const source = captured.verification.attempts[2];
    const verification = {
      ...captured.verification,
      attempts: [{ ...source, ageStatus: "stale", scopeRequested: undefined, scopeExecuted: undefined, selectionEvidence: null }],
    };
    expect(decodeEvidencePacket({ ...captured, verification }, key, baseline)?.verification).toMatchObject({
      attempts: [{ ageStatus: "stale", selectionInvalid: false, outcomes: source.outcomes }],
    });
  });

  it("keeps a refused planning attempt separate from execution and rejects a false outcome", () => {
    const source = captured.verification.attempts[1];
    const attempt = {
      ...source,
      attemptKind: "refused",
      state: "refused",
      scopeExecuted: "refused",
      selectionEvidence: { ...source.selectionEvidence, basis: "refused", omissions: ["refused-no-commands-run"] },
    };
    const verification = { ...captured.verification, attempts: [attempt] };
    expect(decodeEvidencePacket({ ...captured, verification }, key, baseline)?.verification).toMatchObject({
      attempts: [{ state: "refused", selectionInvalid: false, outcomes: [] }],
    });
    const corrupt = { ...verification, attempts: [{ ...attempt, outcomes: [{ index: 0, exitCode: 0, durationMs: 1, timedOut: false }] }] };
    expect(decodeEvidencePacket({ ...captured, verification: corrupt }, key, baseline)?.verification).toMatchObject({
      attempts: [], invalidAttempts: true,
    });
  });

  it("keeps legacy row mappings while distinguishing an exact prefix collision", async () => {
    const short = key.head.slice(0, 8);
    const row = { id: short, status: "Committed", path: "src/lib.rs", author: "Fixture", evidenceKey: key };
    const collision = { ...row, evidenceKey: { ...key, head: short + "0".repeat(32) } };
    const liveRows = [
      row, collision, { ...row, id: "working-tree", status: "Uncommitted" },
      { ...row, id: "abcdef12" }, { ...row, evidenceKey: undefined },
    ];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(liveRows)));
    const [first, second, working, mismatched, legacy] = await fetchChanges();
    expect(first.id).toBe(second.id);
    expect(changeRowKey(first)).not.toBe(changeRowKey(second));
    expect(working).toMatchObject({ evidenceIdentityInvalid: true });
    expect(working.evidenceKey).toBeUndefined();
    expect(mismatched.evidenceKey).toBeUndefined();
    expect(legacy).toMatchObject({ id: short, filesChanged: 1, additions: 0 });
  });

  it.each([
    [200, "text/plain", "invalid"],
    [201, "application/json", "invalid"],
    [404, "text/plain", "error"],
    [429, "application/problem+json", "rate-limited"],
    [503, "application/problem+json", "budget"],
  ] as const)("maps HTTP %s with %s to %s", async (status, contentType, expected) => {
    const value = { type: "about:blank", status, title: "Fixture response", reasonCode: "request-budget" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(value), {
      status, headers: { "content-type": contentType },
    })));
    expect(await fetchChangeEvidence(key, undefined, new AbortController().signal)).toEqual({ status: expected });
  });

  it("maps a typed exact-pair absence on a supported daemon separately", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      type: "about:blank", status: 404, title: "Not Found", reasonCode: "pair-not-found",
    }), { status: 404, headers: { "content-type": "application/problem+json" } })));
    expect(await fetchChangeEvidence(key, undefined, new AbortController().signal)).toEqual({ status: "missing" });
  });
});
