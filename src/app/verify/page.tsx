"use client";

import { useEffect, useState, useCallback } from "react";
import { VerificationHealth, VerificationTrendPoint, VerificationStep } from "@/lib/types";
import { DataSource } from "@/lib/fallback";
import { 
  fetchVerificationHealth, 
  fetchVerificationHistory, 
  fetchVerificationSteps 
} from "@/lib/verify-data";
import { useProject } from "@/lib/ProjectContext";
import { PageLayout } from "@/components/PageLayout";
import { VerificationHealthCard } from "@/components/VerificationHealthCard";
import { VerificationTrendSparkline } from "@/components/VerificationTrendSparkline";
import { VerificationStepsTable } from "@/components/VerificationStepsTable";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { AlertCircle, RefreshCw } from "lucide-react";

type VerifyState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; health: VerificationHealth; history: VerificationTrendPoint[]; steps: VerificationStep[]; source: DataSource };

export default function VerifyPage() {
  const { project } = useProject();
  return <VerifyContent key={project.id} />;
}

function VerifyContent() {
  const [state, setState] = useState<VerifyState>({ status: "loading" });

  const load = useCallback(() => {
    Promise.all([
      fetchVerificationHealth(),
      fetchVerificationHistory(),
      fetchVerificationSteps()
    ])
      .then(([healthResult, historyResult, stepsResult]) => {
        const source: DataSource =
          healthResult.source === "mock" || historyResult.source === "mock" || stepsResult.source === "mock"
            ? "mock"
            : healthResult.source === "unavailable" || historyResult.source === "unavailable" || stepsResult.source === "unavailable"
            ? "unavailable"
            : "live";
        setState({
          status: "ready",
          health: healthResult.data,
          history: historyResult.data,
          steps: stepsResult.data,
          source,
        });
      })
      .catch(() => {
        setState({
          status: "error",
          message:
            "Could not load verification data. The Ledgerful daemon may not be running.",
        });
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <PageLayout title="Verification History">
      <div className="flex items-center gap-3 mb-4" aria-live="polite" aria-busy={state.status === "loading"}>
        {state.status === "ready" && <DataSourceBadge source={state.source} />}
      </div>
      <div aria-live="polite" aria-busy={state.status === "loading"}>
        {state.status === "loading" && (
          <div className="flex flex-col gap-6 animate-pulse">
            <div className="h-32 bg-[var(--color-surface-raised)] rounded-lg border border-[var(--color-border)]" />
            <div className="h-64 bg-[var(--color-surface-raised)] rounded-lg border border-[var(--color-border)]" />
            <div className="h-96 bg-[var(--color-surface-raised)] rounded-lg border border-[var(--color-border)]" />
          </div>
        )}

        {state.status === "error" && (
          <div className="bg-[var(--color-surface-alt)] border border-[var(--color-danger-muted)] rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertCircle
                className="w-5 h-5 text-[var(--color-danger)] flex-shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <h2 className="text-[1rem] font-semibold text-[var(--color-danger)]">
                  Failed to load
                </h2>
                <p className="mt-1 text-[var(--color-text-secondary)]">
                  {state.message}
                </p>
                <button
                  onClick={() => { setState({ status: "loading" }); load(); }}
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
          <div className="flex flex-col gap-8">
            <VerificationHealthCard health={state.health} />
            
            <section className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold">Verification Trend (90 Days)</h2>
              <VerificationTrendSparkline data={state.history} />
            </section>

            <VerificationStepsTable steps={state.steps} />
          </div>
        )}
      </div>
    </PageLayout>
  );
}
