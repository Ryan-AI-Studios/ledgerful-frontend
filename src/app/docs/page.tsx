import { MarketingLayout } from "@/components/MarketingLayout";
import { DocsSidebar } from "@/components/marketing/DocsSidebar";
import { Search, Book, Cpu, Database, ShieldAlert, TerminalSquare } from "lucide-react";
import Link from "next/link";

interface NavLink {
  name: string;
  href: string;
}

interface NavSection {
  title: string;
  links: NavLink[];
}

const SECTIONS: NavSection[] = [
  {
    title: "Getting started",
    links: [
      { name: "Introduction", href: "#introduction" },
      { name: "Quick start", href: "#quick-start" },
      { name: "Install", href: "#install" },
      { name: "Core concepts", href: "#core-concepts" },
    ],
  },
  {
    title: "CLI reference",
    links: [
      { name: "ledgerful init", href: "#cli-init" },
      { name: "ledgerful start", href: "#cli-start" },
      { name: "ledgerful scan", href: "#cli-scan" },
      { name: "ledgerful ledger status", href: "#cli-status" },
      { name: "ledgerful search", href: "#cli-search" },
    ],
  },
  {
    title: "Advanced",
    links: [
      { name: "AI agent integration", href: "#ai-agents" },
      { name: "Compliance export", href: "#compliance-export" },
    ],
  },
];

const CONCEPTS = [
  {
    icon: Book,
    title: "Intent ledger",
    body: "Every change carries a signed record of why it was made — the reasoning, not just the diff.",
  },
  {
    icon: Database,
    title: "Knowledge graph",
    body: "A CozoDB graph couples files, symbols, tests, and boundaries. Impact is scored against real couplings.",
  },
  {
    icon: ShieldAlert,
    title: "Risk scoring",
    body: "HIGH / MED / LOW / TRIVIAL — always color + icon + text. Predicted test failures flag temporal couplings.",
  },
  {
    icon: Cpu,
    title: "Agentic workflows",
    body: "Headless mode for CI/CD and agent orchestration. The MCP server exposes scan, search, ask, hotspots.",
  },
] as const;

function CmdBlock({ id, command }: { id?: string; command: string }) {
  return (
    <code
      id={id}
      className="block px-4 py-3 rounded-md bg-[var(--color-surface)] border border-[var(--color-border-muted)] font-mono text-[0.8125rem] text-[var(--color-primary)] overflow-x-auto scroll-mt-24"
    >
      {command}
    </code>
  );
}

