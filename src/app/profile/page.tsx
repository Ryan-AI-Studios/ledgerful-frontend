"use client";

import { useEffect, useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { fetchSession } from "@/lib/session-data";
import { UserSession } from "@/lib/types";
import { DataSource } from "@/lib/fallback";
import { User, Shield, AlertCircle, RefreshCw } from "lucide-react";

type ProfileState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; session: UserSession; source: DataSource };

export default function ProfilePage() {
  const [state, setState] = useState<ProfileState>({ status: "loading" });

  const load = () => {
    setState({ status: "loading" });
    fetchSession()
      .then((result) => {
        setState({
          status: "ready",
          session: result.data,
          source: result.source,
        });
      })
      .catch(() => {
        setState({
          status: "error",
          message:
            "Could not load session. The Ledgerful daemon may not be running.",
        });
      });
  };

  useEffect(() => {
    // Defer setState to avoid cascading render lint (matches other pages)
    const timeout = setTimeout(() => load(), 0);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <PageLayout title="User Profile">
      <div className="max-w-2xl space-y-8">
        {state.status === "ready" && (
          <div className="flex items-center gap-3">
            <DataSourceBadge source={state.source} />
          </div>
        )}

        {state.status === "loading" && (
          <div className="space-y-3 animate-pulse">
            <div className="h-40 rounded-lg bg-[var(--color-surface-raised)]" />
            <div className="h-24 rounded-lg bg-[var(--color-surface-raised)]" />
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
                  onClick={load}
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
            <section className="bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-[var(--color-primary)]" aria-hidden="true" />
                Personal Information
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 py-3 border-b border-[var(--color-border-muted)]">
                  <span className="text-sm text-[var(--color-text-muted)]">Full Name</span>
                  <span className="text-sm font-medium col-span-2">
                    {state.session.name || "—"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 py-3 border-b border-[var(--color-border-muted)]">
                  <span className="text-sm text-[var(--color-text-muted)]">Email Address</span>
                  <span className="text-sm font-medium col-span-2">
                    {state.session.email || "—"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 py-3">
                  <span className="text-sm text-[var(--color-text-muted)]">Role</span>
                  <span className="text-sm font-medium col-span-2">
                    {state.session.role
                      ? state.session.role
                      : "Role management: Planned."}
                  </span>
                </div>
              </div>
            </section>

            <section className="bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg p-6 opacity-50 cursor-not-allowed">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[var(--color-text-muted)]" aria-hidden="true" />
                Security Settings
              </h2>
              <p className="text-sm text-[var(--color-text-muted)] italic">
                Security settings are managed by the Ledgerful daemon.
              </p>
            </section>
          </>
        )}
      </div>
    </PageLayout>
  );
}
