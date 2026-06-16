"use client";

import { PageLayout } from "@/components/PageLayout";
import { useProject } from "@/lib/ProjectContext";
import { StatusDot } from "@/components/StatusDot";
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw } from "lucide-react";

type Status = "ok" | "warning" | "error";

const checks: { name: string; status: Status; detail: string }[] = [
  { name: "Ledger database", status: "ok", detail: "sqlite · 2,847 entries" },
  { name: "Graph database", status: "ok", detail: "cozo · 132 edges" },
  { name: "Signing key", status: "ok", detail: "Ed25519 · verified" },
  { name: "Git hook", status: "ok", detail: "commit-msg · active" },
  { name: "LLM backend", status: "warning", detail: "llama-server · fallback to Ollama Cloud" },
  { name: "Last scan", status: "ok", detail: "2d ago · 51 files" },
];

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

export default function StatusPage() {
  const { project } = useProject();

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

          <button className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--color-primary)] text-[var(--color-text-inverse)] text-sm font-semibold hover:bg-[var(--color-primary-muted)] transition-colors duration-100">
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Run doctor
          </button>
        </div>
      </div>
    </PageLayout>
  );
}
