"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { fetchStatus } from "@/lib/status-data";

const DISMISS_KEY = "ledgerful:offline-banner-dismissed";

export function GlobalOfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem(DISMISS_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const check = async () => {
      try {
        await fetchStatus();
        setOffline(false);
      } catch {
        setOffline(true);
      }
    };

    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "true");
    } catch {
      // ignore storage errors.
    }
    setDismissed(true);
  };

  if (!offline || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-[var(--color-danger-muted)]/10 border-y border-[var(--color-danger-muted)] px-4 py-2"
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
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
        <button
          onClick={handleDismiss}
          aria-label="Dismiss offline notice"
          className="p-1 rounded-md hover:bg-[var(--color-surface-raised)] transition-colors duration-100 focus:outline-none focus:ring-2 focus:ring-[var(--color-border-strong)]"
        >
          <X className="w-4 h-4 text-[var(--color-text-secondary)]" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
