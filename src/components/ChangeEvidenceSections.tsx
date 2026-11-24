"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { BaselineCandidate, EvidencePacket } from "@/lib/api/change-evidence-decoder";
import type { components } from "@/lib/api/generated";

type Schema = components["schemas"];
type Comparison = NonNullable<EvidencePacket["comparison"]>;
type Comparable = Extract<Comparison, { status: "comparable" }>;
type Verification = NonNullable<EvidencePacket["verification"]>;
type Attempt = Extract<Verification, { status: "recorded" }>["attempts"][number];

const rowClass = "rounded-md border border-[var(--color-border)] p-3";
const factsClass = "grid gap-x-6 gap-y-2 sm:grid-cols-2";
const codeClass = "break-all font-mono text-[var(--color-text-primary)]";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 border-t border-[var(--color-border)] pt-4">
      <h3 className="text-base font-semibold text-[var(--color-text-primary)]">{title}</h3>
      {children}
    </section>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return <div className="min-w-0"><dt className="text-xs">{label}</dt><dd>{children}</dd></div>;
}

function ProducerNotes({ heading, values }: { heading: string; values: readonly string[] }) {
  if (values.length === 0) return null;
  return (
    <div>
      <p className="font-medium">{heading}</p>
      <ul className="list-disc pl-5">
        {values.map((value, index) => (
          <li key={index} className="break-words">
            {Object.hasOwn(noteLabels, value) ? noteLabels[value] : value}
          </li>
        ))}
      </ul>
    </div>
  );
}

const noteLabels: Record<string, string> = {
  analyzerBuildDiffers: "The analyzer build differs between the two inputs.",
  RESOLVED_EDGES_REMOVED: "Resolved edges were lost without an observed improvement in resolution coverage.",
  AMBIGUOUS_GREW: "Ambiguous call resolutions increased.",
  UNRESOLVED_GREW: "Unresolved calls increased.",
  CURRENT_INCOMPLETE: "The current index input is incomplete.",
  BASELINE_INCOMPLETE: "The baseline index input is incomplete.",
  BASELINE_DIGEST_MISMATCH: "The baseline payload digest does not match.",
  EDGE_SOURCES_MISMATCH: "The edge sources differ.",
  PARSER_VERSION_MISMATCH: "The parser versions differ.",
  SCHEMA_MISMATCH: "The analysis schemas differ.",
  SCOPE_MISMATCH: "The analysis scopes differ.",
  "no-test-command-planned": "No test command was planned.",
  "refused-no-commands-run": "The planner refused the request before any commands ran.",
  "fallback-to-full": "The planner fell back to full scope.",
  "steps-not-run": "Some planned steps did not run.",
  "result-correspondence-unknown": "The corresponding result could not be established for some plan steps.",
  "impact-stale": "The impact report was stale.",
  "impact-corrupt": "The impact report could not be read.",
  "impact-missing": "The impact report was missing.",
  "impact-freshness-not-evaluated": "Impact freshness was not evaluated.",
  "prediction-not-run": "Prediction did not run.",
  "prediction-warnings-present": "The prediction reported warnings.",
  "selection-soundness-not-established": "Selection soundness was not established.",
};

const fileLabels = {
  added: "Added",
  modified: "Modified",
  deleted: "Deleted",
  rewrite: "Renamed",
} satisfies Record<Schema["PreparedFileKind"], string>;

