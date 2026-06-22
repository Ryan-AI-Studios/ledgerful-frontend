import { MarketingLayout } from "@/components/MarketingLayout";
import { CopyCommand } from "@/components/marketing/CopyCommand";
import { TerminalReceipt } from "@/components/marketing/TerminalReceipt";
import { SignedReceipt } from "@/components/marketing/SignedReceipt";
import { Reveal } from "@/components/marketing/Reveal";
import { ArrowRight, ShieldCheck, KeyRound, Network, Zap } from "lucide-react";
import Link from "next/link";

const QUESTIONS = [
  {
    n: "01",
    q: "Why did it change?",
    a: "Every commit links to a signed intent record — the reason, the reasoning, the verification. Not a guess from the diff.",
  },
  {
    n: "02",
    q: "Who decided?",
    a: "Ed25519 author signatures on every transaction. Attribution survives a merge, a rebase, and an auditor.",
  },
  {
    n: "03",
    q: "Was the impact understood?",
    a: "A knowledge graph couples every change to the files, tests, and boundaries it touches. Risk is scored before review.",
  },
] as const;

const CHANNELS = [
  {
    icon: Zap,
    title: "MCP server",
    sub: "@changeguard/mcp-server",
    body: "Cursor, Claude Code, Copilot, Windsurf. Your agents call scan, search, ask, hotspots, ledger_status.",
  },
  {
    icon: ShieldCheck,
    title: "GitHub App",
    sub: "PR risk comments",
    body: "A bot comment per pull request: risk level, temporal couplings, unsigned transactions, predicted test failures.",
  },
  {
    icon: Network,
    title: "Local dashboard",
    sub: "ledgerful web",
    body: "http://localhost:52001 — the manager's view. Dashboard, changes, ledger, hotspots, compliance. Zero egress.",
  },
] as const;

