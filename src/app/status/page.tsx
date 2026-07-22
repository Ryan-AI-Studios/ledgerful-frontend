"use client";

import { useEffect, useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { useProject } from "@/lib/ProjectContext";
import { StatusDot } from "@/components/StatusDot";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { fetchStatus, StatusResponse } from "@/lib/status-data";
import { DataSource } from "@/lib/fallback";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";

type Status = "ok" | "warning" | "error";

interface StatusCheck {
  name: string;
  status: Status;
  detail: string;
}

const statusIcon: Record<Status, typeof CheckCircle2> = {
  ok: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

const statusTextClass: Record<Status, string> = {
  ok: "text-[var(--color-success)]",
  warning: "text-[var(--color-warning)]",
  error: "text-[var(--color-danger)]",
};

const statusBorderClass: Record<Status, string> = {
  ok: "border-[var(--color-success)]",
  warning: "border-[var(--color-warning)]",
  error: "border-[var(--color-danger)]",
};

function buildChecks(data: StatusResponse): StatusCheck[] {
  return [
    {
      name: "Index database",
      status: data.indexReady ? "ok" : "error",
      detail: data.indexReady ? "tantivy · ready" : "tantivy · not initialized",
    },
    {
      name: "Graph database",
      status: data.graphReady ? "ok" : "error",
      detail: data.graphReady ? "cozo · ready" : "cozo · not initialized",
    },
    {
      name: "Ledger",
      status: data.pendingTransactions > 0 || data.unauditedDrift > 0 ? "warning" : "ok",
      detail: `${data.pendingTransactions} pending · ${data.unauditedDrift} unaudited drift`,
    },
    {
      name: "Embedding model",
      status: data.embeddingModelReachable ? "ok" : "warning",
      detail: data.embeddingModelReachable ? "reachable" : "unreachable",
    },
    {
      name: "Completion model",
      status: data.completionModelReachable ? "ok" : "warning",
      detail: data.completionModelReachable ? "reachable" : "unreachable",
    },
  ];
}

type StatusPageState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; checks: StatusCheck[]; source: DataSource };

export default function StatusPage() {
  const { project } = useProject();
  const [state, setState] = useState<StatusPageState>({ status: "loading" });

  const load = () => {
    fetchStatus()
      .then((result) =>
        setState({
          status: "ready",
          checks: buildChecks(result.data),
          source: result.source,
        }),
      )
      .catch(() =>
        setState({
          status: "error",
          message:
            "Could not load daemon status. The Ledgerful daemon may not be running.",
        }),
      );
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <PageLayout title="Status">
      <div className="space-y-6">
        {state.status === "ready" && (
          <div className="flex items-center gap-3">
            <DataSourceBadge source={state.source} />
          </div>
        )}

        <div className="bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg p-6">
          <div className="flex items-center gap-4">
            <StatusDot status={project.status} />
            <div>
              <div className="text-[1.25rem] font-semibold text-[var(--color-text-primary)] capitalize">
                {project.status}
              </div>
              <div className="text-sm text-[var(--color-text-secondary)]">
                Project health {project.healthScore}/100 · last scan{" "}
                {project.lastScanAt}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg p-6">
          <h2 className="text-[1rem] font-semibold text-[var(--color-text-primary)] mb-4">
            System checks
          </h2>

          {state.status === "loading" && (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 rounded bg-[var(--color-surface-raised)]" />
              ))}
            </div>
          )}

          {state.status === "error" && (
            <div className="bg-[var(--color-surface-alt)] border border-[var(--color-danger-muted)] rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertCircle
                  className="w-5 h-5 text-[var(--color-danger)] flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div>
                  <h2 className="text-[1rem] font-semibold text-[var(--color-danger)]">
                    Failed to load
                  </h2>
                  <p className="mt-1 text-[var(--color-text-secondary)]">
                    {state.message}
                  </p>
                  <button
                    onClick={() => { setState({ status: "loading" }); load(); }}
                    className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm font-medium hover:bg-[var(--color-surface-raised)] transition-colors duration-100"
                  >
                    <RefreshCw className="w-4 h-4" aria-hidden="true" />
                    Retry
                  </button>
                </div>
              </div>
            </div>
          )}

          {state.status === "ready" && (
            <ul className="divide-y divide-[var(--color-border-muted)]" role="list">
              {state.checks.map((check) => {
                const Icon = statusIcon[check.status];
                return (
                  <li
                    key={check.name}
                    className="py-3 flex items-start justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <Icon
                        className={cn(
                          "w-5 h-5 flex-shrink-0 mt-0.5",
                          statusTextClass[check.status],
                        )}
                        aria-hidden="true"
                      />
                      <div>
                        <div className="text-sm font-medium text-[var(--color-text-primary)]">
                          {check.name}
                        </div>
                        <div className="text-sm text-[var(--color-text-secondary)]">
                          {check.detail}
                        </div>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "text-[0.6875rem] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                        statusTextClass[check.status],
                        statusBorderClass[check.status],
                      )}
                    >
                      {check.status}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-4 flex flex-col items-start gap-1">
            <button
              type="button"
              disabled
              aria-disabled="true"
              aria-label="Run doctor (via CLI only)"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--color-primary)] text-[var(--color-text-inverse)] text-sm font-semibold opacity-50 cursor-not-allowed"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              Run doctor
            </button>
            <p className="text-xs text-[var(--color-text-muted)]">
              Via CLI: <code className="font-mono">ledgerful doctor</code>
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
