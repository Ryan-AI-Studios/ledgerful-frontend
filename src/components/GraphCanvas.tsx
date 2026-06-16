"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { GraphData, GraphNode } from "@/lib/types";

interface GraphCanvasProps {
  data: GraphData;
  onSelectNode: (node: GraphNode | null) => void;
  selectedNodeId?: string;
}

export function GraphCanvas({ data, onSelectNode, selectedNodeId }: GraphCanvasProps) {
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, scale: 1 });
  const [dimensions, setDimensions] = useState({ width: 1000, height: 800 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight
      });
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click for pan
      setIsDragging(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const dx = (e.clientX - lastMousePos.x) / viewBox.scale;
      const dy = (e.clientY - lastMousePos.y) / viewBox.scale;
      setViewBox((prev) => ({ ...prev, x: prev.x - dx, y: prev.y - dy }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  }, [isDragging, lastMousePos, viewBox.scale]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    const direction = e.deltaY > 0 ? 1 / zoomFactor : zoomFactor;
    
    // Zoom towards cursor
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left);
      const mouseY = (e.clientY - rect.top);

      setViewBox((prev) => {
        const newScale = Math.max(0.1, Math.min(prev.scale * direction, 10));
        const actualDirection = newScale / prev.scale;
        
        // Adjust x,y to zoom relative to mouse pointer
        const dx = (mouseX / prev.scale) * (1 - 1 / actualDirection);
        const dy = (mouseY / prev.scale) * (1 - 1 / actualDirection);

        return {
          x: prev.x + dx,
          y: prev.y + dy,
          scale: newScale
        };
      });
    }
  };

  const getRiskColor = (risk?: string) => {
    switch (risk) {
      case "HIGH": return "var(--color-risk-high, #ef4444)";
      case "MEDIUM": return "var(--color-risk-medium, #f59e0b)";
      case "LOW": return "var(--color-risk-low, #10b981)";
      default: return "var(--color-border-muted, #9ca3af)";
    }
  };

  const getNodeColor = (node: GraphNode) => {
    if (node.type === "ai") return "var(--color-accent)";
    return "var(--color-surface-raised, #374151)";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const step = 20 / viewBox.scale;
    switch (e.key) {
      case "ArrowUp":
        setViewBox(prev => ({ ...prev, y: prev.y - step }));
        break;
      case "ArrowDown":
        setViewBox(prev => ({ ...prev, y: prev.y + step }));
        break;
      case "ArrowLeft":
        setViewBox(prev => ({ ...prev, x: prev.x - step }));
        break;
      case "ArrowRight":
        setViewBox(prev => ({ ...prev, x: prev.x + step }));
        break;
      case "+":
      case "=":
        setViewBox(prev => ({ ...prev, scale: prev.scale * 1.1 }));
        break;
      case "-":
      case "_":
        setViewBox(prev => ({ ...prev, scale: prev.scale / 1.1 }));
        break;
    }
  };

  return (
    <div 
      ref={containerRef}
      tabIndex={0}
      role="application"
      aria-label="Knowledge Graph"
      className="relative w-full h-full bg-black/20 overflow-hidden cursor-grab active:cursor-grabbing rounded-lg border border-white/10 outline-none focus:ring-1 focus:ring-primary/30"
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
    >
      <svg 
        className="w-full h-full"
        viewBox={`${viewBox.x} ${viewBox.y} ${dimensions.width / viewBox.scale} ${dimensions.height / viewBox.scale}`}
      >
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="20" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#4b5563" />
          </marker>
        </defs>

        {/* Edges */}
        {data.edges.map((edge) => {
          const source = data.nodes.find(n => n.id === edge.source);
          const target = data.nodes.find(n => n.id === edge.target);
          if (!source || !target) return null;

          return (
            <line
              key={edge.id}
              x1={source.x ?? 0}
              y1={source.y ?? 0}
              x2={target.x ?? 0}
              y2={target.y ?? 0}
              stroke={edge.type === "ai-edited" ? "var(--color-accent)" : "#4b5563"}
              strokeWidth={1.5}
              strokeDasharray={edge.type === "depends" ? "none" : "4 2"}
              markerEnd="url(#arrowhead)"
              opacity={0.6}
            />
          );
        })}

        {/* Nodes */}
        {data.nodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          const strokeColor = isSelected ? "var(--color-primary)" : getRiskColor(node.riskLevel);
          const fillColor = getNodeColor(node);

          return (
            <g 
              key={node.id} 
              transform={`translate(${node.x ?? 0}, ${node.y ?? 0})`}
              className="cursor-pointer outline-none focus:ring-2 focus:ring-[var(--color-primary)] rounded"
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onSelectNode(isSelected ? null : node);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelectNode(isSelected ? null : node);
                }
              }}
            >
              <title>{node.label}</title>
              {node.type === "change" ? (
                <rect 
                  x="-12" y="-12" width="24" height="24"
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isSelected ? 3 : 2}
                  rx="4"
                />
              ) : (
                <circle 
                  r="12"
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isSelected ? 3 : 2}
                />
              )}
              <text
                y="24"
                textAnchor="middle"
                className="text-[10px] fill-gray-400 pointer-events-none select-none font-mono"
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Controls Overlay */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button 
          onClick={() => setViewBox(prev => ({ ...prev, scale: prev.scale * 1.2 }))}
          aria-label="Zoom in"
          className="w-8 h-8 flex items-center justify-center bg-gray-800 border border-white/10 rounded hover:bg-gray-700 text-white"
        >
          +
        </button>
        <button 
          onClick={() => setViewBox(prev => ({ ...prev, scale: prev.scale / 1.2 }))}
          aria-label="Zoom out"
          className="w-8 h-8 flex items-center justify-center bg-gray-800 border border-white/10 rounded hover:bg-gray-700 text-white"
        >
          -
        </button>
        <button 
          onClick={() => setViewBox({ x: 0, y: 0, scale: 1 })}
          aria-label="Reset zoom"
          className="px-2 h-8 flex items-center justify-center bg-gray-800 border border-white/10 rounded hover:bg-gray-700 text-xs text-white"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
