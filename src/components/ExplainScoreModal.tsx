"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

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
          The score is computed from the current ledger and risk state. Lower
          scores mean more pending work, drift, or high-risk changes.
        </p>

        <div className="font-mono text-sm bg-[var(--color-surface)] border border-[var(--color-border-muted)] rounded-md p-4 overflow-x-auto">
          <div>score = 100</div>
          <div className="pl-4">- (HIGH_risks × 10)</div>
          <div className="pl-4">- (pending_txs × 2)</div>
          <div className="pl-4">- (drift_count × 5)</div>
          <div className="pl-4">- (stale_days × 0.5)</div>
          <div>clamped to [0, 100]</div>
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
