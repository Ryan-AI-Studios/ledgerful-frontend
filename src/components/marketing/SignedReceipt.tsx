import { Check } from "lucide-react";

interface Field {
  label: string;
  value: string;
  accent?: boolean;
}

const FIELDS: Field[] = [
  { label: "tx_id", value: "dbce9fe7a4c1·2f8e0b" },
  { label: "category", value: "SECURITY" },
  { label: "intent", value: "refactor authentication layer" },
  { label: "author", value: "r.baxter@ledgerful.dev" },
  { label: "signature", value: "ed25519:9f3a…c7b2", accent: true },
  { label: "status", value: "VERIFIED", accent: true },
];

export function SignedReceipt() {
  return (
    <div className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--color-border-muted)] bg-[var(--color-surface)]">
        <Check className="w-4 h-4 text-[var(--color-primary)]" aria-hidden="true" />
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
          Signed transaction · receipt
        </span>
      </div>
      <dl className="p-4 font-mono text-[0.8125rem] grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5">
        {FIELDS.map((f) => (
          <div key={f.label} className="contents">
            <dt className="text-[var(--color-text-muted)]">{f.label}</dt>
            <dd className={f.accent ? "text-[var(--color-primary)]" : "text-[var(--color-text-primary)]"}>
              {f.value}
            </dd>
          </div>
        ))}
      </dl>
      <div className="px-4 pb-4 pt-2 border-t border-[var(--color-border-muted)] text-[0.6875rem] text-[var(--color-text-muted)] font-mono">
        export with <span className="text-[var(--color-info)]">ledgerful export --format=soc2</span> for audit
      </div>
    </div>
  );
}