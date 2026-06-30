"use client";

import { useEffect, useState } from "react";
import { ComplianceSummary, SignatureEntry } from "@/lib/types";
import { DataSource } from "@/lib/fallback";
import { fetchComplianceSummary, fetchSignatureEntries } from "@/lib/compliance-data";
import { PageLayout } from "@/components/PageLayout";
import { ComplianceSummaryCards } from "@/components/ComplianceSummaryCards";
import { SignatureValidationTable } from "@/components/SignatureValidationTable";
import { Soc2ExportButton } from "@/components/Soc2ExportButton";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { AlertCircle, RefreshCw, Loader2 } from "lucide-react";

type ComplianceState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; summary: ComplianceSummary; entries: SignatureEntry[]; source: DataSource };

export default function CompliancePage() {
  const [state, setState] = useState<ComplianceState>({ status: "loading" });

  const load = () => {
    setState({ status: "loading" });
    Promise.all([fetchComplianceSummary(), fetchSignatureEntries()])
      .then(([summaryResult, entriesResult]) => {
        const source: DataSource =
          summaryResult.source === "mock" || entriesResult.source === "mock"
            ? "mock"
            : summaryResult.source === "stale" || entriesResult.source === "stale"
            ? "stale"
            : summaryResult.source === "unavailable" || entriesResult.source === "unavailable"
            ? "unavailable"
            : "live";
        setState({ status: "ready", summary: summaryResult.data, entries: entriesResult.data, source });
      })
      .catch((err) => {
        setState({
          status: "error",
          message: "Could not load compliance data. The Ledgerful daemon may not be running. " + (err instanceof Error ? err.message : String(err)),
        });
      });
  };

  useEffect(() => {
    const timeout = setTimeout(() => load(), 0);
    return () => clearTimeout(timeout);
  }, []);

  const exportDisabled = state.status === "ready" && state.source === "mock";

  const handleRetry = () => {
    load();
  };

  return (
    <PageLayout title="Compliance Hub">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-[var(--color-text-secondary)] max-w-2xl text-sm leading-relaxed">
            Audit-ready overview of repository integrity. This page provides signed transaction counts,
            signature validity verification, and architectural decision records for compliance reporting.
          </p>
          <div className="flex items-center gap-3">
            {state.status === "ready" && <DataSourceBadge source={state.source} />}
            <Soc2ExportButton disabled={exportDisabled} />
          </div>
        </div>

        {state.status === "loading" && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
            <span className="text-sm text-[var(--color-text-muted)] font-medium">Loading audit artifacts...</span>
          </div>
        )}

        {state.status === "error" && (
          <div className="bg-[var(--color-surface-alt)] border border-[var(--color-danger-muted)] rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[var(--color-danger)] flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h2 className="text-[1rem] font-semibold text-[var(--color-danger)]">Failed to load</h2>
                <p className="mt-1 text-[var(--color-text-secondary)] text-sm">{state.message}</p>
                <button
                  onClick={handleRetry}
                  className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm font-medium hover:bg-[var(--color-surface-raised)] transition-colors duration-100"
                >
                  <RefreshCw className="w-4 h-4" aria-hidden="true" />
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {state.status === "ready" && (
          <>
            <ComplianceSummaryCards summary={state.summary} />
            <SignatureValidationTable entries={state.entries} />
          </>
        )}
      </div>
    </PageLayout>
  );
}
