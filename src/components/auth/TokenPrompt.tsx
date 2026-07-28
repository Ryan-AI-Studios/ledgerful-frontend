"use client";

import { useState } from "react";
import { setAuthToken } from "@/lib/utils";
import { HANDOFF_FAILED_MESSAGE } from "@/lib/session-handoff";

export interface TokenPromptProps {
  onAuthed?: () => void;
  /** Explanatory banner when automatic `#c=` handoff failed or expired. */
  message?: string;
  /** When true, surfaces the failed-handoff copy path (DoD-6). */
  handoffFailed?: boolean;
}

export function TokenPrompt({
  onAuthed,
  message,
  handoffFailed = false,
}: TokenPromptProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Prefer FormData so paste + submit works even if controlled-state
    // and the native input value briefly diverge (password managers, etc.).
    const fromForm = String(new FormData(e.currentTarget).get("token") ?? "").trim();
    const trimmed = fromForm || value.trim();
    if (!trimmed) {
      setError("Token is required.");
      return;
    }
    setAuthToken(trimmed);
    setValue("");
    setError(null);
    onAuthed?.();
  };

  const banner = message ?? (handoffFailed ? HANDOFF_FAILED_MESSAGE : null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)]">
      <div className="w-full max-w-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6 shadow-lg">
        <h1 className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">
          Sign in
        </h1>
        {banner && (
          <p
            className="mb-3 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-secondary)]"
            role="status"
            data-testid="handoff-failed-message"
          >
            {banner}
          </p>
        )}
        <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
          Paste the auth token from{" "}
          <code className="rounded bg-[var(--color-surface)] px-1 py-0.5 text-xs">
            .ledgerful/web-session-token
          </code>{" "}
          (written by{" "}
          <code className="rounded bg-[var(--color-surface)] px-1 py-0.5 text-xs">
            ledgerful web start
          </code>
          ). Use{" "}
          <code className="rounded bg-[var(--color-surface)] px-1 py-0.5 text-xs">
            --print-token=true
          </code>{" "}
          only if you need the token printed to the terminal. The session is
          memory-only — a full page refresh always asks again.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            name="token"
            autoComplete="off"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Auth token"
            autoFocus
            className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
          />
          {error && (
            <p className="text-xs text-[var(--color-danger)]" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded bg-[var(--color-accent)] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Sign in
          </button>
        </form>
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          If Sign in does nothing, check the browser console for CSP errors and restart the
          daemon with{" "}
          <code className="rounded bg-[var(--color-surface)] px-1 py-0.5">
            --spa-dir …/out
          </code>
          , then use a fresh token (it rotates on each start).
        </p>
      </div>
    </div>
  );
}
