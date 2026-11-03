import { DSAProblem } from "./types";

export const DP_1D_PROBLEMS: DSAProblem[] = [
  {
    id: "dsa-dp1-1",
    title: "Climbing Stairs",
    slug: "climbing-stairs",
    level: 1,
    category: "1D Dynamic Programming",
    difficulty: "Easy",
    acceptanceRate: "53.1%",
    description: `You are climbing a staircase. It takes \`n\` steps to reach the top. Each time you can either climb \`1\` or \`2\` steps. In how many distinct ways can you climb to the top?`,
    examples: [
      { input: "n = 2", output: "2", explanation: "1. 1 step + 1 step\n2. 2 steps" },
      { input: "n = 3", output: "3", explanation: "1. 1 step + 1 step + 1 step\n2. 1 step + 2 steps\n3. 2 steps + 1 step" },
    ],
    constraints: ["1 <= n <= 45"],
    patternIntuition: {
      ruleOfThumb: "Fibonacci state transition: `dp[i] = dp[i-1] + dp[i-2]`. To reach step `i`, you must come from step `i-1` (1 step) or step `i-2` (2 steps). Space optimize from O(N) to O(1) using two variables.",
      recognitionTriggers: ["Ways to reach target sum with step sizes 1 and 2"],
      commonPitfalls: ["Recursive tree without memoization causes O(2^N) exponential explosion"],
      templateSnippet: `def climbStairs(n: int) -> int:
    one, two = 1, 1
    for _ in range(n - 1):
        one, two = one + two, one
    return one`,
    },
    timeComplexity: "O(N) - Linear single pass.",
    spaceComplexity: "O(1) - Two variables.",
    starterCode: `class Solution:
    def climbStairs(self, n: int) -> int:
        pass
`,
    solutionCode: `class Solution:
    def climbStairs(self, n: int) -> int:
        # Base cases
        if n <= 2:
            return n

        # Space-optimized Fibonacci: prev1 = ways to reach (i-1), prev2 = ways to reach (i-2)
        prev2 = 1
        prev1 = 2

        for i in range(3, n + 1):
            curr = prev1 + prev2
            prev2 = prev1
            prev1 = curr

        return prev1
`,
    testCases: [
      { id: 1, inputDesc: "n = 2", expectedDesc: "2", args: [2], expected: 2 },
      { id: 2, inputDesc: "n = 3", expectedDesc: "3", args: [3], expected: 3 },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.climbStairs(2)
r2 = sol.climbStairs(3)
passed = (r1 == 2 and r2 == 3)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == 2, "actual": r1, "expected": 2},
    {"testCase": 2, "passed": r2 == 3, "actual": r2, "expected": 3}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-dp1-2",
    title: "House Robber",
    slug: "house-robber",
    level: 2,
    category: "1D Dynamic Programming",
    difficulty: "Medium",
    acceptanceRate: "51.2%",
    description: `You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed. Adjacent houses have security systems connected and it will automatically contact the police if two adjacent houses were broken into on the same night. Return the maximum amount of money you can rob tonight without alerting the police.`,
    examples: [
      { input: "nums = [1,2,3,1]", output: "4", explanation: "Rob house 1 (money = 1) and rob house 3 (money = 3). Total = 1 + 3 = 4." },
      { input: "nums = [2,7,9,3,1]", output: "12", explanation: "Rob house 1 (money = 2), house 3 (money = 9), house 5 (money = 1). Total = 12." },
    ],
    constraints: ["1 <= nums.length <= 100", "0 <= nums[i] <= 400"],
    patternIntuition: {
      ruleOfThumb: "Recurrence: At each house, choose `max(rob_current + rob_two_houses_ago, skip_current)`. In code: `temp = max(n + rob1, rob2); rob1 = rob2; rob2 = temp`.",
      recognitionTriggers: ["Non-adjacent element selection to maximize sum"],
      commonPitfalls: ["Greedy approach (always picking larger alternate) fails on arrays like [2, 1, 1, 2]"],
      templateSnippet: `def rob(nums: list[int]) -> int:
    rob1, rob2 = 0, 0
    for n in nums:
        temp = max(n + rob1, rob2)
        rob1 = rob2
        rob2 = temp
    return rob2`,
    },
    timeComplexity: "O(N) - Single loop.",
    spaceComplexity: "O(1) - Constant state variables.",
    starterCode: `class Solution:
    def rob(self, nums: list[int]) -> int:
        pass
`,
    solutionCode: `class Solution:
    def rob(self, nums: list[int]) -> int:
        # rob1: max money robbed up to house (i - 2)
        # rob2: max money robbed up to house (i - 1)
        rob1 = 0
        rob2 = 0

        for num in nums:
            # Either rob current house + money from (i - 2), or skip current house
            current_max = max(num + rob1, rob2)
            rob1 = rob2
            rob2 = current_max

        return rob2
`,
    testCases: [
      { id: 1, inputDesc: "nums = [1,2,3,1]", expectedDesc: "4", args: [[1,2,3,1]], expected: 4 },
      { id: 2, inputDesc: "nums = [2,7,9,3,1]", expectedDesc: "12", args: [[2,7,9,3,1]], expected: 12 },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.rob([1,2,3,1])
r2 = sol.rob([2,7,9,3,1])
passed = (r1 == 4 and r2 == 12)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == 4, "actual": r1, "expected": 4},
    {"testCase": 2, "passed": r2 == 12, "actual": r2, "expected": 12}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-dp1-3",
    title: "House Robber II",
    slug: "house-robber-ii",
    level: 3,
    category: "1D Dynamic Programming",
    difficulty: "Medium",
    acceptanceRate: "42.5%",
    description: `All houses at this place are arranged in a **circle**. That means the first house is the neighbor of the last one. Return the maximum amount of money you can rob tonight without alerting the police.`,
    examples: [
      { input: "nums = [2,3,2]", output: "3", explanation: "You cannot rob house 1 (money = 2) and then rob house 3 (money = 2), because they are adjacent." },
      { input: "nums = [1,2,3,1]", output: "4" },
    ],
    constraints: ["1 <= nums.length <= 100", "0 <= nums[i] <= 1000"],
    patternIntuition: {
      ruleOfThumb: "Circular boundary decomposition: You can either rob `nums[0]` (which excludes `nums[-1]`), or rob `nums[-1]` (which excludes `nums[0]`). Return `max(nums[0], rob(nums[1:]), rob(nums[:-1]))`.",
      recognitionTriggers: ["Circular adjacency constraint on 1D DP"],
      commonPitfalls: ["Single element array edge case (e.g. `[1]`): `nums[1:]` and `nums[:-1]` would both be empty!"],
      templateSnippet: `def rob(nums: list[int]) -> int:
    def helper(sub):
        r1, r2 = 0, 0
        for n in sub: r1, r2 = r2, max(n + r1, r2)
        return r2
    return max(nums[0], helper(nums[1:]), helper(nums[:-1]))`,
    },
    timeComplexity: "O(N) - Two linear DP passes.",
    spaceComplexity: "O(1) - Constant state memory.",
    starterCode: `class Solution:
    def rob(self, nums: list[int]) -> int:
        pass
`,
    solutionCode: `class Solution:
    def rob(self, nums: list[int]) -> int:
        # Edge case: single house
        if len(nums) == 1:
            return nums[0]

        def linear_rob(houses: list[int]) -> int:
            rob1, rob2 = 0, 0
            for money in houses:
                new_rob = max(money + rob1, rob2)
                rob1 = rob2
                rob2 = new_rob
            return rob2

        # Subproblem 1: Exclude first house (houses 1 to n-1)
        # Subproblem 2: Exclude last house (houses 0 to n-2)
        return max(linear_rob(nums[1:]), linear_rob(nums[:-1]))
`,
    testCases: [
      { id: 1, inputDesc: "nums = [2,3,2]", expectedDesc: "3", args: [[2,3,2]], expected: 3 },
      { id: 2, inputDesc: "nums = [1,2,3,1]", expectedDesc: "4", args: [[1,2,3,1]], expected: 4 },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.rob([2,3,2])
r2 = sol.rob([1,2,3,1])
passed = (r1 == 3 and r2 == 4)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == 3, "actual": r1, "expected": 3},
    {"testCase": 2, "passed": r2 == 4, "actual": r2, "expected": 4}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-dp1-4",
    title: "Coin Change",
    slug: "coin-change",
    level: 4,
    category: "1D Dynamic Programming",
    difficulty: "Medium",
    acceptanceRate: "44.6%",
    description: `You are given an integer array \`coins\` representing coins of different denominations and an integer \`amount\` representing a total amount of money. Return the fewest number of coins that you need to make up that amount. If impossible, return \`-1\`. Infinite coins of each type available.`,
    examples: [
      { input: "coins = [1,2,5], amount = 11", output: "3", explanation: "11 = 5 + 5 + 1" },
      { input: "coins = [2], amount = 3", output: "-1" },
      { input: "coins = [1], amount = 0", output: "0" },
    ],
    constraints: ["1 <= coins.length <= 12", "1 <= coins[i] <= 2^31 - 1", "0 <= amount <= 10^4"],
    patternIntuition: {
      ruleOfThumb: "Unbounded Knapsack: `dp[a]` = minimum coins to make amount `a`. State transition: `dp[a] = min(dp[a], 1 + dp[a - coin])` for every coin where `a >= coin`.",
      recognitionTriggers: ["Minimizing count of reusable items to reach exact sum"],
      commonPitfalls: ["Greedy coin choice fails for arbitrary denominations (e.g., [1, 3, 4] for amount 6: Greedy gives 4+1+1=3 coins, optimal DP gives 3+3=2 coins)"],
      templateSnippet: `def coinChange(coins: list[int], amount: int) -> int:
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0
    for coin in coins:
        for a in range(coin, amount + 1):
            dp[a] = min(dp[a], dp[a - coin] + 1)
    return dp[amount] if dp[amount] != float('inf') else -1`,
    },
    timeComplexity: "O(amount * len(coins)) - 2 nested loops.",
    spaceComplexity: "O(amount) - 1D array of size amount + 1.",
    starterCode: `class Solution:
    def coinChange(self, coins: list[int], amount: int) -> int:
        pass
`,
    solutionCode: `class Solution:
    def coinChange(self, coins: list[int], amount: int) -> int:
        # dp[a] stores minimum coins needed for amount a
        dp = [float('inf')] * (amount + 1)
        # Base case: 0 coins needed to make amount 0
        dp[0] = 0

        for coin in coins:
            for a in range(coin, amount + 1):
                dp[a] = min(dp[a], dp[a - coin] + 1)

        return dp[amount] if dp[amount] != float('inf') else -1
`,
    testCases: [
      { id: 1, inputDesc: "coins=[1,2,5], amount=11", expectedDesc: "3", args: [[1,2,5], 11], expected: 3 },
      { id: 2, inputDesc: "coins=[2], amount=3", expectedDesc: "-1", args: [[2], 3], expected: -1 },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.coinChange([1,2,5], 11)
r2 = sol.coinChange([2], 3)
passed = (r1 == 3 and r2 == -1)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == 3, "actual": r1, "expected": 3},
    {"testCase": 2, "passed": r2 == -1, "actual": r2, "expected": -1}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-dp1-5",
    title: "Longest Increasing Subsequence",
    slug: "longest-increasing-subsequence",
    level: 4,
    category: "1D Dynamic Programming",
    difficulty: "Medium",
    acceptanceRate: "54.8%",
    description: `Given an integer array \`nums\`, return the length of the longest strictly increasing subsequence. Can solve in **O(n log n)** using Patience Sorting / Binary Search.`,
    examples: [
      { input: "nums = [10,9,2,5,3,7,101,18]", output: "4", explanation: "The longest increasing subsequence is [2,3,7,101], therefore the length is 4." },
      { input: "nums = [0,1,0,3,2,3]", output: "4" },
      { input: "nums = [7,7,7,7,7,7,7]", output: "1" },
    ],
    constraints: ["1 <= nums.length <= 2500", "-10^4 <= nums[i] <= 10^4"],
    patternIntuition: {
      ruleOfThumb: "Patience Sorting in O(N log N): Maintain `tails` array where `tails[i]` stores the smallest tail of all increasing subsequences of length `i+1`. For each number, use `bisect_left` to binary search its insert position in `tails`. If position equals len(tails), append; otherwise overwrite.",
      recognitionTriggers: ["Longest increasing subsequence optimized beyond O(N^2) to O(N log N)"],
      commonPitfalls: ["Thinking `tails` contains the actual subsequence: `tails` only preserves the optimal tail boundaries to accurately compute the maximum length!"],
      templateSnippet: `def lengthOfLIS(nums: list[int]) -> int:
    tails = []
    for x in nums:
        idx = bisect.bisect_left(tails, x)
        if idx == len(tails): tails.append(x)
        else: tails[idx] = x
    return len(tails)`,
    },
    timeComplexity: "O(N log N) - Binary search on tails array.",
    spaceComplexity: "O(N) - Tails array.",
    starterCode: `class Solution:
    def lengthOfLIS(self, nums: list[int]) -> int:
        pass
`,
    solutionCode: `import bisect

class Solution:
    def lengthOfLIS(self, nums: list[int]) -> int:
        # tails[i] stores smallest tail element of an increasing subsequence of length i + 1
        tails = []

        for num in nums:
            # Binary search: find index of first element in tails >= num
            idx = bisect.bisect_left(tails, num)

            # If num is strictly greater than all tails, extend the longest subsequence
            if idx == len(tails):
                tails.append(num)
            else:
                # Overwrite tail to allow future numbers to build on a smaller tail value
                tails[idx] = num

        return len(tails)
`,
    testCases: [
      { id: 1, inputDesc: "nums = [10,9,2,5,3,7,101,18]", expectedDesc: "4", args: [[10,9,2,5,3,7,101,18]], expected: 4 },
      { id: 2, inputDesc: "nums = [0,1,0,3,2,3]", expectedDesc: "4", args: [[0,1,0,3,2,3]], expected: 4 },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.lengthOfLIS([10,9,2,5,3,7,101,18])
r2 = sol.lengthOfLIS([0,1,0,3,2,3])
passed = (r1 == 4 and r2 == 4)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == 4, "actual": r1, "expected": 4},
    {"testCase": 2, "passed": r2 == 4, "actual": r2, "expected": 4}
]}))
print("JSON_OUTPUT_END")
`,
  },
];
