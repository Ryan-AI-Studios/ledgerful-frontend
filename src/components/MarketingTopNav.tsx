"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function MarketingTopNav() {
  const pathname = usePathname();

  const navLinks = [
    { name: "Features", href: "/marketing" },
    { name: "Pricing", href: "/pricing" },
    { name: "Docs", href: "/docs" },
  ];

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-8 bg-[var(--color-surface)] border-b border-[var(--color-border-muted)]">
      <div className="flex items-center gap-8">
        <Link href="/marketing" className="text-xl font-bold text-[var(--color-primary)] tracking-tight">
          Ledgerful
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={`text-sm font-medium transition-colors duration-200 ${
                pathname === link.href
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="px-4 py-2 rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-alt)] transition-colors duration-200"
        >
          Dashboard
        </Link>
        <Link
          href="/marketing"
          className="px-4 py-2 rounded-md bg-[var(--color-primary)] text-[var(--color-text-inverse)] text-sm font-medium hover:opacity-90 transition-opacity duration-200"
        >
          Get Started
        </Link>
      </div>
    </header>
  );
}
