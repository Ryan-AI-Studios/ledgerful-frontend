"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { name: "Features", href: "/" },
  { name: "Pricing", href: "/pricing" },
  { name: "Docs", href: "/docs" },
] as const;

export function MarketingTopNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[var(--color-surface)]/95 backdrop-blur-sm border-b border-[var(--color-border-muted)]">
      <div className="max-w-[1080px] mx-auto flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-base font-bold tracking-tight text-[var(--color-text-primary)]"
          >
            <span className="text-[var(--color-primary)]">Ledger</span>ful
          </Link>
          <nav className="hidden md:flex items-center gap-6" aria-label="Primary">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`text-sm font-medium py-2 border-b-2 transition-colors duration-150 ${
                    active
                      ? "text-[var(--color-text-primary)] border-[var(--color-primary)]"
                      : "text-[var(--color-text-secondary)] border-transparent hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-md border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-alt)] transition-colors duration-150"
          >
            Dashboard
          </Link>
          <Link
            href="/#install"
            className="inline-flex items-center px-3 py-1.5 rounded-md bg-[var(--color-primary)] text-[var(--color-text-inverse)] text-sm font-semibold hover:bg-[var(--color-primary-muted)] transition-colors duration-150"
          >
            Get Started
          </Link>
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-alt)] transition-colors"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="md:hidden border-t border-[var(--color-border-muted)] bg-[var(--color-surface)]" aria-label="Mobile">
          <div className="max-w-[1080px] mx-auto px-4 py-2 flex flex-col">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={`py-2.5 text-sm font-medium border-l-2 ${
                    active
                      ? "text-[var(--color-primary)] border-[var(--color-primary)] pl-3"
                      : "text-[var(--color-text-secondary)] border-transparent pl-3 hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            <Link
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="py-2.5 text-sm font-medium text-[var(--color-text-secondary)] border-l-2 border-transparent pl-3 hover:text-[var(--color-text-primary)]"
            >
              Dashboard
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}