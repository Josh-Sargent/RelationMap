"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { GraphData, NodeDetail } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type Vec2 = { x: number; y: number };

type SimNode = {
  id: string;
  name: string;
  color: string;
  databaseId: string;
  px: number;
  py: number;
  vx: number;
  vy: number;
};

type Props = {
  graph: GraphData;
  onSelectNode: (detail: NodeDetail | null) => void;
  selectedNodeId: string | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_ZOOM = 0.06;
const MAX_ZOOM = 5.0;
const NODE_RADIUS = 7;
const NODE_RADIUS_SELECTED = 10;

// ─── Force simulation ─────────────────────────────────────────────────────────

function runForceLayout(
  nodes: SimNode[],
  edges: Array<{ source: string; target: string }>,
  iterations: number,
): void {
  const REPULSION     = 6000;
  const LINK_DIST     = 170;
  const LINK_STRENGTH = 0.10;
  const GRAVITY       = 0.016;
  const DAMPING       = 0.70;

  const idxMap = new Map(nodes.map((n, i) => [n.id, i]));

  for (let iter = 0; iter < iterations; iter++) {
    const cooling = 1 - iter / iterations;

    for (const n of nodes) { n.vx = 0; n.vy = 0; }

    // Repulsion
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        let dx = b.px - a.px, dy = b.py - a.py;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const force = (REPULSION / (dist * dist)) * cooling;
        dx = (dx / dist) * force; dy = (dy / dist) * force;
        a.vx -= dx; a.vy -= dy;
        b.vx += dx; b.vy += dy;
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const si = idxMap.get(edge.source), ti = idxMap.get(edge.target);
      if (si === undefined || ti === undefined) continue;
      const a = nodes[si], b = nodes[ti];
      const dx = b.px - a.px, dy = b.py - a.py;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const delta = (dist - LINK_DIST) * LINK_STRENGTH * cooling;
      const fx = (dx / dist) * delta, fy = (dy / dist) * delta;
      a.vx += fx; a.vy += fy;
      b.vx -= fx; b.vy -= fy;
    }

    // Gravity to center
    for (const n of nodes) {
      n.vx -= n.px * GRAVITY;
      n.vy -= n.py * GRAVITY;
    }

    // Integrate
    for (const n of nodes) {
      n.px += n.vx * DAMPING;
      n.py += n.vy * DAMPING;
    }
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GraphCanvas({ graph, onSelectNode, selectedNodeId }: Props) {
  const svgRef       = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const isPanning   = useRef(false);
  const panStart    = useRef<Vec2>({ x: 0, y: 0 });
  const txAtPanStart = useRef({ x: 0, y: 0, scale: 1 });

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(null);
  const [simNodes, setSimNodes] = useState<SimNode[]>([]);

  // Stable key representing which nodes are in the graph — re-run sim when set changes
  const graphKey = graph.nodes.map((n) => n.id).sort().join(",");
  const lastGraphKey = useRef<string>("");
  const animFrameRef = useRef<number>(0);

  // ── Build & run simulation ──
  useEffect(() => {
    if (graphKey === lastGraphKey.current) return;
    lastGraphKey.current = graphKey;

    // Cancel any in-flight animation from a previous run
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    if (graph.nodes.length === 0) {
      setSimNodes([]);
      return;
    }

    const nodes: SimNode[] = graph.nodes.map((n, i) => ({
      id: n.id, name: n.name, color: n.color, databaseId: n.databaseId,
      px: isFinite(n.x) ? n.x * 0.55 : Math.cos(i * 2.4) * (50 + i * 8),
      py: isFinite(n.y) ? n.y * 0.55 : Math.sin(i * 2.4) * (50 + i * 8),
      vx: 0, vy: 0,
    }));

    const TOTAL = 320, CHUNK = 30;
    let done = 0;

    function tick() {
      runForceLayout(nodes, graph.edges, CHUNK);
      done += CHUNK;
      setSimNodes(nodes.map((n) => ({ ...n })));
      if (done < TOTAL) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        // Auto-fit once simulation settles
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) fitNodes(nodes, rect.width, rect.height);
      }
    }
    animFrameRef.current = requestAnimationFrame(tick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphKey]);

  // ── Fit nodes into viewport ──
  function fitNodes(nodes: SimNode[], w: number, h: number) {
    if (nodes.length === 0) return;
    const xs = nodes.map((n) => n.px).filter(isFinite);
    const ys = nodes.map((n) => n.py).filter(isFinite);
    if (!xs.length) return;
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const rangeX = maxX - minX || 1, rangeY = maxY - minY || 1;
    const padding = 80;
    const s = Math.max(
      MIN_ZOOM,
      Math.min(
        (w - padding * 2) / rangeX,
        (h - padding * 2) / rangeY,
        MAX_ZOOM,
      ),
    );
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    setTransform({ scale: s, x: w / 2 - cx * s, y: h / 2 - cy * s });
  }

  // ── Sync external deselect (panel close) ──
  useEffect(() => {
    if (!selectedNodeId) setLocalSelectedId(null);
  }, [selectedNodeId]);

  // ── Fetch node detail when local selection changes ──
  useEffect(() => {
    if (!localSelectedId) {
      onSelectNode(null);
      return;
    }
    void fetch(`/api/node/${localSelectedId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((payload: NodeDetail | null) => onSelectNode(payload))
      .catch(() => onSelectNode(null));
  }, [localSelectedId, onSelectNode]);

  const nodeMap = useMemo(
    () => new Map(simNodes.map((n) => [n.id, n])),
    [simNodes],
  );

  // ── Pan ──
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as Element).closest("[data-node]")) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY };
    txAtPanStart.current = { ...transform };
  }, [transform]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setTransform({ ...txAtPanStart.current, x: txAtPanStart.current.x + dx, y: txAtPanStart.current.y + dy });
  }, []);

  const stopPan = useCallback(() => { isPanning.current = false; }, []);

  // ── Zoom ──
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    setTransform((p) => {
      const ns = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, p.scale * factor));
      const sd = ns / p.scale;
      return { scale: ns, x: mx - (mx - p.x) * sd, y: my - (my - p.y) * sd };
    });
  }, []);

  // ── Touch ──
  const lastTouches = useRef<React.Touch[]>([]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    lastTouches.current = Array.from(e.touches);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const touches = Array.from(e.touches);
    if (touches.length === 1 && lastTouches.current.length === 1) {
      const dx = touches[0].clientX - lastTouches.current[0].clientX;
      const dy = touches[0].clientY - lastTouches.current[0].clientY;
      setTransform((p) => ({ ...p, x: p.x + dx, y: p.y + dy }));
    } else if (touches.length === 2 && lastTouches.current.length >= 2) {
      const distNow = Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
      const distPrev = Math.hypot(lastTouches.current[0].clientX - lastTouches.current[1].clientX, lastTouches.current[0].clientY - lastTouches.current[1].clientY);
      const factor = distNow / (distPrev || 1);
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mx = (touches[0].clientX + touches[1].clientX) / 2 - rect.left;
      const my = (touches[0].clientY + touches[1].clientY) / 2 - rect.top;
      setTransform((p) => {
        const ns = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, p.scale * factor));
        const sd = ns / p.scale;
        return { scale: ns, x: mx - (mx - p.x) * sd, y: my - (my - p.y) * sd };
      });
    }
    lastTouches.current = touches;
  }, []);

  const { x: tx, y: ty, scale } = transform;

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%", height: "100%",
        position: "relative", overflow: "hidden",
        userSelect: "none",
        cursor: isPanning.current ? "grabbing" : "grab",
        background: "var(--bg-base)",
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={stopPan}
      onMouseLeave={stopPan}
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={() => { lastTouches.current = []; }}
    >
      <svg ref={svgRef} style={{ width: "100%", height: "100%", display: "block" }}>
        <defs>
          <filter id="node-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="node-glow-soft" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <g transform={`translate(${tx},${ty}) scale(${scale})`}>
          {/* Edges */}
          {graph.edges.map((edge) => {
            const src = nodeMap.get(edge.source);
            const tgt = nodeMap.get(edge.target);
            if (!src || !tgt) return null;

            const isRelated = localSelectedId !== null && (
              edge.source === localSelectedId || edge.target === localSelectedId
            );
            const isDimmed = localSelectedId !== null && !isRelated;

            const x1 = src.px || 0, y1 = src.py || 0, x2 = tgt.px || 0, y2 = tgt.py || 0;
            if (!isFinite(x1) || !isFinite(y1) || !isFinite(x2) || !isFinite(y2)) return null;

            return (
              <line
                key={edge.id}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={isRelated ? "var(--accent-warm)" : "var(--edge-color)"}
                strokeWidth={(isRelated ? 1.6 : 0.9) / scale}
                opacity={isDimmed ? 0.1 : isRelated ? 0.8 : 1}
                style={{ transition: "opacity 0.25s, stroke 0.25s" }}
              />
            );
          })}

          {/* Nodes */}
          {simNodes.map((node) => {
            if (!isFinite(node.px) || !isFinite(node.py)) return null;
            const isSelected = node.id === localSelectedId;
            const isHovered  = node.id === hoveredId;
            const isDimmed   = localSelectedId !== null && !isSelected;
            const r = (isSelected ? NODE_RADIUS_SELECTED : NODE_RADIUS);

            const showLabel = isHovered || isSelected;

            return (
              <g
                key={node.id}
                data-node="true"
                style={{ cursor: "pointer" }}
                onClick={() => setLocalSelectedId(isSelected ? null : node.id)}
                onMouseEnter={() => setHoveredId(node.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Selection ring */}
                {isSelected && (
                  <circle
                    cx={node.px} cy={node.py} r={r + 7}
                    fill="none"
                    stroke={node.color}
                    strokeWidth={1 / scale}
                    opacity={0.28}
                  />
                )}

                {/* Hover aura */}
                {isHovered && !isSelected && (
                  <circle
                    cx={node.px} cy={node.py} r={r + 4}
                    fill={node.color}
                    opacity={0.12}
                  />
                )}

                {/* Main circle */}
                <circle
                  cx={node.px} cy={node.py} r={r}
                  fill={node.color}
                  stroke={
                    isSelected ? "var(--bg-base)" :
                    isHovered  ? "rgba(255,255,255,0.9)" :
                                 "rgba(255,255,255,0.4)"
                  }
                  strokeWidth={(isSelected ? 2.5 : 1.5) / scale}
                  opacity={isDimmed ? 0.15 : 1}
                  filter={isSelected ? "url(#node-glow)" : isHovered ? "url(#node-glow-soft)" : undefined}
                  style={{ transition: "opacity 0.2s" }}
                />

                {/* Label */}
                {showLabel && (
                  <text
                    x={node.px + r + 5}
                    y={node.py + 4}
                    fontSize={12 / scale}
                    fontFamily="'Geist', sans-serif"
                    fontWeight={isSelected ? "500" : "400"}
                    fill={isSelected ? "var(--text-primary)" : "var(--text-secondary)"}
                    stroke="var(--bg-base)"
                    strokeWidth={3 / scale}
                    strokeLinejoin="round"
                    paintOrder="stroke"
                    style={{ pointerEvents: "none" }}
                  >
                    {node.name}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Zoom buttons */}
      <div style={{
        position: "absolute", top: 20, right: 24,
        display: "flex", flexDirection: "column", gap: 4, zIndex: 20,
      }}>
        {([
          { label: "+", delta: 1.4 },
          { label: "−", delta: 1 / 1.4 },
        ] as const).map(({ label, delta }) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              const rect = containerRef.current?.getBoundingClientRect();
              if (!rect) return;
              const cx = rect.width / 2, cy = rect.height / 2;
              setTransform((p) => {
                const ns = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, p.scale * delta));
                const sd = ns / p.scale;
                return { scale: ns, x: cx - (cx - p.x) * sd, y: cy - (cy - p.y) * sd };
              });
            }}
            style={zoomBtnStyle}
            onMouseEnter={(e) => Object.assign((e.currentTarget as HTMLElement).style, zoomBtnHover)}
            onMouseLeave={(e) => Object.assign((e.currentTarget as HTMLElement).style, zoomBtnStyle)}
          >
            {label}
          </button>
        ))}
        {/* Reset to center */}
        <button
          type="button"
          title="Reset view"
          onClick={() => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) setTransform({ x: rect.width / 2, y: rect.height / 2, scale: 1 });
          }}
          style={{ ...zoomBtnStyle, fontSize: 13 }}
          onMouseEnter={(e) => Object.assign((e.currentTarget as HTMLElement).style, zoomBtnHover)}
          onMouseLeave={(e) => Object.assign((e.currentTarget as HTMLElement).style, { ...zoomBtnStyle, fontSize: "13px" })}
        >
          ⌖
        </button>
        {/* Fit all nodes */}
        <button
          type="button"
          title="Fit graph to screen"
          onClick={() => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) fitNodes(simNodes, rect.width, rect.height);
          }}
          style={{ ...zoomBtnStyle, fontSize: 12 }}
          onMouseEnter={(e) => Object.assign((e.currentTarget as HTMLElement).style, zoomBtnHover)}
          onMouseLeave={(e) => Object.assign((e.currentTarget as HTMLElement).style, { ...zoomBtnStyle, fontSize: "12px" })}
        >
          ⊡
        </button>
      </div>
    </div>
  );
}

const zoomBtnStyle: React.CSSProperties = {
  width: 32, height: 32,
  background: "var(--panel-bg)",
  backdropFilter: "blur(12px)",
  border: "1px solid var(--border-default)",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 18,
  color: "var(--text-secondary)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "var(--shadow-sm)",
  transition: "background 0.15s, color 0.15s",
  fontFamily: "inherit",
  lineHeight: "1",
};

const zoomBtnHover: React.CSSProperties = {
  ...zoomBtnStyle,
  background: "var(--bg-overlay)",
  color: "var(--accent-warm)",
};
