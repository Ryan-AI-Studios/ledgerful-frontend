"use client";

import { useEffect, useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { GraphData, GraphNode, fetchGraph } from "@/lib/graph-data";
import { DataSource } from "@/lib/fallback";
import { GraphCanvas } from "@/components/GraphCanvas";
import { GraphDetailPanel } from "@/components/GraphDetailPanel";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { Search, Info } from "lucide-react";

export default function GraphPage() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [source, setSource] = useState<DataSource>("live");
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  useEffect(() => {
    fetchGraph().then((result) => {
      setGraphData(result.data);
      setSource(result.source);
      setLoading(false);
    });
  }, []);

  return (
    <PageLayout title="Knowledge Graph">
      <div className="flex items-center gap-3 mb-4">
        {!loading && <DataSourceBadge source={source} />}
      </div>
      <div className="flex flex-col h-[calc(100vh-140px)]">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="text-sm text-[var(--color-text-muted)]">
              {graphData?.nodes.length ?? 0} nodes · {graphData?.edges.length ?? 0} edges
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
          {loading ? (
            <div className="w-full h-full flex items-center justify-center bg-black/20 animate-pulse">
              <div className="text-gray-500">Loading knowledge graph...</div>
            </div>
          ) : graphData ? (
            <>
              <GraphCanvas 
                data={graphData} 
                onSelectNode={setSelectedNode}
                selectedNodeId={selectedNode?.id}
              />
              <GraphDetailPanel 
                node={selectedNode} 
                onClose={() => setSelectedNode(null)} 
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              Failed to load graph data.
            </div>
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
