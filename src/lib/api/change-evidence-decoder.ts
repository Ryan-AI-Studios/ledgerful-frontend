import type { ExtractResponse } from "./contract-types";
import type { components } from "./generated";

type Wire = ExtractResponse<"/api/change-evidence", "get">;
type Schema = components["schemas"];
export type EvidenceKey = Schema["EvidenceKey"];
export type BaselineCandidate = Schema["BaselineCandidate"];
type Comparison = Wire["comparison"];
type Selection = Schema["SelectionEvidence"];
type Attempt = Schema["VerificationAttempt"];

type DecodedAttempt = Omit<Attempt, "selectionEvidence"> & {
  selectionEvidence?: Selection;
  selectionInvalid: boolean;
};

type Verification = Exclude<Wire["verification"], { status: "recorded" }> | {
  status: "recorded";
  attempts: readonly DecodedAttempt[];
  sample: Schema["HistorySample"];
  invalidAttempts: boolean;
};

export type EvidencePacket = EvidenceKey & {
  displayName: string;
  git?: Wire["git"];
  baselineCandidates?: Wire["baselineCandidates"];
  comparison?: Comparison;
  verification?: Verification;
};

type CapabilityReason = "scope-unavailable" | "schema-incompatible" | "storage-busy"
  | "request-budget" | "worker-saturated";
export type EvidenceCapability =
  | { status: "ready"; repoScope: string; displayName: string }
  | { status: "disabled" | "uninitialized" | "unsupported" | "invalid" }
  | { status: "incompatible"; reasonCode: CapabilityReason };

type ObjectValue = Record<string, unknown>;
const object = (value: unknown): value is ObjectValue =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const absent = (value: unknown): value is null | undefined => value == null;
const integer = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value);
const count = (value: unknown): value is number => integer(value) && value >= 0;
const nullableCount = (value: unknown) => absent(value) || count(value);
const matches = (value: unknown, pattern: RegExp): value is string =>
  typeof value === "string" && pattern.test(value);
const uuid = (value: unknown): value is string =>
  matches(value, /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/);
const oid = (value: unknown): value is string => matches(value, /^[0-9a-f]{40}$/);
const digest = (value: unknown): value is string => matches(value, /^blake3:[0-9a-f]{64}$/);
const name = (value: unknown): value is string => matches(value, /^[a-z0-9][a-z0-9._-]{0,63}$/);
const token = (value: unknown): value is string => matches(value, /^[A-Za-z0-9.+_-]{1,128}$/);
const buildId = (value: unknown) => matches(value, /^[A-Za-z0-9.+_-]{1,128}(?: \([a-f0-9]{4,64}\))?$/);
const date = (value: unknown): value is string =>
  matches(value, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/) &&
  value.length <= 40 && Number.isFinite(Date.parse(value));
const oneOf = <T extends string>(value: unknown, choices: readonly T[]): value is T =>
  typeof value === "string" && choices.some((choice) => value === choice);
const codes = <T extends string>(value: unknown, choices: readonly T[]): value is T[] =>
  Array.isArray(value) && value.length <= choices.length &&
  value.every((item) => oneOf(item, choices)) && new Set(value).size === value.length;

function path(value: unknown): value is string {
  return typeof value === "string" && value.length <= 4094 &&
    value.split("/").every((part) =>
      /^[A-Za-z0-9._-]{1,255}$/.test(part) && part !== "." && part !== ".." &&
      ![".git", ".ledgerful"].includes(part.toLowerCase()));
}

export function safeRepositoryName(value: unknown): string {
  return matches(value, /^[A-Za-z0-9 ._-]{1,128}$/) ? value : "Local repository";
}

export function decodeEvidenceKey(value: unknown): EvidenceKey | undefined {
  if (!object(value) || !uuid(value.repoScope) || !oid(value.head) ||
    !oid(value.base) || value.head === value.base) return;
  return { repoScope: value.repoScope, head: value.head, base: value.base };
}

export function evidenceKeyId(key: EvidenceKey): string {
  return [key.repoScope, key.head, key.base].join(":");
}

