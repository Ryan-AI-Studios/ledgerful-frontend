"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Root → dashboard redirect.
 *
 * Must be client-side only (`router.replace` / `<Link>`). A meta refresh or
 * hard `window.location` navigation is a full document load and wipes the
 * in-memory session token (0080/0090: never persist bearer to storage).
 */
export default function RootRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)] text-[var(--color-text-primary)]">
      <Link
        href="/dashboard"
        className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors duration-150"
      >
        Go to dashboard
      </Link>
    </div>
  );
}
