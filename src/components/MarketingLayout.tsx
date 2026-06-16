"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { MarketingTopNav } from "./MarketingTopNav";

interface MarketingLayoutProps {
  children: ReactNode;
}

export function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface)]">
      <MarketingTopNav />
      <main className="flex-1">
        {children}
      </main>
      <footer className="py-12 px-4 md:px-8 border-t border-[var(--color-border-muted)] bg-[var(--color-surface-alt)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col gap-2">
            <span className="text-xl font-bold text-[var(--color-text-primary)]">Ledgerful</span>
            <p className="text-sm text-[var(--color-text-muted)]">
              Local-first change intelligence and cryptographic provenance.
            </p>
          </div>
          <div className="flex gap-8">
            <Link href="/marketing" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">Features</Link>
            <Link href="/pricing" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">Pricing</Link>
            <Link href="/docs" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">Docs</Link>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            © {new Date().getFullYear()} Ledgerful. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
