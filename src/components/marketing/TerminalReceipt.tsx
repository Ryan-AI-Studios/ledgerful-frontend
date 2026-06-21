interface RiskRow {
  icon: string;
  label: string;
  color: string;
  path: string;
  detail: string;
  coupling?: string;
}

const ROWS: RiskRow[] = [
  {
    icon: "▲",
    label: "HIGH",
    color: "var(--color-risk-high)",
    path: "src/auth/session.rs",
    detail: "rate-limiter bypass, 3 temporal couplings",
    coupling: "auth_test::login predicts fail",
  },
  {
    icon: "●",
    label: "MED",
    color: "var(--color-risk-medium)",
    path: "src/api/handlers.rs",
    detail: "new endpoint, no integration tests",
  },
  {
    icon: "○",
    label: "LOW",
    color: "var(--color-risk-low)",
    path: "src/util/format.rs",
    detail: "pure function, isolated change",
  },
];

function Pill({ row }: { row: RiskRow }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border font-mono text-[0.6875rem] font-semibold"
      style={{ color: row.color, borderColor: row.color }}
    >
      <span aria-hidden="true">{row.icon}</span>
      <span>{row.label}</span>
    </span>
  );
}

export function TerminalReceipt() {
  return (
    <div className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-[var(--color-border-muted)] bg-[var(--color-surface-alt)]">
        <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-danger-muted)]" aria-hidden="true" />
        <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-warning-muted)]" aria-hidden="true" />
        <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-success-muted)]" aria-hidden="true" />
        <span className="ml-2 text-[0.6875rem] font-mono text-[var(--color-text-muted)]">ledgerful scan</span>
      </div>
      <div className="p-4 font-mono text-[0.8125rem] leading-relaxed overflow-x-auto">
        <div className="text-[var(--color-text-muted)] mb-3">
          <span className="text-[var(--color-primary)]">$</span> ledgerful scan --open
        </div>
        <div className="flex items-center justify-between mb-4 text-[var(--color-text-secondary)]">
          <span>3 files changed · impact report</span>
          <span className="text-[var(--color-text-muted)]">tx dbce9fe7 · pending</span>
        </div>
        <div className="space-y-2.5">
          {ROWS.map((row) => (
            <div key={row.path} className="flex items-start gap-3">
              <Pill row={row} />
              <div className="flex-1 min-w-0">
                <div className="text-[var(--color-text-primary)] truncate">{row.path}</div>
                <div className="text-[var(--color-text-muted)] text-[0.75rem]">
                  {row.detail}
                  {row.coupling && (
                    <span className="text-[var(--color-accent)]"> · {row.coupling}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-[var(--color-border-muted)] text-[var(--color-text-secondary)]">
          <span className="text-[var(--color-warning)]">!</span> 1 unsigned transaction · 2 temporal couplings detected
        </div>
        <div className="mt-1 text-[var(--color-text-muted)] text-[0.75rem]">
          open <span className="text-[var(--color-info)] underline">localhost:52001</span> for the full dashboard
        </div>
      </div>
    </div>
  );
}