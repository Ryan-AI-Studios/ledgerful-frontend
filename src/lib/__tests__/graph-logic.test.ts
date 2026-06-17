import { describe, it, expect } from "vitest";
import { normalizeGraphData, calculateZoom, clamp } from "../graph-utils";
import { GraphData } from "../types";

describe("Graph Utils", () => {
  describe("normalizeGraphData", () => {
    it("assigns coordinates to nodes missing them", () => {
      const data: GraphData = {
        nodes: [
          { id: "1", type: "file", label: "A" },
          { id: "2", type: "file", label: "B" },
        ],
        edges: [],
      };

      const normalized = normalizeGraphData(data);
      expect(normalized.nodes[0].x).toBeDefined();
      expect(normalized.nodes[0].y).toBeDefined();
      expect(normalized.nodes[1].x).toBeGreaterThan(normalized.nodes[0].x!);
    });

    it("preserves existing coordinates", () => {
      const data: GraphData = {
        nodes: [{ id: "1", type: "file", label: "A", x: 50, y: 50 }],
        edges: [],
      };

      const normalized = normalizeGraphData(data);
      expect(normalized.nodes[0].x).toBe(50);
      expect(normalized.nodes[0].y).toBe(50);
    });
  });

  describe("calculateZoom", () => {
    const initialViewBox = { x: 0, y: 0, scale: 1 };

    it("zooms in correctly", () => {
      const zoomed = calculateZoom(initialViewBox, 2, 100, 100);
      expect(zoomed.scale).toBe(2);
      expect(zoomed.x).toBe(50);
      expect(zoomed.y).toBe(50);
    });

    it("respects maxScale", () => {
      const zoomed = calculateZoom(initialViewBox, 20, 100, 100, 0.1, 10);
      expect(zoomed.scale).toBe(10);
    });

    it("respects minScale", () => {
      const zoomed = calculateZoom(initialViewBox, 0.01, 100, 100, 0.5, 10);
      expect(zoomed.scale).toBe(0.5);
    });

    it("handles zero scale gracefully", () => {
      const zoomed = calculateZoom({ x: 0, y: 0, scale: 0 }, 1.1, 100, 100);
      expect(zoomed.scale).toBeGreaterThan(0);
      expect(isFinite(zoomed.x)).toBe(true);
      expect(isFinite(zoomed.y)).toBe(true);
    });
  });

  describe("clamp", () => {
    it("clamps values within range", () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });
});
