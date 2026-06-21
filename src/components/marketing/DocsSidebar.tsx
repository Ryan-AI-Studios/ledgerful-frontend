"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface DocsSidebarProps {
  search: ReactNode;
  nav: ReactNode;
}

export function DocsSidebar({ search, nav }: DocsSidebarProps) {
  const [open, setOpen] = useState(false);
  return (
    <aside className="w-full md:w-56 flex-shrink-0">
      {/* Mobile: collapsible */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-[var(--color-surface-alt)] border border-[var(--color-border-muted)] text-sm font-semibold text-[var(--color-text-primary)]"
        >
          <span>On this page</span>
          <ChevronDown className={`w-4 h-4 text-[var(--color-text-secondary)] transition-transform duration-150 ${open ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
        {open && (
          <div className="mt-3">
            {search}
            {nav}
          </div>
        )}
      </div>
      {/* Desktop: sticky, always visible */}
      <div className="hidden md:block">
        <div className="md:sticky md:top-20">
          {search}
          {nav}
        </div>
      </div>
    </aside>
  );
}