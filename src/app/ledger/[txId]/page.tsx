"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageLayout } from "@/components/PageLayout";
import { RiskBadge } from "@/components/RiskBadge";
import { LedgerStatusBadge } from "@/components/LedgerStatusBadge";
import { LedgerEntry, fetchLedgerEntry } from "@/lib/ledger-data";
import { Copy, FileJson, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LedgerDetailPage() {
  const params = useParams();
  const txId = params.txId as string;
  const [entry, setEntry] = useState<LedgerEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLedgerEntry(txId).then((data) => {
      setEntry(data || null);
      setLoading(false);
    });
  }, [txId]);

  if (loading) {
    return (
      <PageLayout title="Transaction">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-[var(--color-surface-raised)]" />
          <div className="h-32 rounded bg-[var(--color-surface-raised)]" />
        </div>
      </PageLayout>
    );
  }

  if (!entry) {
    return (
      <PageLayout title="Transaction not found">
        <div className="bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg p-6">
          <p className="text-[var(--color-text-secondary)]">
            No transaction found for tx ID{" "}
            <span className="font-mono text-[var(--color-text-primary)]">{txId}</span>.
          </p>
          <Link
            href="/ledger"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-muted)]"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to ledger
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={`Transaction ${entry.txId}`}>
      <div className="bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <LedgerStatusBadge status={entry.status} />
              <RiskBadge risk={entry.risk} />
              <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                {entry.category}
              </span>
            </div>
            <h2 className="text-[1.25rem] font-semibold text-[var(--color-text-primary)]">
              {entry.summary}
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{entry.reason}</p>
          </div>
          <Link
            href="/ledger"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-100"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Metric label="Author" value={entry.author} />
          <Metric label="When" value={entry.timeAgo} />
          <Metric label="Hotspots crossed" value={entry.hotspotsCrossed.toString()} />
          <Metric label="Tests" value={`${entry.testsRun} run · ${entry.flakes} flakes`} />
          <Metric label="Files changed" value={entry.files.length.toString()} />
          <Metric label="Verification" value={entry.testsRun > 0 ? "Passed" : "N/A"} />
        </div>

        <div className="border-t border-[var(--color-border-muted)] pt-6">
          <h3 className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
            Evidence — files changed
          </h3>
          <ul className="divide-y divide-[var(--color-border-muted)] border border-[var(--color-border-muted)] rounded-md overflow-hidden">
            {entry.files.map((file) => (
              <li
                key={file.path}
                className="flex items-center justify-between px-4 py-2 bg-[var(--color-surface)]"
              >
                <span className="font-mono text-sm text-[var(--color-text-primary)]">
                  {file.path}
                </span>
                <span className="font-mono text-sm text-[var(--color-text-muted)]">
                  +{file.additions} -{file.deletions}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-[var(--color-border-muted)] pt-6 mt-6">
          <h3 className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
            Signature
          </h3>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border-muted)] rounded-md p-4 font-mono text-sm">
            <div className="grid grid-cols-[80px_1fr] gap-y-1">
              <span className="text-[var(--color-text-muted)]">algo:</span>
              <span className="text-[var(--color-text-primary)]">Ed25519</span>
              <span className="text-[var(--color-text-muted)]">sig:</span>
              <span className="text-[var(--color-text-primary)]">{entry.signature}</span>
              <span className="text-[var(--color-text-muted)]">key:</span>
              <span className="text-[var(--color-text-primary)]">{entry.publicKey}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={() => navigator.clipboard.writeText(JSON.stringify(entry, null, 2))}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm font-medium hover:bg-[var(--color-surface-raised)] transition-colors duration-100"
          >
            <Copy className="w-4 h-4" aria-hidden="true" />
            Copy full record
          </button>
          <button className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm font-medium hover:bg-[var(--color-surface-raised)] transition-colors duration-100">
            <FileJson className="w-4 h-4" aria-hidden="true" />
            View raw JSON
          </button>
        </div>
      </div>
    </PageLayout>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border-muted)] rounded-md p-3">
      <div className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
        {label}
      </div>
      <div className="text-sm text-[var(--color-text-primary)]">{value}</div>
    </div>
  );
}