export function decodeCapability(value: unknown): EvidenceCapability | undefined {
  if (absent(value)) return;
  if (!object(value) || !count(value.schemaVersion)) return { status: "invalid" };
  if (value.schemaVersion !== 1) return { status: "unsupported" };
  const { status, repoScope, displayName, reasonCode } = value;
  switch (status) {
    case "ready":
      if (uuid(repoScope) && typeof displayName === "string" && displayName === safeRepositoryName(displayName) &&
        absent(reasonCode)) return { status, repoScope, displayName };
      break;
    case "disabled":
      if (absent(repoScope) && absent(displayName) && absent(reasonCode)) return { status };
      break;
    case "uninitialized":
      if (absent(repoScope) && absent(displayName) && reasonCode === "uninitialized") return { status };
      break;
    case "incompatible":
      if (absent(repoScope) && absent(displayName) && oneOf(reasonCode, [
        "scope-unavailable", "schema-incompatible", "storage-busy", "request-budget", "worker-saturated",
      ])) return { status, reasonCode };
  }
  return { status: "invalid" };
}

function file(value: unknown): value is Schema["PreparedFile"] {
  if (!object(value) || !oneOf(value.kind, ["added", "deleted", "modified", "rewrite"]) ||
    !path(value.path) || !nullableCount(value.additions) || !nullableCount(value.deletions) ||
    !(absent(value.isBinary) || typeof value.isBinary === "boolean")) return false;
  return value.kind === "rewrite"
    ? path(value.oldPath) && value.oldPath !== value.path
    : absent(value.oldPath);
}

function git(value: unknown): value is Wire["git"] {
  if (!object(value)) return false;
  const { status, files, total, omitted, reasonCode } = value;
  if (status === "unavailable") {
    return oneOf(reasonCode, ["not-prepared", "git-files-unavailable"]) &&
      absent(files) && absent(total) && absent(omitted);
  }
  if (!Array.isArray(files) || files.length > 100 || !files.every(file)) return false;
  if (status === "ready") return total === files.length && omitted === 0 && absent(reasonCode);
  return status === "partial" && nullableCount(total) && nullableCount(omitted) &&
    (absent(reasonCode) || reasonCode === "unsupported-tree-path") &&
    (absent(total) || total >= files.length) &&
    (absent(total) || absent(omitted) || total === files.length + omitted);
}

function candidate(value: unknown, base: string): value is BaselineCandidate {
  return object(value) && name(value.name) && digest(value.payloadDigest) &&
    value.base === base && date(value.observedAt);
}

function candidates(value: unknown, base: string): Wire["baselineCandidates"] | undefined {
  if (!object(value)) return;
  if (value.status === "unavailable" && value.reasonCode === "candidates-unavailable" &&
    absent(value.items) && absent(value.complete)) {
    return { status: value.status, reasonCode: value.reasonCode };
  }
  if (value.status !== "ready" || typeof value.complete !== "boolean" ||
    !Array.isArray(value.items) || value.items.length > 32 ||
    !value.items.every((item) => candidate(item, base))) return;
  const items = value.items as BaselineCandidate[];
  if (new Set(items.map((item) => item.name)).size !== items.length) return;
  return { status: value.status, items, complete: value.complete };
}

const comparisonReasons = [
  "baseline-missing", "baseline-unattested", "baseline-wrong-parent", "baseline-digest-mismatch",
  "baseline-incompatible", "not-prepared", "live-proof-unavailable", "historical-head", "head-moved",
  "dirty-worktree", "index-stale", "config-changed", "proof-stale", "proof-time-invalid",
  "proof-time-future", "unsupported-input-encoding", "unsupported-tree-path",
  "index-generation-mismatch", "index-parser-version-mismatch", "index-input-stamp-missing",
  "index-input-stamp-mismatch", "index-input-hash-mismatch", "index-input-unavailable",
] as const satisfies readonly Schema["ComparisonReason"][];
const incomparableReasons = [
  "BASELINE_DIGEST_MISMATCH", "BASELINE_INCOMPLETE", "CURRENT_INCOMPLETE", "EDGE_SOURCES_MISMATCH",
  "PARSER_VERSION_MISMATCH", "SCHEMA_MISMATCH", "SCOPE_MISMATCH",
] as const satisfies readonly Schema["IncomparableReason"][];
const inputReasons = [
  "CAPPED_EDGES", "CONTENT_DRIFT", "INDEX_EMPTY", "INDEX_INDETERMINATE",
  "INDEX_STALE", "PARSE_FAILED_FILES", "SCAN_INCOMPLETE",
] as const;
const regressionReasons = ["AMBIGUOUS_GREW", "UNRESOLVED_GREW"] as const;
const notes = ["RESOLVED_EDGES_REMOVED", "analyzerBuildDiffers"] as const;
const changedClasses = ["added", "removed", "worsened", "improved"] as const;
const coverageKeys = [
  "filesIndexed", "filesParseFailed", "edgesResolvedCrossFile", "edgesResolvedIntraFile",
  "edgesAmbiguous", "edgesUnresolved", "edgesCapped",
] as const satisfies readonly (keyof Schema["EdgeCoverage"])[];
const countKeys = [...changedClasses, "unchanged"] as const;

