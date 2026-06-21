"use client";

import { useState, useCallback } from "react";
import { Check, Copy, TerminalSquare } from "lucide-react";

interface CopyCommandProps {
  command: string;
  label?: string;
}

export function CopyCommand({ command, label = "Copy command" }: CopyCommandProps) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(command);
      setState("copied");
      window.setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("error");
      window.setTimeout(() => setState("idle"), 2600);
    }
  }, [command]);

  return (
    <div className="w-full max-w-md">
      <div className="flex items-stretch rounded-md border border-[var(--color-border)] bg-[var(--color-surface-alt)] overflow-hidden">
        <div className="flex items-center pl-3 pr-2 text-[var(--color-text-muted)]" aria-hidden="true">
          <TerminalSquare className="w-4 h-4" />
        </div>
        <code className="flex-1 py-2.5 px-1 font-mono text-sm text-[var(--color-text-primary)] whitespace-nowrap overflow-x-auto">
          {command}
        </code>
        <button
          type="button"
          onClick={onCopy}
          aria-label={state === "copied" ? "Copied" : state === "error" ? "Copy failed — select and copy manually" : label}
          className="flex items-center gap-1.5 px-3 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors duration-150 border-l border-[var(--color-border)]"
        >
          {state === "copied" ? (
            <>
              <Check className="w-3.5 h-3.5 text-[var(--color-primary)]" aria-hidden="true" />
              <span className="text-[var(--color-primary)]">Copied</span>
            </>
          ) : state === "error" ? (
            <>
              <Copy className="w-3.5 h-3.5 text-[var(--color-danger)]" aria-hidden="true" />
              <span className="text-[var(--color-danger)]">Failed</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}