export default function MarketingPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="border-b border-[var(--color-border-muted)]">
        <div className="max-w-[1080px] mx-auto px-4 md:px-6 pt-20 pb-16 md:pt-28 md:pb-24 grid lg:grid-cols-[5fr_4fr] gap-10 lg:gap-14 items-center">
          <div className="max-w-3xl">
            <h1 className="text-[2rem] md:text-[2.5rem] font-semibold leading-[1.1] tracking-[-0.022em] text-[var(--color-text-primary)] [text-wrap:balance]">
              Know what your change{" "}
              <span className="text-[var(--color-primary)] inline-block">impacts</span>
              {" "}— before review.
            </h1>
            <p className="mt-6 max-w-2xl text-[1.0625rem] leading-relaxed text-[var(--color-text-secondary)] [text-wrap:pretty]">
              The intent ledger for agentic engineering. Map change impact, find the tests
              your PR actually needs, and catch unresolved review gaps — before humans or
              AI touch the diff. Runs local-first; no SaaS, no telemetry, no data egress.
            </p>
            {/* CTA row: filled primary + ghost secondary, side-by-side on desktop, stacked on mobile */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="#install"
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-md bg-[var(--color-primary)] text-[var(--color-text-inverse)] text-sm font-semibold hover:bg-[var(--color-primary-muted)] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[var(--color-border-strong)] focus-visible:outline-offset-2"
              >
                Get started <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-md border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-alt)] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[var(--color-border-strong)] focus-visible:outline-offset-2"
              >
                Read the docs
              </Link>
            </div>
            {/* Install chip below CTAs with muted label */}
            <div id="install" className="mt-6 scroll-mt-24">
              <p className="text-[0.6875rem] text-[var(--color-text-muted)] mb-2">or install the CLI</p>
              <CopyCommand command="npm install -g @ledgerful/cli" />
            </div>
            <p className="mt-3 text-xs text-[var(--color-text-muted)]">
              No telemetry · No data egress · MIT-licensed core
            </p>
          </div>
          {/* TerminalReceipt in the hero right column at lg; below copy on mobile */}
          <TerminalReceipt />
        </div>
      </section>

      {/* In conversations with — trust band */}
      <section className="border-b border-[var(--color-border-muted)]" aria-label="In conversations with design partner companies">
        <div className="max-w-[1080px] mx-auto px-4 md:px-6 py-8">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-4">
            In conversations with
          </p>
          <div className="flex flex-wrap gap-8 items-center">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center justify-center h-8 px-4 rounded-md border border-[var(--color-border-muted)] bg-[var(--color-surface-alt)]"
                aria-hidden="true"
              >
                <span className="text-[0.75rem] font-semibold text-[var(--color-text-muted)] tracking-wide">
                  Company
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cryptography without ceremony */}
      <section className="border-b border-[var(--color-border-muted)] bg-[var(--color-surface-alt)]">
        <Reveal>
          <div className="max-w-[1080px] mx-auto px-4 md:px-6 py-16 md:py-20 grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-14 items-center">
            <SignedReceipt />
            <div>
              <h2 className="text-[1.5rem] font-semibold tracking-[-0.015em] text-[var(--color-text-primary)] [text-wrap:balance]">
                Signed provenance, shown as a receipt.
              </h2>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-[var(--color-text-secondary)] [text-wrap:pretty]">
                The answer in 2 seconds: risk you can screenshot and trust. Every transaction carries an Ed25519 signature, an intent record, and a category.
                A CISO runs <code className="px-1.5 py-0.5 rounded-sm bg-[var(--color-surface)] border border-[var(--color-border-muted)] font-mono text-[0.75rem] text-[var(--color-primary)]">ledgerful export --format=soc2</code> and hands the bundle to an auditor.
                No puzzle, no ceremony — a receipt an auditor and a Staff engineer both believe.
              </p>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[0.8125rem] text-[var(--color-text-muted)]">
                <span className="inline-flex items-center gap-1.5"><KeyRound className="w-3.5 h-3.5 text-[var(--color-primary)]" /> Ed25519 signatures</span>
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-[var(--color-primary)]" /> SOC2 export</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-primary)]" aria-hidden="true" />
                  <span className="text-[0.75rem] font-semibold">SOC2-ready</span>
                </span>
                <span className="inline-flex items-center gap-1.5"><Network className="w-3.5 h-3.5 text-[var(--color-primary)]" /> Knowledge graph</span>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Three questions git can't answer */}
      <section className="border-b border-[var(--color-border-muted)]">
        <Reveal>
          <div className="max-w-[1080px] mx-auto px-4 md:px-6 py-14 md:py-20 grid md:grid-cols-[2fr_3fr] gap-10 lg:gap-14">
            <div>
              <h2 className="text-[1.5rem] font-semibold tracking-[-0.015em] text-[var(--color-text-primary)] mb-2 [text-wrap:balance]">
                Three questions git can&rsquo;t answer.
              </h2>
              <p className="text-[0.9375rem] text-[var(--color-text-secondary)] [text-wrap:pretty]">
                Git records what changed. It does not record why, or whether anyone checked the blast radius. Ledgerful does.
              </p>
            </div>
            <ol className="divide-y divide-[var(--color-border-muted)]">
              {QUESTIONS.map((item) => (
                <li key={item.n} className="py-5 first:pt-0 last:pb-0">
                  <div className="flex items-baseline gap-3 mb-1">
                    <span className="font-mono text-[0.6875rem] text-[var(--color-text-muted)]">{item.n}</span>
                    <h3 className="text-[1.0625rem] font-semibold text-[var(--color-text-primary)]">{item.q}</h3>
                  </div>
                  <p className="text-[0.8125rem] leading-relaxed text-[var(--color-text-secondary)] pl-8">{item.a}</p>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </section>

      {/* Distribution channels */}
      <section className="border-b border-[var(--color-border-muted)]">
        <Reveal>
          <div className="max-w-[1080px] mx-auto px-4 md:px-6 py-16 md:py-20">
            <h2 className="text-[1.5rem] font-semibold tracking-[-0.015em] text-[var(--color-text-primary)] mb-2 [text-wrap:balance]">
              Where it lands.
            </h2>
            <p className="text-[0.9375rem] text-[var(--color-text-secondary)] mb-10 max-w-2xl [text-wrap:pretty]">
              Three surfaces meet your team where they already work: the agent terminal, the pull request, and the local dashboard.
            </p>
            <ol className="grid md:grid-cols-3 gap-6">
              {CHANNELS.map((c, i) => (
                <li key={c.title} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-6 transition-transform duration-100 ease-out hover:-translate-y-0.5">
                  <div className="flex items-center justify-between mb-4">
                    <c.icon className="w-5 h-5 text-[var(--color-primary)]" aria-hidden="true" />
                    <span className="font-mono text-[0.6875rem] text-[var(--color-text-muted)]">0{i + 1}</span>
                  </div>
                  <h3 className="text-[1.0625rem] font-semibold text-[var(--color-text-primary)]">{c.title}</h3>
                  <p className="font-mono text-[0.75rem] text-[var(--color-text-muted)] mt-0.5">{c.sub}</p>
                  <p className="mt-3 text-[0.8125rem] leading-relaxed text-[var(--color-text-secondary)]">{c.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </section>

      {/* Closing CTA */}
      <section>
        <Reveal>
          <div className="max-w-[1080px] mx-auto px-4 md:px-6 py-20 md:py-24 text-center">
          <h2 className="text-[1.75rem] md:text-[2rem] font-semibold tracking-[-0.015em] text-[var(--color-text-primary)] [text-wrap:balance]">
            Install in 60 seconds.
          </h2>
          <p className="mt-4 text-[0.9375rem] text-[var(--color-text-secondary)] max-w-xl mx-auto [text-wrap:pretty]">
            Map your first change in under five.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <CopyCommand command="npm install -g @ledgerful/cli" />
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-md border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-alt)] transition-colors duration-150"
            >
              View pricing <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
          <p className="mt-6 text-xs text-[var(--color-text-muted)]">
            Open source.{" "}
            <a
              href="https://github.com/ledgerful/ledgerful"
              rel="noopener noreferrer"
              target="_blank"
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors duration-150"
            >
              Star us on GitHub →
            </a>
          </p>
        </div>
      </Reveal>
      </section>
    </MarketingLayout>
  );
}
