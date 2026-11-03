export * from "./lld/types";
export { DESIGN_PATTERNS } from "./lld/patterns";
export { CLASSIC_OOP_PROBLEMS } from "./lld/classic_oop";
export { CONCURRENCY_PROBLEMS } from "./lld/concurrency_systems";
export { SOLID_PRINCIPLES } from "./lld/principles";

import { CLASSIC_OOP_PROBLEMS } from "./lld/classic_oop";
import { CONCURRENCY_PROBLEMS } from "./lld/concurrency_systems";
import { LLDProblem } from "./lld/types";

// Unified export for existing consumers
export const LLD_PROBLEMS: LLDProblem[] = [
  ...CLASSIC_OOP_PROBLEMS,
  ...CONCURRENCY_PROBLEMS,
];
