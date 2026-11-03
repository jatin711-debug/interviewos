import { DSAProblem } from "./types";

export const BACKTRACKING_PROBLEMS: DSAProblem[] = [
  {
    id: "dsa-bt-1",
    title: "Subsets",
    slug: "subsets",
    level: 3,
    category: "Backtracking & Recursion",
    difficulty: "Medium",
    acceptanceRate: "77.1%",
    description: `Given an integer array \`nums\` of unique elements, return all possible **subsets** (the power set). The solution set must not contain duplicate subsets. Return the solution in any order.`,
    examples: [
      { input: "nums = [1,2,3]", output: "[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]" },
      { input: "nums = [0]", output: "[[],[0]]" },
    ],
    constraints: ["1 <= nums.length <= 10", "-10 <= nums[i] <= 10", "All the numbers of nums are unique."],
    patternIntuition: {
      ruleOfThumb: "Binary Decision Tree: At each index `i`, we have two recursive choices: either INCLUDE `nums[i]` in the current subset, or EXCLUDE `nums[i]`. When `i == len(nums)`, append a copy of current subset.",
      recognitionTriggers: ["Generating power set or all combinations of unique elements"],
      commonPitfalls: ["Appending `subset` directly instead of a deep copy `subset[:]` or `list(subset)`"],
      templateSnippet: `def subsets(nums: list[int]) -> list[list[int]]:
    res = []
    subset = []
    def dfs(i):
        if i >= len(nums):
            res.append(subset.copy())
            return
        subset.append(nums[i])
        dfs(i + 1)
        subset.pop()
        dfs(i + 1)
    dfs(0)
    return res`,
    },
    timeComplexity: "O(N * 2^N) - 2^N subsets, each requiring O(N) copy.",
    spaceComplexity: "O(N) - Recursion depth bounded by N.",
    starterCode: `class Solution:
    def subsets(self, nums: list[int]) -> list[list[int]]:
        pass
`,
    solutionCode: `class Solution:
    def subsets(self, nums: list[int]) -> list[list[int]]:
        result = []
        current = []

        def backtrack(index: int):
            # Base case: reached end of array
            if index == len(nums):
                result.append(list(current))
                return

            # Choice 1: Include nums[index]
            current.append(nums[index])
            backtrack(index + 1)

            # Choice 2: Exclude nums[index] (Backtrack)
            current.pop()
            backtrack(index + 1)

        backtrack(0)
        return result
`,
    testCases: [
      { id: 1, inputDesc: "nums = [1,2,3]", expectedDesc: "8 subsets", args: [[1,2,3]], expected: [[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]] },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
res = sorted([sorted(s) for s in sol.subsets([1,2,3])])
passed = (len(res) == 8 and [] in res and [1,2,3] in res)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": passed, "actual": len(res), "expected": 8}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-bt-2",
    title: "Combination Sum",
    slug: "combination-sum",
    level: 3,
    category: "Backtracking & Recursion",
    difficulty: "Medium",
    acceptanceRate: "71.4%",
    description: `Given an array of **distinct** integers \`candidates\` and a target integer \`target\`, return a list of all **unique combinations** of \`candidates\` where the chosen numbers sum to \`target\`. The same number may be chosen from candidates an **unlimited number of times**.`,
    examples: [
      { input: "candidates = [2,3,6,7], target = 7", output: "[[2,2,3],[7]]" },
      { input: "candidates = [2,3,5], target = 8", output: "[[2,2,2,2],[2,3,3],[3,5]]" },
    ],
    constraints: ["1 <= candidates.length <= 30", "2 <= candidates[i] <= 40", "All elements of candidates are distinct.", "1 <= target <= 40"],
    patternIntuition: {
      ruleOfThumb: "Unbounded Choice Backtracking: At each index `i`, we can choose to reuse `candidates[i]` (recursively call `dfs(i, curr_sum + candidates[i])`) or move to the next candidate `dfs(i + 1, curr_sum)`.",
      recognitionTriggers: ["Finding combinations summing to target with elements reusable unlimited times"],
      commonPitfalls: ["Incrementing index when reusing candidate: reuse means index stays at `i`"],
      templateSnippet: `def combinationSum(candidates: list[int], target: int) -> list[list[int]]:
    res = []
    def dfs(i, cur, total):
        if total == target:
            res.append(cur.copy())
            return
        if i >= len(candidates) or total > target:
            return
        cur.append(candidates[i])
        dfs(i, cur, total + candidates[i])
        cur.pop()
        dfs(i + 1, cur, total)
    dfs(0, [], 0)
    return res`,
    },
    timeComplexity: "O(2^(T/M)) - Where T is target and M is minimal candidate value.",
    spaceComplexity: "O(T/M) - Maximum recursion call depth.",
    starterCode: `class Solution:
    def combinationSum(self, candidates: list[int], target: int) -> list[list[int]]:
        pass
`,
    solutionCode: `class Solution:
    def combinationSum(self, candidates: list[int], target: int) -> list[list[int]]:
        result = []

        def backtrack(start_idx: int, current_combo: list[int], remaining: int):
            # Target reached
            if remaining == 0:
                result.append(list(current_combo))
                return
            # Exceeded target
            if remaining < 0:
                return

            for i in range(start_idx, len(candidates)):
                # Choose candidates[i]
                current_combo.append(candidates[i])
                # Stay at index i since elements can be reused
                backtrack(i, current_combo, remaining - candidates[i])
                # Backtrack
                current_combo.pop()

        backtrack(0, [], target)
        return result
`,
    testCases: [
      { id: 1, inputDesc: "candidates=[2,3,6,7], target=7", expectedDesc: "[[2,2,3],[7]]", args: [[2,3,6,7], 7], expected: [[2,2,3],[7]] },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
res = sorted([sorted(c) for c in sol.combinationSum([2,3,6,7], 7)])
exp = sorted([sorted(c) for c in [[2,2,3],[7]]])
passed = (res == exp)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": passed, "actual": res, "expected": exp}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-bt-3",
    title: "Permutations",
    slug: "permutations",
    level: 3,
    category: "Backtracking & Recursion",
    difficulty: "Medium",
    acceptanceRate: "77.8%",
    description: `Given an array \`nums\` of distinct integers, return all the possible **permutations**. You can return the answer in any order.`,
    examples: [
      { input: "nums = [1,2,3]", output: "[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]" },
      { input: "nums = [0,1]", output: "[[0,1],[1,0]]" },
    ],
    constraints: ["1 <= nums.length <= 6", "-10 <= nums[i] <= 10", "All integers of nums are unique."],
    patternIntuition: {
      ruleOfThumb: "Backtrack with an in-place swap or `visited` boolean set: Pick each unused element for the current position, recurse for next position, and backtrack by popping/unswapping.",
      recognitionTriggers: ["Generating all permutations / orderings of distinct items"],
      commonPitfalls: ["Order matters in permutations (unlike combinations), so loop must consider all unused elements"],
      templateSnippet: `def permute(nums: list[int]) -> list[list[int]]:
    res = []
    def backtrack(start):
        if start == len(nums):
            res.append(nums[:])
            return
        for i in range(start, len(nums)):
            nums[start], nums[i] = nums[i], nums[start]
            backtrack(start + 1)
            nums[start], nums[i] = nums[i], nums[start]
    backtrack(0)
    return res`,
    },
    timeComplexity: "O(N! * N) - N! permutations, each requiring O(N) array copy.",
    spaceComplexity: "O(N) - Recursion call stack of depth N.",
    starterCode: `class Solution:
    def permute(self, nums: list[int]) -> list[list[int]]:
        pass
`,
    solutionCode: `class Solution:
    def permute(self, nums: list[int]) -> list[list[int]]:
        result = []

        def backtrack(start_idx: int):
            if start_idx == len(nums):
                result.append(list(nums))
                return

            for i in range(start_idx, len(nums)):
                # Swap current element into starting position
                nums[start_idx], nums[i] = nums[i], nums[start_idx]
                # Recurse on remaining positions
                backtrack(start_idx + 1)
                # Backtrack: restore original array order
                nums[start_idx], nums[i] = nums[i], nums[start_idx]

        backtrack(0)
        return result
`,
    testCases: [
      { id: 1, inputDesc: "nums = [1,2,3]", expectedDesc: "6 permutations", args: [[1,2,3]], expected: 6 },
    ],
    runWrapper: (userCode: string) => `
import sys, json
import itertools
${userCode}

sol = Solution()
res = sol.permute([1,2,3])
passed = sorted(tuple(item) for item in res) == sorted(itertools.permutations([1,2,3]))

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": passed, "actual": len(res), "expected": 6}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-bt-4",
    title: "Word Search",
    slug: "word-search",
    level: 4,
    category: "Backtracking & Recursion",
    difficulty: "Medium",
    acceptanceRate: "41.9%",
    description: `Given an \`m x n\` grid of characters \`board\` and a string \`word\`, return \`true\` if \`word\` exists in the grid. Adjacent cells horizontally or vertically, cell cannot be used more than once per word.`,
    examples: [
      { input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"', output: "true" },
      { input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "SEE"', output: "true" },
      { input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCB"', output: "false" },
    ],
    constraints: ["m == board.length", "n = board[i].length", "1 <= m, n <= 6", "1 <= word.length <= 15"],
    patternIntuition: {
      ruleOfThumb: "2D Grid DFS with In-Place Visited Masking: Replace `board[r][c] = '#'` before recursing into 4 neighbors, and restore `board[r][c] = temp` upon return.",
      recognitionTriggers: ["Finding path matching string in a 2D matrix"],
      commonPitfalls: ["Forgetting to unmark visited cell during backtracking"],
      templateSnippet: `def exist(board, word):
    def dfs(r, c, i):
        if i == len(word): return True
        if r < 0 or c < 0 or r == rows or c == cols or board[r][c] != word[i]: return False
        tmp = board[r][c]
        board[r][c] = "#"
        res = (dfs(r+1, c, i+1) or dfs(r-1, c, i+1) or dfs(r, c+1, i+1) or dfs(r, c-1, i+1))
        board[r][c] = tmp
        return res`,
    },
    timeComplexity: "O(M * N * 3^L) - Where L is length of word.",
    spaceComplexity: "O(L) - Recursion depth bounded by word length.",
    starterCode: `class Solution:
    def exist(self, board: list[list[str]], word: str) -> bool:
        pass
`,
    solutionCode: `class Solution:
    def exist(self, board: list[list[str]], word: str) -> bool:
        rows, cols = len(board), len(board[0])

        def dfs(r: int, c: int, char_idx: int) -> bool:
            # Word completely matched
            if char_idx == len(word):
                return True

            # Boundary and character match check
            if (r < 0 or r >= rows or c < 0 or c >= cols or 
                board[r][c] != word[char_idx]):
                return False

            # Mark current cell visited by overwriting
            temp = board[r][c]
            board[r][c] = "#"

            # Recurse in 4 cardinal directions
            found = (
                dfs(r + 1, c, char_idx + 1) or
                dfs(r - 1, c, char_idx + 1) or
                dfs(r, c + 1, char_idx + 1) or
                dfs(r, c - 1, char_idx + 1)
            )

            # Backtrack: restore original character
            board[r][c] = temp
            return found

        for r in range(rows):
            for c in range(cols):
                if board[r][c] == word[0] and dfs(r, c, 0):
                    return True

        return False
`,
    testCases: [
      { id: 1, inputDesc: "board with 'ABCCED'", expectedDesc: "true", args: [], expected: true },
      { id: 2, inputDesc: "board with 'ABCB'", expectedDesc: "false", args: [], expected: false },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]]
sol = Solution()
r1 = sol.exist(board, "ABCCED")
r2 = sol.exist(board, "ABCB")
passed = (r1 == True and r2 == False)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == True, "actual": r1, "expected": True},
    {"testCase": 2, "passed": r2 == False, "actual": r2, "expected": False}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-bt-5",
    title: "N-Queens",
    slug: "n-queens",
    level: 7,
    category: "Backtracking & Recursion",
    difficulty: "Hard",
    acceptanceRate: "67.5%",
    description: `The **n-queens** puzzle is the problem of placing \`n\` queens on an \`n x n\` chessboard such that no two queens attack each other.

Given an integer \`n\`, return all distinct solutions to the **n-queens puzzle**. Each solution contains a distinct board configuration of the n-queens' placement, where \`'Q'\` and \`'.' \` both indicate a queen and an empty space, respectively.`,
    examples: [
      { input: "n = 4", output: '[[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]' },
      { input: "n = 1", output: '[["Q"]]' },
    ],
    constraints: ["1 <= n <= 9"],
    patternIntuition: {
      ruleOfThumb: "Place one queen per row. Maintain three HashSets for O(1) conflict validation: `cols`, positive diagonals `(row + col)`, and negative diagonals `(row - col)`.",
      recognitionTriggers: ["Constrained non-attacking geometric placement on grid"],
      commonPitfalls: ["Recalculating diagonals with O(N) loops instead of O(1) `row + col` and `row - col` set lookups"],
      templateSnippet: `def solveNQueens(n: int) -> list[list[str]]:
    col, posDiag, negDiag = set(), set(), set()
    res = []
    board = [["."] * n for _ in range(n)]
    def backtrack(r):
        if r == n:
            res.append(["".join(row) for row in board])
            return
        for c in range(n):
            if c in col or (r + c) in posDiag or (r - c) in negDiag: continue
            col.add(c); posDiag.add(r + c); negDiag.add(r - c)
            board[r][c] = "Q"
            backtrack(r + 1)
            col.remove(c); posDiag.remove(r + c); negDiag.remove(r - c)
            board[r][c] = "."
    backtrack(0)
    return res`,
    },
    timeComplexity: "O(N!) - Placing queens row by row.",
    spaceComplexity: "O(N^2) - Board representation and recursion stack.",
    starterCode: `class Solution:
    def solveNQueens(self, n: int) -> list[list[str]]:
        pass
`,
    solutionCode: `class Solution:
    def solveNQueens(self, n: int) -> list[list[str]]:
        cols = set()
        pos_diag = set()  # (row + col)
        neg_diag = set()  # (row - col)

        result = []
        board = [["."] * n for _ in range(n)]

        def backtrack(row: int):
            # All n queens placed successfully
            if row == n:
                result.append(["".join(r) for r in board])
                return

            for col in range(n):
                # Verify column and diagonals are free from attacking queens
                if (col in cols or 
                    (row + col) in pos_diag or 
                    (row - col) in neg_diag):
                    continue

                # Place queen
                cols.add(col)
                pos_diag.add(row + col)
                neg_diag.add(row - col)
                board[row][col] = "Q"

                # Advance to next row
                backtrack(row + 1)

                # Backtrack: remove queen
                cols.remove(col)
                pos_diag.remove(row + col)
                neg_diag.remove(row - col)
                board[row][col] = "."

        backtrack(0)
        return result
`,
    testCases: [
      { id: 1, inputDesc: "n = 4", expectedDesc: "2 solutions", args: [4], expected: 2 },
      { id: 2, inputDesc: "n = 1", expectedDesc: "1 solution", args: [1], expected: 1 },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.solveNQueens(4)
r2 = sol.solveNQueens(1)
def valid_solutions(boards, n, expected_count):
    if len(boards) != expected_count:
        return False
    unique = set()
    for board in boards:
        if len(board) != n or any(len(row) != n or set(row) - {'.', 'Q'} or row.count('Q') != 1 for row in board):
            return False
        cols = [row.index('Q') for row in board]
        if len(set(cols)) != n or len({r - c for r, c in enumerate(cols)}) != n or len({r + c for r, c in enumerate(cols)}) != n:
            return False
        unique.add(tuple(board))
    return len(unique) == expected_count

p1 = valid_solutions(r1, 4, 2)
p2 = valid_solutions(r2, 1, 1)
passed = p1 and p2

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": p1, "actual": r1, "expected": "2 distinct valid boards"},
    {"testCase": 2, "passed": p2, "actual": r2, "expected": "1 valid board"}
]}))
print("JSON_OUTPUT_END")
`,
  },
];
