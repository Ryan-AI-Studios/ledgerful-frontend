"use client";

import { PageLayout } from "@/components/PageLayout";
import { useProject } from "@/lib/ProjectContext";
import { projects } from "@/lib/projects";
import { StatusDot } from "@/components/StatusDot";
import { Check, FolderGit2 } from "lucide-react";

export default function ProjectsPage() {
  const { project, setProject } = useProject();

  return (
    <PageLayout title="Projects">
      <div className="bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg p-6">
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          Select the project to analyze. Ledgerful scans the active project and
          updates the dashboard, ledger, and hotspots.
        </p>

        <div className="space-y-2">
          {projects.map((p) => {
            const active = p.id === project.id;
            return (
              <button
                key={p.id}
                onClick={() => setProject(p)}
                className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-colors duration-100 text-left ${
                  active
                    ? "bg-[rgba(0,229,160,0.06)] border-[var(--color-primary)]"
                    : "bg-[var(--color-surface)] border-[var(--color-border-muted)] hover:bg-[var(--color-surface-raised)]"
                }`}
              >
                <FolderGit2 className="w-8 h-8 text-[var(--color-text-muted)]" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-[1rem] font-semibold text-[var(--color-text-primary)]">
                      {p.name}
                    </span>
                    {active && (
                      <span className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--color-primary)]">
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-[var(--color-text-muted)] truncate">
                    {p.path}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <StatusDot status={p.status} label={p.status} />
                    <span className="text-[var(--color-text-secondary)]">Health {p.healthScore}/100</span>
                    <span className="text-[var(--color-text-muted)]">Scanned {p.lastScanAt}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
}