function GitFiles({ git }: Pick<EvidencePacket, "git">) {
  return (
    <Section title="Changed files">
      {!git ? <p>Invalid changed-files response.</p>
        : git.status === "unavailable" ? (
          <p>{git.reasonCode === "not-prepared"
            ? "Changed files have not been prepared for this pair."
            : "Changed files could not be read for this pair."}</p>
        ) : (
          <>
            {git.status === "partial" && <p role="status">File evidence is partial.</p>}
            {"reasonCode" in git && git.reasonCode === "unsupported-tree-path" && (
              <p>The daemon omitted paths outside its supported format.</p>
            )}
            {git.total != null && <p>Showing {git.files.length} of {git.total} changed files.</p>}
            {git.omitted != null && git.omitted > 0 && <p>{git.omitted} files omitted.</p>}
            {git.files.length === 0 && git.status === "ready" && <p>No changed files in this pair.</p>}
            {git.files.length > 0 && (
              <ul aria-label="Exact changed files" className="space-y-2">
                {git.files.map((file, index) => (
                  <li className={rowClass} key={index}>
                    <p className="font-medium">{fileLabels[file.kind]}</p>
                    {file.oldPath && (
                      <p>First parent <code className={codeClass}>{file.oldPath}</code></p>
                    )}
                    <p>
                      {file.kind === "deleted" ? "First parent " : file.kind === "modified" ? "Both revisions " : "Selected revision "}
                      <code className={codeClass}>{file.path}</code>
                    </p>
                    <p>Additions {file.additions ?? "Unavailable"} · Deletions {file.deletions ?? "Unavailable"}
                      {file.isBinary === true && " · Binary"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
    </Section>
  );
}

const comparisonMessages: Record<Schema["ComparisonReason"], string> = {
  "baseline-missing": "No matching baseline recorded.",
  "baseline-unattested": "Baseline revision binding unavailable.",
  "baseline-wrong-parent": "Baseline does not match this change’s parent.",
  "baseline-digest-mismatch": "The stored baseline digest no longer matches the selection.",
  "baseline-incompatible": "The selected baseline is incompatible.",
  "not-prepared": "No comparison has been prepared for this pair and baseline.",
  "live-proof-unavailable": "The current checkout or index binding could not be verified.",
  "historical-head": "Before/after comparison is available for the current committed revision.",
  "head-moved": "The checked-out revision moved. Reload Changes.",
  "dirty-worktree": "The checkout has uncommitted changes.",
  "index-stale": "Current index is stale.",
  "config-changed": "The analyzer configuration changed after preparation.",
  "proof-stale": "The stored checkout and index observation is stale.",
  "proof-time-invalid": "The stored observation time could not be verified.",
  "proof-time-future": "The stored observation time is in the future.",
  "unsupported-input-encoding": "The analyzer input encoding is unsupported.",
  "unsupported-tree-path": "A tree path is outside the supported format.",
  "index-generation-mismatch": "Current index is stale. Its generation changed.",
  "index-parser-version-mismatch": "The current index uses a different parser version.",
  "index-input-stamp-missing": "The current index lacks an input stamp.",
  "index-input-stamp-mismatch": "Current index is stale. The input stamp changed.",
  "index-input-hash-mismatch": "Current index is stale. The indexed bytes do not match the checked input.",
  "index-input-unavailable": "The current indexed inputs could not be read.",
};

const edgeLabels = {
  added: "Added",
  removed: "Removed",
  worsened: "More resolved calls",
  improved: "Fewer resolved calls",
  unchanged: "Unchanged",
} satisfies Record<Schema["DeltaClass"], string>;

function Delta({ value }: { value: Comparable }) {
  const changed = value.counts.added + value.counts.removed + value.counts.worsened + value.counts.improved;
  const covered = value.currentCoverage;
  const baselineCoverage = value.baselineCoverage;
  return (
    <>
      <p>Observed repository-wide differences in resolved file-to-file calls. A changed count does not identify the cause or establish a policy or runtime result.</p>
      {value.regression === "unknown" && (
        <p role="status" className="font-medium text-[var(--color-text-primary)]">
          Coverage limits leave the overall relationship result unknown. Observed differences are shown below.
        </p>
      )}
      {!value.sample.complete && <p role="status">Evidence is partial. Showing {value.items.length} of {changed} changed relationships. {value.sample.omitted} omitted.</p>}
      {value.regression === "none" && value.sample.complete && (
        <p>No new or increased resolved call relationships observed.</p>
      )}
      {changed === 0 && value.sample.complete && <p>No changed resolved relationships in the compared inputs.</p>}
      <dl className={factsClass}>
        <Fact label="Unchanged resolved relationships">{value.counts.unchanged}</Fact>
        <Fact label="Comparison prepared"><time dateTime={value.capturedAt}>{value.capturedAt}</time></Fact>
        <Fact label="Current inputs checked"><time dateTime={value.liveCheckedAt}>{value.liveCheckedAt}</time></Fact>
        <Fact label="Analyzer scope">Repository · {value.currentIdentity.edgeSources.join(", ") || "Edge sources unavailable"}</Fact>
        <Fact label="Baseline analyzer build">{value.baselineIdentity.ledgerfulVersion}</Fact>
        <Fact label="Current analyzer build">{value.currentIdentity.ledgerfulVersion}</Fact>
      </dl>
      <p>Checkout and index checks describe the observed inputs. Later edits can invalidate the comparison.</p>
      <details>
        <summary className="cursor-pointer">Input and resolution coverage</summary>
        <dl className={factsClass}>
          <Fact label="Baseline input digest"><code className={codeClass}>{value.baselineIdentity.inputDigest}</code></Fact>
          <Fact label="Current input digest"><code className={codeClass}>{value.currentIdentity.inputDigest}</code></Fact>
          <Fact label="Unresolved calls (before → after)">{baselineCoverage.edgesUnresolved} → {covered.edgesUnresolved}</Fact>
          <Fact label="Ambiguous calls (before → after)">{baselineCoverage.edgesAmbiguous} → {covered.edgesAmbiguous}</Fact>
          <Fact label="Capped edges (before → after)">{baselineCoverage.edgesCapped} → {covered.edgesCapped}</Fact>
          <Fact label="Files with parse failures (before → after)">{baselineCoverage.filesParseFailed} → {covered.filesParseFailed}</Fact>
        </dl>
      </details>
      <ProducerNotes heading="Coverage reasons" values={value.regressionReasons} />
      <ProducerNotes heading="Comparison notes" values={value.notes} />
      <ul aria-label="Resolved call relationships" className="space-y-2">
        {value.items.map(({ edgeKey, class: category, baselineWeight, currentWeight }) => (
          <li className={rowClass} key={edgeKey.srcPath + ":" + edgeKey.dstPath}>
            <p className="font-medium">{edgeLabels[category]}</p>
            <p>
              <code className={codeClass}>{edgeKey.srcPath}</code>
              <span aria-label="calls"> → </span>
              <code className={codeClass}>{edgeKey.dstPath}</code>
            </p>
            <dl className={factsClass}>
              <Fact label="Before · first parent">{baselineWeight ?? "Edge absent"}</Fact>
              <Fact label="After · selected revision">{currentWeight ?? "Edge absent"}</Fact>
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

function Dependencies({
  comparison,
  baselineCandidates,
  baseline,
}: Pick<EvidencePacket, "comparison" | "baselineCandidates"> & { baseline?: BaselineCandidate }) {
  return (
    <Section title="Dependency changes">
      {!comparison ? <p>Invalid dependency comparison response.</p>
        : comparison.status === "selection-required" ? <p>Choose a baseline.</p>
          : comparison.status === "unavailable" ? (
            <p>{!baseline && comparison.reasonCode === "not-prepared" &&
              baselineCandidates?.status === "ready" && baselineCandidates.complete &&
              baselineCandidates.items.length === 0
              ? "No matching baseline recorded."
              : comparisonMessages[comparison.reasonCode]}</p>
          ) : comparison.status === "incomparable" ? (
            <>
              <p>Baseline and current inputs cannot be compared.</p>
              <ProducerNotes heading="Comparison reasons" values={comparison.incomparableReasons} />
              <ProducerNotes heading="Current input reasons" values={comparison.currentInputReasons} />
              <ProducerNotes heading="Comparison notes" values={comparison.notes} />
            </>
          ) : <Delta value={comparison} />}
    </Section>
  );
}

const attemptLabels = {
  recorded: "Recorded execution",
  partial: "Partial execution evidence",
  planned: "Dry run",
  refused: "Verification refused",
  "run-record-lost": "Canonical run record unavailable",
} satisfies Record<Schema["AttemptStatus"], string>;

const stepLabels = {
  planned: "Planned",
  passed: "Recorded success",
  failed: "Recorded failure",
  "not-run": "Not run",
  unknown: "Unknown",
} satisfies Record<Schema["StepState"], string>;

function Selection({ attempt }: { attempt: Attempt }) {
  const evidence = attempt.selectionEvidence;
  return (
    <div className="space-y-2">
      <h5 className="font-semibold">Selection and prediction</h5>
      {!evidence ? (
        <p>{attempt.selectionInvalid
          ? "Invalid selection evidence response."
          : "Selection evidence not captured for this run."}</p>
      ) : (
        <>
          <dl className={factsClass}>
            <Fact label="Scope requested">{attempt.scopeRequested}</Fact>
            <Fact label={attempt.attemptKind === "dry-run" ? "Dry-run scope" : "Scope executed"}>{attempt.scopeExecuted}</Fact>
            <Fact label="Selection basis">{evidence.basis}</Fact>
            <Fact label="Prediction">{evidence.prediction.state} · {evidence.prediction.warningCount} warnings</Fact>
            {evidence.prediction.impactFreshness && (
              <Fact label="Impact freshness">{evidence.prediction.impactFreshness}</Fact>
            )}
          </dl>
          <ProducerNotes heading="Omissions" values={evidence.omissions} />
          <ProducerNotes heading="Limitations" values={evidence.limitationCodes} />
          {evidence.steps.length > 0 && (
            <ol aria-label="Plan steps" className="space-y-1">
              {evidence.steps.map((step) => {
                const result = attempt.outcomes?.find((outcome) => outcome.index === step.index);
                const state = !result && (step.state === "passed" || step.state === "failed")
                  ? "Outcome unavailable"
                  : stepLabels[step.state];
                return (
                  <li key={step.index}>
                    Position {step.index} · {step.command === "withheld" ? "Command withheld" : <code>{step.command}</code>}
                    {" · "}{step.kind}{" · "}{state}
                  </li>
                );
              })}
            </ol>
          )}
        </>
      )}
    </div>
  );
}

function Outcomes({ attempt }: { attempt: Attempt }) {
  return (
    <div className="space-y-2">
      <h5 className="font-semibold">Recorded command outcomes</h5>
      {attempt.state === "run-record-lost"
        ? <p>Command outcomes are unavailable because the canonical run record was lost.</p>
        : attempt.attemptKind !== "executed"
          ? <p>Zero observed commands.</p>
          : !attempt.outcomes?.length
            ? <p>No command outcomes are available for this run.</p>
            : (
              <ul aria-label="Recorded exits" className="space-y-1">
                {attempt.outcomes.map((outcome) => {
                  const command = attempt.selectionEvidence?.steps.find((step) => step.index === outcome.index)?.command;
                  return (
                    <li key={outcome.index}>
                      Position {outcome.index} · {command === "git --version" ? <code>{command}</code> : "Command withheld"}
                      {" · "}{outcome.timedOut ? "Timed out" : outcome.exitCode === 0 ? "Recorded success" : "Recorded failure"}
                      {" · "}exit {outcome.exitCode} · {outcome.durationMs} ms
                    </li>
                  );
                })}
              </ul>
            )}
    </div>
  );
}

function VerificationDetails({ verification }: Pick<EvidencePacket, "verification">) {
  return (
    <Section title="Verification">
      {!verification ? <p>Invalid verification evidence response.</p>
        : verification.status === "not-recorded" ? (
          <p>No verification recorded for this revision. Transaction history may include runs outside this revision’s evidence scope.</p>
        ) : verification.status === "unavailable" ? <p>Verification evidence could not be read.</p> : (
          <>
            <p>These records refer to the selected revision. Exits report command outcomes only.</p>
            {!verification.sample.complete && <p role="status">Verification history is partial. More attempts may exist.</p>}
            {verification.invalidAttempts && <p role="status">Some verification attempt records were invalid.</p>}
            {verification.attempts.map((attempt) => (
              <article className={rowClass + " space-y-3"} key={attempt.attemptId}>
                <h4 className="font-semibold text-[var(--color-text-primary)]">{attemptLabels[attempt.state]}</h4>
                <dl className={factsClass}>
                  <Fact label="Attempt ID"><code className={codeClass}>{attempt.attemptId}</code></Fact>
                  {attempt.runId != null && <Fact label="Run ID">{attempt.runId}</Fact>}
                  {attempt.observedFrom && (
                    <Fact label="Observation started"><time dateTime={attempt.observedFrom}>{attempt.observedFrom}</time></Fact>
                  )}
                  {attempt.observedTo && (
                    <Fact label="Observation ended"><time dateTime={attempt.observedTo}>{attempt.observedTo}</time></Fact>
                  )}
                </dl>
                {attempt.ageStatus === "stale" && <p role="status">The recorded run is stale.</p>}
                {attempt.ageStatus === "unknown" && (
                  <p role="status">{attempt.ageReason === "attempt-time-future"
                    ? "The observation is dated in the future. Record age is unknown."
                    : "The observation time is invalid. Record age is unknown."}</p>
                )}
                {(attempt.state === "partial" || attempt.sample?.complete === false) && (
                  <p role="status">Evidence is partial.
                    {attempt.sample?.omitted ? " " + attempt.sample.omitted + " plan positions omitted." : ""}
                  </p>
                )}
                <Selection attempt={attempt} />
                <Outcomes attempt={attempt} />
                {attempt.txId && (
                  <p>
                    <Link
                      className="text-[var(--color-primary)] underline underline-offset-2"
                      href={{ pathname: "/ledger/detail", query: { txId: attempt.txId } }}
                      prefetch={false}
                    >Ledger transaction</Link>
                    {" · Transaction context"}
                  </p>
                )}
              </article>
            ))}
          </>
        )}
    </Section>
  );
}

export function ChangeEvidenceSections({ packet, baseline }: { packet: EvidencePacket; baseline?: BaselineCandidate }) {
  return (
    <div className="space-y-4 text-sm text-[var(--color-text-secondary)]">
      <GitFiles git={packet.git} />
      <Dependencies comparison={packet.comparison} baselineCandidates={packet.baselineCandidates} baseline={baseline} />
      <VerificationDetails verification={packet.verification} />
    </div>
  );
}
