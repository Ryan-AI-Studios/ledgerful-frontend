"use client";

import { Search, Power, Menu } from "lucide-react";
import { ProjectSwitcher } from "./ProjectSwitcher";
import { UserMenu } from "./UserMenu";
import Link from "next/link";

interface TopNavProps {
  onToggleMenu?: () => void;
  isOpen?: boolean;
}

export function TopNav({ onToggleMenu, isOpen }: TopNavProps) {
  return (
    <header className="h-12 flex items-center justify-between px-4 md:px-6 bg-[var(--color-surface-alt)] border-b border-[var(--color-border)]">
      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={onToggleMenu}
          aria-expanded={isOpen}
          aria-controls="mobile-sidebar"
          className="lg:hidden p-2 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors duration-100"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/" className="font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-primary)] transition-colors duration-100 p-1">
          Ledgerful
        </Link>
        <span className="hidden md:inline text-[var(--color-text-muted)]" aria-hidden="true">/</span>
        <div className="hidden md:block">
          <ProjectSwitcher />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="relative hidden sm:block">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" aria-hidden="true" />
          <input
            type="search"
            aria-label="Search"
            placeholder="Search..."
            className="w-40 md:w-80 h-8 pl-8 pr-3 rounded-md bg-[var(--color-surface)] border border-[var(--color-border-muted)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
          />
        </div>
        <button aria-label="Disconnect" className="p-2 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors duration-100">
          <Power className="w-4 h-4" />
        </button>
        <UserMenu />
      </div>
    </header>
  );
}
