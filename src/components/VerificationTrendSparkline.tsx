"use client";

import { VerificationTrendPoint } from "@/lib/types";

interface VerificationTrendSparklineProps {
  data: VerificationTrendPoint[];
}

export function VerificationTrendSparkline({ data }: VerificationTrendSparklineProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg p-6 h-[200px] flex items-center justify-center">
        <span className="text-sm text-[var(--color-text-muted)]">No trend data available</span>
      </div>
    );
  }

  const width = 400;
  const height = 120;
  const paddingX = 0;
  const paddingY = 20;

  // Find max total to scale the chart
  const maxTotal = Math.max(...data.map(p => Math.max(p.passed, p.failed)), 1);
  
  const stepX = (width - paddingX * 2) / (data.length - 1 || 1);

  const getPoints = (type: "passed" | "failed") => {
    return data.map((p, i) => {
      const x = paddingX + i * stepX;
      const val = p[type];
      const y = height - paddingY - (val / maxTotal) * (height - paddingY * 2);
      return `${x},${y}`;
    }).join(" ");
  };

  const passedPoints = getPoints("passed");
  const failedPoints = getPoints("failed");

  return (
    <div 
      className="bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg p-6"
      role="region"
      aria-label="Verification trend sparkline showing passed and failed counts over time"
    >
      <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-6">
        Activity Trend (Last 15 Runs)
      </h2>
      
      <div className="relative h-[120px] w-full group">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {/* Grid lines (optional, keeping it clean for sparkline) */}
          <line 
            x1="0" y1={height - paddingY} 
            x2={width} y2={height - paddingY} 
            stroke="var(--color-border-muted)" 
            strokeWidth="1" 
          />

          {/* Passed Trend */}
          <polyline
            fill="none"
            stroke="var(--color-success)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            points={passedPoints}
            className="transition-all duration-300"
          />
          
          {/* Failed Trend */}
          <polyline
            fill="none"
            stroke="var(--color-danger)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            points={failedPoints}
            className="transition-all duration-300 opacity-80"
          />
        </svg>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-[var(--color-success)] rounded-full" />
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">Passed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-[var(--color-danger)] rounded-full" />
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">Failed</span>
          </div>
        </div>
        
        <div className="text-[10px] text-[var(--color-text-muted)] font-mono uppercase tracking-tight">
          {data[0].date} — {data[data.length - 1].date}
        </div>
      </div>
    </div>
  );
}
