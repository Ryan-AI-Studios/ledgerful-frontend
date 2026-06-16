import { MarketingLayout } from "@/components/MarketingLayout";
import { Check, Star } from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  const tiers = [
    {
      name: "Free",
      price: "$0",
      description: "Perfect for individual developers and open-source projects.",
      features: [
        "Local intent ledger",
        "Cryptographic signatures",
        "Basic impact analysis",
        "Community support",
      ],
      cta: "Get Started",
      highlight: false,
    },
    {
      name: "Pro",
      price: "$29",
      period: "/month",
      description: "Advanced intelligence for professional engineers and small teams.",
      features: [
        "Everything in Free",
        "Advanced Knowledge Graph",
        "AI Agent orchestration",
        "Unlimited project history",
        "Priority email support",
      ],
      cta: "Try Pro Free",
      highlight: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "Full governance and compliance for large organizations.",
      features: [
        "Everything in Pro",
        "SAML/SSO integration",
        "SOC2 compliance reports",
        "Custom policy engine",
        "Dedicated success manager",
      ],
      cta: "Contact Sales",
      highlight: false,
    },
  ];

  return (
    <MarketingLayout>
      <div className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold mb-4">Simple, transparent pricing</h1>
          <p className="text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            Scale your cryptographic provenance and change intelligence as your team grows.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col p-8 rounded-2xl border transition-all duration-200 ${
                tier.highlight
                  ? "bg-[var(--color-surface)] border-[var(--color-primary)] shadow-xl scale-105 z-10"
                  : "bg-[var(--color-surface-alt)] border-[var(--color-border-muted)] hover:border-[var(--color-border)]"
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[var(--color-primary)] text-[var(--color-text-inverse)] text-xs font-bold flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" /> Recommended
                </div>
              )}
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">{tier.price}</span>
                  {tier.period && <span className="text-[var(--color-text-muted)]">{tier.period}</span>}
                </div>
                <p className="mt-4 text-[var(--color-text-secondary)] text-sm">{tier.description}</p>
              </div>

              <ul className="flex-1 space-y-4 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[var(--color-primary)] flex-shrink-0" />
                    <span className="text-sm text-[var(--color-text-primary)]">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/marketing"
                className={`w-full py-3 rounded-lg text-center font-bold transition-all ${
                  tier.highlight
                    ? "bg-[var(--color-primary)] text-[var(--color-text-inverse)] hover:opacity-90"
                    : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]"
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-20 p-8 rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-center">
          <h2 className="text-2xl font-bold mb-4">Need something else?</h2>
          <p className="text-[var(--color-text-secondary)] mb-6">
            We offer special discounts for startups, non-profits, and educational institutions.
          </p>
          <Link href="mailto:sales@ledgerful.com" className="text-[var(--color-primary)] font-bold hover:underline">
            Talk to our team
          </Link>
        </div>
      </div>
    </MarketingLayout>
  );
}
