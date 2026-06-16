"use client";

import { useEffect, useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { DataTable, Column } from "@/components/DataTable";
import { Hotspot, fetchHotspots } from "@/lib/hotspots-data";
import { ArrowUpRight } from "lucide-react";

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const range = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 80;
      const y = 24 - ((v - min) / range) * 20;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width="80" height="28" aria-hidden="true" className="overflow-visible">
      <polyline
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
}

export default function HotspotsPage() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHotspots().then((data) => {
      setHotspots(data);
      setLoading(false);
    });
  }, []);

  const columns: Column<Hotspot>[] = [
    {
      key: "rank",
      header: "Rank",
      width: "70px",
      cell: (row) => (
        <span className="text-sm font-medium text-[var(--color-text-muted)]">
          {row.rank}
        </span>
      ),
    },
    {
      key: "file",
      header: "File",
      cell: (row) => (
        <span className="font-mono text-sm text-[var(--color-text-primary)] truncate">
          {row.filePath}
        </span>
      ),
    },
    {
      key: "score",
      header: "Score",
      width: "90px",
      cell: (row) => (
        <span className="text-sm font-medium text-[var(--color-text-primary)]">
          {row.score.toFixed(1)}
        </span>
      ),
    },
    {
      key: "trend",
      header: "Trend (90d)",
      width: "120px",
      cell: (row) => <Sparkline values={row.trend} />,
    },
    {
      key: "action",
      header: "",
      width: "60px",
      cell: () => (
        <ArrowUpRight className="w-4 h-4 text-[var(--color-text-muted)]" aria-hidden="true" />
      ),
    },
  ];

  return (
    <PageLayout title={`Hotspots (${hotspots.length})`}>
      <div className="bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-[var(--color-text-muted)]">
            Ranked by complexity × change frequency. Higher scores mean more risk.
          </div>
          <select className="h-8 px-2 rounded-md bg-[var(--color-surface)] border border-[var(--color-border-muted)] text-sm text-[var(--color-text-primary)]">
            <option>Sort by score</option>
            <option>Sort by trend</option>
            <option>Sort by file name</option>
          </select>
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
            rows={hotspots}
            getRowKey={(row) => row.filePath}
            onRowClick={(row) => {
              window.location.href = `/graph?focus=${encodeURIComponent(row.filePath)}`;
            }}
          />
        )}
      </div>
    </PageLayout>
  );
}
