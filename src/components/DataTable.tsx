"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  cell: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  getRowKey: (row: T) => string;
}

export function DataTable<T>({
  columns,
  rows,
  emptyMessage = "No entries found.",
  onRowClick,
  getRowKey,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto -mx-6 px-6">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left py-2 px-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] bg-[var(--color-surface)]"
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-8 text-center text-sm text-[var(--color-text-secondary)]"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={getRowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "border-b border-[var(--color-border-muted)] transition-colors duration-100",
                  onRowClick
                    ? "cursor-pointer hover:bg-[var(--color-surface-raised)]"
                    : ""
                )}
              >
                {columns.map((col) => (
                  <td
                    key={`${getRowKey(row)}-${col.key}`}
                    className="py-3 px-3 align-top"
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
