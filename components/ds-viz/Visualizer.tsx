"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, Pause, Play, RotateCcw } from "lucide-react";
import type { ArrayPanel, BucketsPanel, GraphPanel, GridPanel, LinkedPanel, Panel, StackPanel, TextPanel, Tone, TreeNode, TreePanel, VarsPanel, Visual } from "@/lib/ds-viz/types";

// On narrow screens diagrams shrink to fit, but not below this scale (then they scroll sideways).
const FIT_MIN_SCALE = 0.65;

// Animation model: panels keep their identity between steps (keyed by position and type), so
//  - array cells / linked-list nodes with `ids` slide to their new index (CSS left transition, .dsviz-move),
//  - tree nodes glide to their new layout position (requestAnimationFrame tween, see useTween),
//  - a value or colour that changes "pops" (.dsviz-pop), new things fade or drop in (.dsviz-enter / .dsviz-fade),
//  - edges being examined get marching dashes (.dsviz-flow) and the current graph node pulses (SVG <animate>).
// Everything respects prefers-reduced-motion (see app/globals.css and useReducedMotion).

// ---------------------------------------------------------------- colours
const TONE: Record<Tone, { cell: string; fill: string; stroke: string; text: string; label: string }> = {
  default: { cell: "border-[#3a5052] bg-[#1b2a2f] text-[#dbe7e0]", fill: "#1b2a2f", stroke: "#4a6466", text: "#dbe7e0", label: "Not looked at yet" },
  active: { cell: "border-[#f2c14e] bg-[#4a3a12] text-[#ffe7a8]", fill: "#4a3a12", stroke: "#f2c14e", text: "#ffe7a8", label: "Working on it now" },
  compare: { cell: "border-[#5aa9e6] bg-[#13314a] text-[#cfe8ff]", fill: "#13314a", stroke: "#5aa9e6", text: "#cfe8ff", label: "Being compared / waiting" },
  done: { cell: "border-[#6fcf7f] bg-[#1d3b26] text-[#d6f5da]", fill: "#1d3b26", stroke: "#6fcf7f", text: "#d6f5da", label: "Finished / in place" },
  found: { cell: "border-[#dcffa1] bg-[#c9f27b] text-[#172418]", fill: "#c9f27b", stroke: "#dcffa1", text: "#172418", label: "The answer" },
  muted: { cell: "border-[#253235] bg-[#121a1d] text-[#5d6f6a]", fill: "#121a1d", stroke: "#2b3a3d", text: "#5d6f6a", label: "Ruled out / ignored" },
  new: { cell: "border-[#b18cf2] bg-[#33224d] text-[#eadcff]", fill: "#33224d", stroke: "#b18cf2", text: "#eadcff", label: "Just added / changed" },
  removed: { cell: "border-[#ef6f7c] bg-[#4a1e24] text-[#ffd3d8]", fill: "#4a1e24", stroke: "#ef6f7c", text: "#ffd3d8", label: "Removed / rejected" },
  path: { cell: "border-[#3fd0c4] bg-[#123b3a] text-[#ccfff9]", fill: "#123b3a", stroke: "#3fd0c4", text: "#ccfff9", label: "On the path / chosen" },
};
const EDGE: Record<Tone, string> = { ...Object.fromEntries(Object.entries(TONE).map(([key, value]) => [key, value.stroke])) as Record<Tone, string>, default: "#4f6b6b", muted: "#25322f" };
const tone = (value?: Tone) => TONE[value ?? "default"];
const label = "mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#8da99a]";
/** Tones that deserve a little "pop" when a cell takes them on. */
const LOUD = new Set<Tone | undefined>(["active", "new", "found", "removed"]);
const colourTransition = "transition-colors duration-300";

function useReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!query) return;
    setReduce(query.matches);
    const listen = () => setReduce(query.matches);
    query.addEventListener?.("change", listen);
    return () => query.removeEventListener?.("change", listen);
  }, []);
  return reduce;
}

