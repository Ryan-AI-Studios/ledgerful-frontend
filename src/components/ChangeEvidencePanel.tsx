"use client";

import { useEffect, useState } from "react";
import { fetchChangeEvidence, type EvidenceRequestState } from "@/lib/api/change-evidence";
import {
  safeRepositoryName,
  type BaselineCandidate,
  type EvidenceKey,
} from "@/lib/api/change-evidence-decoder";
import { changeRowKey } from "@/lib/api/changes";
import { fetchProjects } from "@/lib/api/projects";
import { isApiError } from "@/lib/api";
import { useDaemonStatusDetail } from "@/lib/DaemonStatusContext";
import { SESSION_INVALID_EVENT } from "@/lib/events";
import { useProject } from "@/lib/ProjectContext";
import type { ChangeEntry, DataSource, Project } from "@/lib/types";
import { getAuthGeneration, getAuthToken } from "@/lib/utils";
import { ChangeEvidenceSections } from "./ChangeEvidenceSections";

const buttonClass = "rounded-md border border-[var(--color-border)] px-2.5 py-1.5 text-sm font-medium " +
  "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] " +
  "focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]";
const loading = { status: "loading" } as const;
const unauthorized = { status: "unauthorized" } as const;
type Reading = EvidenceRequestState | typeof loading;

const messages = {
  loading: "Loading change evidence…",
  unauthorized: "Sign in to view change evidence.",
  timeout: "Change evidence request timed out.",
  invalid: "Invalid change evidence response.",
  missing: "No evidence is available for this exact revision pair.",
  budget: "Comparison stopped at the request limit.",
  disabled: "Change evidence is disabled on this daemon.",
  uninitialized: "This repository has no initialized change evidence.",
  unsupported: "This daemon does not provide change evidence.",
  busy: "The daemon is busy serving evidence.",
  scope: "The daemon could not establish its repository scope.",
  "rate-limited": "The daemon is limiting evidence requests.",
  error: "Change evidence could not be loaded.",
} satisfies Record<Exclude<Reading["status"], "ready">, string>;

const retryable = new Set<Reading["status"]>([
  "timeout", "invalid", "missing", "budget", "busy", "scope", "rate-limited", "error",
]);

function RequestFeedback({
  status,
  retry,
}: { status: Exclude<Reading["status"], "ready">; retry: () => void }) {
  return (
    <div className="space-y-2">
      <p role="status">{messages[status]}</p>
      {retryable.has(status) && (
        <button type="button" className={buttonClass} onClick={retry}>Retry evidence</button>
      )}
    </div>
  );
}

/** Each mounted request belongs to one exact selection and authentication generation. */
function useEvidenceRequest<T>(
  fetchData: (signal: AbortSignal) => Promise<T>,
  fallback: (error: unknown) => T,
) {
  const [reading, setReading] = useState<T | typeof loading | typeof unauthorized>(loading);
  const [requestNumber, setRequestNumber] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const generation = getAuthGeneration();
    const current = () => !controller.signal.aborted && generation === getAuthGeneration();
    const invalidate = () => {
      controller.abort();
      setReading(unauthorized);
    };
    window.addEventListener(SESSION_INVALID_EVENT, invalidate);

    if (getAuthToken()) {
      void fetchData(controller.signal)
        .then((data) => {
          if (current()) setReading(data);
        })
        .catch((error: unknown) => {
          if (current()) setReading(fallback(error));
        });
    } else {
      queueMicrotask(() => {
        if (current()) setReading(unauthorized);
      });
    }
    return () => {
      controller.abort();
      window.removeEventListener(SESSION_INVALID_EVENT, invalidate);
    };
  }, [fetchData, fallback, requestNumber]);

  return {
    reading,
    retry() {
      setReading(loading);
      setRequestNumber((version) => version + 1);
    },
  };
}

function comparisonRequestError(): EvidenceRequestState {
  return { status: "error" };
}

function useExactEvidence(key: EvidenceKey, baseline?: BaselineCandidate) {
  // The callers key each mounted instance by the full pair and baseline
  // selection. Capture that request so unrelated parent renders can't replace it.
  const [load] = useState(() => (
    (signal: AbortSignal) => fetchChangeEvidence(key, baseline, signal)
  ));
  return useEvidenceRequest(load, comparisonRequestError);
}

