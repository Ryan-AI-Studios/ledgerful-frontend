import { Fragment } from "react";
import { MarketingLayout } from "@/components/MarketingLayout";
import { Check, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

type Cell = boolean | string;

interface Tier {
  name: string;
  price: string;
  period: string;
  blurb: string;
  cta: { label: string; href: string };
  highlight: boolean;
  features: string[];
}

const TIERS: Tier[] = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    blurb: "Individual developers and open-source projects.",
    cta: { label: "Get started", href: "/#install" },
    highlight: false,
    features: [
      "Local intent ledger",
      "Ed25519 signatures",
      "Basic impact analysis",
      "Knowledge graph (local)",
      "Community support",
    ],
  },
  {
    name: "Pro",
    price: "$19",
    period: "/mo · 5 seats",
    blurb: "Teams that review together. GitHub App, dashboard, webhooks.",
    cta: { label: "Try Pro free", href: "/#install" },
    highlight: true,
    features: [
      "Everything in Free",
      "GitHub App (PR risk comments)",
      "Team dashboard (ledgerful web)",
      "Slack webhooks",
      "Merge blocking on unsigned tx",
      "Unlimited project history",
      "Priority email support",
    ],
  },
  {
    name: "Enterprise",
    price: "$99",
    period: "/seat/mo · or $5k/yr flat",
    blurb: "Governance and compliance for regulated industries.",
    cta: { label: "Request demo", href: "mailto:sales@ledgerful.dev" },
    highlight: false,
    features: [
      "Everything in Pro",
      "SSO / SAML (OIDC, Okta, Azure AD)",
      "SOC2 compliance export",
      "RBAC (admin, auditor, developer)",
      "Signed audit trail (survives investigation)",
      "Dedicated success manager",
      "SLA + uptime monitoring",
    ],
  },
];

interface MatrixRow {
  category: string;
  items: { label: string; free: Cell; pro: Cell; ent: Cell }[];
}

const MATRIX: MatrixRow[] = [
  {
    category: "Core",
    items: [
      { label: "Intent ledger", free: true, pro: true, ent: true },
      { label: "Ed25519 signatures", free: true, pro: true, ent: true },
      { label: "Knowledge graph", free: "local", pro: true, ent: true },
      { label: "Risk scoring + multi-cue badges", free: true, pro: true, ent: true },
      { label: "MCP server", free: true, pro: true, ent: true },
    ],
  },
  {
    category: "Team",
    items: [
      { label: "GitHub App (PR comments)", free: false, pro: true, ent: true },
      { label: "Team dashboard (ledgerful web)", free: false, pro: true, ent: true },
      { label: "Slack webhooks", free: false, pro: true, ent: true },
      { label: "Merge blocking on unsigned tx", free: false, pro: true, ent: true },
      { label: "Seats", free: "1", pro: "5", ent: "unlimited" },
    ],
  },
  {
    category: "Governance",
    items: [
      { label: "SSO / SAML", free: false, pro: false, ent: true },
      { label: "SOC2 compliance export", free: false, pro: false, ent: true },
      { label: "RBAC", free: false, pro: false, ent: true },
      { label: "Signed audit trail", free: false, pro: false, ent: true },
      { label: "Dedicated success manager + SLA", free: false, pro: false, ent: true },
    ],
  },
];

const FAQ = [
  {
    q: "Does Ledgerful send my code or intent data anywhere?",
    a: "No. Ledgerful runs entirely on your machine or inside your air-gapped VPC. There is no SaaS, no telemetry, no data egress. The Enterprise tier adds hosted options, but the local-first model is the default.",
  },
  {
    q: "How is this different from git?",
    a: "Git records what changed. Ledgerful records why it changed, who decided, and whether the impact was understood — signed with Ed25519 and coupled to a knowledge graph that scores risk before review.",
  },
  {
    q: "Do I need the GitHub App for the free tier?",
    a: "No. The GitHub App is a Pro feature. The free tier is the local CLI plus the local dashboard. Teams that want PR risk comments and merge blocking upgrade to Pro.",
  },
  {
    q: "What does the SOC2 export include?",
    a: "A signed bundle of every transaction in the window: intent records, Ed25519 signatures, categories, risk scores, and verification status. An auditor can validate the signature chain without access to your source.",
  },
  {
    q: "Is there a self-hosted Enterprise option?",
    a: "Yes. Enterprise runs in your VPC with SSO/SAML, RBAC, and the compliance export. The hosted SaaS wrapper is optional and arrives after the local-first product is proven.",
  },
];

