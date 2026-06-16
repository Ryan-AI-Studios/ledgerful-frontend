# Track SPEC: 0004-GraphVisualizationCanvas — Interactive Knowledge-Graph Canvas

## Objective

Replace the Graph page placeholder with an interactive canvas that visualizes the codebase as a knowledge graph: files, changes, and AI-attributed edits as nodes with risk-weighted edges.

## Why This Matters

A list view of changes cannot show systemic coupling. The graph canvas helps users spot clusters of risk, unexpected dependencies, and AI-edited hotspots at a glance.

## Requirements

### Must Have
- Canvas-based graph on `/graph` (HTML5 Canvas, SVG, or D3) that renders nodes and edges.
- Node types: file, change entry, AI attribution marker.
- Edge types: depends-on, changed-by, ai-edited.
- Pan and zoom (mouse wheel, pinch, and UI buttons).
- Click a node to open a detail panel showing file path, risk level, and recent changes.
- Fit-to-screen / reset view button.

### Should Have
- Force-directed layout with stable re-rendering.
- Color coding: mint for selection, coral for AI-attribution, risk colors for node borders.
- Minimap or bird's-eye overview for large graphs.

### Won't Do
- Full graph query language (Cypher, GraphQL).
- Real-time collaborative editing cursors.

## API / Data Contracts

```ts
// src/lib/types.ts additions
export interface GraphNode {
  id: string;
  type: "file" | "change" | "ai";
  label: string;
  riskLevel?: "HIGH" | "MEDIUM" | "LOW" | "TRIVIAL";
  x?: number;
  y?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: "depends" | "changed" | "ai-edited";
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
```

Live endpoint:
- `GET /api/v1/graph`

## UI/UX Notes

- Keep the dark surface and single mint accent.
- Coral is reserved for AI-attribution nodes and edges.
- Multi-cue risk: node border color + shape + tooltip text.
- Keyboard: Tab to focus canvas, arrow keys to pan, +/- to zoom, Enter to select focused node.

## Testing Strategy

- Unit tests for graph layout math and viewport clamping.
- Manual smoke test with mock graph data.
- Screenshot of default graph state and selected node panel.

## Definition of Done

- [ ] `/graph` renders an interactive canvas with nodes and edges.
- [ ] Pan, zoom, fit, and node selection all work.
- [ ] Detail panel opens on node selection.
- [ ] `npm run build` passes.
- [ ] `npm run lint` passes.
- [ ] Screenshots updated.
- [ ] `changeguard ledger status` clean.

## Related Documents

- `docs/product.md`
- `docs/design.md`
- `AGENTS.md`
- `conductor/0001-DaemonAPIClientLayer/spec.md`
