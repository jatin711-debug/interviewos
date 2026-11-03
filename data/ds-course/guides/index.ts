import type { DsGuide } from "../types";
export { DS_SOLUTIONS } from "./solutions";
import { TECHNIQUES_GUIDES } from "./techniques";
import { PARADIGMS_GUIDES } from "./paradigms";
import { SORTING_GUIDES } from "./sorting";
import { GRAPHS_GUIDES } from "./graphs";
import { RANGE_GUIDES } from "./range";
import { TREES_GUIDES } from "./trees";
import { FOUNDATIONS_GUIDES } from "./foundations";
import { LINEAR_GUIDES } from "./linear";
import { HASHING_GUIDES } from "./hashing";

/** Lesson id -> beginner guide. Lessons without one fall back to the original layout. */
export const DS_GUIDES: Record<string, DsGuide> = {
  ...TECHNIQUES_GUIDES,
  ...PARADIGMS_GUIDES,
  ...SORTING_GUIDES,
  ...GRAPHS_GUIDES,
  ...RANGE_GUIDES,
  ...TREES_GUIDES,
  ...FOUNDATIONS_GUIDES,
  ...LINEAR_GUIDES,
  ...HASHING_GUIDES,
};
