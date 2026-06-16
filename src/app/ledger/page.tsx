"use client";

import { useEffect, useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { DataTable, Column } from "@/components/DataTable";
import { RiskBadge } from "@/components/RiskBadge";
import { LedgerStatusBadge } from "@/components/LedgerStatusBadge";
import { LedgerEntry, fetchLedger } from "@/lib/ledger-data";
import { Search } from "lucide-react";

export default function LedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLedger().then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, []);

  const columns: Column<LedgerEntry>[] = [
    {
      key: "txId",
      header: "Tx ID",
      width: "120px",
      cell: (row) => (
        <span className="font-mono text-sm text-[var(--color-text-primary)]">
          {row.txId}
        </span>
      ),
    },
    {
      key: "category",
      header: "Category",
      width: "100px",
      cell: (row) => (
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          {row.category}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "110px",
      cell: (row) => <LedgerStatusBadge status={row.status} />,
    },
    {
      key: "summary",
      header: "Summary / Reason",
      cell: (row) => (
        <div className="min-w-0">
          <div className="text-sm text-[var(--color-text-primary)] truncate">
            {row.summary}
          </div>
          <div className="text-sm text-[var(--color-text-secondary)]">{row.reason}</div>
        </div>
      ),
    },
    {
      key: "risk",
      header: "Risk",
      width: "90px",
      cell: (row) => <RiskBadge risk={row.risk} />,
    },
    {
      key: "author",
      header: "Author",
      width: "90px",
      cell: (row) => <span className="text-sm text-[var(--color-text-secondary)]">{row.author}</span>,
    },
    {
      key: "time",
      header: "When",
      width: "90px",
      cell: (row) => <span className="text-sm text-[var(--color-text-muted)]">{row.timeAgo}</span>,
    },
  ];

  return (
    <PageLayout title={`Ledger (${entries.length.toLocaleString()} entries)`}>
      <div className="bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search transactions..."
              className="w-full h-8 pl-8 pr-3 rounded-md bg-[var(--color-surface)] border border-[var(--color-border-muted)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
            />
          </div>
          <select className="h-8 px-2 rounded-md bg-[var(--color-surface)] border border-[var(--color-border-muted)] text-sm text-[var(--color-text-primary)]">
            <option>All categories</option>
            <option>FEATURE</option>
            <option>BUGFIX</option>
            <option>REFACTOR</option>
            <option>DOCS</option>
          </select>
        </div>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded bg-[var(--color-surface-raised)]" />
            ))}
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={entries}
            getRowKey={(row) => row.txId}
            onRowClick={(row) => {
              window.location.href = `/ledger/detail?txId=${encodeURIComponent(row.txId)}`;
            }}
          />
        )}
      </div>
    </PageLayout>
  );
}
