"use client";

import { CircleDot, Database, AlertCircle, WifiOff } from "lucide-react";
import { DataSource } from "@/lib/fallback";

interface DataSourceBadgeProps {
  source: DataSource;
}

const sourceConfig: Record<
  DataSource,
  { label: string; icon: typeof CircleDot; dotClass: string; ariaLabel: string }
> = {
  live: {
    label: "Live",
    icon: CircleDot,
    dotClass: "bg-[var(--color-primary)]",
    ariaLabel: "Data source: live",
  },
  mock: {
    label: "Mock data",
    icon: Database,
    dotClass: "bg-[var(--color-warning)]",
    ariaLabel: "Data source: mock",
  },
  stale: {
    label: "Stale",
    icon: AlertCircle,
    dotClass: "bg-[var(--color-text-muted)]",
    ariaLabel: "Data source: stale",
  },
  unavailable: {
    label: "Unavailable",
    icon: WifiOff,
    dotClass: "bg-[var(--color-text-muted)]",
    ariaLabel: "Data source: unavailable",
  },
};

export function DataSourceBadge({ source }: DataSourceBadgeProps) {
  const config = sourceConfig[source];
  const Icon = config.icon;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-[var(--color-border-muted)] bg-[var(--color-surface)] text-[0.6875rem] font-medium text-[var(--color-text-secondary)]"
      aria-label={config.ariaLabel}
      title={config.ariaLabel}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} aria-hidden="true" />
      <Icon className="w-3 h-3" aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
}
