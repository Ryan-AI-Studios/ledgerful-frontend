"use client";

import { VerificationHealth } from "@/lib/types";
import { StatusDot } from "./StatusDot";
import { formatRelativeTime } from "@/lib/utils";

interface VerificationHealthCardProps {
  health: VerificationHealth;
}

type DegradedKind = "no_runs" | "stale" | "other";

function degradedKind(health: VerificationHealth): DegradedKind {
  if (!health.lastRunAt) return "no_runs";
  const msg = (health.message ?? "").toLowerCase();
  if (msg.includes("stale") || msg.includes("older than")) return "stale";
  return "other";
}

/** Human-facing title + explanation for verification health (not project status). */
function describeHealth(health: VerificationHealth): {
  title: string;
  summary: string;
  detail: string;
  action?: string;
} {
  switch (health.status) {
    case "HEALTHY":
      return {
        title: "Verification healthy",
        summary:
          "The latest recorded verification run passed and is recent enough to trust.",
        detail:
          "This is only about verification history (`ledgerful verify`), not overall project status in the sidebar.",
      };
    case "FAILING":
      return {
        title: "Verification failing",
        summary:
          health.message?.trim() ||
          "The latest recorded verification run did not pass overall.",
        detail:
          "Something in the last verify plan failed. Open the steps table below or re-run verification to see which checks broke.",
        action: "Re-run: ledgerful verify",
      };
    case "DEGRADED": {
      const kind = degradedKind(health);
      if (kind === "no_runs") {
        return {
          title: "No verification data yet",
          summary:
            "Status is DEGRADED because there are no verification runs on record — not because a run failed.",
          detail:
            "The engine treats “never verified” as degraded posture so an empty history is not mistaken for a clean pass. Project status in the sidebar is separate and can still show healthy.",
          action: "Record a baseline: ledgerful verify",
        };
      }
      if (kind === "stale") {
        return {
          title: "Verification data is stale",
          summary:
            health.message?.trim() ||
            "The last successful verification run is older than the freshness window (7 days).",
          detail:
            "The last run passed, but it is too old to count as current. DEGRADED here means “out of date,” not “currently failing.”",
          action: "Refresh: ledgerful verify",
        };
      }
      return {
        title: "Verification degraded",
        summary:
          health.message?.trim() ||
          "Verification posture is incomplete or not fully trustworthy right now.",
        detail:
          "DEGRADED means the verification signal is weak or partial — for example missing history or a freshness problem — not necessarily that the latest run failed (that would be FAILING).",
        action: "Re-check: ledgerful verify",
      };
    }
  }
}

export function VerificationHealthCard({ health }: VerificationHealthCardProps) {
  const statusMap = {
    HEALTHY: "healthy",
    DEGRADED: "warning",
    FAILING: "critical",
  } as const;

  const copy = describeHealth(health);

  return (
    <div
      className="bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg p-6"
      role="region"
      aria-label={`Verification health: ${health.status}. ${copy.summary}`}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          Verification health
        </h2>
        <StatusDot status={statusMap[health.status]} label={health.status} />
      </div>

      <div className="mt-4">
        <p className="text-2xl font-bold text-[var(--color-text-primary)] leading-tight">
          {copy.title}
        </p>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          {copy.summary}
        </p>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">{copy.detail}</p>
        {copy.action && (
          <p className="mt-3 text-sm text-[var(--color-text-primary)]">
            <span className="text-[var(--color-text-muted)]">Next step: </span>
            <code className="rounded bg-[var(--color-surface)] border border-[var(--color-border-muted)] px-1.5 py-0.5 text-xs font-mono">
              {copy.action.replace(/^[^:]+:\s*/, "")}
            </code>
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--color-text-muted)]">
        <span>Last verification run:</span>
        {health.lastRunAt ? (
          <time dateTime={health.lastRunAt}>
            {formatRelativeTime(health.lastRunAt)}
          </time>
        ) : (
          <span>None recorded yet</span>
        )}
        <span className="text-[var(--color-border)]" aria-hidden="true">
          ·
        </span>
        <span>
          API status:{" "}
          <span className="font-mono text-[var(--color-text-secondary)]">
            {health.status}
          </span>
        </span>
      </div>
    </div>
  );
}
