/**
 * Data model for the step-by-step visualizer in the Data structures & algorithms course.
 *
 * A lesson has one or more `Visual`s (for example "Bubble sort" and "Insertion sort").
 * A visual is a list of `Step`s; each step is a caption in plain English plus the panels
 * (array, linked list, tree, graph, table, variables, ...) that show the state at that moment.
 * Steps are produced by small trace functions in `lib/ds-viz/traces/*` that run the algorithm
 * in TypeScript and record a snapshot after every interesting change.
 */

/** Colour role of a cell / node / edge. The legend in the visualizer explains each one. */
export type Tone = "default" | "active" | "compare" | "done" | "found" | "muted" | "new" | "removed" | "path";

/** A labelled arrow under an array cell or linked-list node, e.g. `lo`, `hi`, `head`. */
export interface Marker { at: number; label: string; tone?: Tone }

/** A highlighted span of array cells, e.g. the current window or the unsorted part. */
export interface Range { from: number; to: number; label?: string; tone?: Tone }

export interface ArrayPanel {
  type: "array";
  title?: string;
  items: (string | number | null)[];
  tones?: Record<number, Tone>;
  markers?: Marker[];
  ranges?: Range[];
  /** Show the index under each cell (default true). */
  indices?: boolean;
  /** Draw numbers as bars (good for sorting). */
  bars?: boolean;
  /**
   * A stable identity per cell (same length as items). When the same id sits at a different index in the
   * next step, the cell SLIDES there, so swaps and shifts are animated. Ids must be unique within the panel.
   */
  ids?: (string | number)[];
  /** Text shown in place of the cells when `items` is empty. */
  empty?: string;
}

/** A vertical stack; the last item is the top. */
export interface StackPanel {
  type: "stack";
  title?: string;
  items: (string | number)[];
  tones?: Record<number, Tone>;
  empty?: string;
}

/** `id` makes a node slide to its new position between steps (e.g. LRU move-to-front). */
export interface LinkedNode { label: string; sub?: string; tone?: Tone; id?: string }
export interface LinkedPanel {
  type: "linked";
  title?: string;
  nodes: LinkedNode[];
  doubly?: boolean;
  markers?: Marker[];
  /** Draw a trailing "None" after the last node (default true). */
  showNone?: boolean;
}

export interface Bucket { label: string; tone?: Tone }
export interface BucketsPanel {
  type: "buckets";
  title?: string;
  buckets: Bucket[][];
  /** Tone of the bucket slot itself (by bucket index). */
  tones?: Record<number, Tone>;
  /** "chain" draws each bucket as a short list; "slots" draws one cell per bucket (open addressing). */
  mode?: "chain" | "slots";
}

/** `id` lets a node glide to its new place between steps (rotations, heap swaps). Defaults to its path from the root. */
export interface TreeNode { label: string; sub?: string; tone?: Tone; edgeLabel?: string; id?: string; children: (TreeNode | null)[] }
export interface TreePanel {
  type: "tree";
  title?: string;
  root: TreeNode | null;
  /** Binary layout (in-order x positions, nulls keep left/right shape). Default true. */
  binary?: boolean;
  /** Sit next to other panels instead of taking a full row (for forests of small trees). */
  compact?: boolean;
  empty?: string;
}

export interface GraphNode { id: string; label?: string; sub?: string; x: number; y: number; tone?: Tone }
export interface GraphEdge { from: string; to: string; label?: string; tone?: Tone }
export interface GraphPanel {
  type: "graph";
  title?: string;
  directed?: boolean;
  /** Node coordinates are in a 0..100 x 0..60 box. */
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GridPanel {
  type: "grid";
  title?: string;
  cells: (string | number | null)[][];
  /** Keys are "row,col". */
  tones?: Record<string, Tone>;
  rowLabels?: string[];
  colLabels?: string[];
}

export interface VarsPanel { type: "vars"; title?: string; values: Record<string, string | number | boolean | null> }
export interface TextPanel { type: "text"; title?: string; lines: string[]; mono?: boolean }

export type Panel = ArrayPanel | StackPanel | LinkedPanel | BucketsPanel | TreePanel | GraphPanel | GridPanel | VarsPanel | TextPanel;

export interface Step {
  /** What just happened and why, in one or two plain sentences. */
  caption: string;
  panels: Panel[];
}

export interface Visual {
  title: string;
  /** One sentence shown above the player: what the example input is. */
  intro?: string;
  /** Override legend text for colours used in this visual, e.g. { active: "mid", muted: "discarded half" }. */
  legend?: Partial<Record<Tone, string>>;
  steps: Step[];
}

/** Lesson id -> builder for that lesson's visuals. Builders are pure and cheap. */
export type TraceRegistry = Record<string, () => Visual[]>;
