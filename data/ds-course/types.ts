import type { DSACategory } from "../dsa/types";
import type { LessonChallenge } from "../python-course";

/**
 * structure  - a data structure implemented as a class (container protocol, iterators, __repr__).
 * algorithm  - one or more pure functions (often generators) with stated invariants.
 * technique  - a reusable problem-solving pattern shown as small functions.
 * concept    - background that supports the others (design rules, analysis).
 */
export type DsLessonKind = "structure" | "algorithm" | "technique" | "concept";

export interface DsComplexityRow {
  operation: string;
  /** e.g. "O(1) amortized", "O(log n)", "O(n) worst case". Say amortized / expected / worst case when it matters. */
  time: string;
  note?: string;
}

export interface DsLesson {
  id: string;
  title: string;
  kind: DsLessonKind;
  /** One or two sentences: what it is and why it matters. */
  summary: string;
  /** The ideas to understand before reading the code (3-5 items, each 1-3 sentences). */
  concepts: string[];
  /** One row per important operation. */
  complexity: DsComplexityRow[];
  /** Space used, including auxiliary / recursion-stack space. */
  space: string;
  /** Idiomatic, runnable Python: the implementation plus a short demo under `if __name__ == "__main__":`. */
  code: string;
  /** Exact stdout of `code` (compared after trimming). Must be deterministic. */
  output: string;
  /** The Pythonic design choices visible in `code`, and why (3-6 items). */
  bestPractices: string[];
  /** Common mistakes and interview traps (2-4 items). */
  pitfalls: string[];
  /** Problem signals that point to this structure/algorithm (2-4 items). */
  useWhen: string[];
  /** What to use in production instead of hand-rolling it (standard library, usually), and when hand-rolling is right. */
  inPractice: string;
  /** Auto-graded exercise, run in browser Python (Pyodide) by lib/python-challenge.ts. */
  challenge: LessonChallenge;
  /** DSA practice topics to continue with. */
  practice: DSACategory[];
  /** Reference link (docs.python.org for the standard library, otherwise a stable article). */
  source: string;
}

export interface DsModule {
  id: string;
  title: string;
  description: string;
  lessons: DsLesson[];
}

/**
 * The beginner-first "learn it" layer shown before the polished implementation.
 * Lives in data/ds-course/guides/*.ts, keyed by lesson id. See guides/README.md.
 */
export interface DsGuide {
  /** How hard the lesson is for someone who knows basic Python. */
  level: "Beginner" | "Intermediate" | "Advanced";
  /** A real-world picture of the idea, 2-4 sentences. */
  analogy: string;
  /** The idea in plain English, as short paragraphs (3-6). Define every term the first time it appears. */
  explain: string[];
  /** The smallest clear version of the idea: plain functions/classes, no typing generics or dunder tricks, lots of comments. */
  simpleCode: string;
  /** Exact stdout of simpleCode. */
  simpleOutput: string;
  /** "How the code works": one bullet per important part of simpleCode, in reading order. */
  codeNotes: string[];
  /** What to remember, 3-5 short bullets. */
  takeaways: string[];
}

/** Explains a lesson challenge's solution; see data/ds-course/guides/solutions.ts. */
export interface DsSolutionGuide {
  /** How the solution works, in reading order (3-5 bullets; `code` spans are rendered). */
  notes: string[];
  /** A simpler solution shown instead of the polished reference. Must pass every check. */
  code?: string;
}
