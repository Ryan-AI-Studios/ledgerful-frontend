"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { DataTable, Column } from "@/components/DataTable";
import { Hotspot, fetchHotspots } from "@/lib/hotspots-data";
import { RiskBadge } from "@/components/RiskBadge";
import { ArrowUpRight, Calendar, Clock } from "lucide-react";

export default function HotspotsPage() {
  const router = useRouter();
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [range, setRange] = useState(90);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHotspots(range).then((data) => {
      setHotspots(data);
      setLoading(false);
    });
  }, [range]);

  const columns: Column<Hotspot>[] = [
    {
      key: "rank",
      header: "Rank",
      width: "60px",
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
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-sm text-[var(--color-text-primary)] truncate max-w-[400px]">
            {row.filePath}
          </span>
          <span className="text-[0.625rem] text-[var(--color-text-muted)] flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Last touched: {new Date(row.lastTouchedAt).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      key: "risk",
      header: "Risk",
      width: "100px",
      cell: (row) => <RiskBadge risk={row.riskLevel} />,
    },
    {
      key: "score",
      header: "Risk Score",
      width: "100px",
      cell: (row) => (
        <span className="text-sm font-medium text-[var(--color-text-primary)]">
          {row.riskScore.toFixed(1)}
        </span>
      ),
    },
    {
      key: "contributor",
      header: "Contributor",
      width: "120px",
      cell: (row) => (
        <span className="text-sm text-[var(--color-text-secondary)]">
          {row.contributor || "N/A"}
        </span>
      ),
    },
    {
      key: "changes",
      header: "Changes",
      width: "90px",
      cell: (row) => (
        <span className="text-sm text-[var(--color-text-secondary)]">
          {row.changeCount}
        </span>
      ),
    },
    {
      key: "action",
      header: "",
      width: "40px",
      cell: () => (
        <ArrowUpRight className="w-4 h-4 text-[var(--color-text-muted)]" aria-hidden="true" />
      ),
    },
  ];

  return (
    <PageLayout title={`Hotspots (${hotspots.length})`}>
      <div className="bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="text-sm text-[var(--color-text-muted)] max-w-md">
            Ranked by complexity × change frequency. Higher scores mean more risk concentrated in these files.
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 h-9 rounded-md bg-[var(--color-surface)] border border-[var(--color-border-muted)]">
              <Calendar className="w-4 h-4 text-[var(--color-text-muted)]" />
              <select 
                value={range}
                onChange={(e) => {
                  setLoading(true);
                  setRange(Number(e.target.value));
                }}
                className="bg-transparent text-sm text-[var(--color-text-primary)] focus:outline-none cursor-pointer"
                aria-label="Select date range"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 rounded bg-[var(--color-surface-raised)]" />
            ))}
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={hotspots}
            getRowKey={(row) => row.id}
            onRowClick={(row) => {
              router.push(`/graph?focus=${encodeURIComponent(row.filePath)}`);
            }}
          />
        )}
      </div>
    </PageLayout>
  );
}
