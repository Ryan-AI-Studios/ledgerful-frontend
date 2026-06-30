"use client";

import { useEffect } from "react";

const DOCS_URL = "https://www.ledgerful.dev/docs";

export default function DocsRedirect() {
  useEffect(() => {
    window.location.replace(DOCS_URL);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)] text-[var(--color-text-primary)]">
      <a
        href={DOCS_URL}
        className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors duration-150"
      >
        Go to Ledgerful docs
      </a>
      <meta httpEquiv="refresh" content={`0;url=${DOCS_URL}`} />
    </div>
  );
}
