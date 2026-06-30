"use client";

import { AlertTriangle } from "lucide-react";
import { useDaemonStatus } from "@/lib/DaemonStatusContext";

export function GlobalOfflineBanner() {
  const isDaemonOffline = useDaemonStatus();

  if (!isDaemonOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-[var(--color-danger-muted)]/10 border-y border-[var(--color-danger-muted)] px-4 py-2"
    >
      <div className="max-w-5xl mx-auto flex items-center gap-2 text-sm">
        <AlertTriangle
          className="w-4 h-4 text-[var(--color-warning)] flex-shrink-0"
          aria-hidden="true"
        />
        <span className="text-[var(--color-text-primary)]">
          The Ledgerful daemon is unreachable.
        </span>
        <span className="text-[var(--color-text-secondary)]">
          Some data is shown from mock fallback.
        </span>
      </div>
    </div>
  );
}