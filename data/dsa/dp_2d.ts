import { DSAProblem } from "./types";

export const DP_2D_PROBLEMS: DSAProblem[] = [
  {
    id: "dsa-dp2-1",
    title: "Unique Paths",
    slug: "unique-paths",
    level: 2,
    category: "2D Dynamic Programming",
    difficulty: "Medium",
    acceptanceRate: "64.1%",
    description: `There is a robot on an \`m x n\` grid. The robot is initially located at the top-left corner (\`grid[0][0]\`). The robot tries to move to the bottom-right corner (\`grid[m - 1][n - 1]\`). The robot can only move either down or right at any point in time. Given the two integers \`m\` and \`n\`, return the number of possible unique paths.`,
    examples: [
      { input: "m = 3, n = 7", output: "28" },
      { input: "m = 3, n = 2", output: "3" },
    ],
    constraints: ["1 <= m, n <= 100"],
    patternIntuition: {
      ruleOfThumb: "2D Grid DP: `dp[r][c] = dp[r-1][c] + dp[r][c-1]`. Space optimize to 1D: maintain a single `row = [1] * n` and update `row[c] = row[c] + row[c-1]`.",
      recognitionTriggers: ["Counting paths on a grid moving only right and down"],
      commonPitfalls: ["Allocating full m*n matrix when space can be compressed to O(n)"],
      templateSnippet: `def uniquePaths(m: int, n: int) -> int:
    row = [1] * n
    for r in range(m - 1):
        for c in range(1, n):
            row[c] += row[c - 1]
    return row[-1]`,
    },
    timeComplexity: "O(M * N) - Two nested loops.",
    spaceComplexity: "O(N) - 1D row array.",
    starterCode: `class Solution:
    def uniquePaths(self, m: int, n: int) -> int:
        pass
`,
    solutionCode: `class Solution:
    def uniquePaths(self, m: int, n: int) -> int:
        # Space-optimized 1D row: initially 1 path to each cell in row 0
        row = [1] * n

        # Iterate through remaining (m - 1) rows
        for r in range(m - 1):
            for c in range(1, n):
                # row[c] was from row above, row[c - 1] is from cell to the left
                row[c] = row[c] + row[c - 1]

        return row[-1]
`,
    testCases: [
      { id: 1, inputDesc: "m = 3, n = 7", expectedDesc: "28", args: [3, 7], expected: 28 },
      { id: 2, inputDesc: "m = 3, n = 2", expectedDesc: "3", args: [3, 2], expected: 3 },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.uniquePaths(3, 7)
r2 = sol.uniquePaths(3, 2)
passed = (r1 == 28 and r2 == 3)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == 28, "actual": r1, "expected": 28},
    {"testCase": 2, "passed": r2 == 3, "actual": r2, "expected": 3}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-dp2-2",
    title: "Longest Common Subsequence",
    slug: "longest-common-subsequence",
    level: 3,
    category: "2D Dynamic Programming",
    difficulty: "Medium",
    acceptanceRate: "58.7%",
    description: `Given two strings \`text1\` and \`text2\`, return the length of their longest common subsequence. If there is no common subsequence, return \`0\`.`,
    examples: [
      { input: 'text1 = "abcde", text2 = "ace"', output: "3", explanation: 'The longest common subsequence is "ace" and its length is 3.' },
      { input: 'text1 = "abc", text2 = "abc"', output: "3" },
      { input: 'text1 = "abc", text2 = "def"', output: "0" },
    ],
    constraints: ["1 <= text1.length, text2.length <= 1000", "text1 and text2 consist of only lowercase English characters."],
    patternIntuition: {
      ruleOfThumb: "2D String DP Table: If `text1[i] == text2[j]`, `dp[i][j] = 1 + dp[i+1][j+1]`. Otherwise, `dp[i][j] = max(dp[i+1][j], dp[i][j+1])`.",
      recognitionTriggers: ["Finding maximum overlap subsequence between two strings"],
      commonPitfalls: ["Confusing subsequence (can skip letters) with substring (must be contiguous)"],
      templateSnippet: `def longestCommonSubsequence(text1, text2):
    dp = [[0] * (len(text2) + 1) for _ in range(len(text1) + 1)]
    for i in range(len(text1) - 1, -1, -1):
        for j in range(len(text2) - 1, -1, -1):
            if text1[i] == text2[j]: dp[i][j] = 1 + dp[i+1][j+1]
            else: dp[i][j] = max(dp[i+1][j], dp[i][j+1])
    return dp[0][0]`,
    },
    timeComplexity: "O(M * N) - Matrix iteration.",
    spaceComplexity: "O(M * N) - 2D DP table.",
    starterCode: `class Solution:
    def longestCommonSubsequence(self, text1: str, text2: str) -> int:
        pass
`,
    solutionCode: `class Solution:
    def longestCommonSubsequence(self, text1: str, text2: str) -> int:
        m, n = len(text1), len(text2)
        # dp[i][j] stores LCS length of text1[i:] and text2[j:]
        dp = [[0] * (n + 1) for _ in range(m + 1)]

        # Bottom-up DP from end of strings
        for i in range(m - 1, -1, -1):
            for j in range(n - 1, -1, -1):
                if text1[i] == text2[j]:
                    dp[i][j] = 1 + dp[i + 1][j + 1]
                else:
                    dp[i][j] = max(dp[i + 1][j], dp[i][j + 1])

        return dp[0][0]
`,
    testCases: [
      { id: 1, inputDesc: 'text1="abcde", text2="ace"', expectedDesc: "3", args: ["abcde", "ace"], expected: 3 },
      { id: 2, inputDesc: 'text1="abc", text2="def"', expectedDesc: "0", args: ["abc", "def"], expected: 0 },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.longestCommonSubsequence("abcde", "ace")
r2 = sol.longestCommonSubsequence("abc", "def")
passed = (r1 == 3 and r2 == 0)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == 3, "actual": r1, "expected": 3},
    {"testCase": 2, "passed": r2 == 0, "actual": r2, "expected": 0}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-dp2-3",
    title: "Best Time to Buy and Sell Stock with Cooldown",
    slug: "best-time-to-buy-and-sell-stock-with-cooldown",
    level: 4,
    category: "2D Dynamic Programming",
    difficulty: "Medium",
    acceptanceRate: "58.4%",
    description: `You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`i-th\` day. You may complete as many transactions as you like with the restriction: after you sell your stock, you cannot buy stock on the next day (i.e., cooldown one day). Return max profit.`,
    examples: [
      { input: "prices = [1,2,3,0,2]", output: "3", explanation: "transactions = [buy, sell, cooldown, buy, sell]" },
      { input: "prices = [1]", output: "0" },
    ],
    constraints: ["1 <= prices.length <= 5000", "0 <= prices[i] <= 1000"],
    patternIntuition: {
      ruleOfThumb: "State Machine DP: Maintain 3 states: `held` (holding stock), `sold` (sold today, forced cooldown tomorrow), `rest` (can buy or continue idling).",
      recognitionTriggers: ["Stock transaction optimization with state transition constraints"],
      commonPitfalls: ["Buying immediately on cooldown day"],
      templateSnippet: `def maxProfit(prices):
    sold, held, rest = float('-inf'), float('-inf'), 0
    for p in prices:
        prev_sold = sold
        sold = held + p
        held = max(held, rest - p)
        rest = max(rest, prev_sold)
    return max(sold, rest)`,
    },
    timeComplexity: "O(N) - Linear pass.",
    spaceComplexity: "O(1) - Constant variables.",
    starterCode: `class Solution:
    def maxProfit(self, prices: list[int]) -> int:
        pass
`,
    solutionCode: `class Solution:
    def maxProfit(self, prices: list[int]) -> int:
        if not prices:
            return 0

        # State 1: Currently holding a share of stock
        held = -prices[0]
        # State 2: Sold stock today (entering cooldown)
        sold = 0
        # State 3: In cooldown or resting (ready to buy)
        rest = 0

        for price in prices[1:]:
            prev_sold = sold
            # Selling transitions from held -> sold
            sold = held + price
            # Buying transitions from rest -> held
            held = max(held, rest - price)
            # Resting transitions from previous sold or continued rest
            rest = max(rest, prev_sold)

        return max(sold, rest)
`,
    testCases: [
      { id: 1, inputDesc: "prices = [1,2,3,0,2]", expectedDesc: "3", args: [[1,2,3,0,2]], expected: 3 },
      { id: 2, inputDesc: "prices = [1]", expectedDesc: "0", args: [[1]], expected: 0 },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.maxProfit([1,2,3,0,2])
r2 = sol.maxProfit([1])
passed = (r1 == 3 and r2 == 0)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == 3, "actual": r1, "expected": 3},
    {"testCase": 2, "passed": r2 == 0, "actual": r2, "expected": 0}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-dp2-4",
    title: "Target Sum",
    slug: "target-sum",
    level: 4,
    category: "2D Dynamic Programming",
    difficulty: "Medium",
    acceptanceRate: "47.2%",
    description: `You are given an integer array \`nums\` and an integer \`target\`. Build an expression out of nums by adding one of the symbols \`'+'\` and \`'-'\` before each integer. Return the number of different expressions that you can build, which evaluates to \`target\`.`,
    examples: [
      { input: "nums = [1,1,1,1,1], target = 3", output: "5", explanation: "5 ways to assign symbols to reach sum 3." },
      { input: "nums = [1], target = 1", output: "1" },
    ],
    constraints: ["1 <= nums.length <= 20", "0 <= nums[i] <= 1000", "0 <= sum(nums[i]) <= 1000", "-1000 <= target <= 1000"],
    patternIntuition: {
      ruleOfThumb: "Subset Sum Transformation: Partition array into Positive subset P and Negative subset N. `sum(P) - sum(N) = target` and `sum(P) + sum(N) = total`. Adding equations: `2 * sum(P) = target + total` $\to$ `sum(P) = (target + total) // 2`. Standard 0/1 knapsack!",
      recognitionTriggers: ["Assigning +/- signs to reach target sum"],
      commonPitfalls: ["When `(target + total)` is negative or odd, return 0 immediately!"],
      templateSnippet: `def findTargetSumWays(nums, target):
    total = sum(nums)
    if (total + target) < 0 or (total + target) % 2 != 0: return 0
    s = (total + target) // 2
    dp = [0] * (s + 1)
    dp[0] = 1
    for n in nums:
        for j in range(s, n - 1, -1):
            dp[j] += dp[j - n]
    return dp[s]`,
    },
    timeComplexity: "O(N * S) - Where S is (total + target) // 2.",
    spaceComplexity: "O(S) - 1D knapsack array.",
    starterCode: `class Solution:
    def findTargetSumWays(self, nums: list[int], target: int) -> int:
        pass
`,
    solutionCode: `class Solution:
    def findTargetSumWays(self, nums: list[int], target: int) -> int:
        total = sum(nums)

        # Mathematical impossibility checks:
        # sum(P) = (total + target) / 2 must be a non-negative integer
        if (total + target) < 0 or (total + target) % 2 != 0:
            return 0

        subset_sum = (total + target) // 2
        # dp[j] stores number of subsets summing to j
        dp = [0] * (subset_sum + 1)
        dp[0] = 1

        for num in nums:
            # Reverse iteration to prevent using the same number multiple times
            for j in range(subset_sum, num - 1, -1):
                dp[j] += dp[j - num]

        return dp[subset_sum]
`,
    testCases: [
      { id: 1, inputDesc: "nums = [1,1,1,1,1], target = 3", expectedDesc: "5", args: [[1,1,1,1,1], 3], expected: 5 },
      { id: 2, inputDesc: "nums = [1], target = 1", expectedDesc: "1", args: [[1], 1], expected: 1 },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.findTargetSumWays([1,1,1,1,1], 3)
r2 = sol.findTargetSumWays([1], 1)
passed = (r1 == 5 and r2 == 1)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == 5, "actual": r1, "expected": 5},
    {"testCase": 2, "passed": r2 == 1, "actual": r2, "expected": 1}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-dp2-5",
    title: "Edit Distance",
    slug: "edit-distance",
    level: 6,
    category: "2D Dynamic Programming",
    difficulty: "Hard",
    acceptanceRate: "56.4%",
    description: `Given two strings \`word1\` and \`word2\`, return the minimum number of operations required to convert \`word1\` to \`word2\`. Allowed operations: Insert a character, Delete a character, Replace a character.`,
    examples: [
      { input: 'word1 = "horse", word2 = "ros"', output: "3", explanation: "horse -> rorse (replace 'h' with 'r') -> rose (remove 'r') -> ros (remove 'e')" },
      { input: 'word1 = "intention", word2 = "execution"', output: "5" },
    ],
    constraints: ["0 <= word1.length, word2.length <= 500", "word1 and word2 consist of lowercase English letters."],
    patternIntuition: {
      ruleOfThumb: "Classic Levenshtein Distance: `dp[i][j]` = min edits to convert `word1[i:]` to `word2[j:]`. If characters match: `dp[i][j] = dp[i+1][j+1]`. If characters differ: `dp[i][j] = 1 + min(insert: dp[i][j+1], delete: dp[i+1][j], replace: dp[i+1][j+1])`.",
      recognitionTriggers: ["Levenshtein edit operations (insert/delete/replace) between strings"],
      commonPitfalls: ["Base cases: Converting empty string to length K requires K insertions"],
      templateSnippet: `def minDistance(w1, w2):
    dp = [[float("inf")] * (len(w2) + 1) for _ in range(len(w1) + 1)]
    for j in range(len(w2) + 1): dp[len(w1)][j] = len(w2) - j
    for i in range(len(w1) + 1): dp[i][len(w2)] = len(w1) - i
    for i in range(len(w1) - 1, -1, -1):
        for j in range(len(w2) - 1, -1, -1):
            if w1[i] == w2[j]: dp[i][j] = dp[i+1][j+1]
            else: dp[i][j] = 1 + min(dp[i+1][j], dp[i][j+1], dp[i+1][j+1])
    return dp[0][0]`,
    },
    timeComplexity: "O(M * N) - 2D matrix iteration.",
    spaceComplexity: "O(M * N) - 2D DP table.",
    starterCode: `class Solution:
    def minDistance(self, word1: str, word2: str) -> int:
        pass
`,
    solutionCode: `class Solution:
    def minDistance(self, word1: str, word2: str) -> int:
        m, n = len(word1), len(word2)
        # dp[i][j] stores minimum edits to convert word1[i:] into word2[j:]
        dp = [[0] * (n + 1) for _ in range(m + 1)]

        # Base cases: converting suffix to empty string requires deleting all characters
        for i in range(m + 1):
            dp[i][n] = m - i
        for j in range(n + 1):
            dp[m][j] = n - j

        for i in range(m - 1, -1, -1):
            for j in range(n - 1, -1, -1):
                if word1[i] == word2[j]:
                    # Characters match, no operation needed
                    dp[i][j] = dp[i + 1][j + 1]
                else:
                    # Choose minimum between Insert, Delete, and Replace + 1
                    insert_op = dp[i][j + 1]
                    delete_op = dp[i + 1][j]
                    replace_op = dp[i + 1][j + 1]
                    dp[i][j] = 1 + min(insert_op, delete_op, replace_op)

        return dp[0][0]
`,
    testCases: [
      { id: 1, inputDesc: 'word1="horse", word2="ros"', expectedDesc: "3", args: ["horse", "ros"], expected: 3 },
      { id: 2, inputDesc: 'word1="intention", word2="execution"', expectedDesc: "5", args: ["intention", "execution"], expected: 5 },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.minDistance("horse", "ros")
r2 = sol.minDistance("intention", "execution")
passed = (r1 == 3 and r2 == 5)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == 3, "actual": r1, "expected": 3},
    {"testCase": 2, "passed": r2 == 5, "actual": r2, "expected": 5}
]}))
print("JSON_OUTPUT_END")
`,
  },
];
