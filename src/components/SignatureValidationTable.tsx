"use client";

import { SignatureEntry } from "@/lib/types";
import { DataTable, Column } from "./DataTable";
import { CheckCircle2, XCircle, Slash, Search } from "lucide-react";
import { useState } from "react";

interface SignatureValidationTableProps {
  entries: SignatureEntry[];
}

export function SignatureValidationTable({ entries }: SignatureValidationTableProps) {
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.txId.toLowerCase().includes(filter.toLowerCase()) || 
                          entry.signer.toLowerCase().includes(filter.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || entry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns: Column<SignatureEntry>[] = [
    {
      key: "txId",
      header: "Transaction ID",
      cell: (row) => (
        <code className="text-xs font-mono bg-[var(--color-surface-raised)] px-1.5 py-0.5 rounded border border-[var(--color-border)] select-all">
          {row.txId}
        </code>
      ),
    },
    {
      key: "timestamp",
      header: "Timestamp",
      cell: (row) => (
        <span className="text-sm text-[var(--color-text-secondary)]">
          {new Date(row.timestamp).toLocaleString()}
        </span>
      ),
    },
    {
      key: "signer",
      header: "Signer",
      cell: (row) => (
        <span className="text-sm font-medium">{row.signer}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => {
        const config = {
          VALID: { icon: CheckCircle2, text: "Valid", class: "text-[var(--color-success)] bg-[var(--color-success-muted)]" },
          INVALID: { icon: XCircle, text: "Invalid", class: "text-[var(--color-danger)] bg-[var(--color-danger-muted)]" },
          SKIPPED: { icon: Slash, text: "Skipped", class: "text-[var(--color-text-muted)] bg-[var(--color-surface-raised)]" },
        };
        const { icon: Icon, text, class: className } = config[row.status];
        return (
          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[0.6875rem] font-bold uppercase tracking-wider ${className}`}>
            <Icon className="w-3 h-3" />
            {text}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Signature Validation</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
            <input
              type="text"
              aria-label="Search transactions or signers"
              placeholder="Search TX or Signer..."
              className="pl-9 pr-3 py-1.5 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] w-full sm:w-64"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <select
            aria-label="Filter by status"
            className="px-3 py-1.5 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="VALID">Valid</option>
            <option value="INVALID">Invalid</option>
            <option value="SKIPPED">Skipped</option>
          </select>
        </div>
      </div>
      
      <DataTable
        columns={columns}
        rows={filteredEntries}
        getRowKey={(row) => row.txId}
        emptyMessage="No signature records found matching your filters."
      />
    </div>
  );
}
