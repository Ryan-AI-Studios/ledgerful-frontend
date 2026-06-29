"use client";

import { useEffect, useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { DataTable, Column } from "@/components/DataTable";
import { RiskBadge } from "@/components/RiskBadge";
import { ChangeEntry, fetchChanges } from "@/lib/changes-data";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function ChangesPage() {
  const [changes, setChanges] = useState<ChangeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChanges()
      .then((data) => {
        setChanges(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load changes:", err);
        setLoading(false);
      });
  }, []);

  const columns: Column<ChangeEntry>[] = [
    {
      key: "risk",
      header: "Risk",
      width: "90px",
      cell: (row) => <RiskBadge risk={row.risk} />,
    },
    {
      key: "file",
      header: "File / Summary",
      cell: (row) => (
        <div className="min-w-0">
          <div className="font-mono text-sm text-[var(--color-text-primary)] truncate">
            {row.filePath}
          </div>
          <div className="text-sm text-[var(--color-text-secondary)]">{row.summary}</div>
        </div>
      ),
    },
    {
      key: "author",
      header: "Author",
      width: "100px",
      cell: (row) => <span className="text-sm text-[var(--color-text-secondary)]">{row.author}</span>,
    },
    {
      key: "time",
      header: "When",
      width: "100px",
      cell: (row) => <span className="text-sm text-[var(--color-text-muted)]">{row.timeAgo}</span>,
    },
    {
      key: "files",
      header: "Files",
      width: "80px",
      cell: (row) => (
        <span className="text-sm text-[var(--color-text-muted)]">
          {row.filesChanged}
        </span>
      ),
    },
    {
      key: "diff",
      header: "Diff",
      width: "120px",
      cell: (row) => (
        <span className="text-sm font-mono text-[var(--color-text-muted)]">
          +
          {row.additions} -{row.deletions}
        </span>
      ),
    },
  ];

  return (
    <PageLayout title="Changes">
      <div className="bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-[var(--color-text-muted)]">
            Last 7 days · {changes.length} changes · sorted by risk then time
          </div>
          <div className="flex items-center gap-2">
            <select className="h-8 px-2 rounded-md bg-[var(--color-surface)] border border-[var(--color-border-muted)] text-sm text-[var(--color-text-primary)]">
              <option>All risks</option>
              <option>HIGH, MEDIUM</option>
              <option>LOW, TRIVIAL</option>
            </select>
            <select className="h-8 px-2 rounded-md bg-[var(--color-surface)] border border-[var(--color-border-muted)] text-sm text-[var(--color-text-primary)]">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>All time</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 rounded bg-[var(--color-surface-raised)]" />
            ))}
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={changes}
            getRowKey={(row) => row.id}
          />
        )}

        <div className="mt-4">
          <Link
            href="/changes"
            className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-muted)] transition-colors duration-100"
          >
            Load more
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}
