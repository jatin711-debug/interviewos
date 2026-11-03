import type { DSACategory } from "./dsa/types";

// Python foundations lessons that support each DSA topic, most relevant first.
export const TOPIC_PYTHON_LESSONS: Partial<Record<DSACategory, string[]>> = {
  "Arrays & Hashing": ["maps-sets", "lists", "collections-toolkit"],
  "Prefix Sums": ["lists", "big-o"],
  "Two Pointers": ["lists", "patterns"],
  "Sliding Window": ["collections-toolkit", "maps-sets"],
  "Stack & Monotonic Queue": ["lists", "collections-toolkit"],
  "Sorting": ["sorting", "recursion"],
  "Binary Search": ["sorting", "patterns"],
  "Linked List": ["classes-dataclasses", "mutability-copy"],
  "Trees & BST": ["recursion", "classes-dataclasses"],
  "Tries": ["maps-sets", "classes-dataclasses"],
  "Heaps & Priority Queues": ["heapq"],
  "Backtracking & Recursion": ["recursion", "mutability-copy"],
  "Graphs & Shortest Path": ["collections-toolkit", "heapq"],
  "Advanced Graphs": ["heapq", "sorting"],
  "Union Find": ["lists", "big-o"],
  "1D Dynamic Programming": ["caching", "recursion"],
  "2D Dynamic Programming": ["caching", "lists"],
  "Greedy Algorithms": ["sorting", "heapq"],
  "Intervals & Sweepline": ["sorting", "heapq"],
  "Bit Manipulation": ["values"],
  "Math & Number Theory": ["values", "big-o"],
  "Math & Geometry": ["lists", "comprehensions"],
  "Segment & Fenwick Trees": ["lists", "big-o", "values"],
  "String Algorithms": ["strings", "lists", "maps-sets"],
  "Advanced DP": ["caching", "recursion", "values"],
};

export function topicsForLesson(lessonId: string): DSACategory[] {
  return (Object.entries(TOPIC_PYTHON_LESSONS) as [DSACategory, string[]][])
    .filter(([, lessons]) => lessons.includes(lessonId))
    .map(([topic]) => topic);
}