export default function DocsPage() {
  return (
    <MarketingLayout>
      <div className="max-w-[1080px] mx-auto px-4 md:px-6 py-12 md:py-16 flex flex-col md:flex-row gap-10 md:gap-12">
        {/* Sidebar */}
        <DocsSidebar
          search={
            <div className="relative mb-6">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" aria-hidden="true" />
              <input
                type="search"
                aria-label="Search documentation"
                placeholder="Search docs"
                className="w-full h-9 pl-9 pr-3 rounded-md bg-[var(--color-surface-alt)] border border-[var(--color-border-muted)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
              />
            </div>
          }
          nav={
            <nav aria-label="Documentation">
              {SECTIONS.map((section) => (
                <div key={section.title} className="mb-6">
                  <h2 className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">
                    {section.title}
                  </h2>
                  <ul className="space-y-0.5 border-l border-[var(--color-border-muted)]">
                    {section.links.map((link) => (
                      <li key={link.name}>
                        <Link
                          href={link.href}
                          className="block pl-3 -ml-px border-l border-transparent py-1 text-[0.8125rem] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border)] transition-colors duration-100"
                        >
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          }
        />

        {/* Content */}
        <article className="flex-1 min-w-0 max-w-2xl">
          <div id="introduction" className="mb-12 scroll-mt-20">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--color-primary)] mb-2">Documentation</p>
            <h1 className="text-[2rem] font-semibold tracking-[-0.022em] text-[var(--color-text-primary)] [text-wrap:balance]">
              Build high-integrity software with Ledgerful.
            </h1>
            <p className="mt-4 text-[1rem] leading-relaxed text-[var(--color-text-secondary)] [text-wrap:pretty]">
              Ledgerful captures the immutable why behind every code change — intent, reasoning, verification — signs it with Ed25519, and makes it answerable in two seconds. Everything runs on your machine.
            </p>
          </div>

          {/* Quick start */}
          <section id="quick-start" className="mb-14 scroll-mt-20">
            <h2 className="text-[1.25rem] font-semibold tracking-[-0.01em] text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
              <TerminalSquare className="w-5 h-5 text-[var(--color-primary)]" aria-hidden="true" />
              Quick start
            </h2>
            <p className="mb-6 text-[0.9375rem] text-[var(--color-text-secondary)] [text-wrap:pretty]">
              Up and running in under two minutes. Run each command in the root of your git repository.
            </p>

            <div className="space-y-6">
              <div id="install" className="scroll-mt-20">
                <h3 className="text-[0.9375rem] font-semibold text-[var(--color-text-primary)] mb-2">
                  <span className="font-mono text-[var(--color-text-muted)] mr-2">1</span>
                  Install the CLI
                </h3>
                <CmdBlock command="npm install -g @ledgerful/cli" />
              </div>

              <div>
                <h3 id="cli-init" className="text-[0.9375rem] font-semibold text-[var(--color-text-primary)] mb-2 scroll-mt-20">
                  <span className="font-mono text-[var(--color-text-muted)] mr-2">2</span>
                  Initialize your project
                </h3>
                <p className="text-[0.8125rem] text-[var(--color-text-secondary)] mb-2">Creates the local ledger, config, and git hooks.</p>
                <CmdBlock command="ledgerful init" />
              </div>

              <div>
                <h3 id="cli-start" className="text-[0.9375rem] font-semibold text-[var(--color-text-primary)] mb-2 scroll-mt-20">
                  <span className="font-mono text-[var(--color-text-muted)] mr-2">3</span>
                  Capture your intent
                </h3>
                <p className="text-[0.8125rem] text-[var(--color-text-secondary)] mb-2">Before you start coding, record why.</p>
                <CmdBlock command="ledgerful start &quot;refactor authentication layer&quot; --category security" />
              </div>

              <div>
                <h3 id="cli-scan" className="text-[0.9375rem] font-semibold text-[var(--color-text-primary)] mb-2 scroll-mt-20">
                  <span className="font-mono text-[var(--color-text-muted)] mr-2">4</span>
                  Scan for impact and risk
                </h3>
                <p className="text-[0.8125rem] text-[var(--color-text-secondary)] mb-2">Couplings, predicted test failures, and risk scores — then open the dashboard.</p>
                <CmdBlock command="ledgerful scan --open" />
              </div>

              <div>
                <h3 id="cli-status" className="text-[0.9375rem] font-semibold text-[var(--color-text-primary)] mb-2 scroll-mt-20">
                  <span className="font-mono text-[var(--color-text-muted)] mr-2">5</span>
                  Check the ledger
                </h3>
                <CmdBlock command="ledgerful ledger status --compact" />
              </div>

              <div>
                <h3 id="cli-search" className="text-[0.9375rem] font-semibold text-[var(--color-text-primary)] mb-2 scroll-mt-20">
                  <span className="font-mono text-[var(--color-text-muted)] mr-2">6</span>
                  Search the knowledge graph
                </h3>
                <CmdBlock command="ledgerful search &quot;auth session&quot;" />
              </div>
            </div>
          </section>

          {/* Core concepts */}
          <section id="core-concepts" className="mb-14 scroll-mt-20">
            <h2 className="text-[1.25rem] font-semibold tracking-[-0.01em] text-[var(--color-text-primary)] mb-6">
              Core concepts
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {CONCEPTS.map((c) => (
                <div key={c.title} className="rounded-lg border border-[var(--color-border-muted)] bg-[var(--color-surface-alt)] p-5">
                  <c.icon className="w-5 h-5 text-[var(--color-primary)] mb-3" aria-hidden="true" />
                  <h3 className="text-[0.9375rem] font-semibold text-[var(--color-text-primary)]">{c.title}</h3>
                  <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-[var(--color-text-secondary)]">{c.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Advanced */}
          <section id="advanced" className="mb-14 scroll-mt-20">
            <h2 className="text-[1.25rem] font-semibold tracking-[-0.01em] text-[var(--color-text-primary)] mb-4">
              Advanced
            </h2>
            <div className="space-y-4">
              <div id="ai-agents" className="rounded-lg border border-[var(--color-border-muted)] bg-[var(--color-surface-alt)] p-5 scroll-mt-20">
                <h3 className="text-[0.9375rem] font-semibold text-[var(--color-text-primary)] mb-1.5">AI agent integration</h3>
                <p className="text-[0.8125rem] leading-relaxed text-[var(--color-text-secondary)] mb-3">
                  Install the MCP server and your agent can call scan, search, ask, hotspots, and ledger_status.
                </p>
                <CmdBlock command="npm install -g @ledgerful/mcp-server" />
              </div>
              <div id="compliance-export" className="rounded-lg border border-[var(--color-border-muted)] bg-[var(--color-surface-alt)] p-5 scroll-mt-20">
                <h3 className="text-[0.9375rem] font-semibold text-[var(--color-text-primary)] mb-1.5">Compliance export</h3>
                <p className="text-[0.8125rem] leading-relaxed text-[var(--color-text-secondary)] mb-3">
                  Hand an auditor a signed bundle. The signature chain validates without access to your source.
                </p>
                <CmdBlock command="ledgerful export --format=soc2 --out ./audit-bundle.zip" />
              </div>
            </div>
          </section>

          <div className="mt-16 pt-8 border-t border-[var(--color-border-muted)] text-[0.8125rem] text-[var(--color-text-muted)]">
            <p>
              Full CLI reference and API docs ship with the backend. Run <code className="font-mono text-[var(--color-info)]">ledgerful --help</code> for every command.
            </p>
          </div>
        </article>
      </div>
    </MarketingLayout>
  );
}