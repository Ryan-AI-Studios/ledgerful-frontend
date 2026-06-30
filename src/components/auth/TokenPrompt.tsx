"use client";

import { useState } from "react";
import { setAuthToken } from "@/lib/utils";

export function TokenPrompt({ onAuthed }: { onAuthed?: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Token is required.");
      return;
    }
    setAuthToken(trimmed);
    setValue("");
    setError(null);
    onAuthed?.();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)]">
      <div className="w-full max-w-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6 shadow-lg">
        <h1 className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">
          Sign in
        </h1>
        <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
          Paste the auth token printed by{" "}
          <code className="rounded bg-[var(--color-surface)] px-1 py-0.5 text-xs">
            ledgerful web start
          </code>
          .
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Auth token"
            autoFocus
            className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
          />
          {error && (
            <p className="text-xs text-[var(--color-danger)]">{error}</p>
          )}
          <button
            type="submit"
            className="w-full rounded bg-[var(--color-accent)] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}