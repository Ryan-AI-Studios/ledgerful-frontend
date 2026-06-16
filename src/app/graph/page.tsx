"use client";

import { useEffect, useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { DataTable, Column } from "@/components/DataTable";
import { RiskBadge } from "@/components/RiskBadge";
import { GraphNode, fetchGraph } from "@/lib/graph-data";
import { Search, Share2 } from "lucide-react";

export default function GraphPage() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGraph().then((data) => {
      setNodes(data);
      setLoading(false);
    });
  }, []);

  const columns: Column<GraphNode>[] = [
    {
      key: "symbol",
      header: "Symbol",
      cell: (row) => (
        <span className="font-mono text-sm text-[var(--color-text-primary)]">
          {row.symbol}
        </span>
      ),
    },
    {
      key: "file",
      header: "File",
      cell: (row) => (
        <span className="font-mono text-sm text-[var(--color-text-secondary)] truncate">
          {row.filePath}
        </span>
      ),
    },
    {
      key: "risk",
      header: "Risk",
      width: "90px",
      cell: (row) => <RiskBadge risk={row.risk} />,
    },
    {
      key: "edges",
      header: "Edges",
      width: "80px",
      cell: (row) => (
        <span className="text-sm text-[var(--color-text-muted)]">{row.edges}</span>
      ),
    },
    {
      key: "complexity",
      header: "Complexity",
      width: "110px",
      cell: (row) => (
        <span className="text-sm text-[var(--color-text-muted)]">{row.complexity}</span>
      ),
    },
  ];

  return (
    <PageLayout title="Knowledge Graph">
      <div className="bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="text-sm text-[var(--color-text-muted)]">
              {nodes.length} nodes · 132 edges
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" aria-hidden="true" />
              <input
                type="search"
                placeholder="Search symbols..."
                className="w-64 h-8 pl-8 pr-3 rounded-md bg-[var(--color-surface)] border border-[var(--color-border-muted)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm font-medium hover:bg-[var(--color-surface-raised)] transition-colors duration-100">
              <Share2 className="w-4 h-4" aria-hidden="true" />
              Export JSON
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 rounded bg-[var(--color-surface-raised)]" />
            ))}
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={nodes}
            getRowKey={(row) => row.id}
            onRowClick={(row) => {
              window.location.href = `/hotspots?focus=${encodeURIComponent(row.filePath)}`;
            }}
          />
        )}

        <div className="mt-4 text-sm text-[var(--color-text-muted)]">
          Table view is canonical. Graph visualization ships in v1.1.
        </div>
      </div>
    </PageLayout>
  );
}
