import { LedgerStatus } from "@/lib/ledger-data";

const statusConfig: Record<LedgerStatus, { color: string; label: string }> = {
  COMMITTED: { color: "var(--color-success)", label: "Committed" },
  PENDING: { color: "var(--color-warning)", label: "Pending" },
  ROLLED_BACK: { color: "var(--color-danger)", label: "Rolled back" },
};

interface LedgerStatusBadgeProps {
  status: LedgerStatus;
}

export function LedgerStatusBadge({ status }: LedgerStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full border text-[0.6875rem] font-semibold uppercase tracking-wider"
      style={{ color: config.color, borderColor: config.color }}
    >
      {config.label}
    </span>
  );
}
