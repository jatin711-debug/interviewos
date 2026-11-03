import { ADVANCED_MODULE } from "./advanced";
import { FOUNDATIONS_MODULE } from "./foundations";
import { GRAPHS_MODULE } from "./graphs";
import { HASHING_MODULE } from "./hashing";
import { LINEAR_MODULE } from "./linear";
import { PARADIGMS_MODULE } from "./paradigms";
import { RANGE_QUERIES_MODULE } from "./range-queries";
import { SORTING_SEARCHING_MODULE } from "./sorting-searching";
import { TECHNIQUES_MODULE } from "./techniques";
import { TREES_MODULE } from "./trees";
import { SUPPLEMENTAL_MODULE } from "./supplemental";
import { MISSING_MODULE } from "./missing";
import type { DsLesson, DsModule } from "./types";

export type { DsComplexityRow, DsLesson, DsLessonKind, DsModule } from "./types";

// Reading order: build the Python habits, then structures, then algorithms, then techniques.
const extra = (...ids: string[]) => ids.map(id => {
  const item = [...SUPPLEMENTAL_MODULE.lessons, ...MISSING_MODULE.lessons].find(lesson => lesson.id === id);
  if (!item) throw new Error(`Course lesson not found: ${id}`);
  return item;
});
export const DS_COURSE: DsModule[] = [
  FOUNDATIONS_MODULE,
  { ...LINEAR_MODULE, lessons: [...LINEAR_MODULE.lessons.slice(0, 2), ...extra("doubly-linked-list"), ...LINEAR_MODULE.lessons.slice(2), ...extra("queue")] },
  HASHING_MODULE,
  { ...TREES_MODULE, lessons: extra("binary-tree", "bst", "avl-tree", "heap", "trie") },
  { ...RANGE_QUERIES_MODULE, lessons: extra("fenwick-tree", "segment-tree", "sparse-table") },
  { ...GRAPHS_MODULE, lessons: [...GRAPHS_MODULE.lessons, ...extra("minimum-spanning-tree", "scc-bridges")] },
  SORTING_SEARCHING_MODULE,
  { ...PARADIGMS_MODULE, lessons: [...PARADIGMS_MODULE.lessons, ...extra("greedy")] },
  { ...TECHNIQUES_MODULE, lessons: [...TECHNIQUES_MODULE.lessons, ...extra("intervals-sweep", "bit-manipulation", "number-theory", "string-matching")] },
  ADVANCED_MODULE,
].filter(module => module.lessons.length > 0);

export const DS_LESSONS: DsLesson[] = DS_COURSE.flatMap(module => module.lessons);
