"use client";

import { VerificationStep } from "@/lib/types";
import { DataTable, Column } from "./DataTable";
import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { formatDuration, formatTimeAgo } from "@/lib/utils";

interface VerificationStepsTableProps {
  steps: VerificationStep[];
}

type SortKey = keyof VerificationStep;
type SortOrder = "asc" | "desc";

export function VerificationStepsTable({ steps }: VerificationStepsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const sortedSteps = useMemo(() => {
    return [...steps].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [steps, sortKey, sortOrder]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const renderSortIcon = (columnKey: SortKey) => {
    if (sortKey !== columnKey) return <ChevronsUpDown className="w-3 h-3 text-[var(--color-text-muted)]" aria-hidden="true" />;
    return sortOrder === "asc" ? (
      <ChevronUp className="w-3 h-3 text-[var(--color-primary)]" aria-hidden="true" />
    ) : (
      <ChevronDown className="w-3 h-3 text-[var(--color-primary)]" aria-hidden="true" />
    );
  };

  const columns: Column<VerificationStep>[] = [
    {
      key: "name",
      header: (
        <button
          onClick={() => toggleSort("name")}
          className="flex items-center gap-1 hover:text-[var(--color-text-primary)] transition-colors"
        >
          Step Name
          {renderSortIcon("name")}
        </button>
      ),
      cell: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{row.name}</span>
          <span className="text-[0.6875rem] text-[var(--color-text-muted)] font-mono">
            {row.id}
          </span>
        </div>
      ),
    },
    {
      key: "lastRunAt",
      header: (
        <button
          onClick={() => toggleSort("lastRunAt")}
          className="flex items-center gap-1 hover:text-[var(--color-text-primary)] transition-colors"
        >
          Last Run
          {renderSortIcon("lastRunAt")}
        </button>
      ),
      cell: (row) => (
        <span className="text-sm text-[var(--color-text-secondary)]">
          {formatTimeAgo(row.lastRunAt)}
        </span>
      ),
    },
    {
      key: "averageDurationMs",
      header: (
        <button
          onClick={() => toggleSort("averageDurationMs")}
          className="flex items-center gap-1 hover:text-[var(--color-text-primary)] transition-colors"
        >
          Avg Duration
          {renderSortIcon("averageDurationMs")}
        </button>
      ),
      cell: (row) => (
        <div className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)]">
          <Clock className="w-3.5 h-3.5 text-[var(--color-text-muted)]" aria-hidden="true" />
          {formatDuration(row.averageDurationMs)}
        </div>
      ),
    },
    {
      key: "passRatePercent",
      header: (
        <button
          onClick={() => toggleSort("passRatePercent")}
          className="flex items-center gap-1 hover:text-[var(--color-text-primary)] transition-colors"
        >
          Pass Rate
          {renderSortIcon("passRatePercent")}
        </button>
      ),
      cell: (row) => {
        const isHealthy = row.passRatePercent >= 95;
        const isWarning = row.passRatePercent >= 80 && row.passRatePercent < 95;
        
        return (
          <div className="flex flex-col gap-1.5 w-full max-w-[120px]">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className={isHealthy ? "text-[var(--color-success)]" : isWarning ? "text-[var(--color-warning)]" : "text-[var(--color-danger)]"}>
                {row.passRatePercent}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-[var(--color-surface-raised)] rounded-full overflow-hidden border border-[var(--color-border)]" aria-hidden="true">
              <div 
                className={`h-full rounded-full ${isHealthy ? "bg-[var(--color-success)]" : isWarning ? "bg-[var(--color-warning)]" : "bg-[var(--color-danger)]"}`}
                style={{ width: `${row.passRatePercent}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: "recentFailures",
      header: (
        <button
          onClick={() => toggleSort("recentFailures")}
          className="flex items-center gap-1 hover:text-[var(--color-text-primary)] transition-colors"
        >
          Recent Failures
          {renderSortIcon("recentFailures")}
        </button>
      ),
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          {row.recentFailures > 0 ? (
            <>
              <AlertCircle className="w-4 h-4 text-[var(--color-danger)]" aria-hidden="true" />
              <span className="text-sm font-medium text-[var(--color-danger)]">{row.recentFailures}</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" aria-hidden="true" />
              <span className="text-sm text-[var(--color-text-muted)]">None</span>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Verification Steps</h2>
        <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-widest font-bold">
          {steps.length} Steps Tracked
        </span>
      </div>
      <DataTable
        columns={columns}
        rows={sortedSteps}
        getRowKey={(row) => row.id}
        emptyMessage="No verification steps found."
      />
    </div>
  );
}
