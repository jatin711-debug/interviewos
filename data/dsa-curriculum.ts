import type { DSACategory, DSAProblem } from "./dsa";
import type { ProblemProgress } from "@/lib/storage";

export interface LearningStage {
  title: string;
  subtitle: string;
  categories: DSACategory[];
  /** "core": what mid-level coding rounds usually cover. "stretch": worth it once the core feels solid. */
  focus: "core" | "stretch";
}

export const LEARNING_STAGES: LearningStage[] = [
  { title: "01 · Build the foundations", subtitle: "Get comfortable with common operations, invariants, and linear scans.", categories: ["Arrays & Hashing", "Prefix Sums", "Two Pointers", "Sliding Window", "Stack & Monotonic Queue"], focus: "core" },
  { title: "02 · Work with structure", subtitle: "Use ordering and the right data structure to reduce work.", categories: ["Sorting", "Binary Search", "Linked List", "Trees & BST", "Tries", "Heaps & Priority Queues"], focus: "core" },
  { title: "03 · Explore possibilities", subtitle: "Model state, traverse connections, and track components.", categories: ["Backtracking & Recursion", "Graphs & Shortest Path", "Union Find", "Advanced Graphs"], focus: "core" },
  { title: "04 · Optimize decisions", subtitle: "Reuse subproblems and reason about local choices.", categories: ["1D Dynamic Programming", "2D Dynamic Programming", "Greedy Algorithms", "Intervals & Sweepline"], focus: "core" },
  { title: "05 · Round out your toolkit", subtitle: "Practice the mathematical tools behind efficient solutions.", categories: ["Bit Manipulation", "Math & Number Theory", "Math & Geometry"], focus: "stretch" },
  { title: "06 · Advanced techniques", subtitle: "Specialized structures and richer state designs for the hardest rounds.", categories: ["Segment & Fenwick Trees", "String Algorithms", "Advanced DP"], focus: "stretch" },
];

