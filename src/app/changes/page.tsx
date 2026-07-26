"use client";

import { useEffect, useState, useCallback } from "react";
import { PageLayout } from "@/components/PageLayout";
import { DataTable, Column } from "@/components/DataTable";
import { RiskBadge } from "@/components/RiskBadge";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { ChangeEntry, fetchChanges } from "@/lib/changes-data";
import { DataSource } from "@/lib/fallback";
import { AlertCircle, RefreshCw, ArrowRight } from "lucide-react";

type ChangesState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: ChangeEntry[]; source: DataSource };

/** API only supports `days` (no offset). Load more widens the window. */
const DAY_STEPS = [7, 30, 90, 365] as const;

export default function ChangesPage() {
  const [state, setState] = useState<ChangesState>({ status: "loading" });
  const [daysIndex, setDaysIndex] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const days = DAY_STEPS[daysIndex] ?? DAY_STEPS[DAY_STEPS.length - 1];
  const canLoadMore = daysIndex < DAY_STEPS.length - 1;

  const load = useCallback((daysWindow: number, mode: "replace" | "more") => {
    if (mode === "replace") {
      setTimeout(() => setState({ status: "loading" }), 0);
    } else {
      setLoadingMore(true);
    }
    fetchChanges(daysWindow)
      .then((result) => {
        setState({ status: "ready", data: result.data, source: result.source });
      })
      .catch(() => {
        setState({
          status: "error",
          message: "Could not load changes. The Ledgerful daemon may not be running.",
        });
      })
      .finally(() => {
        setLoadingMore(false);
      });
  }, []);

  useEffect(() => {
    // Defer so the effect does not setState synchronously (lint).
    const t = setTimeout(() => load(DAY_STEPS[0], "replace"), 0);
    return () => clearTimeout(t);
  }, [load]);

  const handleLoadMore = () => {
    if (!canLoadMore || loadingMore) return;
    const next = daysIndex + 1;
    setDaysIndex(next);
    load(DAY_STEPS[next], "more");
  };

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
      <div className="flex items-center gap-3 mb-4">
        {state.status === "ready" && <DataSourceBadge source={state.source} />}
      </div>
      <div className="bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-[var(--color-text-muted)]">
            Last {days} days · {state.status === "ready" ? state.data.length : 0} changes · sorted by risk then time
          </div>
          <div className="flex items-center gap-2">
            <select
              className="h-8 px-2 rounded-md bg-[var(--color-surface)] border border-[var(--color-border-muted)] text-sm text-[var(--color-text-primary)]"
              aria-label="Filter by risk"
              disabled
              title="Risk filter not wired yet"
            >
              <option>All risks</option>
              <option>HIGH, MEDIUM</option>
              <option>LOW, TRIVIAL</option>
            </select>
            <select
              className="h-8 px-2 rounded-md bg-[var(--color-surface)] border border-[var(--color-border-muted)] text-sm text-[var(--color-text-primary)]"
              aria-label="Time range"
              value={String(days)}
              onChange={(e) => {
                const nextDays = Number(e.target.value);
                const idx = DAY_STEPS.indexOf(nextDays as (typeof DAY_STEPS)[number]);
                if (idx < 0) return;
                setDaysIndex(idx);
                load(nextDays, "replace");
              }}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </div>

        {state.status === "loading" ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 rounded bg-[var(--color-surface-raised)]" />
            ))}
          </div>
        ) : state.status === "error" ? (
          <div className="bg-[var(--color-surface-alt)] border border-[var(--color-danger-muted)] rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[var(--color-danger)] flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h2 className="text-[1rem] font-semibold text-[var(--color-danger)]">Failed to load</h2>
                <p className="mt-1 text-[var(--color-text-secondary)]">{state.message}</p>
                <button
                  onClick={() => load(days, "replace")}
                  className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm font-medium hover:bg-[var(--color-surface-raised)] transition-colors duration-100"
                >
                  <RefreshCw className="w-4 h-4" aria-hidden="true" />
                  Retry
                </button>
              </div>
            </div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={state.data}
            getRowKey={(row) => row.id}
          />
        )}

        <div className="mt-4 flex items-center gap-3">
          {canLoadMore ? (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore || state.status !== "ready"}
              className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-muted)] transition-colors duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? "Loading…" : `Load more (last ${DAY_STEPS[daysIndex + 1]} days)`}
              {!loadingMore && <ArrowRight className="w-4 h-4" aria-hidden="true" />}
            </button>
          ) : (
            <span className="text-sm text-[var(--color-text-muted)]">
              Showing the widest window supported ({days} days).
            </span>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
