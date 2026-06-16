import { cva } from "class-variance-authority";

const statusDot = cva("w-2 h-2 rounded-full flex-shrink-0", {
  variants: {
    status: {
      healthy: "bg-[var(--color-success)]",
      warning: "bg-[var(--color-warning)]",
      critical: "bg-[var(--color-danger)]",
      info: "bg-[var(--color-info)]",
    },
  },
  defaultVariants: {
    status: "info",
  },
});

interface StatusDotProps {
  status?: "healthy" | "warning" | "critical" | "info";
  label?: string;
}

export function StatusDot({ status = "info", label }: StatusDotProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={statusDot({ status })} aria-hidden="true" />
      {label && <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>}
    </span>
  );
}
