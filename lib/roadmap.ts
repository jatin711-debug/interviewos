export type RoadmapBlock = { topic: string; detail: string; href: string; weight: number };
export type ScheduledBlock = RoadmapBlock & { start: Date; end: Date; state: "done" | "current" | "upcoming" };

// Weights are relative; the plan stretches or compresses to fit the time until the target date.
export const ROADMAP: RoadmapBlock[] = [
  { topic: "Python foundations", detail: "Core Python, collections, complexity, recursion, testing", href: "/python-course", weight: 1.5 },
  { topic: "DSA foundations", detail: "Arrays, hashing, prefix sums, two pointers, sliding window, stacks", href: "/dsa?view=path", weight: 2 },
  { topic: "Searching & sorting", detail: "Binary search, sorting, linked lists", href: "/dsa?topic=Binary%20Search", weight: 2 },
  { topic: "Non-linear structures", detail: "Trees, BSTs, tries, heaps", href: "/dsa?topic=Trees%20%26%20BST", weight: 2 },
  { topic: "Graphs", detail: "BFS, DFS, shortest paths, union-find", href: "/dsa?topic=Graphs%20%26%20Shortest%20Path", weight: 2 },
  { topic: "Dynamic programming", detail: "1D and 2D DP, knapsack, subsequences", href: "/dsa?topic=1D%20Dynamic%20Programming", weight: 2 },
  { topic: "Low-level design", detail: "SOLID, design patterns, concurrency", href: "/lld", weight: 2 },
  { topic: "System design", detail: "Distributed systems, case studies, architecture", href: "/hld", weight: 2 },
  { topic: "Database internals", detail: "Transactions, storage engines, WAL", href: "/databases", weight: 1.5 },
  { topic: "Interview practice", detail: "Mock interviews and STAR stories", href: "/grill-me", weight: 2 },
];

const DAY_MS = 86_400_000;

function localMidnight(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Parses a local YYYY-MM-DD key. */
function fromDateKey(key: string | undefined): Date | null {
  const match = key?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
}

/** The target is stored as a UTC midnight timestamp; treat it as a calendar date. */
function targetDay(targetIso: string): Date | null {
  const time = Date.parse(targetIso);
  if (Number.isNaN(time)) return null;
  const date = new Date(time);
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Lays the roadmap between the plan start (first activity, or today) and the target date. */
export function buildRoadmap(planStart: string | undefined, targetIso: string, now: Date): { blocks: ScheduledBlock[]; weeks: number; start: Date; target: Date } {
  const today = localMidnight(now);
  const start = fromDateKey(planStart) ?? today;
  const target = targetDay(targetIso) ?? addDays(start, 18 * 7);
  const totalDays = Math.max(ROADMAP.length, Math.round((target.getTime() - start.getTime()) / DAY_MS));
  const totalWeight = ROADMAP.reduce((sum, block) => sum + block.weight, 0);
  let cumulative = 0;
  const offsets = ROADMAP.map(block => {
    const offset = Math.round(totalDays * cumulative / totalWeight);
    cumulative += block.weight;
    return offset;
  });
  const blocks = ROADMAP.map((block, index) => {
    const blockStart = addDays(start, offsets[index]);
    const blockEnd = addDays(start, (offsets[index + 1] ?? totalDays) - 1);
    const state: ScheduledBlock["state"] = today > blockEnd ? "done" : today >= blockStart ? "current" : "upcoming";
    return { ...block, start: blockStart, end: blockEnd, state };
  });
  return { blocks, weeks: Math.max(1, Math.round(totalDays / 7)), start, target };
}
