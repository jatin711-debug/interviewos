import { DSAProblem, TestCase, DSACategory } from "./dsa/types";
import { ARRAYS_HASHING_PROBLEMS } from "./dsa/arrays_hashing";
import { TWO_POINTERS_PROBLEMS } from "./dsa/two_pointers";
import { SLIDING_WINDOW_PROBLEMS } from "./dsa/sliding_window";
import { STACK_PROBLEMS } from "./dsa/stack";
import { BINARY_SEARCH_PROBLEMS } from "./dsa/binary_search";
import { LINKED_LIST_PROBLEMS } from "./dsa/linked_list";
import { TREES_PROBLEMS } from "./dsa/trees";
import { TRIES_PROBLEMS } from "./dsa/tries";
import { HEAPS_PROBLEMS } from "./dsa/heaps";
import { BACKTRACKING_PROBLEMS } from "./dsa/backtracking";
import { GRAPHS_PROBLEMS } from "./dsa/graphs";
import { DP_1D_PROBLEMS } from "./dsa/dp_1d";
import { DP_2D_PROBLEMS } from "./dsa/dp_2d";
import { GREEDY_PROBLEMS } from "./dsa/greedy";
import { INTERVALS_PROBLEMS } from "./dsa/intervals";
import { CORE_PROBLEMS } from "./dsa/core";
import { EXPANSION_PROBLEMS } from "./dsa/expansion";
import { STRUCTURE_PROBLEMS } from "./dsa/structures";
import { FOUNDATIONS_PLUS_PROBLEMS } from "./dsa/foundations_plus";
import { HARD_PLUS_PROBLEMS } from "./dsa/hard_plus";
import { ADVANCED_PROBLEMS } from "./dsa/advanced";

export type { DSAProblem, TestCase, DSACategory };

export const DSA_PROBLEMS: DSAProblem[] = [
  ...ARRAYS_HASHING_PROBLEMS,
  ...TWO_POINTERS_PROBLEMS,
  ...SLIDING_WINDOW_PROBLEMS,
  ...STACK_PROBLEMS,
  ...BINARY_SEARCH_PROBLEMS,
  ...LINKED_LIST_PROBLEMS,
  ...TREES_PROBLEMS,
  ...TRIES_PROBLEMS,
  ...HEAPS_PROBLEMS,
  ...BACKTRACKING_PROBLEMS,
  ...GRAPHS_PROBLEMS,
  ...DP_1D_PROBLEMS,
  ...DP_2D_PROBLEMS,
  ...GREEDY_PROBLEMS,
  ...INTERVALS_PROBLEMS,
  ...CORE_PROBLEMS,
  ...EXPANSION_PROBLEMS,
  ...STRUCTURE_PROBLEMS,
  ...FOUNDATIONS_PLUS_PROBLEMS,
  ...HARD_PLUS_PROBLEMS,
  ...ADVANCED_PROBLEMS,
];
