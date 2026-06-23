"use client";

import { useState, useEffect, useRef } from "react";
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Terminal, 
  CheckCircle2, 
  ShieldCheck,
  Copy,
  Check
} from "lucide-react";

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function OnboardingWizard({ isOpen, onClose, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      returnFocusRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
      // Small delay to ensure modal is rendered and focusable
      setTimeout(() => {
        modalRef.current?.focus();
      }, 0);
    } else {
      document.body.style.overflow = "unset";
      // Return focus to previous element or page title
      if (returnFocusRef.current) {
        returnFocusRef.current.focus();
      } else {
        (document.querySelector("h1") as HTMLElement)?.focus();
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText("ledger init");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (step === 3 && !scanComplete) {
      const duration = 2000;
      const intervalTime = 50;
      const increment = 100 / (duration / intervalTime);
      
      const timer = setInterval(() => {
        setScanProgress((prev) => {
          const next = prev + increment;
          if (next >= 100) {
            clearInterval(timer);
            setScanComplete(true);
            return 100;
          }
          return next;
        });
      }, intervalTime);
      
      return () => clearInterval(timer);
    }
  }, [step, scanComplete]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div 
        ref={modalRef}
        tabIndex={-1}
        className="w-full max-w-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl shadow-2xl overflow-hidden focus:outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[var(--color-primary)]" />
            <span className="font-semibold text-sm tracking-tight text-[var(--color-text-primary)]">
              LEDGERFUL ONBOARDING
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-md hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            aria-label="Close onboarding"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 min-h-[300px]">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 id="onboarding-title" className="text-2xl font-bold text-[var(--color-text-primary)]">
                Welcome to Ledgerful
              </h2>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                Ledgerful is your local-first change intelligence engine. We help you track, 
                verify, and govern your codebase changes with cryptographic certainty.
              </p>
              <div className="grid grid-cols-1 gap-3 pt-4">
                <div className="flex gap-3 items-start p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]">
                  <div className="mt-1 p-1.5 rounded bg-[var(--color-primary-muted)] text-[var(--color-primary)]">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-[var(--color-text-primary)]">AI-Governed Integrity</h3>
                    <p className="text-xs text-[var(--color-text-secondary)]">Verify changes against your team&apos;s policies automatically.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]">
                  <div className="mt-1 p-1.5 rounded bg-[var(--color-primary-muted)] text-[var(--color-primary)]">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-[var(--color-text-primary)]">Local-First Engine</h3>
                    <p className="text-xs text-[var(--color-text-secondary)]">All intelligence runs on your machine. Your code stays private.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
                Connect Your Project
              </h2>
              <p className="text-[var(--color-text-secondary)]">
                Run the following command in your repository&apos;s root directory to initialize Ledgerful.
              </p>
              <div className="mt-6 p-4 bg-black rounded-lg border border-[var(--color-border)] font-mono text-sm relative group">
                <div className="flex items-center gap-3">
                  <span className="text-[var(--color-primary)]">$</span>
                  <span className="text-white">ledger init</span>
                </div>
                <button 
                  onClick={copyToClipboard}
                  className="absolute right-3 top-3 p-2 rounded bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Copy ledger init command to clipboard"
                >
                  {copied ? <Check className="w-4 h-4 text-[var(--color-primary)]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] pt-2 italic">
                This will create a <code className="text-[var(--color-text-primary)]">.changeguard</code> directory and start the local daemon.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
                Indexing Codebase
              </h2>
              <p className="text-[var(--color-text-secondary)]">
                Ledgerful is scanning your repository to build a high-precision knowledge graph of your architecture.
              </p>
              
              <div className="pt-8">
                <div className="flex justify-between mb-2 text-xs font-mono">
                  <span className="text-[var(--color-text-secondary)]">
                    {scanComplete ? "SCAN COMPLETE" : "SCANNING..."}
                  </span>
                  <span className="text-[var(--color-primary)]">{Math.round(scanProgress)}%</span>
                </div>
                <div 
                  className="h-2 w-full bg-[var(--color-surface)] rounded-full overflow-hidden border border-[var(--color-border)]"
                  role="progressbar"
                  aria-valuenow={scanProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div 
                    className="h-full bg-[var(--color-primary)] transition-all duration-[50ms] ease-linear" 
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>

              {scanComplete && (
                <div className="mt-6 p-4 rounded-lg bg-[var(--color-primary-muted)] border border-[var(--color-primary-faded)] flex items-center gap-3 animate-in zoom-in-95 duration-300">
                  <CheckCircle2 className="w-5 h-5 text-[var(--color-primary)]" />
                  <span className="text-sm font-medium text-[var(--color-primary)]">
                    3,412 symbols indexed. Graph ready.
                  </span>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
                Start with Intent
              </h2>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                Before you make your first change, start an <strong>Intent Ledger</strong>. This links your 
                upcoming edits to a specific goal, ensuring clean provenance.
              </p>
              
              <div className="mt-4 p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-start gap-4">
                <div className="mt-1 p-2 rounded bg-indigo-500/10 text-indigo-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--color-text-primary)]">Provenance First</h3>
                  <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                    Every transaction in Ledgerful is signed and immutable. It&apos;s the &quot;Why&quot; 
                    behind your &quot;What&quot;.
                  </p>
                </div>
              </div>

              <div className="bg-[var(--color-primary-muted)] p-4 rounded-lg border border-[var(--color-primary-faded)] mt-6">
                <p className="text-sm text-[var(--color-text-primary)]">
                  <strong>Tip:</strong> Use <code className="font-mono text-[var(--color-primary)]">ledger start</code> 
                  to begin a new unit of work.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex gap-1" role="img" aria-label={`Step ${step} of 4`}>
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className={`h-1.5 w-6 rounded-full transition-colors ${
                  i === step ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]"
                }`} 
              />
            ))}
          </div>
          <div className="flex gap-3">
            {step > 1 && (
              <button 
                onClick={handleBack}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-transparent border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm font-medium hover:bg-[var(--color-surface-raised)] transition-colors"
                aria-label="Previous step"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
            <button 
              onClick={handleNext}
              disabled={step === 3 && !scanComplete}
              aria-label={step === 4 ? "Complete onboarding" : "Next step"}
              className={`inline-flex items-center gap-2 px-6 py-2 rounded-md font-bold text-sm transition-all duration-200 ${
                step === 3 && !scanComplete 
                  ? "bg-[var(--color-border)] text-[var(--color-text-secondary)] cursor-not-allowed"
                  : "bg-[var(--color-primary)] text-black hover:bg-[var(--color-primary-hover)] active:scale-95 shadow-lg shadow-[var(--color-primary-faded)] hover:shadow-[0_0_24px_var(--color-primary-faded)]"
              }`}
            >
              {step === 4 ? "Finish" : "Next"}
              {step < 4 && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
