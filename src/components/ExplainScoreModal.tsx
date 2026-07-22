"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { UI_HEALTH_SCORE_FORMULA } from "@/lib/health-score";

interface ExplainScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExplainScoreModal({ isOpen, onClose }: ExplainScoreModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-xl p-0 shadow-[0_8px_24px_rgba(0,0,0,0.4)] text-[var(--color-text-primary)] w-full max-w-lg backdrop:bg-[var(--color-surface-overlay)]"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[1.25rem] font-semibold">Project Health score</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors duration-100"
            aria-label="Close"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <p className="text-[var(--color-text-secondary)] mb-4">
          This is a <strong className="font-semibold text-[var(--color-text-primary)]">UI-derived</strong>{" "}
          gate posture score computed from pending transactions and unaudited drift.
          It is not cryptographic verification and does not mean the project is &quot;Verified.&quot;
        </p>

        <div className="font-mono text-sm bg-[var(--color-surface)] border border-[var(--color-border-muted)] rounded-md p-4 overflow-x-auto">
          {UI_HEALTH_SCORE_FORMULA.map((line, i) => (
            <div key={i} className={line.startsWith("  ") ? "pl-4" : undefined}>
              {line.trim() === "" ? "\u00A0" : line.trimStart()}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-[var(--color-primary)] text-[var(--color-text-inverse)] text-sm font-semibold hover:bg-[var(--color-primary-muted)] transition-colors duration-100"
          >
            Got it
          </button>
        </div>
      </div>
    </dialog>
  );
}
