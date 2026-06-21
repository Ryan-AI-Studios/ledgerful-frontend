"use client";

import { VerificationHealth } from "@/lib/types";
import { StatusDot } from "./StatusDot";
import { formatRelativeTime } from "@/lib/utils";

interface VerificationHealthCardProps {
  health: VerificationHealth;
}

export function VerificationHealthCard({ health }: VerificationHealthCardProps) {
  const statusMap = {
    HEALTHY: "healthy",
    DEGRADED: "warning",
    FAILING: "critical",
  } as const;

  const statusTextMap = {
    HEALTHY: "System Healthy",
    DEGRADED: "System Degraded",
    FAILING: "System Failing",
  } as const;

  return (
    <div 
      className="bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg p-6"
      role="region"
      aria-label={`Verification health: ${health.status}`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          Current Health
        </h2>
        <StatusDot 
          status={statusMap[health.status]} 
          label={health.status} 
        />
      </div>
      
      <div className="mt-4">
        <p className="text-2xl font-bold text-[var(--color-text-primary)] leading-tight">
          {statusTextMap[health.status]}
        </p>
        {health.message && (
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {health.message}
          </p>
        )}
      </div>

      <div className="mt-6 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
        <span>Last verified:</span>
        {health.lastRunAt ? (
          <time dateTime={health.lastRunAt}>
            {formatRelativeTime(health.lastRunAt)}
          </time>
        ) : (
          <span>No runs yet</span>
        )}
      </div>
    </div>
  );
}
