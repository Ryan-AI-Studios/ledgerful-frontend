"use client";

import React from "react";
import { GraphNode } from "@/lib/types";
import { RiskBadge } from "./RiskBadge";
import { X } from "lucide-react";

interface GraphDetailPanelProps {
  node: GraphNode | null;
  onClose: () => void;
}

export function GraphDetailPanel({ node, onClose }: GraphDetailPanelProps) {
  if (!node) return null;

  return (
    <div 
      role="complementary"
      aria-label="Node Details"
      className="absolute top-4 right-4 w-80 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg shadow-2xl p-4 z-10 animate-in slide-in-from-right duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
            {node.type}
          </h3>
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] break-all">
            {node.label}
          </h2>
        </div>
        <button 
          onClick={onClose}
          aria-label="Close details"
          className="p-1 hover:bg-[var(--color-surface-alt)] rounded-md transition-colors text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          <X size={18} />
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between py-2 border-b border-[var(--color-border-muted)]">
          <span className="text-sm text-[var(--color-text-muted)]">Risk Level</span>
          {node.riskLevel && <RiskBadge risk={node.riskLevel} />}
        </div>

        <div>
          <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase mb-2">Metadata</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-[var(--color-surface-alt)] p-2 rounded">
              <div className="text-[var(--color-text-muted)] text-[10px] uppercase">ID</div>
              <div className="text-[var(--color-text-secondary)] font-mono">{node.id}</div>
            </div>
            <div className="bg-[var(--color-surface-alt)] p-2 rounded">
              <div className="text-[var(--color-text-muted)] text-[10px] uppercase">Type</div>
              <div className="text-[var(--color-text-secondary)] capitalize">{node.type}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