export const TOPIC_GUIDES: Record<DSACategory, { summary: string; learn: string; checkpoint: string }> = {
  "Arrays & Hashing": { summary: "Use indexing, sets, and maps to trade space for fast lookups.", learn: "Array traversal · hash maps · frequency counts · collision-aware complexity", checkpoint: "Explain why a hash lookup is O(1) on average and how duplicates affect your approach." },
  "Prefix Sums": { summary: "Precompute cumulative information to answer range and subarray questions.", learn: "Running totals · range sums · prefix frequencies · negative numbers", checkpoint: "Explain why prefix[j] − prefix[i] gives the sum between two boundaries." },
  "Two Pointers": { summary: "Move coordinated pointers to avoid redundant comparisons.", learn: "Opposing pointers · same-direction pointers · sorted input · invariants", checkpoint: "State what can safely be discarded whenever a pointer moves." },
  "Sliding Window": { summary: "Maintain a contiguous window as its boundaries move.", learn: "Fixed and variable windows · frequency maps · shrinking conditions", checkpoint: "Describe when the window is valid and when it must shrink." },
  "Stack & Monotonic Queue": { summary: "Track nested structure and useful candidates in order.", learn: "LIFO · balanced delimiters · monotonic stacks · next greater element", checkpoint: "Explain what each stack entry represents and when it is removed." },
  "Sorting": { summary: "Use ordering, partitioning, and divide-and-conquer to simplify problems.", learn: "Merge sort · partitioning · stability · time and space trade-offs", checkpoint: "Compare merge sort with in-place partitioning and explain their costs." },
  "Binary Search": { summary: "Halve a monotonic search space while preserving the answer.", learn: "Bounds · loop invariants · answer-space search · rotated arrays", checkpoint: "Define the search interval and prove it shrinks on every iteration." },
  "Linked List": { summary: "Manipulate node references without losing the rest of the list.", learn: "Pointer rewiring · dummy nodes · fast/slow pointers · caches", checkpoint: "Draw the pointer changes before writing an in-place reversal." },
  "Trees & BST": { summary: "Break a tree into subtrees and combine their results.", learn: "DFS · BFS · recursion · BST ordering · tree invariants", checkpoint: "Identify the base case and what each recursive call returns." },
  "Tries": { summary: "Represent shared prefixes so searches can reuse common paths.", learn: "Prefix trees · word termination · trie traversal · pruning", checkpoint: "Distinguish a valid prefix from a complete stored word." },
  "Heaps & Priority Queues": { summary: "Keep the next best candidate available efficiently.", learn: "Min/max heaps · top-k · streaming values · scheduling", checkpoint: "Explain what the heap contains and why its top is useful." },
  "Backtracking & Recursion": { summary: "Explore choices, undo them, and prune impossible paths.", learn: "Decision trees · choose/explore/undo · pruning · recursion depth", checkpoint: "Define a state, its choices, and the condition that produces an answer." },
  "Graphs & Shortest Path": { summary: "Model relationships and traverse reachable states.", learn: "Adjacency lists · BFS/DFS · topological sort · weighted shortest paths", checkpoint: "Choose BFS, DFS, or a weighted shortest-path algorithm and justify it." },
  "Advanced Graphs": { summary: "Solve weighted connectivity, constrained paths, and graph ordering problems.", learn: "Minimum spanning trees · Bellman-Ford · constrained shortest paths · topological ordering", checkpoint: "Explain why the chosen graph algorithm handles the edge weights and constraints." },
  "Union Find": { summary: "Maintain connected components as undirected edges are added.", learn: "Disjoint sets · path compression · union by size · cycle detection", checkpoint: "Explain why only joining different roots changes the component count." },
  "1D Dynamic Programming": { summary: "Build an answer from overlapping smaller states.", learn: "State definition · transitions · base cases · space optimization", checkpoint: "Write the recurrence in words before implementing it." },
  "2D Dynamic Programming": { summary: "Track state across two dimensions or sequences.", learn: "Grid states · subsequences · edit distance · dependency order", checkpoint: "Explain what a table cell represents and which cells it depends on." },
  "Greedy Algorithms": { summary: "Make a local choice only when it can be shown to preserve an optimal answer.", learn: "Exchange arguments · reachability · interval choices · invariants", checkpoint: "Give a reason the greedy choice cannot make an optimal solution worse." },
  "Intervals & Sweepline": { summary: "Sort endpoints and reason about overlap over time.", learn: "Interval sorting · merging · overlap · sweep line · heaps", checkpoint: "Clarify whether endpoints that touch count as overlapping." },
  "Bit Manipulation": { summary: "Use binary operations to represent and combine compact state.", learn: "AND/OR/XOR · shifts · masks · parity", checkpoint: "Explain why XOR cancels matching pairs and what its identity is." },
  "Math & Number Theory": { summary: "Use mathematical structure to avoid unnecessary iteration.", learn: "Euclidean algorithm · modular arithmetic · primes · exponentiation", checkpoint: "Trace the Euclidean algorithm and explain why it preserves the GCD." },
  "Math & Geometry": { summary: "Use coordinates, matrix transformations, and arithmetic invariants.", learn: "Grid traversal · rotation · geometry · integer operations", checkpoint: "Describe the coordinate transformation and verify the boundary cases." },
  "Segment & Fenwick Trees": { summary: "Answer range queries quickly while the underlying array keeps changing.", learn: "Fenwick trees · segment trees · coordinate compression · range updates", checkpoint: "Explain which range each tree node covers and why a query or update touches only O(log n) nodes." },
  "String Algorithms": { summary: "Reuse what earlier comparisons revealed to search and compare text in linear time.", learn: "KMP prefix function · Z-function · rolling hashes · palindromic centers", checkpoint: "Explain what a prefix-function value means and why the scan never moves backward in the text." },
  "Advanced DP": { summary: "Design richer states over subsets, intervals, and trees.", learn: "Bitmask DP · interval DP · tree DP · rerooting", checkpoint: "Name the state, justify the fill order, and estimate how many states there are." },
};

// Preserve progress from the original six-problem bank without changing stored data.
const LEGACY_IDS: Record<string, string> = {
  "two-sum": "dsa-1",
  "longest-substring-without-repeating-characters": "dsa-2",
  "trapping-rain-water": "dsa-3",
  "lru-cache": "dsa-4",
  "course-schedule": "dsa-5",
  "coin-change": "dsa-6",
};

export function problemProgress(problem: Pick<DSAProblem, "id" | "slug">, progress: Record<string, ProblemProgress>): ProblemProgress | undefined {
  return progress[problem.id] ?? progress[LEGACY_IDS[problem.slug]];
}
