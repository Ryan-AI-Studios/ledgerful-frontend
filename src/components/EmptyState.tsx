"use client";

import { Copy, BookOpen } from "lucide-react";

export function EmptyState() {
  const command = "ledgerful scan";

  const copy = () => {
    navigator.clipboard.writeText(command);
  };

  return (
    <section className="bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg p-10 text-center">
      <h2 className="text-[1.25rem] font-semibold text-[var(--color-text-primary)]">
        No data yet
      </h2>
      <p className="mt-2 text-[var(--color-text-secondary)] max-w-md mx-auto">
        Run your first scan to populate the dashboard. Then refresh this page.
      </p>

      <div className="mt-6 inline-flex items-center gap-3 px-4 py-3 rounded-md bg-[var(--color-surface)] border border-[var(--color-border-muted)] font-mono text-sm text-[var(--color-text-primary)]">
        <span className="text-[var(--color-text-muted)]">$</span> {command}
      </div>

      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          onClick={copy}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--color-primary)] text-[var(--color-text-inverse)] text-sm font-semibold hover:bg-[var(--color-primary-muted)] transition-colors duration-100"
        >
          <Copy className="w-4 h-4" aria-hidden="true" />
          Copy command
        </button>
        <a
          href="https://docs.ledgerful.dev"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm font-medium hover:bg-[var(--color-surface-raised)] transition-colors duration-100"
        >
          <BookOpen className="w-4 h-4" aria-hidden="true" />
          Open docs
        </a>
      </div>
    </section>
  );
}
