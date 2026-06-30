"use client";

import { useEffect, useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { DataTable, Column } from "@/components/DataTable";
import { RiskBadge } from "@/components/RiskBadge";
import { LedgerStatusBadge } from "@/components/LedgerStatusBadge";
import { LedgerEntry, fetchLedger } from "@/lib/ledger-data";
import { DataSource } from "@/lib/fallback";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { Search } from "lucide-react";

export default function LedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [source, setSource] = useState<DataSource>("live");
  const [loading, setLoading] = useState(true);
  const [authorFilter, setAuthorFilter] = useState("All authors");

  useEffect(() => {
    fetchLedger().then((result) => {
      setEntries(result.data);
      setSource(result.source);
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
      key: "pr",
      header: <span title="GitHub PR linking is not yet implemented">PR</span>,
      width: "90px",
      cell: (row) => row.prNumber ? (
        <span className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full border border-[var(--color-border-muted)] bg-[var(--color-surface)]" title="GitHub PR linking is not yet implemented">
          <span className={`w-1.5 h-1.5 rounded-full ${row.prStatus === "Merged" ? "bg-[var(--color-primary)]" : row.prStatus === "Closed" ? "bg-[var(--color-error)]" : "bg-[var(--color-success)]"}`} />
          #{row.prNumber}
        </span>
      ) : (
        <span className="text-xs text-[var(--color-text-muted)]" title="GitHub PR linking is not yet implemented">-</span>
      ),
    },
    {
      key: "author",
      header: "Author",
      width: "110px",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-[var(--color-surface-raised)] flex items-center justify-center text-[10px] font-bold text-[var(--color-text-primary)] uppercase">
            {row.author.charAt(0)}
          </div>
          <span className="text-sm text-[var(--color-text-secondary)] truncate max-w-[70px]" title={row.author}>
            {row.author}
          </span>
        </div>
      ),
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
      <div className="flex items-center gap-3 mb-4">
        {!loading && <DataSourceBadge source={source} />}
      </div>
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
          <select 
            value={authorFilter}
            onChange={(e) => setAuthorFilter(e.target.value)}
            className="h-8 px-2 rounded-md bg-[var(--color-surface)] border border-[var(--color-border-muted)] text-sm text-[var(--color-text-primary)] min-w-[120px]"
            aria-label="Filter by author"
          >
            <option>All authors</option>
            {Array.from(new Set(entries.map(e => e.author))).map(author => (
              <option key={author} value={author}>{author}</option>
            ))}
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
            rows={entries.filter(e => authorFilter === "All authors" || e.author === authorFilter)}
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
