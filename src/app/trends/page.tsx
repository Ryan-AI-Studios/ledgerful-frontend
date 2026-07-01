"use client";

import { useState, useMemo } from "react";
import { PageLayout } from "@/components/PageLayout";
import { TrendPoint } from "@/lib/trends-data";
import { DataSource } from "@/lib/fallback";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { Calendar, Info, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";

type TrendsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: TrendPoint[]; source: DataSource }
  | { status: "planned" };

export default function TrendsPage() {
  // /api/trends is PLANNED, not shipped (track 0013 DoD-4). fetchTrends
  // returns synchronously — no loading state, no fetch, no 404 log spam.
  // When /api/trends is built, replace this with the live + fallback flow.
  const [state, setState] = useState<TrendsState>(() => {
    // Synchronous init — fetchTrends returns immediately with source: "planned"
    // This avoids a loading flash since no async fetch happens.
    return { status: "planned" };
  });
  const [range, setRange] = useState(90);

  const chartData = useMemo(() => {
    if (state.status !== "ready" || state.data.length === 0) return null;

    const width = 1000;
    const height = 300;
    const padding = 40;

    const minScore = 0;
    const maxScore = 100;
    
    const xStep = (width - padding * 2) / (state.data.length - 1);
    const yScale = (height - padding * 2) / (maxScore - minScore);

    const points = state.data.map((p, i) => ({
      x: padding + i * xStep,
      y: height - padding - (p.score - minScore) * yScale,
      data: p
    }));

    const pathData = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

    return {
      width,
      height,
      padding,
      points,
      pathData
    };
  }, [state]);

  const trends = state.status === "ready" ? state.data : [];

  return (
    <PageLayout title="Project Health Trends">
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          {state.status === "ready" && <DataSourceBadge source={state.source} />}
          {state.status === "planned" && <DataSourceBadge source="planned" />}
        </div>
        <div className="bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="space-y-1">
              <h2 className="text-lg font-medium text-[var(--color-text-primary)] flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[var(--color-primary)]" />
                90-Day Health History
              </h2>
              <p className="text-sm text-[var(--color-text-muted)] max-w-md">
                Tracking project health score and high-risk change anomalies over time.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 h-9 rounded-md bg-[var(--color-surface)] border border-[var(--color-border-muted)]">
                <Calendar className="w-4 h-4 text-[var(--color-text-muted)]" />
              <select 
                value={range}
                onChange={(e) => {
                  setRange(Number(e.target.value));
                }}
                className="bg-transparent text-sm text-[var(--color-text-primary)] focus:outline-none cursor-pointer"
                aria-label="Select date range"
                disabled
              >

                  <option value={7}>Last 7 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={90}>Last 90 days</option>
                </select>
              </div>
            </div>
          </div>

          {state.status === "loading" ? (
            <div className="h-[300px] w-full bg-[var(--color-surface)] rounded-md animate-pulse border border-[var(--color-border-muted)] flex items-center justify-center">
              <span className="text-sm text-[var(--color-text-muted)]">Loading trend data...</span>
            </div>
          ) : state.status === "planned" ? (
            <div className="h-[300px] flex items-center justify-center border border-dashed border-[var(--color-border)] rounded-lg">
              <div className="text-center space-y-3 max-w-md">
                <TrendingUp className="w-8 h-8 text-[var(--color-text-muted)] mx-auto" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Trends analytics is planned</h3>
                <p className="text-sm text-[var(--color-text-muted)]">
                  The <code className="text-xs bg-[var(--color-surface)] px-1 py-0.5 rounded">/api/trends</code> endpoint
                  has not been built yet. This feature is planned for a future release with a real per-day risk score
                  and change-count data source.
                </p>
              </div>
            </div>
          ) : state.status === "error" ? (
            <div className="bg-[var(--color-surface-alt)] border border-[var(--color-danger-muted)] rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[var(--color-danger)] flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h2 className="text-[1rem] font-semibold text-[var(--color-danger)]">Failed to load</h2>
                  <p className="mt-1 text-[var(--color-text-secondary)]">{state.message}</p>
                  <button
                    onClick={() => { setState({ status: "planned" }); }}
                    className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm font-medium hover:bg-[var(--color-surface-raised)] transition-colors duration-100"
                  >
                    <RefreshCw className="w-4 h-4" aria-hidden="true" />
                    Retry
                  </button>
                </div>
              </div>
            </div>
          ) : chartData ? (
            <div className="relative group">
              <svg 
                viewBox={`0 0 ${chartData.width} ${chartData.height}`}
                className="w-full h-auto overflow-visible"
                preserveAspectRatio="none"
                role="img"
                aria-label="90-Day Health History Chart"
              >
                {/* Grid Lines */}
                {[0, 25, 50, 75, 100].map((level) => {
                  const y = chartData.height - chartData.padding - (level * (chartData.height - chartData.padding * 2) / 100);
                  return (
                    <g key={level}>
                      <line 
                        x1={chartData.padding} 
                        y1={y} 
                        x2={chartData.width - chartData.padding} 
                        y2={y} 
                        stroke="var(--color-border-muted)" 
                        strokeWidth="1"
                        strokeDasharray="4 4"
                      />
                      <text 
                        x={chartData.padding - 10} 
                        y={y} 
                        textAnchor="end" 
                        alignmentBaseline="middle"
                        className="text-[10px] fill-[var(--color-text-muted)] font-mono"
                      >
                        {level}
                      </text>
                    </g>
                  );
                })}

                {/* X Axis Labels (start, mid, end) */}
                {[0, Math.floor(trends.length / 2), trends.length - 1].map((idx) => {
                  const p = chartData.points[idx];
                  return (
                    <text
                      key={idx}
                      x={p.x}
                      y={chartData.height - chartData.padding + 20}
                      textAnchor="middle"
                      className="text-[10px] fill-[var(--color-text-muted)] font-mono"
                    >
                      {p.data.date}
                    </text>
                  );
                })}

                {/* The Line */}
                <path
                  d={chartData.pathData}
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Area under the line */}
                <path
                  d={`${chartData.pathData} L ${chartData.points[chartData.points.length - 1].x} ${chartData.height - chartData.padding} L ${chartData.points[0].x} ${chartData.height - chartData.padding} Z`}
                  fill="url(#gradient)"
                  className="opacity-10"
                />

                {/* Anomaly Markers */}
                {chartData.points.filter(p => p.data.highRiskCount > 0).map((p, i) => (
                  <g key={i}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="4"
                      fill="var(--color-accent)"
                      className="animate-pulse"
                    />
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="8"
                      stroke="var(--color-accent)"
                      strokeWidth="1"
                      fill="none"
                      className="opacity-30"
                    />
                  </g>
                ))}

                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>
              </svg>
              
              <div className="mt-8 flex items-center gap-6 justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[var(--color-primary)]"></div>
                  <span className="text-xs text-[var(--color-text-secondary)] font-medium text-nowrap">Health Score</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[var(--color-accent)] animate-pulse"></div>
                  <span className="text-xs text-[var(--color-text-secondary)] font-medium text-nowrap">Risk Anomaly</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center border border-dashed border-[var(--color-border)] rounded-lg">
              <div className="text-center space-y-2">
                <Info className="w-8 h-8 text-[var(--color-text-muted)] mx-auto" />
                <p className="text-sm text-[var(--color-text-muted)]">No trend data available for this range.</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">Average Score</h3>
            <div className="text-2xl font-mono text-[var(--color-primary)]">
              {trends.length > 0 ? (trends.reduce((acc, curr) => acc + curr.score, 0) / trends.length).toFixed(1) : "--"}
            </div>
          </div>
          <div className="bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">Total Changes</h3>
            <div className="text-2xl font-mono text-[var(--color-text-primary)]">
              {trends.reduce((acc, curr) => acc + curr.changes, 0)}
            </div>
          </div>
          <div className="bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">High Risk Anomalies</h3>
            <div className="text-2xl font-mono text-[var(--color-accent)]">
              {trends.filter(p => p.highRiskCount > 0).length}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
