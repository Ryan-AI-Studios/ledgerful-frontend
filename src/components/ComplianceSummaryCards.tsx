"use client";

import { ComplianceSummary } from "@/lib/types";
import { DataSource } from "@/lib/fallback";
import { ShieldCheck, FileCheck, History, FileWarning } from "lucide-react";

interface ComplianceSummaryCardsProps {
  summary: ComplianceSummary;
  /** When "mock", ADR card may render from mock data even if field is optional. */
  source?: DataSource;
}

export function ComplianceSummaryCards({
  summary,
  source,
}: ComplianceSummaryCardsProps) {
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString();
  };

  const hasCountBreakdown =
    summary.validCount !== undefined && summary.invalidCount !== undefined;

  // ADR three-state (FE-H0):
  // - Field absent on live-shaped data → omit card entirely
  // - Field present & truthy → warning card
  // - Field present & empty (null/undefined value with key defined) or mock empty → "None"
  // Never synthesize "All ADRs addressed" from mere absence on live data.
  const showAdrCard =
    source === "mock" || Object.prototype.hasOwnProperty.call(summary, "oldestUnaddressedAdr");
  const adr = summary.oldestUnaddressedAdr;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card
        icon={ShieldCheck}
        label="Total Signed"
        value={summary.totalSigned.toLocaleString()}
        subValue={
          hasCountBreakdown
            ? `${summary.validCount} valid / ${summary.invalidCount} invalid`
            : "Signed transactions"
        }
        tone="neutral"
      />
      <Card
        icon={FileCheck}
        label="Validity Score"
        value={`${summary.validityPercent}%`}
        subValue={summary.validityPercent === 100 ? "Clean audit" : "Action required"}
        tone={summary.validityPercent > 99 ? "success" : summary.validityPercent > 95 ? "warning" : "danger"}
      />
      <Card
        icon={History}
        label="Last Audit"
        value={formatDate(summary.lastAuditAt)}
        subValue={summary.hotspotDeltaPercent <= 0 ? `${Math.abs(summary.hotspotDeltaPercent)}% reduction in hotspots` : `${summary.hotspotDeltaPercent}% increase in hotspots`}
        tone={summary.hotspotDeltaPercent <= 0 ? "success" : "warning"}
      />
      {showAdrCard &&
        (adr ? (
          <Card
            icon={FileWarning}
            label="Oldest ADR"
            value={adr.id}
            subValue={adr.title}
            tone="warning"
          />
        ) : (
          <Card
            icon={FileWarning}
            label="Oldest ADR"
            value="None"
            subValue="No unaddressed ADRs reported"
            tone="neutral"
          />
        ))}
    </div>
  );
}

interface CardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subValue: string;
  tone: "success" | "warning" | "danger" | "neutral";
}

function Card({ icon: Icon, label, value, subValue, tone }: CardProps) {
  const toneClasses = {
    success: "text-[var(--color-success)]",
    warning: "text-[var(--color-warning)]",
    danger: "text-[var(--color-danger)]",
    neutral: "text-[var(--color-text-primary)]",
  };

  return (
    <div className="bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
        <Icon className="w-4 h-4" />
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div>
        <div className={`text-2xl font-semibold ${toneClasses[tone]}`}>{value}</div>
        <div className="text-xs text-[var(--color-text-secondary)] mt-1 truncate" title={subValue}>{subValue}</div>
      </div>
    </div>
  );
}
