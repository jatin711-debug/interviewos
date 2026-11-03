import type { ArrayPanel, GraphEdge, GraphNode, GraphPanel, Panel, Step, Tone, TreeNode, Visual } from "./types";

/** Collects steps while a trace function runs the algorithm. */
export class Recorder {
  steps: Step[] = [];
  step(caption: string, ...panels: Panel[]): void {
    // Deep-copy so later mutations by the trace never change an earlier snapshot.
    this.steps.push({ caption, panels: JSON.parse(JSON.stringify(panels)) });
  }
  visual(title: string, intro?: string, legend?: Visual["legend"]): Visual {
    return { title, intro, legend, steps: this.steps };
  }
}

/** Build a tone map: tones([1, 2], "compare", [0], "done") -> {1: compare, 2: compare, 0: done}. Later entries win. */
export function tones(...pairs: (number[] | Tone)[]): Record<number, Tone> {
  const out: Record<number, Tone> = {};
  for (let i = 0; i + 1 < pairs.length; i += 2) {
    const indexes = pairs[i] as number[];
    const tone = pairs[i + 1] as Tone;
    for (const index of indexes) out[index] = tone;
  }
  return out;
}

/** Indexes from `from` to `to` inclusive (empty when from > to). */
export function span(from: number, to: number): number[] {
  const out: number[] = [];
  for (let i = from; i <= to; i++) out.push(i);
  return out;
}

export function array(items: (string | number | null)[], extra: Omit<ArrayPanel, "type" | "items"> = {}): ArrayPanel {
  return { type: "array", items: [...items], ...extra };
}

export function vars(values: Record<string, string | number | boolean | null>, title = "Variables"): Panel {
  return { type: "vars", title, values };
}

export function text(lines: string[], title?: string, mono = true): Panel {
  return { type: "text", title, lines: [...lines], mono };
}

/** A simple binary-tree node used by tree traces. */
export interface BNode { value: number | string; left: BNode | null; right: BNode | null; tone?: Tone; sub?: string }

export function bnode(value: number | string, left: BNode | null = null, right: BNode | null = null): BNode {
  return { value, left, right };
}

/** Convert a binary tree to the panel format, colouring nodes with `toneOf`. */
export function toTree(root: BNode | null, toneOf: (node: BNode) => Tone | undefined = node => node.tone, subOf: (node: BNode) => string | undefined = node => node.sub): TreeNode | null {
  if (!root) return null;
  const left = toTree(root.left, toneOf, subOf);
  const right = toTree(root.right, toneOf, subOf);
  // The value is the node's identity, so a node that moves (rotation, swap) glides to its new spot.
  return { label: String(root.value), id: String(root.value), tone: toneOf(root), sub: subOf(root), children: left || right ? [left, right] : [] };
}

/** Build a heap-shaped binary tree from an array (children of i are 2i+1 and 2i+2). */
export function heapTree(items: (number | string)[], toneOf: (index: number) => Tone | undefined = () => undefined): TreeNode | null {
  const build = (i: number): TreeNode | null => {
    if (i >= items.length) return null;
    const left = build(2 * i + 1);
    const right = build(2 * i + 2);
    return { label: String(items[i]), id: String(items[i]), sub: `[${i}]`, tone: toneOf(i), children: left || right ? [left, right] : [] };
  };
  return build(0);
}

/** A reusable graph layout: positions plus edges, with per-step colours. */
export class GraphView {
  nodes: Omit<GraphNode, "tone">[];
  edges: Omit<GraphEdge, "tone">[];
  directed: boolean;
  constructor(nodes: Omit<GraphNode, "tone">[], edges: Omit<GraphEdge, "tone">[], directed = false) {
    this.nodes = nodes;
    this.edges = edges;
    this.directed = directed;
  }
  panel(nodeTones: Record<string, Tone> = {}, edgeTones: Record<string, Tone> = {}, extra: { title?: string; subs?: Record<string, string>; labels?: Record<string, string> } = {}): GraphPanel {
    const key = (edge: Omit<GraphEdge, "tone">) => `${edge.from}-${edge.to}`;
    return {
      type: "graph",
      title: extra.title,
      directed: this.directed,
      nodes: this.nodes.map(node => ({ ...node, tone: nodeTones[node.id], sub: extra.subs?.[node.id] ?? node.sub })),
      edges: this.edges.map(edge => ({ ...edge, label: extra.labels?.[key(edge)] ?? edge.label, tone: edgeTones[key(edge)] ?? (this.directed ? undefined : edgeTones[`${edge.to}-${edge.from}`]) })),
    };
  }
}

/** Format a number for display; Infinity becomes "∞". */
export function fmt(value: number): string {
  return value === Infinity ? "∞" : value === -Infinity ? "-∞" : String(value);
}
