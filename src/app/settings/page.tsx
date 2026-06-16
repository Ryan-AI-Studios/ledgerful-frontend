"use client";

import { useEffect, useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Copy, CheckCircle2 } from "lucide-react";
import { buildApiUrl } from "@/lib/utils";

interface ConfigResponse {
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

const defaultConfig: ConfigResponse = {
  project: "unknown",
  repo_path: "",
  ledger_path: "",
  graph_path: "",
  signing_key: "",
  llm_backend: "none",
  polling_interval: "30s",
  telemetry: "disabled",
  version: "ledgerful",
};

export default function SettingsPage() {
  const [config, setConfig] = useState<ConfigResponse>(defaultConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(buildApiUrl("/config"))
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: ConfigResponse) => {
        setConfig(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const copyConfig = () => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
  };

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
      <div className="bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg p-6">
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
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--color-primary)] text-[var(--color-text-inverse)] text-sm font-semibold hover:bg-[var(--color-primary-muted)] transition-colors duration-100"
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
      </div>
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
