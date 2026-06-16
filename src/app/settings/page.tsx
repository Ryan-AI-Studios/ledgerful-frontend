"use client";

import { PageLayout } from "@/components/PageLayout";
import { Copy, CheckCircle2 } from "lucide-react";

const config = {
  project: "changeguard",
  repoPath: "C:/dev/changeguard",
  ledgerPath: "C:/dev/changeguard/.changeguard/state/ledger.db",
  graphPath: "C:/dev/changeguard/.changeguard/state/graph.db",
  signingKey: "Ed25519 · 5b2c88ef1a2d...",
  llmBackend: "local (llama-server)",
  pollingInterval: "30s",
  telemetry: "disabled",
  version: "ledgerful 0.2.0-alpha",
};

export default function SettingsPage() {
  const copyConfig = () => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
  };

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
          <Setting label="Repository path" value={config.repoPath} />
          <Setting label="Ledger database" value={config.ledgerPath} />
          <Setting label="Graph database" value={config.graphPath} />
          <Setting label="Signing key" value={config.signingKey} />
          <Setting label="LLM backend" value={config.llmBackend} />
          <Setting label="Dashboard polling" value={config.pollingInterval} />
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
