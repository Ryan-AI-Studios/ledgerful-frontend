"use client";

import { useEffect, useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Copy, CheckCircle2, GitPullRequest, ShieldCheck, Activity, Users, AlertCircle } from "lucide-react";
import { apiGet } from "@/lib/api";
import { getGithubIntegrationStatus, connectGithub, disconnectGithub } from "@/lib/api/github";
import { useProject } from "@/lib/ProjectContext";
import { fetchSyncStatus, SyncStatus } from "@/lib/sync-data";
import { DataSource } from "@/lib/fallback";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import type { ExtractResponse } from "@/lib/api/contract-types";

type ConfigWire = ExtractResponse<"/api/config", "get">;

interface ConfigView {
  project: string;
  repo_path: string;
  ledger_path: string;
  graph_path: string;
  signing_key: string;
  llm_backend: string;
  polling_interval: string;
  telemetry: string;
  version: string;
}

function mapConfig(data: ConfigWire): ConfigView {
  return {
    project: data.project,
    repo_path: data.repo_path,
    ledger_path: data.ledger_path,
    graph_path: data.graph_path,
    signing_key: data.signing_key,
    llm_backend: data.llm_backend,
    polling_interval: data.polling_interval,
    telemetry: data.telemetry,
    version: data.version,
  };
}

async function fetchConfigLive(): Promise<ConfigView> {
  const data = await apiGet<ConfigWire>("/config");
  return mapConfig(data);
}

