import { LedgerStatus } from "@/lib/ledger-data";

const statusConfig: Record<LedgerStatus, { color: string; label: string }> = {
  COMMITTED: { color: "var(--color-success)", label: "Committed" },
  PENDING: { color: "var(--color-warning)", label: "Pending" },
  ROLLED_BACK: { color: "var(--color-danger)", label: "Rolled back" },
  OTHER: { color: "var(--color-text-muted)", label: "Other" },
};

interface LedgerStatusBadgeProps {
  status: LedgerStatus;
  /** Raw entry_type when status is OTHER */
  entryTypeRaw?: string;
}

export function LedgerStatusBadge({ status, entryTypeRaw }: LedgerStatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.OTHER;
  const label =
    status === "OTHER" && entryTypeRaw ? entryTypeRaw : config.label;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full border text-[0.6875rem] font-semibold uppercase tracking-wider"
      style={{ color: config.color, borderColor: config.color }}
      title={status === "OTHER" && entryTypeRaw ? `entry_type: ${entryTypeRaw}` : undefined}
    >
      {label}
    </span>
  );
}
