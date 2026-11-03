export interface TestCase {
  id: number;
  inputDesc: string;
  expectedDesc: string;
  args: any[];
  expected: any;
  isHidden?: boolean;
}

export type DSACategory =
  | "Arrays & Hashing"
  | "Two Pointers"
  | "Sliding Window"
  | "Stack & Monotonic Queue"
  | "Binary Search"
  | "Linked List"
  | "Trees & BST"
  | "Tries"
  | "Heaps & Priority Queues"
  | "Backtracking & Recursion"
  | "Graphs & Shortest Path"
  | "Advanced Graphs"
  | "1D Dynamic Programming"
  | "2D Dynamic Programming"
  | "Greedy Algorithms"
  | "Intervals & Sweepline"
  | "Prefix Sums"
  | "Sorting"
  | "Bit Manipulation"
  | "Math & Number Theory"
  | "Math & Geometry"
  | "Union Find"
  | "Segment & Fenwick Trees"
  | "String Algorithms"
  | "Advanced DP";

export interface DSAProblem {
  id: string;
  title: string;
  slug: string;
  level: number; // 1 to 9
  category: DSACategory;
  difficulty: "Easy" | "Medium" | "Hard";
  acceptanceRate: string;
  description: string;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints: string[];
  patternIntuition: {
    ruleOfThumb: string;
    recognitionTriggers: string[];
    commonPitfalls: string[];
    templateSnippet: string;
  };
  timeComplexity: string;
  spaceComplexity: string;
  starterCode: string;
  solutionCode: string;
  testCases: TestCase[];
  runWrapper: (userCode: string) => string;
}