function identity(value: unknown, revision: string): value is Schema["BaselineIdentity"] {
  if (!object(value) || value.baselineSchema !== 1 || value.payloadKind !== "fileDependencyEdges" ||
    !digest(value.inputDigest) || !token(value.parserVersion) || !buildId(value.ledgerfulVersion) ||
    !object(value.scope) || value.scope.kind !== "repo" || value.indexHeadHash !== revision ||
    !object(value.inputCompleteness) || value.inputCompleteness.state !== "COMPLETE" ||
    !Array.isArray(value.inputCompleteness.reasons) || value.inputCompleteness.reasons.length > 0) return false;
  const sources = value.edgeSources;
  return Array.isArray(sources) && sources[0] === "native" &&
    (sources.length === 1 || (sources.length === 2 && sources[1] === "scip"));
}

function edge(value: unknown): value is Schema["DeltaItem"] {
  if (!object(value) || !object(value.edgeKey) ||
    !path(value.edgeKey.srcPath) || !path(value.edgeKey.dstPath) ||
    value.edgeKey.srcPath === value.edgeKey.dstPath) return false;
  const { baselineWeight: before, currentWeight: after } = value;
  const positive = (weight: unknown): weight is number => count(weight) && weight > 0;
  switch (value.class) {
    case "added": return absent(before) && positive(after);
    case "removed": return positive(before) && absent(after);
    case "worsened": return positive(before) && positive(after) && after > before;
    case "improved": return positive(before) && positive(after) && after < before;
    default: return false;
  }
}

function sample(value: unknown): value is Schema["Sample"] {
  return object(value) && count(value.omitted) && value.complete === (value.omitted === 0);
}

function comparison(value: unknown, key: EvidenceKey, selected: boolean): value is Comparison {
  if (!object(value)) return false;
  if (value.status !== "comparable" && (!absent(value.counts) || !absent(value.items))) return false;
  switch (value.status) {
    case "selection-required":
      return !selected;
    case "unavailable":
      return oneOf(value.reasonCode, comparisonReasons);
    case "incomparable":
      return selected && identity(value.baselineIdentity, key.base) &&
        codes(value.notes, ["analyzerBuildDiffers"]) && codes(value.currentInputReasons, inputReasons) &&
        codes(value.incomparableReasons, incomparableReasons) && value.incomparableReasons.length > 0;
    case "comparable":
      return selected && comparable(value, key);
    default:
      return false;
  }
}

function comparable(value: ObjectValue, key: EvidenceKey): boolean {
  const coverage = (item: unknown): item is Schema["EdgeCoverage"] =>
    object(item) && coverageKeys.every((field) => count(item[field]));
  const { items, counts, regression, baselineCoverage, currentCoverage, regressionReasons: reportedReasons } = value;
  if (!identity(value.baselineIdentity, key.base) || !identity(value.currentIdentity, key.head) ||
    value.baselineIdentity.parserVersion !== value.currentIdentity.parserVersion ||
    value.baselineIdentity.edgeSources.length !== value.currentIdentity.edgeSources.length ||
    !coverage(baselineCoverage) || !coverage(currentCoverage) ||
    !date(value.capturedAt) || !date(value.liveCheckedAt) ||
    Date.parse(value.capturedAt) > Date.parse(value.liveCheckedAt) ||
    !codes(value.notes, notes) || !codes(reportedReasons, regressionReasons) ||
    !oneOf(regression, ["none", "present", "unknown"]) ||
    !object(counts) || !countKeys.every((field) => count(counts[field])) ||
    !Array.isArray(items) || items.length > 100 || !items.every(edge) || !sample(value.sample)) return false;

  const typedCounts = counts as Schema["DeltaCounts"];
  const typedItems = items as Schema["DeltaItem"][];
  const total = changedClasses.reduce((sum, kind) => sum + typedCounts[kind], 0);
  if (!Number.isSafeInteger(total) || total !== items.length + value.sample.omitted) return false;

  // Validate the producer's verdict against its own counts. An invalid section
  // is withheld rather than deriving a replacement verdict to display.
  const hasIncrease = typedCounts.added > 0 || typedCounts.worsened > 0;
  const expectedReasons: (typeof regressionReasons)[number][] = [];
  if (!hasIncrease) {
    if (currentCoverage.edgesAmbiguous > baselineCoverage.edgesAmbiguous) expectedReasons.push("AMBIGUOUS_GREW");
    if (currentCoverage.edgesUnresolved > baselineCoverage.edgesUnresolved) expectedReasons.push("UNRESOLVED_GREW");
  }
  const expectedVerdict = hasIncrease ? "present" : expectedReasons.length > 0 ? "unknown" : "none";
  if (regression !== expectedVerdict || reportedReasons.length !== expectedReasons.length ||
    expectedReasons.some((reason, index) => reportedReasons[index] !== reason)) return false;

  const pairs = new Set(typedItems.map(({ edgeKey }) => edgeKey.srcPath + ":" + edgeKey.dstPath));
  return pairs.size === items.length &&
    changedClasses.every((kind) => typedItems.filter((item) => item.class === kind).length <= typedCounts[kind]);
}

