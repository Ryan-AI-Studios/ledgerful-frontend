import { MarketingLayout } from "@/components/MarketingLayout";
import { Book, Terminal, Cpu, Search, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function DocsPage() {
  const sections = [
    {
      title: "Getting Started",
      links: [
        { name: "Introduction", href: "/docs" },
        { name: "Quick Start Guide", href: "#quick-start" },
        { name: "Installation", href: "/docs" },
        { name: "Core Concepts", href: "/docs" },
      ],
    },
    {
      title: "CLI Reference",
      links: [
        { name: "ledger start", href: "/docs" },
        { name: "ledger commit", href: "/docs" },
        { name: "ledger status", href: "/docs" },
        { name: "search", href: "/docs" },
      ],
    },
    {
      title: "Advanced",
      links: [
        { name: "AI Agent Integration", href: "/docs" },
        { name: "Knowledge Graph API", href: "/docs" },
        { name: "Compliance Hub", href: "/docs" },
        { name: "Custom Policies", href: "/docs" },
      ],
    },
  ];

  return (
    <MarketingLayout>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12 py-12 px-4 md:px-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="sticky top-24">
            <div className="relative mb-8">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
              <input
                type="search"
                aria-label="Search documentation"
                placeholder="Search docs..."
                className="w-full h-11 pl-10 pr-4 rounded-lg bg-[var(--color-surface-alt)] border border-[var(--color-border-muted)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              />
            </div>
            <nav className="space-y-8">
              {sections.map((section) => (
                <div key={section.title}>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
                    {section.title}
                  </h4>
                  <ul className="space-y-2">
                    {section.links.map((link) => (
                      <li key={link.name}>
                        <Link
                          href={link.href}
                          className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] flex items-center justify-between group"
                        >
                          {link.name}
                          <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <article className="flex-1 max-w-3xl">
          <div className="mb-12">
            <h1 className="text-4xl font-extrabold mb-4">Documentation</h1>
            <p className="text-xl text-[var(--color-text-secondary)]">
              Everything you need to build high-integrity software with Ledgerful.
            </p>
          </div>

          <section id="quick-start" className="mb-16">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Terminal className="w-6 h-6 text-[var(--color-primary)]" /> Quick Start Guide
            </h2>
            <p className="mb-6 text-[var(--color-text-secondary)]">
              Get up and running with Ledgerful in less than 2 minutes.
            </p>

            <div className="space-y-8">
              <div className="p-6 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border-muted)]">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-[var(--color-text-inverse)] flex items-center justify-center text-xs">1</span>
                  Install the CLI
                </h3>
                <code className="block p-4 rounded bg-[var(--color-surface)] border border-[var(--color-border)] font-mono text-sm text-[var(--color-primary)]">
                  npm install -g @ledgerful/cli
                </code>
              </div>

              <div className="p-6 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border-muted)]">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-[var(--color-text-inverse)] flex items-center justify-center text-xs">2</span>
                  Initialize your project
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                  Run this in the root of your git repository.
                </p>
                <code className="block p-4 rounded bg-[var(--color-surface)] border border-[var(--color-border)] font-mono text-sm text-[var(--color-primary)]">
                  ledger init
                </code>
              </div>

              <div className="p-6 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border-muted)]">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-[var(--color-text-inverse)] flex items-center justify-center text-xs">3</span>
                  Start a transaction
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                  Capture your intent before you start coding.
                </p>
                <code className="block p-4 rounded bg-[var(--color-surface)] border border-[var(--color-border)] font-mono text-sm text-[var(--color-primary)]">
                  ledger start &quot;refactor authentication layer&quot; --category security
                </code>
              </div>
            </div>
          </section>

          <div className="grid sm:grid-cols-2 gap-6">
            <Link
              href="/docs"
              className="p-6 rounded-xl border border-[var(--color-border-muted)] hover:border-[var(--color-primary)] transition-colors group"
            >
              <Book className="w-8 h-8 text-[var(--color-primary)] mb-4" />
              <h3 className="font-bold mb-2 group-hover:text-[var(--color-primary)]">Core Concepts</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">Understand the intent ledger and cryptographic provenance.</p>
            </Link>
            <Link
              href="/docs"
              className="p-6 rounded-xl border border-[var(--color-border-muted)] hover:border-[var(--color-primary)] transition-colors group"
            >
              <Cpu className="w-8 h-8 text-[var(--color-primary)] mb-4" />
              <h3 className="font-bold mb-2 group-hover:text-[var(--color-primary)]">Agentic Workflows</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">Learn how to integrate Ledgerful with AI coding assistants.</p>
            </Link>
          </div>
        </article>
      </div>
    </MarketingLayout>
  );
}
