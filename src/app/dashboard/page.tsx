"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardData } from "@/lib/types";
import { fetchDashboardData } from "@/lib/data";
import { useProject } from "@/lib/ProjectContext";
import { PageLayout } from "@/components/PageLayout";
import { HeroCard } from "@/components/HeroCard";
import { RecentChanges } from "@/components/RecentChanges";
import { EmptyState } from "@/components/EmptyState";
import { HeroSkeleton } from "@/components/HeroSkeleton";
import { ExplainScoreModal } from "@/components/ExplainScoreModal";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { AlertCircle, RefreshCw } from "lucide-react";

type DashboardState =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "error"; message: string }
  | { status: "ready"; data: DashboardData };

const ONBOARDING_KEY = "ledgerful:onboarding-completed";
const ONBOARDING_DISMISSED_KEY = "ledgerful:onboarding-dismissed";

export default function DashboardPage() {
  const { project, allProjects, isLoaded } = useProject();
  return (
    <DashboardContent
      key={project.id}
      projectId={project.id}
      hasProjects={allProjects.length > 0}
      isLoaded={isLoaded}
    />
  );
}

function DashboardContent({
  projectId,
  hasProjects,
  isLoaded,
}: {
  projectId: string;
  hasProjects: boolean;
  isLoaded: boolean;
}) {
  const [state, setState] = useState<DashboardState>({ status: "loading" });
  const [explainOpen, setExplainOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      const completed = localStorage.getItem(ONBOARDING_KEY);
      const dismissed = sessionStorage.getItem(ONBOARDING_DISMISSED_KEY);
      // If onboarding not completed AND not dismissed in session, show wizard
      // We show it even if there are projects if it's not completed yet
      if (!completed && !dismissed) {
        const timer = setTimeout(() => setShowOnboarding(true), 0);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoaded]);

  const load = useCallback(() => {
    if (!hasProjects) {
      // Use setTimeout to defer state update and avoid cascading render lint error
      setTimeout(() => setState({ status: "empty" }), 0);
      return;
    }

    fetchDashboardData(projectId)
      .then((data) => {
        if (data.recentChanges.length === 0 && data.health.score === 100) {
          setState({ status: "empty" });
        } else {
          setState({ status: "ready", data });
        }
      })
      .catch(() => {
        setState({
          status: "error",
          message:
            "Could not load dashboard data. The Ledgerful daemon may not be running.",
        });
      });
  }, [projectId, hasProjects]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <PageLayout title="Dashboard">
      <div aria-live="polite" aria-busy={state.status === "loading"}>
        {state.status === "loading" && (
          <>
            <HeroSkeleton />
            <div className="mt-6">
              <RecentChanges changes={[]} />
            </div>
          </>
        )}

        {state.status === "empty" && <EmptyState />}

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
          <>
            <HeroCard
              health={state.data.health}
              onExplain={() => setExplainOpen(true)}
            />
            <div className="mt-6">
              <RecentChanges changes={state.data.recentChanges} />
            </div>
          </>
        )}
      </div>

      <ExplainScoreModal
        isOpen={explainOpen}
        onClose={() => setExplainOpen(false)}
      />

      <OnboardingWizard
        isOpen={showOnboarding}
        onClose={() => {
          sessionStorage.setItem(ONBOARDING_DISMISSED_KEY, "true");
          setShowOnboarding(false);
        }}
        onComplete={() => {
          localStorage.setItem(ONBOARDING_KEY, "true");
          setShowOnboarding(false);
        }}
      />
    </PageLayout>
  );
}
