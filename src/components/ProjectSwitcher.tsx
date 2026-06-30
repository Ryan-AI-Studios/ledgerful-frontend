"use client";

import { useState, useRef, useEffect } from "react";
import { useProject } from "@/lib/ProjectContext";
import { Check, ChevronDown, FolderGit2, AlertTriangle } from "lucide-react";
import { StatusDot } from "./StatusDot";

export function ProjectSwitcher() {
  const { project, setProject, allProjects } = useProject();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-100"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <FolderGit2 className="w-4 h-4" aria-hidden="true" />
        <span className="font-medium text-[var(--color-text-primary)]">{project.name}</span>
        {project.validationWarnings.length > 0 && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--color-warning)]/10 text-[var(--color-warning)] border border-[var(--color-warning)]/20">
            <AlertTriangle className="w-3 h-3" aria-hidden="true" />
            Needs attention
          </span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-100 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-2 w-72 bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.4)] z-50 py-1"
          role="listbox"
        >
          <div className="px-3 py-2 text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            Select project
          </div>
          {allProjects.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setProject(p);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 flex items-start gap-3 transition-colors duration-100 ${
                p.id === project.id
                  ? "bg-[rgba(0,229,160,0.06)]"
                  : "hover:bg-[var(--color-surface-raised)]"
              }`}
              role="option"
              aria-selected={p.id === project.id}
            >
              <div className="mt-1">
                <StatusDot status={p.status} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                    {p.name}
                  </span>
                  {p.id === project.id && (
                    <Check className="w-4 h-4 text-[var(--color-primary)]" aria-hidden="true" />
                  )}
                </div>
                <div className="text-xs text-[var(--color-text-muted)] truncate">
                  {p.path}
                </div>
                <div className="text-xs text-[var(--color-text-muted)] mt-1">
                  Health {p.healthScore}/100 · scanned {p.lastScanAt}
                </div>
                {p.validationWarnings.length > 0 && (
                  <div className="flex items-center gap-1 mt-1 text-[0.6875rem] text-[var(--color-warning)]">
                    <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                    <span>{p.validationWarnings.length} warning{p.validationWarnings.length > 1 ? "s" : ""}</span>
                  </div>
                )}
              </div>
            </button>
          ))}
          <div className="border-t border-[var(--color-border-muted)] mt-1 pt-1">
            <a
              href="/projects"
              className="block px-3 py-2 text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-muted)] transition-colors duration-100"
              onClick={() => setOpen(false)}
            >
              Manage projects →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