function outcome(value: unknown): value is Schema["Outcome"] {
  return object(value) && count(value.index) && integer(value.exitCode) &&
    value.exitCode >= -2147483648 && value.exitCode <= 2147483647 &&
    count(value.durationMs) && typeof value.timedOut === "boolean";
}

const omissionCodes = [
  "refused-no-commands-run", "fallback-to-full", "no-test-command-planned",
  "steps-not-run", "result-correspondence-unknown",
] as const;
const limitationCodes = [
  "selection-soundness-not-established", "impact-stale", "impact-corrupt", "impact-missing",
  "impact-freshness-not-evaluated", "prediction-not-run", "prediction-warnings-present",
] as const;
const selectionLimit = 32;

function selection(value: unknown): value is Selection {
  if (!object(value) || value.schemaVersion !== 1 || !oneOf(value.basis, [
    "full-requested", "scoped-selection", "fast-no-test-step", "fallback-full", "refused",
    "explicit-steps", "manual-command", "unknown",
  ]) || !object(value.prediction) || !oneOf(value.prediction.state, [
    "ran", "skipped", "disabled", "not-applicable",
  ]) || !count(value.prediction.warningCount) ||
    !(absent(value.prediction.impactFreshness) ||
      oneOf(value.prediction.impactFreshness, ["available", "stale", "unavailable"])) ||
    !codes(value.omissions, omissionCodes) || !codes(value.limitationCodes, limitationCodes) ||
    !value.limitationCodes.includes("selection-soundness-not-established") ||
    !Array.isArray(value.steps) || value.steps.length > selectionLimit) return false;

  return value.steps.every((step, index) => object(step) && step.index === index &&
    oneOf(step.command, ["git --version", "withheld"]) &&
    oneOf(step.kind, ["test-run", "non-test", "unknown"]) &&
    oneOf(step.state, ["planned", "passed", "failed", "not-run", "unknown"]));
}

function attempt(value: unknown): DecodedAttempt | undefined {
  if (!object(value) || !matches(value.attemptId, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/) ||
    !oneOf(value.attemptKind, ["executed", "dry-run", "refused"]) ||
    !oneOf(value.ageStatus, ["current", "stale", "unknown"]) ||
    !oneOf(value.state, ["recorded", "partial", "planned", "refused", "run-record-lost"])) return;
  const { ageStatus, ageReason, observedFrom, observedTo, state, attemptKind, runId, txId } = value;
  if (!(observedFrom === null || date(observedFrom)) || !(observedTo === null || date(observedTo))) return;
  if (ageStatus === "unknown") {
    if (!oneOf(ageReason, ["attempt-time-invalid", "attempt-time-future"])) return;
  } else if (!absent(ageReason) || observedFrom === null || observedTo === null ||
    Date.parse(observedFrom) > Date.parse(observedTo)) return;

  const hasRun = state === "recorded" || state === "partial";
  if (hasRun) {
    if (attemptKind !== "executed" || !count(runId) || runId === 0 ||
      !(absent(txId) || uuid(txId))) return;
  } else if (!absent(runId) || !absent(txId) ||
    (state === "planned" && attemptKind !== "dry-run") ||
    (state === "refused" && attemptKind !== "refused") ||
    (!absent(value.outcomes) && !(Array.isArray(value.outcomes) && value.outcomes.length === 0))) return;

  const outcomes = value.outcomes;
  if (!(absent(outcomes) || (Array.isArray(outcomes) && outcomes.length <= selectionLimit &&
    outcomes.every((row, index) => outcome(row) && (index === 0 || row.index > outcomes[index - 1].index))))) return;
  if (!(absent(value.sample) || sample(value.sample))) return;
  const scope = (field: unknown) => oneOf(field, ["fast", "full", "refused"]);
  const selected = value.selectionEvidence;
  const selectionCaptured = !absent(selected);
  const refused = state === "refused";
  const validSelection = selection(selected) && oneOf(value.scopeRequested, ["fast", "full"]) &&
    scope(value.scopeExecuted) && state !== "run-record-lost" &&
    (value.scopeExecuted === "refused") === refused && (selected.basis === "refused") === refused &&
    selected.omissions.includes("refused-no-commands-run") === refused &&
    selected.omissions.includes("steps-not-run") === (state === "partial") &&
    sample(value.sample) && (value.sample.complete || selected.steps.length === selectionLimit) &&
    validSelectionOutcomes(selected.steps, outcomes ?? [], state, value.sample.complete);
  // Command outcomes come from independently checked run positions, even when
  // a separate selection section is corrupt or a legacy record has no plan.
  const validated = value as unknown as Attempt;
  return {
    ...validated,
    selectionEvidence: validSelection ? selected : undefined,
    selectionInvalid: (selectionCaptured && !validSelection) ||
      (!selectionCaptured && (!absent(value.scopeRequested) || !absent(value.scopeExecuted))),
  };
}