function SelectedEvidence({ evidenceKey, baseline }: {
  evidenceKey: EvidenceKey;
  baseline: BaselineCandidate;
}) {
  const { reading, retry } = useExactEvidence(evidenceKey, baseline);
  return (
    <>
      <p role="status" className="sr-only">
        {reading.status === "ready" ? "Change evidence ready for the selected baseline." : ""}
      </p>
      {reading.status === "ready"
        ? <ChangeEvidenceSections packet={reading.packet} baseline={baseline} />
        : <RequestFeedback status={reading.status} retry={retry} />}
    </>
  );
}

function PairEvidence({ evidenceKey, displayName }: { evidenceKey: EvidenceKey; displayName: string }) {
  const { reading, retry } = useExactEvidence(evidenceKey);
  return (
    <>
      <p role="status" className="sr-only">
        {reading.status === "ready" ? "Revision evidence loaded." : ""}
      </p>
      {reading.status === "ready"
        ? <BaselineEvidence evidenceKey={evidenceKey} displayName={displayName} packet={reading.packet} />
        : <RequestFeedback status={reading.status} retry={retry} />}
    </>
  );
}

function BaselineEvidence({ evidenceKey, displayName, packet }: {
  evidenceKey: EvidenceKey;
  displayName: string;
  packet: Extract<EvidenceRequestState, { status: "ready" }>["packet"];
}) {
  const [choice, setChoice] = useState<string>();
  const [copyStatus, setCopyStatus] = useState("");

  const candidates = packet.baselineCandidates;
  const items = candidates?.status === "ready" ? candidates.items : [];
  const auto = candidates?.status === "ready" && candidates.complete && items.length === 1 ? items[0] : undefined;
  const selected = choice === undefined ? auto : items.find((item) => item.name === choice);

  async function copyRevision() {
    try {
      await navigator.clipboard.writeText(evidenceKey.head);
      setCopyStatus("Revision copied.");
    } catch {
      setCopyStatus("Copy unavailable. Select the full revision text to copy it.");
    }
  }

  return (
    <div className="space-y-4">
      <dl className="grid gap-2 break-all rounded-md bg-[var(--color-surface)] p-3">
        <div><dt className="text-xs">Served repository</dt><dd>{displayName}</dd></div>
        <div><dt className="text-xs">Daemon repository scope</dt><dd className="font-mono">{evidenceKey.repoScope}</dd></div>
        <div>
          <dt className="text-xs">Selected revision</dt>
          <dd className="flex flex-wrap items-center gap-2">
            <code>{evidenceKey.head}</code>
            <button type="button" onClick={() => void copyRevision()} className={buttonClass}>Copy revision</button>
          </dd>
        </div>
        <div><dt className="text-xs">First parent</dt><dd className="font-mono">{evidenceKey.base}</dd></div>
      </dl>
      <p role="status" className={copyStatus ? undefined : "sr-only"}>{copyStatus}</p>
      <div className="space-y-2">
        <p className="font-semibold text-[var(--color-text-primary)]">First-parent baseline</p>
        {!candidates ? <p>Invalid baseline candidate response.</p>
          : candidates.status === "unavailable" ? <p>Baseline candidates could not be read.</p> : (
            <>
              {!candidates.complete && <p role="status">Baseline candidate list is partial. Additional candidates may be omitted.</p>}
              {(items.length > 0 || !candidates.complete) && (
                <label className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">Baseline</span>
                  <select
                    value={selected?.name ?? ""}
                    onChange={(event) => setChoice(event.target.value)}
                    className="min-w-0 max-w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-[var(--color-text-primary)]"
                  >
                    <option value="">Choose a baseline</option>
                    {items.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
                  </select>
                </label>
              )}
            </>
          )}
        {selected && (
          <dl className="grid gap-2">
            <div><dt className="text-xs">Stored payload digest</dt><dd className="break-all font-mono">{selected.payloadDigest}</dd></div>
            <div><dt className="text-xs">Baseline revision binding observed</dt>
              <dd><time dateTime={selected.observedAt}>{selected.observedAt}</time></dd>
            </div>
          </dl>
        )}
      </div>
      {selected
        ? <SelectedEvidence key={selected.name + ":" + selected.payloadDigest} evidenceKey={evidenceKey} baseline={selected} />
        : <ChangeEvidenceSections packet={packet} />}
    </div>
  );
}

type Discovery = { status: "ready"; primary: Project } | { status: "error" | "timeout" | "invalid" };

async function discoverPrimary(signal: AbortSignal): Promise<Discovery> {
  // The engine emits its actual serving project first. Siblings in the same
  // list are switcher entries and never retarget the daemon.
  const [primary, ...siblings] = await fetchProjects(signal);
  if (!primary || typeof primary.id !== "string" || typeof primary.path !== "string" ||
    typeof primary.name !== "string" || siblings.some((sibling) => sibling.changeEvidence)) {
    return { status: "invalid" };
  }
  return { status: "ready", primary };
}

function discoveryError(error: unknown): Discovery {
  if (error instanceof Error && error.name === "TimeoutError") return { status: "timeout" };
  if (isApiError(error) && error.status === 200) return { status: "invalid" };
  return { status: "error" };
}

const incompatibleStatus = {
  "scope-unavailable": "scope",
  "schema-incompatible": "unsupported",
  "storage-busy": "busy",
  "request-budget": "budget",
  "worker-saturated": "busy",
} as const;

function ScopedEvidence({ row, project }: { row: ChangeEntry; project: Project }) {
  const { reading, retry } = useEvidenceRequest(discoverPrimary, discoveryError);
  if (reading.status !== "ready") return <RequestFeedback status={reading.status} retry={retry} />;
  const primary = reading.primary;
  const capability = primary.changeEvidence;
  const displayName = capability?.status === "ready" ? capability.displayName : safeRepositoryName(primary.name);
  if (project.id !== primary.id || project.path !== primary.path) {
    return <p role="status">Selected project: {safeRepositoryName(project.name)}. Connected daemon serves {displayName}.</p>;
  }

  if (capability?.status !== "ready") {
    const status = capability?.status === "incompatible"
      ? incompatibleStatus[capability.reasonCode]
      : capability?.status ?? "unsupported";
    return <RequestFeedback status={status} retry={retry} />;
  }
  if (row.evidenceIdentityInvalid) return <RequestFeedback status="invalid" retry={retry} />;
  if (!row.evidenceKey) {
    return <p role="status">{row.id === "working-tree"
      ? "Before/after evidence is available for committed changes."
      : "This change has no supported first-parent revision pair."}</p>;
  }
  if (row.evidenceKey.repoScope !== capability.repoScope) {
    return <p role="status">The change belongs to a different daemon repository scope. Reload Changes.</p>;
  }
  return <PairEvidence evidenceKey={row.evidenceKey} displayName={displayName} />;
}

export function ChangeEvidencePanel({
  row, source, panelId, onClose,
}: { row: ChangeEntry; source: DataSource; panelId: string; onClose: () => void }) {
  const { project, isLoaded } = useProject();
  const daemon = useDaemonStatusDetail();
  const headingId = panelId + "-title";

  return (
    <section id={panelId} aria-labelledby={headingId}
      className="mt-4 space-y-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4 text-sm text-[var(--color-text-secondary)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 id={headingId} className="text-lg font-semibold text-[var(--color-text-primary)]">Change evidence</h2>
          <p className="break-words">{row.summary}</p>
        </div>
        <button type="button" className={buttonClass} onClick={onClose}>Close evidence</button>
      </div>
      {source === "mock" ? <p role="status">Example data. Live change evidence is unavailable.</p>
        : source !== "live" || daemon.isDaemonOffline ? <p role="status">Daemon unavailable.</p>
          : daemon.sseState === "reconnecting" ? <p role="status">Reconnecting to the daemon…</p>
            : !isLoaded ? <p role="status">Loading change evidence…</p>
              : <ScopedEvidence key={JSON.stringify([project.id, project.path, changeRowKey(row)])} row={row} project={project} />}
    </section>
  );
}
