import { ReactNode } from "react";
import Link from "next/link";
import { MarketingTopNav } from "./MarketingTopNav";

interface MarketingLayoutProps {
  children: ReactNode;
}

export function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-b-md focus:bg-[var(--color-primary)] focus:text-[var(--color-text-inverse)] focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>
      <MarketingTopNav />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <footer className="border-t border-[var(--color-border-muted)] bg-[var(--color-surface-alt)]">
        <div className="max-w-[1080px] mx-auto px-4 md:px-6 py-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="flex flex-col gap-2 max-w-sm">
            <span className="text-base font-bold text-[var(--color-text-primary)]">
              <span className="text-[var(--color-primary)]">Ledger</span>ful
            </span>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Local-first change intelligence and cryptographic provenance.
              Where git answers what changed, Ledgerful answers why.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-10">
            <nav aria-label="Footer">
              <ul className="flex flex-col gap-2">
                <li><Link href="/" className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">Features</Link></li>
                <li><Link href="/pricing" className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">Pricing</Link></li>
                <li><Link href="/docs" className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">Docs</Link></li>
                <li><Link href="/dashboard" className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">Dashboard</Link></li>
              </ul>
            </nav>
          </div>
        </div>
        <div className="border-t border-[var(--color-border-muted)]">
          <div className="max-w-[1080px] mx-auto px-4 md:px-6 py-4">
            <p className="text-[0.6875rem] text-[var(--color-text-muted)]">
              © {new Date().getFullYear()} Ledgerful. Built for high-integrity engineering.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}