export default function SettingsPage() {
  const { project } = useProject();
  const projectId = project?.id || "unknown";

  const [activeTab, setActiveTab] = useState<"daemon" | "integrations" | "sync" | "privacy">("daemon");
  const [config, setConfig] = useState<ConfigView | null>(null);
  const [configSource, setConfigSource] = useState<DataSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState(false);

  const [githubStatus, setGithubStatus] = useState<"CONNECTED" | "DISCONNECTED" | "PENDING" | "UNREACHABLE">("DISCONNECTED");
  const [githubRepo, setGithubRepo] = useState<string | undefined>(undefined);
  const [isGithubLoading, setIsGithubLoading] = useState(true);
  const [githubSource, setGithubSource] = useState<DataSource>("planned");

  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncSource, setSyncSource] = useState<DataSource>("live");

  // Display-only from config; no UI write (engine has no telemetry PATCH)
  const telemetryEnabled = config?.telemetry === "enabled";

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      // FE-H4: shared client + generated signing_key; no default object on error
      try {
        const data = await fetchConfigLive();
        if (mounted) {
          setConfig(data);
          setConfigSource("live");
          setConfigError(false);
        }
      } catch {
        if (mounted) {
          setConfig(null);
          setConfigSource(null);
          setConfigError(true);
        }
      } finally {
        if (mounted) setLoading(false);
      }

      try {
        const { data, source } = await getGithubIntegrationStatus(projectId);
        if (mounted) {
          setGithubSource(source);
          if (source === "planned") {
            setGithubStatus("DISCONNECTED");
            setGithubRepo(undefined);
          } else {
            setGithubStatus(data.status || "DISCONNECTED");
            setGithubRepo(data.repo);
          }
        }
      } catch {
        if (mounted) {
          setGithubStatus("UNREACHABLE");
          setGithubSource("unavailable");
        }
      } finally {
        if (mounted) setIsGithubLoading(false);
      }

      try {
        const result = await fetchSyncStatus();
        if (mounted) {
          setSyncStatus(result.data);
          setSyncSource(result.source);
        }
      } catch {
        if (mounted) setSyncStatus(null);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [projectId]);

  const copyConfig = () => {
    if (!config) return;
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
  };

  const handleGithubConnect = async () => {
    // Only interactive under explicit mock mode
    if (githubSource !== "mock") return;
    setIsGithubLoading(true);
    try {
      if (githubStatus === "CONNECTED") {
        await disconnectGithub(projectId);
        setGithubStatus("DISCONNECTED");
      } else {
        await connectGithub(projectId);
        setGithubStatus("CONNECTED");
      }
    } catch (e) {
      void e;
    } finally {
      setIsGithubLoading(false);
    }
  };

  const telemetryPayload = {
    anonymousId: "user-1234",
    appVersion: config?.version ?? "unknown",
    os: "windows",
    totalChanges: 42,
    activeIntegrations: githubStatus === "CONNECTED" ? ["github"] : [],
  };

  const githubActionsDisabled = isGithubLoading || githubSource !== "mock";

  if (loading) {
    return (
      <PageLayout title="Settings">
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded bg-[var(--color-surface-raised)]" />
          ))}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Settings">
      <div className="flex items-center gap-3 mb-4">
        {configSource && <DataSourceBadge source={configSource} />}
        {syncStatus && <DataSourceBadge source={syncSource} />}
        {githubSource && <DataSourceBadge source={githubSource} />}
      </div>
      <div className="flex gap-4 mb-6 border-b border-[var(--color-border)]">
        <button
          className={`pb-2 px-1 min-h-[44px] min-w-[44px] border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${
            activeTab === "daemon"
              ? "border-[var(--color-primary)] text-[var(--color-primary)]"
              : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          }`}
          onClick={() => setActiveTab("daemon")}
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span>Daemon Config</span>
          </div>
        </button>
        <button
          className={`pb-2 px-1 min-h-[44px] min-w-[44px] border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${
            activeTab === "integrations"
              ? "border-[var(--color-primary)] text-[var(--color-primary)]"
              : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          }`}
          onClick={() => setActiveTab("integrations")}
        >
          <div className="flex items-center gap-2">
            <GitPullRequest className="w-4 h-4" />
            <span>Integrations</span>
          </div>
        </button>
        <button
          className={`pb-2 px-1 min-h-[44px] min-w-[44px] border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${
            activeTab === "sync"
              ? "border-[var(--color-primary)] text-[var(--color-primary)]"
              : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          }`}
          onClick={() => setActiveTab("sync")}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>Team Sync</span>
          </div>
        </button>
        <button
          className={`pb-2 px-1 min-h-[44px] min-w-[44px] border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${
            activeTab === "privacy"
              ? "border-[var(--color-primary)] text-[var(--color-primary)]"
              : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          }`}
          onClick={() => setActiveTab("privacy")}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Privacy & Telemetry</span>
          </div>
        </button>
      </div>

      {activeTab === "daemon" && (
        <div className="bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg p-6">
          {configError || !config ? (
            <div className="flex items-center gap-3 py-4">
              <AlertCircle className="w-5 h-5 text-[var(--color-danger)] flex-shrink-0" aria-hidden="true" />
              <div>
                <div className="text-sm font-semibold text-[var(--color-danger)]">Configuration unavailable</div>
                <div className="text-sm text-[var(--color-text-secondary)]">The Ledgerful daemon could not be reached. Configuration values are not available.</div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[var(--color-success)]" aria-hidden="true" />
                  <div>
                    <div className="text-sm text-[var(--color-text-secondary)]">Configuration resolved</div>
                    <div className="font-mono text-sm text-[var(--color-text-primary)]">
                      {config.version}
                    </div>
                  </div>
                </div>
                <button
                  onClick={copyConfig}
                  className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-md bg-[var(--color-primary)] text-[var(--color-text-inverse)] text-sm font-semibold hover:bg-[var(--color-primary-muted)] transition-colors duration-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)]"
                >
                  <Copy className="w-4 h-4" aria-hidden="true" />
                  Copy as JSON
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Setting label="Project" value={config.project} />
                <Setting label="Repository path" value={config.repo_path} />
                <Setting label="Ledger database" value={config.ledger_path} />
                <Setting label="Graph database" value={config.graph_path} />
                <Setting label="Signing key" value={config.signing_key} />
                <Setting label="LLM backend" value={config.llm_backend} />
                <Setting label="Dashboard polling" value={config.polling_interval} />
                <Setting label="Telemetry" value={config.telemetry} />
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "integrations" && (
        <div className="bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">GitHub Integration</h2>
          <div className="flex items-center justify-between bg-[var(--color-surface)] border border-[var(--color-border-muted)] rounded-md p-4">
            <div className="flex items-center gap-3">
              <GitPullRequest className="w-6 h-6 text-[var(--color-text-primary)]" aria-hidden="true" />
              <div>
                <div className="text-sm font-medium text-[var(--color-text-primary)]">GitHub App</div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-1 flex items-center gap-2 flex-wrap">
                  {githubSource === "planned" ? (
                    <span aria-label="GitHub status: Planned">
                      Status: <strong>Planned</strong> — not yet available on this daemon
                    </span>
                  ) : (
                    <>
                      <span aria-label={`GitHub status: ${githubStatus}`}>
                        Status: <strong className={githubStatus === "CONNECTED" ? "text-[var(--color-success)]" : ""}>{githubStatus}</strong>
                      </span>
                      {githubStatus === "CONNECTED" && (
                        <span>
                          • Linked:{" "}
                          <code className="font-mono bg-[var(--color-surface-raised)] px-1 rounded">
                            {githubRepo || "unknown/repo"}
                          </code>
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={handleGithubConnect}
              disabled={githubActionsDisabled}
              className={`inline-flex items-center justify-center px-4 py-2 min-h-[44px] min-w-[120px] rounded-md text-sm font-semibold transition-colors duration-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] ${
                githubStatus === "CONNECTED"
                  ? "bg-transparent border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]"
                  : "bg-[var(--color-primary)] text-[var(--color-text-inverse)] hover:bg-[var(--color-primary-muted)]"
              } ${githubActionsDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
              aria-label={
                githubSource === "planned"
                  ? "GitHub connect planned"
                  : githubStatus === "CONNECTED"
                    ? "Disconnect from GitHub"
                    : "Connect to GitHub"
              }
              title={
                githubSource === "planned"
                  ? "Planned — GitHub integration is not available yet"
                  : githubSource !== "mock"
                    ? "Connect/disconnect disabled — not in mock mode"
                    : undefined
              }
            >
              {isGithubLoading
                ? "..."
                : githubSource === "planned"
                  ? "Planned"
                  : githubStatus === "CONNECTED"
                    ? "Disconnect"
                    : "Connect to GitHub"}
            </button>
          </div>
        </div>
      )}

      {activeTab === "sync" && (
        <div className="bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Team Sync Data</h2>
          {!syncStatus ? (
            <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border-muted)] rounded-md text-[var(--color-text-secondary)] text-sm">
              Loading sync status...
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Setting label="Device ID" value={syncStatus.deviceId || "None"} />
              <Setting label="Last Extract" value={syncStatus.lastExtractAt ? new Date(syncStatus.lastExtractAt).toLocaleString() : "Never"} />
              <Setting label="Last Apply" value={syncStatus.lastApplyAt ? new Date(syncStatus.lastApplyAt).toLocaleString() : "Never"} />
              <Setting label="Last Run" value={syncStatus.lastRunAt ? new Date(syncStatus.lastRunAt).toLocaleString() : "Never"} />
            </div>
          )}
        </div>
      )}

      {activeTab === "privacy" && (
        <div className="bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Privacy & Telemetry</h2>

          <div className="flex items-start justify-between mb-6 bg-[var(--color-surface)] border border-[var(--color-border-muted)] rounded-md p-4">
            <div>
              <h3 className="text-sm font-medium text-[var(--color-text-primary)]">Anonymous Usage Metrics</h3>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1 max-w-xl">
                Help improve Ledgerful by sending anonymous usage data. This data never includes sensitive information like codebase contents, secrets, or PII.
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-2">
                Managed by CLI (<code className="font-mono">ledgerful usage</code> /{" "}
                <code className="font-mono">ledgerful config</code>). The dashboard cannot change this setting.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 min-h-[44px] min-w-[44px]">
              <button
                role="switch"
                aria-checked={telemetryEnabled}
                aria-disabled="true"
                aria-label="Anonymous usage metrics (managed by CLI)"
                disabled
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors opacity-50 cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] ${
                  telemetryEnabled ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]"
                }`}
              >
                <span
                  className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                    telemetryEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-[0.625rem] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
                CLI-owned
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-sm font-medium text-[var(--color-text-primary)]">Example Payload</h3>
              <DataSourceBadge source="mock" />
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mb-3">
              Illustrative shape of the anonymous data sent when telemetry is enabled. Not a live capture.
            </p>
            <div className="bg-[var(--color-surface)] rounded-md p-4 overflow-x-auto border border-[var(--color-border-muted)]">
              <pre className="text-xs text-[var(--color-text-secondary)] font-mono whitespace-pre-wrap">
                {JSON.stringify(telemetryPayload, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}

function Setting({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border-muted)] rounded-md p-4">
      <div className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
        {label}
      </div>
      <div className="font-mono text-sm text-[var(--color-text-primary)] break-all">
        {value}
      </div>
    </div>
  );
}
