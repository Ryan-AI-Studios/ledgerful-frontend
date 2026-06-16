"use client";

import { Search, Power } from "lucide-react";
import { ProjectSwitcher } from "./ProjectSwitcher";
import Link from "next/link";

export function TopNav() {
  return (
    <header className="h-12 flex items-center justify-between px-6 bg-[var(--color-surface-alt)] border-b border-[var(--color-border)]">
      <div className="flex items-center gap-4">
        <Link href="/" className="font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-primary)] transition-colors duration-100">
          Ledgerful
        </Link>
        <span className="text-[var(--color-text-muted)]" aria-hidden="true">/</span>
        <ProjectSwitcher />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search..."
            className="w-80 h-8 pl-8 pr-3 rounded-md bg-[var(--color-surface)] border border-[var(--color-border-muted)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
          />
        </div>
        <button className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors duration-100">
          <Power className="w-4 h-4" />
        </button>
        <div className="w-7 h-7 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-[var(--color-text-inverse)] text-xs font-semibold">
          Y
        </div>
      </div>
    </header>
  );
}
