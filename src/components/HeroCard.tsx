"use client";

import { ProjectHealth, RiskLevel } from "@/lib/types";
import {
  CheckCircle2,
  AlertTriangle,
  GitPullRequest,
  ShieldCheck,
} from "lucide-react";

interface HeroCardProps {
  health: ProjectHealth;
  onExplain?: () => void;
}

function riskColor(risk: RiskLevel) {
  switch (risk) {
    case "HIGH":
      return "text-[var(--color-risk-high)]";
    case "MEDIUM":
      return "text-[var(--color-risk-medium)]";
    case "LOW":
      return "text-[var(--color-risk-low)]";
    case "TRIVIAL":
      return "text-[var(--color-risk-trivial)]";
  }
}

export function HeroCard({ health, onExplain }: HeroCardProps) {
  const deltaPositive = health.delta >= 0;
  const scoreColor = riskColor(health.currentRisk);

  return (
    <section
      className="bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg p-6 cursor-pointer transition-colors duration-100 hover:bg-[var(--color-surface-raised)]"
      onClick={onExplain}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onExplain?.();
      }}
      aria-label={`Project health: ${health.score} out of 100. Current risk ${health.currentRisk}. Click for breakdown.`}
    >
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-baseline gap-3">
          <span
            className={`text-[2.25rem] font-semibold leading-none tracking-[-0.022em] ${scoreColor}`}
            aria-hidden={true}
          >
            {health.score}
          </span>
          <span className="text-[1.25rem] font-semibold text-[var(--color-text-muted)] tracking-[-0.01em]">
            / 100
          </span>
          <span
            className={`ml-3 text-sm font-medium ${
              deltaPositive ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"
            }`}
          >
            {deltaPositive ? "↑" : "↓"} {Math.abs(health.delta)} from last week
          </span>
        </div>

        <button
          className="text-[var(--color-primary)] text-sm font-medium hover:text-[var(--color-primary-muted)] transition-colors duration-100 p-2 -mr-2"
          onClick={(e) => {
            e.stopPropagation();
            onExplain?.();
          }}
        >
          Explain score
        </button>
      </div>

      <h1 className="mt-1 text-[var(--color-text-secondary)] text-sm">
        Project Health
      </h1>

      <div className="mt-6 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-x-4 gap-y-6 sm:gap-6">
        <Indicator
          icon={ShieldCheck}
          label="Verified"
          value={health.verified ? "Yes" : "No"}
          tone={health.verified ? "success" : "warning"}
        />
        <Indicator
          icon={AlertTriangle}
          label="Drift"
          value={`${health.driftCount}`}
          tone={health.driftCount > 0 ? "danger" : "success"}
        />
        <Indicator
          icon={GitPullRequest}
          label="Pending"
          value={`${health.pendingCount}`}
          tone={health.pendingCount > 0 ? "warning" : "success"}
        />
        <Indicator
          icon={CheckCircle2}
          label="Risk"
          value={health.currentRisk}
          tone={
            health.currentRisk === "HIGH"
              ? "danger"
              : health.currentRisk === "MEDIUM"
              ? "warning"
              : "success"
          }
        />
      </div>
    </section>
  );
}

interface IndicatorProps {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties; "aria-hidden"?: boolean }>;
  label: string;
  value: string;
  tone: "success" | "warning" | "danger";
}

function Indicator({ icon: Icon, label, value, tone }: IndicatorProps) {
  const toneColorClass =
    tone === "success"
      ? "text-[var(--color-success)]"
      : tone === "warning"
      ? "text-[var(--color-warning)]"
      : "text-[var(--color-danger)]";

  return (
    <div className="flex items-center gap-2">
      <Icon
        className={`w-4 h-4 ${toneColorClass}`}
        aria-hidden={true}
      />
      <div className="flex flex-col">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          {label}
        </span>
        <span className={`text-sm font-medium ${toneColorClass}`}>
          {value}
        </span>
      </div>
    </div>
  );
}
