"use client";

import { useState, useRef, useEffect } from "react";
import { Download, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { triggerSoc2Export } from "@/lib/compliance-data";

interface Soc2ExportButtonProps {
  disabled?: boolean;
}

export function Soc2ExportButton({ disabled = false }: Soc2ExportButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleExport = async () => {
    if (status === "loading" || disabled) return;
    setStatus("loading");
    setErrorMessage("");
    try {
      await triggerSoc2Export();
      setStatus("success");
      timerRef.current = setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Export failed");
    }
  };

  const statusMessages = {
    loading: "Exporting SOC2 Evidence...",
    success: "Export successful.",
    error: "Export failed.",
    idle: ""
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <span aria-live="polite" className="sr-only">
        {statusMessages[status]}
      </span>
      <button
        onClick={handleExport}
        disabled={disabled || status === "loading"}
        aria-disabled={disabled || status === "loading"}
        title={disabled ? "Export disabled — data source is mock" : undefined}
        className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-150 ${
          disabled || status === "loading"
            ? "bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] cursor-not-allowed"
            : status === "success"
            ? "bg-[var(--color-success)] text-white"
            : status === "error"
            ? "bg-[var(--color-danger)] text-white"
            : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-muted)]"
        }`}
      >
        {status === "loading" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating ZIP...
          </>
        ) : status === "success" ? (
          <>
            <CheckCircle className="w-4 h-4" />
            Exported
          </>
        ) : status === "error" ? (
          <>
            <AlertCircle className="w-4 h-4" />
            Retry Export
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Export SOC2 Evidence
          </>
        )}
      </button>
      {status === "error" && (
        <span className="text-[0.6875rem] text-[var(--color-danger)] font-medium">
          {errorMessage}
        </span>
      )}
    </div>
  );
}
