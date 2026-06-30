"use client";

import { useEffect } from "react";

const PRICING_URL = "https://www.ledgerful.dev/pricing";

export default function PricingRedirect() {
  useEffect(() => {
    window.location.replace(PRICING_URL);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)] text-[var(--color-text-primary)]">
      <a
        href={PRICING_URL}
        className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors duration-150"
      >
        Go to Ledgerful pricing
      </a>
      <meta httpEquiv="refresh" content={`0;url=${PRICING_URL}`} />
    </div>
  );
}