type Point = { x: number; y: number };
/** Smoothly move a set of named points from where they were last drawn to `targets`. */
function useTween(targets: Record<string, Point>, ms = 560): Record<string, Point> {
  const key = JSON.stringify(targets);
  const [current, setCurrent] = useState(targets);
  const shown = useRef(targets);
  useEffect(() => {
    const goal = JSON.parse(key) as Record<string, Point>;
    const from = shown.current;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const moving = Object.keys(goal).some(id => from[id] && (from[id].x !== goal[id].x || from[id].y !== goal[id].y));
    if (reduce || !moving) { shown.current = goal; setCurrent(goal); return; }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // ease in-out
      const next: Record<string, Point> = {};
      for (const id in goal) { const a = from[id] ?? goal[id]; next[id] = { x: a.x + (goal[id].x - a.x) * e, y: a.y + (goal[id].y - a.y) * e }; }
      shown.current = next;
      setCurrent(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [key, ms]);
  // Points that appeared this render (not tweened yet) are drawn at their target.
  return { ...targets, ...Object.fromEntries(Object.entries(current).filter(([id]) => id in targets)) };
}

/** A value that pops whenever its text or tone changes (the key remounts the span and replays the animation). */
function Pop({ value, tone: t, children }: { value: unknown; tone?: Tone; children: React.ReactNode }) {
  return <span key={`${String(value)}|${t ?? ""}`} className={`inline-block ${LOUD.has(t) ? "dsviz-pop" : ""}`}>{children}</span>;
}

// ---------------------------------------------------------------- panels
const W = 48;
function ArrayView({ panel }: { panel: ArrayPanel }) {
  const { items, tones = {}, markers = [], ranges = [], indices = true, bars, ids } = panel;
  if (!items.length) return <p className="dsviz-fade rounded-lg border border-dashed border-[#34463e] px-4 py-3 text-sm text-[#7f958b]">{panel.empty ?? "empty"}</p>;
  const max = Math.max(1, ...items.map(item => (typeof item === "number" ? Math.abs(item) : 0)));
  // With ids, every cell is absolutely positioned and keyed by id, so it slides when its index changes.
  const keyed = ids && ids.length === items.length && new Set(ids).size === ids.length;
  const order = items.map((item, i) => ({ item, i, key: keyed ? `id:${ids![i]}` : `i:${i}` }));
  const sorted = keyed ? [...order].sort((a, b) => String(a.key).localeCompare(String(b.key))) : order; // stable DOM order => no remounts
  return <div className="overflow-x-auto pb-1">
    <div className="relative inline-block" style={{ minWidth: items.length * W }}>
      {ranges.length > 0 && <div className="relative mb-1" style={{ height: ranges.length * 18 }}>{ranges.map((range, i) => range.to >= range.from && <div key={i} className="dsviz-move absolute flex items-end" style={{ left: range.from * W + 4, width: (range.to - range.from + 1) * W - 8, top: i * 18, height: 16, transition: "left .45s, width .45s" }}><div className="h-2 w-full rounded-t border-x-2 border-t-2" style={{ borderColor: tone(range.tone ?? "compare").stroke }} />{range.label && <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#141e23] px-1 text-[10px] font-semibold" style={{ color: tone(range.tone ?? "compare").stroke }}>{range.label}</span>}</div>)}</div>}
      {bars && <div className="relative" style={{ height: 120, width: items.length * W }}>{sorted.map(({ item, i, key }) => <div key={key} className="dsviz-move absolute bottom-0 flex justify-center" style={{ left: i * W, width: W }}><div className={`w-8 rounded-t border transition-all duration-300 ${tone(tones[i]).cell}`} style={{ height: typeof item === "number" ? 8 + (Math.abs(item) / max) * 108 : 8 }} /></div>)}</div>}
      <div className="relative h-11" style={{ width: items.length * W }}>{sorted.map(({ item, i, key }) => <div key={key} className={`${keyed ? "dsviz-move" : ""} absolute top-0 px-[2px]`} style={{ left: i * W, width: W, zIndex: LOUD.has(tones[i]) ? 2 : 1 }}><div className={`flex h-11 items-center justify-center rounded-md border-2 font-mono text-sm font-semibold ${colourTransition} ${tone(tones[i]).cell}`}><Pop value={item} tone={tones[i]}>{item === null ? "" : String(item)}</Pop></div></div>)}</div>
      {indices && <div className="flex">{items.map((_, i) => <div key={i} className="pt-1 text-center font-mono text-[10px] text-[#6c8379]" style={{ width: W }}>{i}</div>)}</div>}
      {markers.length > 0 && <div className="relative h-8" style={{ width: items.length * W }}>{markers.filter(marker => marker.at >= 0 && marker.at < items.length).map(marker => { const stack = markers.filter((other, j) => other.at === marker.at && j < markers.indexOf(marker)).length; return <div key={marker.label} className="dsviz-move absolute flex flex-col items-center" style={{ left: marker.at * W, width: W, top: stack * 13 }}>{stack === 0 && <span className="text-xs leading-none" style={{ color: marker.tone ? tone(marker.tone).stroke : "#c9f27b" }}>▲</span>}<span className="whitespace-nowrap font-mono text-[11px] font-semibold leading-[13px]" style={{ color: marker.tone ? tone(marker.tone).stroke : "#c9f27b" }}>{marker.label}</span></div>; })}</div>}
      {markers.some(marker => marker.at >= items.length || marker.at < 0) && <p className="mt-1 font-mono text-[11px] text-[#9fb5aa]">{markers.filter(marker => marker.at >= items.length || marker.at < 0).map(marker => `${marker.label} = ${marker.at} (outside)`).join(" · ")}</p>}
    </div>
  </div>;
}

function StackView({ panel }: { panel: StackPanel }) {
  const { items, tones = {} } = panel;
  return <div className="inline-flex flex-col items-stretch">
    {!items.length && <p className="dsviz-fade rounded-lg border border-dashed border-[#34463e] px-6 py-3 text-sm text-[#7f958b]">{panel.empty ?? "empty"}</p>}
    {/* Keyed by position from the bottom: a push mounts a new top element, which drops in. */}
    {items.map((item, i) => [item, i] as const).reverse().map(([item, i], position) => <div key={i} className="dsviz-enter flex items-center gap-2"><div className={`min-w-[96px] rounded-md border-2 px-3 py-1.5 text-center font-mono text-sm font-semibold ${colourTransition} ${tone(tones[i]).cell}`}><Pop value={item} tone={tones[i]}>{String(item)}</Pop></div><span className="w-12 text-[11px] font-semibold text-[#c9f27b]">{position === 0 ? "← top" : ""}</span></div>)}
    {items.length > 0 && <div className="mt-1 h-1 w-[96px] rounded bg-[#4a6466]" />}
  </div>;
}

function LinkedView({ panel }: { panel: LinkedPanel }) {
  const { nodes, doubly, markers = [], showNone = true } = panel;
  if (!nodes.length) return <span className="dsviz-fade inline-block rounded-md border border-dashed border-[#34463e] px-3 py-2 font-mono text-sm text-[#7f958b]">None (empty list)</span>;
  // Fixed-width slots so nodes with ids can slide between them.
  const node = Math.max(48, ...nodes.map(n => n.label.length * 9 + 22));
  const gap = 30, slot = node + gap;
  const keyed = nodes.every(n => n.id) && new Set(nodes.map(n => n.id)).size === nodes.length;
  const order = nodes.map((n, i) => ({ n, i, key: keyed ? `id:${n.id}` : `i:${i}` }));
  const sorted = keyed ? [...order].sort((a, b) => a.key.localeCompare(b.key)) : order;
  const width = nodes.length * slot + (showNone ? 40 : 0);
  return <div className="overflow-x-auto pb-1"><div className="relative" style={{ width, height: 44 + 16 + (markers.length ? 16 : 0) }}>
    {nodes.map((_, i) => (i < nodes.length - 1 || showNone) && <span key={`arrow${i}`} className="absolute flex h-11 items-center justify-center text-lg text-[#7fa494]" style={{ left: i * slot + node, width: gap }}>{doubly && i < nodes.length - 1 ? "⇄" : "→"}</span>)}
    {showNone && <span className="absolute flex h-11 items-center font-mono text-xs text-[#6c8379]" style={{ left: nodes.length * slot }}>None</span>}
    {sorted.map(({ n, i, key }) => <div key={key} className={`${keyed ? "dsviz-move" : ""} absolute top-0 flex flex-col items-center`} style={{ left: i * slot, width: node, zIndex: LOUD.has(n.tone) ? 2 : 1 }}>
      <div className={`flex h-11 w-full items-center justify-center rounded-md border-2 px-1 font-mono text-sm font-semibold ${colourTransition} ${tone(n.tone).cell}`}><Pop value={n.label} tone={n.tone}>{n.label}</Pop></div>
      {n.sub && <span className="mt-0.5 font-mono text-[10px] text-[#8da99a]">{n.sub}</span>}
    </div>)}
    {markers.filter(m => m.at >= 0 && m.at < nodes.length).map(marker => { const above = markers.filter(other => other.at === marker.at && markers.indexOf(other) < markers.indexOf(marker)).length; return <span key={marker.label} className="dsviz-move absolute whitespace-nowrap text-center font-mono text-[11px] font-semibold" style={{ left: marker.at * slot, width: node, top: 48 + (nodes[marker.at]?.sub ? 14 : 0) + above * 13, color: marker.tone ? tone(marker.tone).stroke : "#c9f27b" }}>▲ {marker.label}</span>; })}
  </div></div>;
}

function BucketsView({ panel }: { panel: BucketsPanel }) {
  const { buckets, tones = {}, mode = "chain" } = panel;
  if (mode === "slots") return <ArrayView panel={{ type: "array", items: buckets.map(bucket => bucket[0]?.label ?? null), tones: Object.fromEntries(buckets.map((bucket, i) => [i, tones[i] ?? bucket[0]?.tone ?? (bucket.length ? "default" : "muted")])) }} />;
  return <div className="space-y-1.5">{buckets.map((bucket, i) => <div key={i} className="flex items-center gap-1.5">
    <div className={`flex h-9 w-14 shrink-0 items-center justify-center rounded-md border-2 font-mono text-xs font-semibold ${colourTransition} ${tone(tones[i]).cell}`}>[{i}]</div>
    {bucket.map(entry => <Fragment key={entry.label}><span className="dsviz-fade text-[#7fa494]">→</span><div className={`dsviz-enter flex h-9 items-center rounded-md border-2 px-2.5 font-mono text-xs font-semibold ${colourTransition} ${tone(entry.tone).cell}`}><Pop value={entry.label} tone={entry.tone}>{entry.label}</Pop></div></Fragment>)}
    {!bucket.length && <span className="font-mono text-[11px] text-[#5d6f6a]">empty</span>}
  </div>)}</div>;
}

type Placed = { node: TreeNode; id: string; parent?: string; x: number; y: number };
/** Lay a tree out in grid units and give every node a stable id (its own id, else its path from the root). */
function layoutTree(root: TreeNode, binary: boolean): Placed[] {
  const placed: Placed[] = [];
  const used = new Set<string>();
  const idOf = (node: TreeNode, path: string) => {
    let id = node.id ?? `@${path}`;
    for (let n = 1; used.has(id); n++) id = `${node.id ?? `@${path}`}~${n}`;
    used.add(id);
    return id;
  };
  let next = 0;
  if (binary) {
    // In-order x positions: everything in the left subtree sits left of the node, the right subtree right of it.
    const visit = (node: TreeNode | null, depth: number, path: string, parent?: string) => {
      if (!node) return;
      const entry: Placed = { node, id: idOf(node, path), parent, x: 0, y: depth };
      visit(node.children[0] ?? null, depth + 1, `${path}L`, entry.id);
      entry.x = next++;
      placed.push(entry);
      visit(node.children[1] ?? null, depth + 1, `${path}R`, entry.id);
    };
    visit(root, 0, "");
  } else {
    // Leaves take the next free column; a parent sits centred above its first and last child.
    const visit = (node: TreeNode, depth: number, path: string, parent?: string): Placed => {
      const entry: Placed = { node, id: idOf(node, path), parent, x: 0, y: depth };
      const kids = node.children.map((child, i) => (child ? visit(child, depth + 1, `${path}.${i}`, entry.id) : null)).filter((kid): kid is Placed => !!kid);
      entry.x = kids.length ? (kids[0].x + kids[kids.length - 1].x) / 2 : next++;
      placed.push(entry);
      return entry;
    };
    visit(root, 0, "");
  }
  return placed;
}

const DX = 54, DY = 66, R = 19, PAD = 28;
function TreeView({ panel }: { panel: TreePanel }) {
  const { root, binary = true } = panel;
  const placed = useMemo(() => (root ? layoutTree(root, binary) : []), [root, binary]);
  const targets = useMemo(() => Object.fromEntries(placed.map(p => [p.id, { x: p.x * DX + PAD, y: p.y * DY + PAD }])), [placed]);
  const pos = useTween(targets);
  if (!root) return <p className="dsviz-fade rounded-lg border border-dashed border-[#34463e] px-4 py-3 text-sm text-[#7f958b]">{panel.empty ?? "empty tree (root is None)"}</p>;
  const all = Object.values(pos);
  const width = Math.max(80, ...all.map(p => p.x + PAD));
  const height = Math.max(...all.map(p => p.y + PAD + 14));
  // Draw in a stable order (by id) so React keeps each node's elements while it moves.
  const nodes = [...placed].sort((a, b) => a.id.localeCompare(b.id));
  return <div className="overflow-x-auto"><svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label="tree diagram" className="block h-auto max-w-full" style={{ minWidth: Math.round(width * FIT_MIN_SCALE) }}>
    {nodes.filter(p => p.parent && pos[p.parent]).map(p => { const a = pos[p.parent!], b = pos[p.id]; const on = p.node.tone === "path" || p.node.tone === "found"; return <g key={`edge-${p.id}`}><line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={on ? TONE.path.stroke : "#4f6b6b"} strokeWidth={on ? 2.5 : 1.5} style={{ transition: "stroke .3s" }} />{p.node.edgeLabel && <text x={(a.x + b.x) / 2 + (b.x >= a.x ? 6 : -6)} y={(a.y + b.y) / 2} fill="#c9f27b" fontSize="11" fontFamily="monospace" textAnchor={b.x >= a.x ? "start" : "end"}>{p.node.edgeLabel}</text>}</g>; })}
    {nodes.map(p => { const t = tone(p.node.tone); const { x, y } = pos[p.id]; return <g key={p.id} className="dsviz-fade">
      {(p.node.tone === "active" || p.node.tone === "found") && <circle key={`ring-${p.node.tone}`} cx={x} cy={y} r={R} fill="none" stroke={t.stroke} strokeWidth={2}><animate attributeName="r" from={R} to={R + 10} dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from="0.8" to="0" dur="1.2s" repeatCount="indefinite" /></circle>}
      <circle cx={x} cy={y} r={R} fill={t.fill} stroke={t.stroke} strokeWidth={2} style={{ transition: "fill .3s, stroke .3s" }} />
      <text x={x} y={y + 4} textAnchor="middle" fill={t.text} fontSize={p.node.label.length > 3 ? 10 : 13} fontWeight={600} fontFamily="monospace">{p.node.label}</text>
      {p.node.sub && <text x={x} y={y + R + 12} textAnchor="middle" fill="#8da99a" fontSize="10" fontFamily="monospace">{p.node.sub}</text>}
    </g>; })}
  </svg></div>;
}

function GraphView({ panel }: { panel: GraphPanel }) {
  const reduce = useReducedMotion();
  const S = 6.4, NR = 17;
  const nodes = new Map(panel.nodes.map(node => [node.id, node]));
  const pairs = new Set(panel.edges.map(edge => `${edge.from}->${edge.to}`));
  const width = Math.max(...panel.nodes.map(node => node.x)) * S + 40;
  const height = Math.max(...panel.nodes.map(node => node.y)) * S + 44;
  return <div className="overflow-x-auto"><svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label="graph diagram" className="block h-auto max-w-full" style={{ minWidth: Math.round(width * FIT_MIN_SCALE) }}>
    <defs>{(Object.keys(EDGE) as Tone[]).map(key => <marker key={key} id={`arrow-${key}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill={EDGE[key]} /></marker>)}</defs>
    {panel.edges.map(edge => {
      const a = nodes.get(edge.from), b = nodes.get(edge.to);
      if (!a || !b) return null;
      let x1 = a.x * S + 20, y1 = a.y * S + 20, x2 = b.x * S + 20, y2 = b.y * S + 20;
      const len = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / len, uy = (y2 - y1) / len;
      // Two edges in opposite directions: shift each sideways so both stay visible.
      const shift = panel.directed && pairs.has(`${edge.to}->${edge.from}`) ? 5 : 0;
      x1 += ux * NR - uy * shift; y1 += uy * NR + ux * shift; x2 -= ux * (NR + (panel.directed ? 2 : 0)) + uy * shift; y2 -= uy * (NR + (panel.directed ? 2 : 0)) - ux * shift;
      const t = edge.tone ?? "default", strong = t !== "default" && t !== "muted";
      // Edges being examined right now get marching dashes; settled edges stay solid.
      const flowing = t === "compare" || t === "active" || t === "new";
      return <g key={`${edge.from}->${edge.to}`}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={EDGE[t]} strokeWidth={strong ? 3 : 1.6} markerEnd={panel.directed ? `url(#arrow-${t})` : undefined} className={flowing ? "dsviz-flow" : ""} style={{ transition: "stroke .3s, stroke-width .3s" }} />{edge.label && <g><rect x={(x1 + x2) / 2 - 3 - edge.label.length * 3.4 - uy * 9} y={(y1 + y2) / 2 - 8 + ux * 9} width={edge.label.length * 6.8 + 6} height={15} rx={3} fill="#0f171a" /><text x={(x1 + x2) / 2 - uy * 9} y={(y1 + y2) / 2 + 3 + ux * 9} textAnchor="middle" fill={strong ? EDGE[t] : "#b9cbbf"} fontSize="11" fontFamily="monospace" fontWeight={600}>{edge.label}</text></g>}</g>;
    })}
    {panel.nodes.map(node => { const t = tone(node.tone); const x = node.x * S + 20, y = node.y * S + 20; return <g key={node.id}>
      {!reduce && (node.tone === "active" || node.tone === "found") && <circle key={`ring-${node.tone}`} cx={x} cy={y} r={NR} fill="none" stroke={t.stroke} strokeWidth={2}><animate attributeName="r" from={NR} to={NR + 11} dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from="0.8" to="0" dur="1.2s" repeatCount="indefinite" /></circle>}
      <circle cx={x} cy={y} r={NR} fill={t.fill} stroke={t.stroke} strokeWidth={2} style={{ transition: "fill .3s, stroke .3s" }} />
      <text x={x} y={y + 4} textAnchor="middle" fill={t.text} fontSize="13" fontWeight={600} fontFamily="monospace">{node.label ?? node.id}</text>
      {node.sub && <text key={node.sub} x={x} y={y + NR + 13} textAnchor="middle" fill="#c9f27b" fontSize="11" fontWeight={600} fontFamily="monospace" className="dsviz-fade">{node.sub}</text>}
    </g>; })}
  </svg></div>;
}

function GridView({ panel }: { panel: GridPanel }) {
  const { cells, tones = {}, rowLabels, colLabels } = panel;
  return <div className="overflow-x-auto"><table className="border-separate border-spacing-[3px] font-mono text-xs">
    {colLabels && <thead><tr>{rowLabels && <th />}{colLabels.map((name, c) => <th key={c} className="px-1 pb-1 text-center font-semibold text-[#8da99a]">{name}</th>)}</tr></thead>}
    <tbody>{cells.map((row, r) => <tr key={r}>{rowLabels && <th className="whitespace-nowrap pr-2 text-right font-semibold text-[#8da99a]">{rowLabels[r]}</th>}{row.map((cell, c) => { const t = tones[`${r},${c}`]; return <td key={c} className={`h-9 min-w-[38px] rounded-md border-2 px-1.5 text-center font-semibold ${colourTransition} ${tone(t).cell}`}><Pop value={cell} tone={t}>{cell === null ? "" : String(cell)}</Pop></td>; })}</tr>)}</tbody>
  </table></div>;
}

function VarsView({ panel }: { panel: VarsPanel }) {
  return <div className="flex flex-wrap gap-2">{Object.entries(panel.values).map(([name, value]) => <span key={name} className="rounded-md border border-[#34463e] bg-[#0f191b] px-2.5 py-1 font-mono text-xs text-[#bcd0c4]"><span className="text-[#8db8d6]">{name}</span> = <span key={String(value)} className="dsviz-pop inline-block font-semibold text-[#e9f5d8]">{value === null ? "None" : String(value)}</span></span>)}</div>;
}

function TextView({ panel }: { panel: TextPanel }) {
  return <div className={`rounded-lg border border-[#2b3c37] bg-[#0e1718] px-3 py-2 text-xs leading-6 text-[#c7d8ce] ${panel.mono === false ? "" : "font-mono"}`}>{panel.lines.length ? panel.lines.map((line, i) => <div key={`${i}:${line}`} className="dsviz-fade whitespace-pre-wrap">{line}</div>) : <span className="text-[#6c8379]">(nothing yet)</span>}</div>;
}

export function PanelView({ panel }: { panel: Panel }) {
  const body = (() => {
    switch (panel.type) {
      case "array": return <ArrayView panel={panel} />;
      case "stack": return <StackView panel={panel} />;
      case "linked": return <LinkedView panel={panel} />;
      case "buckets": return <BucketsView panel={panel} />;
      case "tree": return <TreeView panel={panel} />;
      case "graph": return <GraphView panel={panel} />;
      case "grid": return <GridView panel={panel} />;
      case "vars": return <VarsView panel={panel} />;
      case "text": return <TextView panel={panel} />;
    }
  })();
  const wide = (panel.type === "tree" && !panel.compact) || panel.type === "array" || panel.type === "linked" || panel.type === "graph" || panel.type === "grid" || panel.type === "buckets";
  return <div className={`min-w-0 ${wide ? "basis-full" : ""}`}>{panel.title && <p className={label}>{panel.title}</p>}{body}</div>;
}

// ---------------------------------------------------------------- legend
function usedTones(visual: Visual): Tone[] {
  const found = new Set<Tone>();
  const add = (value?: Tone) => { if (value && value !== "default") found.add(value); };
  const tree = (node: TreeNode | null) => { if (!node) return; add(node.tone); node.children.forEach(tree); };
  for (const step of visual.steps) for (const panel of step.panels) {
    if (panel.type === "array") { Object.values(panel.tones ?? {}).forEach(add); }
    else if (panel.type === "stack") Object.values(panel.tones ?? {}).forEach(add);
    else if (panel.type === "linked") panel.nodes.forEach(node => add(node.tone));
    else if (panel.type === "buckets") { Object.values(panel.tones ?? {}).forEach(add); panel.buckets.flat().forEach(entry => add(entry.tone)); }
    else if (panel.type === "tree") tree(panel.root);
    else if (panel.type === "graph") { panel.nodes.forEach(node => add(node.tone)); panel.edges.forEach(edge => add(edge.tone)); }
    else if (panel.type === "grid") Object.values(panel.tones ?? {}).forEach(add);
  }
  return (Object.keys(TONE) as Tone[]).filter(key => found.has(key));
}

// ---------------------------------------------------------------- player
const SPEEDS = [{ name: "Slow", ms: 2600 }, { name: "Normal", ms: 1600 }, { name: "Fast", ms: 800 }];

export function Visualizer({ visuals }: { visuals: Visual[] }) {
  const [tab, setTab] = useState(0);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const visual = visuals[Math.min(tab, visuals.length - 1)];
  const steps = visual.steps;
  const step = steps[Math.min(index, steps.length - 1)];
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!playing) return;
    if (index >= steps.length - 1) { setPlaying(false); return; }
    timer.current = setTimeout(() => setIndex(value => value + 1), SPEEDS[speed].ms);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [playing, index, steps.length, speed]);
  const tonesUsed = useMemo(() => usedTones(visual), [visual]);
  function choose(next: number) { setTab(next); setIndex(0); setPlaying(false); }
  function go(next: number) { setPlaying(false); setIndex(Math.max(0, Math.min(steps.length - 1, next))); }
  function onKey(event: React.KeyboardEvent) {
    if (event.target instanceof HTMLButtonElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLInputElement) return;
    if (event.key === "ArrowRight") { event.preventDefault(); go(index + 1); }
    else if (event.key === "ArrowLeft") { event.preventDefault(); go(index - 1); }
    else if (event.key === " ") { event.preventDefault(); if (index >= steps.length - 1) setIndex(0); setPlaying(value => !value); }
  }
  const button = "inline-flex items-center gap-1.5 rounded-lg border border-[#394d42] px-3 py-2 text-xs font-medium text-[#c2d3c5] hover:bg-[#22332b] disabled:opacity-35";
  return <section className="overflow-hidden rounded-2xl border border-[#35483b] bg-[#141e23]" aria-label="Step-by-step visualization" tabIndex={0} onKeyDown={onKey}>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#293c35] px-5 py-4">
      <div><h3 className="flex items-center gap-2 text-sm font-semibold text-[#e2eee4]"><Eye className="h-4 w-4 text-[#c9f27b]" />Watch it work, step by step</h3><p className="mt-0.5 text-xs text-[#879b94]">Use the buttons or ← → keys. Space plays and pauses.</p></div>
      {visuals.length > 1 && <div role="tablist" className="flex flex-wrap gap-1.5">{visuals.map((item, i) => <button key={item.title} role="tab" aria-selected={i === tab} onClick={() => choose(i)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${i === tab ? "bg-[#c9f27b] text-[#172418]" : "border border-[#394d42] text-[#c2d3c5] hover:bg-[#22332b]"}`}>{item.title}</button>)}</div>}
    </div>
    {visual.intro && <p className="border-b border-[#293c35] bg-[#17241e] px-5 py-3 text-sm leading-6 text-[#b4c6b7]">{visual.intro}</p>}
    <div className="px-5 pt-4">
      <div className="flex items-start gap-3 rounded-xl border border-[#3d5a3f] bg-[#1a2921] p-4"><span className="mt-0.5 shrink-0 rounded-md bg-[#c9f27b] px-2 py-0.5 font-mono text-[11px] font-bold text-[#172418]">{index + 1}/{steps.length}</span><p key={`${tab}-${index}`} aria-live="polite" className="dsviz-fade text-[15px] leading-7 text-[#e3eee4]">{step.caption}</p></div>
    </div>
    <div className="flex min-h-[180px] flex-wrap items-start gap-x-8 gap-y-5 px-5 py-5">{step.panels.map((panel, i) => <PanelView key={`${tab}-${i}-${panel.type}`} panel={panel} />)}</div>
    <div className="flex flex-wrap items-center gap-2 border-t border-[#293c35] px-5 py-3">
      <button onClick={() => go(0)} disabled={index === 0} className={button} aria-label="Restart"><RotateCcw className="h-3.5 w-3.5" /></button>
      <button onClick={() => go(index - 1)} disabled={index === 0} className={button}><ChevronLeft className="h-3.5 w-3.5" />Back</button>
      <button onClick={() => { if (index >= steps.length - 1) setIndex(0); setPlaying(value => !value); }} className="inline-flex items-center gap-1.5 rounded-lg bg-[#c9f27b] px-3.5 py-2 text-xs font-semibold text-[#172418] hover:bg-[#dcffa1]">{playing ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}{playing ? "Pause" : index >= steps.length - 1 ? "Replay" : "Play"}</button>
      <button onClick={() => go(index + 1)} disabled={index >= steps.length - 1} className={button}>Next<ChevronRight className="h-3.5 w-3.5" /></button>
      <input type="range" min={0} max={steps.length - 1} value={index} onChange={event => go(Number(event.target.value))} aria-label="Step" className="mx-2 min-w-[120px] flex-1 accent-[#c9f27b]" />
      <label className="flex items-center gap-1.5 text-xs text-[#8da99a]">Speed<select value={speed} onChange={event => setSpeed(Number(event.target.value))} className="rounded-md border border-[#34463e] bg-[#0d1718] px-2 py-1 text-xs text-[#e2ede5]">{SPEEDS.map((item, i) => <option key={item.name} value={i}>{item.name}</option>)}</select></label>
    </div>
    {tonesUsed.length > 0 && <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-[#293c35] bg-[#111a1e] px-5 py-3">{tonesUsed.map(key => <span key={key} className="flex items-center gap-1.5 text-[11px] text-[#9fb5aa]"><span className={`inline-block h-3 w-3 rounded-sm border-2 ${TONE[key].cell}`} />{visual.legend?.[key] ?? TONE[key].label}</span>)}</div>}
  </section>;
}