function validSelectionOutcomes(
  steps: Selection["steps"],
  outcomes: readonly Schema["Outcome"][],
  state: Attempt["state"],
  complete: boolean,
): boolean {
  if (state === "refused") return steps.length === 0 && outcomes.length === 0;
  if (state === "planned") return outcomes.length === 0 && steps.every((step) => step.state === "planned");
  if (outcomes.length > steps.length) return false;
  for (const [index, step] of steps.entries()) {
    const result = outcomes[index];
    if (result) {
      const observed = result.exitCode === 0 && !result.timedOut ? "passed" : "failed";
      if (result.index !== step.index || step.state !== observed) return false;
    } else if (state !== "partial" || step.state !== "not-run") return false;
  }
  return state !== "partial" || !complete || steps.length > outcomes.length;
}

function verification(value: unknown): Verification | undefined {
  if (!object(value)) return;
  if (value.status === "not-recorded" && value.reasonCode === "revision-not-captured" &&
    absent(value.attempts) && absent(value.sample)) return { status: value.status, reasonCode: value.reasonCode };
  if (value.status === "unavailable" && value.reasonCode === "attempts-unavailable" &&
    absent(value.attempts) && absent(value.sample)) return { status: value.status, reasonCode: value.reasonCode };
  if (value.status !== "recorded" || !object(value.sample) || typeof value.sample.complete !== "boolean" ||
    !Array.isArray(value.attempts) || value.attempts.length === 0 || value.attempts.length > 8) return;
  const attempts = value.attempts.map(attempt).filter((item) => item !== undefined);
  const uniqueAttempts = new Set(attempts.map((item) => item.attemptId));
  const runs = attempts.flatMap((item) => item.runId == null ? [] : [item.runId]);
  if (uniqueAttempts.size !== attempts.length || new Set(runs).size !== runs.length) return;
  return { status: value.status, attempts, sample: { complete: value.sample.complete }, invalidAttempts: attempts.length !== value.attempts.length };
}

export function decodeEvidencePacket(
  value: unknown,
  key: EvidenceKey,
  selected?: BaselineCandidate,
): EvidencePacket | undefined {
  if (!object(value) || value.schemaVersion !== 1 || typeof value.displayName !== "string" ||
    value.displayName !== safeRepositoryName(value.displayName)) return;
  const received = decodeEvidenceKey(value);
  if (!received || evidenceKeyId(received) !== evidenceKeyId(key)) return;
  if (selected
    ? !candidate(selected, key.base) ||
      value.baselineName !== selected.name || value.baselineDigest !== selected.payloadDigest
    : !absent(value.baselineName) || !absent(value.baselineDigest)) return;
  const baselineCandidates = candidates(value.baselineCandidates, key.base);
  const selectionImpossible = object(value.comparison) && value.comparison.status === "selection-required" &&
    baselineCandidates?.status === "ready" && baselineCandidates.complete &&
    baselineCandidates.items.length === 0;
  return {
    ...received,
    displayName: value.displayName,
    git: git(value.git) ? value.git : undefined,
    baselineCandidates,
    comparison: !selectionImpossible && comparison(value.comparison, key, Boolean(selected)) ? value.comparison : undefined,
    verification: verification(value.verification),
  };
}
