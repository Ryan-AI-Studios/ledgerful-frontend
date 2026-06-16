"use client";

import { RecentChange } from "@/lib/types";
import { RiskBadge } from "./RiskBadge";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface RecentChangesProps {
  changes: RecentChange[];
}

export function RecentChanges({ changes }: RecentChangesProps) {
  return (
    <section className="bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[1rem] font-semibold text-[var(--color-text-primary)]">
          Recent Changes (7d)
        </h2>
        <span className="text-sm text-[var(--color-text-muted)]">
          {changes.length} shown
        </span>
      </div>

      {changes.length === 0 ? (
        <p className="text-sm text-[var(--color-text-secondary)]">
          No changes in the last 7 days.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--color-border-muted)]" role="list">
          {changes.map((change) => (
            <li key={change.id}>
              <Link
                href={`/ledger/detail?txId=${encodeURIComponent(change.id)}`}
                className="group flex items-start justify-between gap-4 py-3 transition-colors duration-100 hover:bg-[var(--color-surface-raised)] -mx-6 px-6"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <RiskBadge risk={change.risk} />
                  <div className="min-w-0">
                    <div className="font-mono text-sm text-[var(--color-text-primary)] truncate">
                      {change.filePath}
                    </div>
                    <div className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
                      {change.summary}
                    </div>
                    <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                      {change.author} · {change.timeAgo} · {change.fileCount}{" "}
                      {change.fileCount === 1 ? "file" : "files"}
                    </div>
                  </div>
                </div>
                <ArrowRight
                  className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] flex-shrink-0 mt-1 transition-colors duration-100"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4">
        <Link
          href="/changes"
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-muted)] transition-colors duration-100"
        >
          View all changes
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
