import type { TraceRegistry } from "../types";
import { TECHNIQUES_TRACES } from "./techniques";
import { PARADIGMS_TRACES } from "./paradigms";
import { SORTING_TRACES } from "./sorting";
import { GRAPHS_TRACES } from "./graphs";
import { RANGE_TRACES } from "./range";
import { TREES_TRACES } from "./trees";
import { FOUNDATIONS_TRACES } from "./foundations";
import { LINEAR_TRACES } from "./linear";
import { HASHING_TRACES } from "./hashing";

/** Lesson id -> builder for its step-by-step visuals. */
export const DS_TRACES: TraceRegistry = {
  ...TECHNIQUES_TRACES,
  ...PARADIGMS_TRACES,
  ...SORTING_TRACES,
  ...GRAPHS_TRACES,
  ...RANGE_TRACES,
  ...TREES_TRACES,
  ...FOUNDATIONS_TRACES,
  ...LINEAR_TRACES,
  ...HASHING_TRACES,
};
