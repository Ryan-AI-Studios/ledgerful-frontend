"use client";

import { useEffect, useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { useProject } from "@/lib/ProjectContext";
import { StatusDot } from "@/components/StatusDot";
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw } from "lucide-react";
import { buildApiUrl } from "@/lib/utils";

type Status = "ok" | "warning" | "error";

interface StatusCheck {
  name: string;
  status: Status;
  detail: string;
}

interface StatusResponse {
  index_ready: boolean;
  graph_ready: boolean;
  pending_transactions: number;
  unaudited_drift: number;
  embedding_model_reachable: boolean;
  completion_model_reachable: boolean;
}

const statusIcon: Record<Status, typeof CheckCircle2> = {
  ok: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

const statusColor: Record<Status, string> = {
  ok: "var(--color-success)",
  warning: "var(--color-warning)",
  error: "var(--color-danger)",
};

function buildChecks(data: StatusResponse): StatusCheck[] {
  return [
    {
      name: "Index database",
      status: data.index_ready ? "ok" : "error",
      detail: data.index_ready ? "tantivy · ready" : "tantivy · not initialized",
    },
    {
      name: "Graph database",
      status: data.graph_ready ? "ok" : "error",
      detail: data.graph_ready ? "cozo · ready" : "cozo · not initialized",
    },
    {
      name: "Ledger",
      status: data.pending_transactions > 0 || data.unaudited_drift > 0 ? "warning" : "ok",
      detail: `${data.pending_transactions} pending · ${data.unaudited_drift} unaudited drift`,
    },
    {
      name: "Embedding model",
      status: data.embedding_model_reachable ? "ok" : "warning",
      detail: data.embedding_model_reachable ? "reachable" : "unreachable",
    },
    {
      name: "Completion model",
      status: data.completion_model_reachable ? "ok" : "warning",
      detail: data.completion_model_reachable ? "reachable" : "unreachable",
    },
  ];
}

export default function StatusPage() {
  const { project } = useProject();
  const [checks, setChecks] = useState<StatusCheck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(buildApiUrl("/status"))
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: StatusResponse) => {
        setChecks(buildChecks(data));
        setLoading(false);
      })
      .catch(() => {
        setChecks([]);
        setLoading(false);
      });
  }, []);

  return (
    <PageLayout title="Status">
      <div className="space-y-6">
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

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 rounded bg-[var(--color-surface-raised)]" />
              ))}
            </div>
          ) : (
            <ul className="divide-y divide-[var(--color-border-muted)]" role="list">
            {checks.map((check) => {
              const Icon = statusIcon[check.status];
              return (
                <li key={check.name} className="py-3 flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Icon
                      className="w-5 h-5 flex-shrink-0 mt-0.5"
                      style={{ color: statusColor[check.status] }}
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
                    className="text-[0.6875rem] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                    style={{
                      color: statusColor[check.status],
                      borderColor: statusColor[check.status],
                    }}
                  >
                    {check.status}
                  </span>
                </li>
              );
            })}
          </ul>
          )}

          <button className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--color-primary)] text-[var(--color-text-inverse)] text-sm font-semibold hover:bg-[var(--color-primary-muted)] transition-colors duration-100">
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Run doctor
          </button>
        </div>
      </div>
    </PageLayout>
  );
}
