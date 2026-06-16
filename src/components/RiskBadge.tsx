import { RiskLevel } from "@/lib/types";

const riskConfig: Record<
  RiskLevel,
  { color: string; icon: string; label: string }
> = {
  HIGH: { color: "var(--color-risk-high)", icon: "▲", label: "HIGH" },
  MEDIUM: { color: "var(--color-risk-medium)", icon: "●", label: "MED" },
  LOW: { color: "var(--color-risk-low)", icon: "○", label: "LOW" },
  TRIVIAL: { color: "var(--color-risk-trivial)", icon: "·", label: "TRIV" },
};

interface RiskBadgeProps {
  risk: RiskLevel;
}

export function RiskBadge({ risk }: RiskBadgeProps) {
  const config = riskConfig[risk];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[0.6875rem] font-semibold uppercase tracking-wider"
      style={{
        color: config.color,
        borderColor: config.color,
      }}
      aria-label={`Risk level: ${config.label}`}
    >
      <span aria-hidden="true">{config.icon}</span>
      {config.label}
    </span>
  );
}
