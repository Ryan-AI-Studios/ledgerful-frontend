import { GraphData } from "./types";

const DEFAULT_NODE_SPACING = 100;
const MAX_NODES_PER_ROW = 10;

/**
 * Normalizes graph data, ensuring all nodes have x and y coordinates.
 * If missing, it assigns them a default or random position.
 */
export function normalizeGraphData(data: GraphData): GraphData {
  return {
    ...data,
    nodes: data.nodes.map((node, index) => ({
      ...node,
      x: node.x ?? (index % MAX_NODES_PER_ROW) * DEFAULT_NODE_SPACING,
      y: node.y ?? Math.floor(index / MAX_NODES_PER_ROW) * DEFAULT_NODE_SPACING,
    })),
  };
}

interface ViewBox {
  x: number;
  y: number;
  scale: number;
}

/**
 * Calculates the new viewBox when zooming relative to a point (e.g., mouse cursor).
 */
export function calculateZoom(
  prevViewBox: ViewBox,
  zoomDirection: number, // > 1 for zoom in, < 1 for zoom out
  pointX: number, // Point x in container coordinates
  pointY: number, // Point y in container coordinates
  minScale: number = 0.1,
  maxScale: number = 10
): ViewBox {
  // Prevent division by zero if scale is somehow 0
  const safePrevScale = prevViewBox.scale || 0.1;
  
  const newScale = Math.max(minScale, Math.min(safePrevScale * zoomDirection, maxScale));
  const actualDirection = newScale / safePrevScale;

  // Adjust x,y to zoom relative to the point
  const dx = (pointX / safePrevScale) * (1 - 1 / actualDirection);
  const dy = (pointY / safePrevScale) * (1 - 1 / actualDirection);

  return {
    x: prevViewBox.x + dx,
    y: prevViewBox.y + dy,
    scale: newScale,
  };
}

/**
 * Clamps a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}
