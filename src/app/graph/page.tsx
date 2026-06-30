"use client";

import { useEffect, useState, useCallback } from "react";
import { PageLayout } from "@/components/PageLayout";
import { GraphData, GraphNode, fetchGraph } from "@/lib/graph-data";
import { DataSource } from "@/lib/fallback";
import { GraphCanvas } from "@/components/GraphCanvas";
import { GraphDetailPanel } from "@/components/GraphDetailPanel";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { Search, Info, AlertCircle, RefreshCw } from "lucide-react";

type GraphState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: GraphData; source: DataSource };

export default function GraphPage() {
  const [state, setState] = useState<GraphState>({ status: "loading" });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const load = useCallback(() => {
    setTimeout(() => setState({ status: "loading" }), 0);
    fetchGraph()
      .then((result) => {
        setState({ status: "ready", data: result.data, source: result.source });
      })
      .catch(() => {
        setState({
          status: "error",
          message: "Could not load knowledge graph. The Ledgerful daemon may not be running.",
        });
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <PageLayout title="Knowledge Graph">
      <div className="flex items-center gap-3 mb-4">
        {state.status === "ready" && <DataSourceBadge source={state.source} />}
      </div>
      <div className="flex flex-col h-[calc(100vh-140px)]">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="text-sm text-[var(--color-text-muted)]">
              {state.status === "ready" ? `${state.data.nodes.length} nodes · ${state.data.edges.length} edges` : "0 nodes · 0 edges"}
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" aria-hidden="true" />
              <input
                type="search"
                aria-label="Search symbols"
                placeholder="Search symbols..."
                className="w-64 h-8 pl-8 pr-3 rounded-md bg-[var(--color-surface)] border border-[var(--color-border-muted)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[var(--color-text-secondary)] text-xs">
              <Info size={14} />
              <span>Interactive View Beta</span>
            </div>
          </div>
        </div>

        <div className="relative flex-1 bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg overflow-hidden">
          {state.status === "loading" ? (
            <div className="w-full h-full flex items-center justify-center bg-black/20 animate-pulse">
              <div className="text-gray-500">Loading knowledge graph...</div>
            </div>
          ) : state.status === "error" ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="bg-[var(--color-surface-alt)] border border-[var(--color-danger-muted)] rounded-lg p-6 max-w-md">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-[var(--color-danger)] flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <h2 className="text-[1rem] font-semibold text-[var(--color-danger)]">Failed to load</h2>
                    <p className="mt-1 text-[var(--color-text-secondary)]">{state.message}</p>
                    <button
                      onClick={() => { setState({ status: "loading" }); load(); }}
                      className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm font-medium hover:bg-[var(--color-surface-raised)] transition-colors duration-100"
                    >
                      <RefreshCw className="w-4 h-4" aria-hidden="true" />
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <GraphCanvas 
                data={state.data} 
                onSelectNode={setSelectedNode}
                selectedNodeId={selectedNode?.id}
              />
              <GraphDetailPanel 
                node={selectedNode} 
                onClose={() => setSelectedNode(null)} 
              />
            </>
          )}
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm text-[var(--color-text-muted)]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gray-700 border border-gray-600"></span>
            <span>File</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-gray-700 border border-gray-600"></span>
            <span>Change</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[var(--color-accent)]"></span>
            <span>AI Attribution</span>
          </div>
          <div className="ml-auto">
            Use mouse wheel to zoom, drag to pan. Click nodes to see details.
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
