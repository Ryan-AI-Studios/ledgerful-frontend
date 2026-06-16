import { MarketingLayout } from "@/components/MarketingLayout";
import { Terminal, Shield, Brain, Zap, ArrowRight, Check } from "lucide-react";
import Link from "next/link";

export default function MarketingPage() {
  const valueProps = [
    {
      title: "Local-first change intelligence",
      description: "Everything stays on your machine. No cloud dependency for your core dev loop.",
      icon: Zap,
    },
    {
      title: "Cryptographic provenance",
      description: "Every change is signed and hashed. Trust nothing, verify everything.",
      icon: Shield,
    },
    {
      title: "AI governance ready",
      description: "Full audit trails for agentic workflows. Know exactly what your AI did and why.",
      icon: Brain,
    },
  ];

  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-[var(--color-text-primary)] mb-6">
          Local-first change intelligence. <br />
          <span className="text-[var(--color-primary)]">Cryptographic provenance.</span> <br />
          AI governance ready.
        </h1>
        <p className="text-xl text-[var(--color-text-secondary)] mb-10 max-w-3xl mx-auto">
          The intent ledger for high-integrity engineering. Secure your codebase, verify agentic contributions, and maintain a perfect audit trail without leaving your local environment.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/marketing"
            className="w-full sm:w-auto px-8 py-4 rounded-lg bg-[var(--color-primary)] text-[var(--color-text-inverse)] font-semibold text-lg hover:opacity-90 transition-opacity"
          >
            Get Started
          </Link>
          <div className="w-full sm:w-auto flex items-center gap-3 px-6 py-4 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] font-mono text-sm">
            <Terminal className="w-4 h-4 text-[var(--color-primary)]" />
            <span className="text-[var(--color-text-primary)]">npm install -g @ledgerful/cli</span>
          </div>
        </div>

        {/* Value Props */}
        <div className="grid md:grid-cols-3 gap-8 text-left">
          {valueProps.map((prop) => (
            <div key={prop.title} className="p-6 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border-muted)]">
              <div className="w-12 h-12 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center mb-4">
                <prop.icon className="w-6 h-6 text-[var(--color-primary)]" />
              </div>
              <h3 className="text-xl font-bold mb-2">{prop.title}</h3>
              <p className="text-[var(--color-text-secondary)]">{prop.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Detail */}
      <section className="py-20 px-4 md:px-8 bg-[var(--color-surface-alt)] border-y border-[var(--color-border-muted)]">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">Built for the future of agentic engineering</h2>
            <p className="text-[var(--color-text-secondary)] mb-8">
              As AI agents become first-class citizens in the codebase, you need more than just Git. Ledgerful provides the missing layer of intent and cryptographic verification.
            </p>
            <ul className="space-y-4">
              {[
                "Automatic intent capture from terminal and IDE",
                "Cryptographic signatures for every transaction",
                "Knowledge graph integration for impact analysis",
                "Headless mode for CI/CD and agent orchestration",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[var(--color-primary)]" />
                  <span className="text-[var(--color-text-primary)] font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="aspect-video rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl overflow-hidden flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/dashboard.png" alt="Ledgerful Dashboard Interactive Demo" className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity duration-300 cursor-pointer" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-8 text-center max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">Ready to secure your provenance?</h2>
        <p className="text-[var(--color-text-secondary)] mb-10">
          Join high-integrity teams building the next generation of software with Ledgerful.
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-[var(--color-primary)] text-[var(--color-text-inverse)] font-semibold text-lg hover:opacity-90 transition-opacity"
        >
          View Pricing <ArrowRight className="w-5 h-5" />
        </Link>
      </section>
    </MarketingLayout>
  );
}