function CellValue({ value }: { value: Cell }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center" aria-label="Included">
        <Check className="w-4 h-4 text-[var(--color-primary)]" aria-hidden="true" />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="text-[var(--color-text-muted)]" aria-label="Not included">
        &mdash;
      </span>
    );
  }
  return <span className="font-mono text-[0.75rem] text-[var(--color-text-secondary)]">{value}</span>;
}

export default function PricingPage() {
  return (
    <MarketingLayout>
      <div className="max-w-[1080px] mx-auto px-4 md:px-6 py-16 md:py-20">
        <header className="max-w-2xl mb-12">
          <h1 className="text-[2rem] md:text-[2.25rem] font-semibold tracking-[-0.022em] text-[var(--color-text-primary)] [text-wrap:balance]">
            Pricing
          </h1>
          <p className="mt-3 text-[1rem] leading-relaxed text-[var(--color-text-secondary)] [text-wrap:pretty]">
            Local-first by default. Pay for team coordination and governance, not for the core ledger.
          </p>
        </header>

        {/* Tiers — dense table-style, not floating cards */}
        <div className="grid md:grid-cols-3 gap-px bg-[var(--color-border-muted)] rounded-lg overflow-hidden border border-[var(--color-border-muted)]">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`flex flex-col p-6 ${
                tier.highlight
                  ? "bg-[var(--color-surface)] ring-1 ring-[var(--color-primary)] md:my-[-4px] md:py-8 z-10"
                  : "bg-[var(--color-surface-alt)]"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-[1.0625rem] font-semibold text-[var(--color-text-primary)]">{tier.name}</h2>
                {tier.highlight && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-[var(--color-primary)] text-[var(--color-primary)] text-[0.625rem] font-bold uppercase tracking-wider bg-[rgba(0,229,160,0.06)]">
                    Recommended
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-[1.75rem] font-bold text-[var(--color-text-primary)]">{tier.price}</span>
                <span className="text-[0.75rem] text-[var(--color-text-muted)]">{tier.period}</span>
              </div>
              <p className="mt-2 text-[0.8125rem] text-[var(--color-text-secondary)] leading-relaxed min-h-[2.5rem]">{tier.blurb}</p>
              <Link
                href={tier.cta.href}
                className={`mt-4 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-150 ${
                  tier.highlight
                    ? "bg-[var(--color-primary)] text-[var(--color-text-inverse)] hover:bg-[var(--color-primary-muted)]"
                    : "border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]"
                }`}
              >
                {tier.cta.label}
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <ul className="mt-6 space-y-2.5 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 mt-0.5 text-[var(--color-primary)] flex-shrink-0" aria-hidden="true" />
                    <span className="text-[0.8125rem] text-[var(--color-text-primary)] leading-relaxed">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Compliance proof block */}
        <div className="mt-8 p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)]">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-[var(--color-primary)]" aria-hidden="true" />
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">Compliance-ready</span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            SOC2-ready export format, Ed25519 signed audit trail, and RBAC for admin, auditor,
            and developer roles. Designed for regulated industries and external auditor review.
          </p>
        </div>

        {/* Comparison matrix */}
        <section className="mt-16" aria-labelledby="matrix-heading">
          <h2 id="matrix-heading" className="text-[1.25rem] font-semibold tracking-[-0.01em] text-[var(--color-text-primary)] mb-6">
            Compare features
          </h2>

          {/* Mobile: stacked per-tier */}
          <div className="md:hidden space-y-3">
            {[["Free", "free"], ["Pro", "pro"], ["Enterprise", "ent"]].map(([label, key]) => (
              <details key={key} className="rounded-lg border border-[var(--color-border-muted)] bg-[var(--color-surface-alt)]" open={key === "pro"}>
                <summary className="cursor-pointer list-none px-4 py-2.5 flex items-center justify-between">
                  <span className="text-[0.9375rem] font-semibold text-[var(--color-text-primary)]">{label}</span>
                  <span className="text-[0.6875rem] text-[var(--color-text-muted)]">{MATRIX.reduce((n, g) => n + g.items.filter((r) => r[key as "free" | "pro" | "ent"] !== false).length, 0)} features</span>
                </summary>
                <dl className="px-4 pb-3 pt-1 space-y-3">
                  {MATRIX.map((group) => (
                    <div key={group.category}>
                      <dt className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">{group.category}</dt>
                      <dd className="space-y-1">
                        {group.items.map((row) => {
                          const v = row[key as "free" | "pro" | "ent"];
                          if (v === false) return null;
                          return (
                            <div key={row.label} className="flex items-center gap-2 text-[0.8125rem]">
                              <Check className="w-3.5 h-3.5 text-[var(--color-primary)] flex-shrink-0" aria-hidden="true" />
                              <span className="text-[var(--color-text-primary)]">{row.label}</span>
                              {typeof v === "string" && (
                                <span className="ml-auto font-mono text-[0.6875rem] text-[var(--color-text-secondary)]">{v}</span>
                              )}
                            </div>
                          );
                        })}
                      </dd>
                    </div>
                  ))}
                </dl>
              </details>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block rounded-lg border border-[var(--color-border-muted)] overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">Feature availability across Free, Pro, and Enterprise tiers</caption>
              <thead>
                <tr className="bg-[var(--color-surface)]">
                  <th scope="col" className="text-left px-4 py-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">Feature</th>
                  <th scope="col" className="text-center px-4 py-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] border-b border-[var(--color-border)] w-20">Free</th>
                  <th scope="col" className="text-center px-4 py-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--color-primary)] border-b border-[var(--color-border)] w-20">Pro</th>
                  <th scope="col" className="text-center px-4 py-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] border-b border-[var(--color-border)] w-24">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {MATRIX.map((group, gi) => (
                  <Fragment key={group.category}>
                    {gi > 0 && (
                      <tr aria-hidden="true">
                        <td colSpan={4} className="h-px bg-[var(--color-border-muted)] p-0" />
                      </tr>
                    )}
                    <tr className="bg-[var(--color-surface-alt)]">
                      <th scope="row" colSpan={4} className="text-left px-4 py-2 text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                        {group.category}
                      </th>
                    </tr>
                    {group.items.map((row) => (
                      <tr key={row.label} className="border-b border-[var(--color-border-muted)] last:border-0 hover:bg-[var(--color-surface-raised)] transition-colors duration-100">
                        <th scope="row" className="text-left px-4 py-2.5 font-normal text-[var(--color-text-primary)] text-[0.8125rem]">
                          {row.label}
                        </th>
                        <td className="text-center px-4 py-2.5"><CellValue value={row.free} /></td>
                        <td className="text-center px-4 py-2.5 bg-[rgba(0,229,160,0.04)]"><CellValue value={row.pro} /></td>
                        <td className="text-center px-4 py-2.5"><CellValue value={row.ent} /></td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-16" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-[1.25rem] font-semibold tracking-[-0.01em] text-[var(--color-text-primary)] mb-6">
            Common questions
          </h2>
          <dl className="divide-y divide-[var(--color-border-muted)] border-y border-[var(--color-border-muted)]">
            {FAQ.map((item) => (
              <div key={item.q} className="py-5">
                <dt className="text-[0.9375rem] font-semibold text-[var(--color-text-primary)]">{item.q}</dt>
                <dd className="mt-2 text-[0.875rem] leading-relaxed text-[var(--color-text-secondary)] [text-wrap:pretty]">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Closing */}
        <section className="mt-16 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-8 text-center">
          <h2 className="text-[1.25rem] font-semibold text-[var(--color-text-primary)]">Need something else?</h2>
          <p className="mt-2 text-[0.875rem] text-[var(--color-text-secondary)] max-w-md mx-auto [text-wrap:pretty]">
            Discounts for startups, non-profits, and educational institutions. Air-gapped VPC deployments available.
          </p>
          <Link
            href="mailto:sales@ledgerful.dev"
            className="mt-5 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-md border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors duration-150"
          >
            Talk to our team <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </MarketingLayout>
  );
}