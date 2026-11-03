import { DSAProblem } from "./types";

export const GREEDY_PROBLEMS: DSAProblem[] = [
  {
    id: "dsa-grd-1",
    title: "Maximum Subarray (Kadane's Algorithm)",
    slug: "maximum-subarray",
    level: 2,
    category: "Greedy Algorithms",
    difficulty: "Medium",
    acceptanceRate: "51.1%",
    description: `Given an integer array \`nums\`, find the subarray with the largest sum, and return its sum. Must run in **O(n)** time.`,
    examples: [
      { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6", explanation: "The subarray [4,-1,2,1] has the largest sum 6." },
      { input: "nums = [1]", output: "1" },
      { input: "nums = [5,4,-1,7,8]", output: "23" },
    ],
    constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    patternIntuition: {
      ruleOfThumb: "Kadane's Algorithm: Maintain running `current_sum`. If `current_sum < 0`, discard the prefix and reset to 0 because a negative prefix can only hurt future sums!",
      recognitionTriggers: ["Contiguous subarray maximizing sum"],
      commonPitfalls: ["Initializing max_sum with 0 instead of `nums[0]` or `-inf` (fails when all numbers are negative!)"],
      templateSnippet: `def maxSubArray(nums: list[int]) -> int:
    max_sum = nums[0]
    cur_sum = 0
    for n in nums:
        cur_sum = max(cur_sum, 0) + n
        max_sum = max(max_sum, cur_sum)
    return max_sum`,
    },
    timeComplexity: "O(N) - Single pass.",
    spaceComplexity: "O(1) - Constant variables.",
    starterCode: `class Solution:
    def maxSubArray(self, nums: list[int]) -> int:
        pass
`,
    solutionCode: `class Solution:
    def maxSubArray(self, nums: list[int]) -> int:
        max_sum = nums[0]
        current_sum = 0

        for num in nums:
            # If current_sum has become negative, reset to 0 before adding num
            current_sum = max(current_sum, 0) + num
            # Track global maximum
            max_sum = max(max_sum, current_sum)

        return max_sum
`,
    testCases: [
      { id: 1, inputDesc: "nums = [-2,1,-3,4,-1,2,1,-5,4]", expectedDesc: "6", args: [[-2,1,-3,4,-1,2,1,-5,4]], expected: 6 },
      { id: 2, inputDesc: "nums = [-1]", expectedDesc: "-1", args: [[-1]], expected: -1 },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.maxSubArray([-2,1,-3,4,-1,2,1,-5,4])
r2 = sol.maxSubArray([-1])
passed = (r1 == 6 and r2 == -1)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == 6, "actual": r1, "expected": 6},
    {"testCase": 2, "passed": r2 == -1, "actual": r2, "expected": -1}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-grd-2",
    title: "Jump Game",
    slug: "jump-game",
    level: 3,
    category: "Greedy Algorithms",
    difficulty: "Medium",
    acceptanceRate: "39.1%",
    description: `You are given an integer array \`nums\`. You are initially positioned at the array's first index, and each element in the array represents your maximum jump length at that position. Return \`true\` if you can reach the last index, or \`false\` otherwise.`,
    examples: [
      { input: "nums = [2,3,1,1,4]", output: "true", explanation: "Jump 1 step from index 0 to 1, then 3 steps to the last index." },
      { input: "nums = [3,2,1,0,4]", output: "false" },
    ],
    constraints: ["1 <= nums.length <= 10^4", "0 <= nums[i] <= 10^5"],
    patternIntuition: {
      ruleOfThumb: "Greedy Goal Post Shift: Iterate backwards starting from the target end index. If index `i + nums[i] >= goal`, shift `goal = i`. If `goal == 0` at the end, the start can reach the target!",
      recognitionTriggers: ["Reaching target index through variable jump steps"],
      commonPitfalls: ["Simulating all jump combinations with exponential recursion O(2^N)"],
      templateSnippet: `def canJump(nums: list[int]) -> bool:
    goal = len(nums) - 1
    for i in range(len(nums) - 2, -1, -1):
        if i + nums[i] >= goal: goal = i
    return goal == 0`,
    },
    timeComplexity: "O(N) - Single backwards linear pass.",
    spaceComplexity: "O(1) - Single goal variable.",
    starterCode: `class Solution:
    def canJump(self, nums: list[int]) -> bool:
        pass
`,
    solutionCode: `class Solution:
    def canJump(self, nums: list[int]) -> bool:
        # Move goal post backward from destination
        goal = len(nums) - 1

        for i in range(len(nums) - 2, -1, -1):
            # If current index can jump to or past current goal, shift goal to i
            if i + nums[i] >= goal:
                goal = i

        return goal == 0
`,
    testCases: [
      { id: 1, inputDesc: "nums = [2,3,1,1,4]", expectedDesc: "true", args: [[2,3,1,1,4]], expected: true },
      { id: 2, inputDesc: "nums = [3,2,1,0,4]", expectedDesc: "false", args: [[3,2,1,0,4]], expected: false },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.canJump([2,3,1,1,4])
r2 = sol.canJump([3,2,1,0,4])
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
    id: "dsa-grd-3",
    title: "Jump Game II",
    slug: "jump-game-ii",
    level: 4,
    category: "Greedy Algorithms",
    difficulty: "Medium",
    acceptanceRate: "45.8%",
    description: `You are given a 0-indexed array of integers \`nums\` of length \`n\`. Return the minimum number of jumps to reach \`nums[n - 1]\`. Test cases guarantee you can reach the end.`,
    examples: [
      { input: "nums = [2,3,1,1,4]", output: "2", explanation: "The minimum number of jumps to reach the last index is 2. Jump 1 step from index 0 to 1, then 3 steps to the last index." },
      { input: "nums = [2,3,0,1,4]", output: "2" },
    ],
    constraints: ["1 <= nums.length <= 10^4", "0 <= nums[i] <= 1000"],
    patternIntuition: {
      ruleOfThumb: "BFS Level by Level with Two Pointers [left, right]: In current jump window `[l, r]`, determine the farthest reachable index `farthest = max(i + nums[i])`. Then set `l = r + 1`, `r = farthest`, and increment jump count.",
      recognitionTriggers: ["Minimum number of jumps in unweighted shortest path graph"],
      commonPitfalls: ["Updating jumps inside the inner loop instead of at boundary `r`"],
      templateSnippet: `def jump(nums: list[int]) -> int:
    res = l = r = 0
    while r < len(nums) - 1:
        farthest = 0
        for i in range(l, r + 1):
            farthest = max(farthest, i + nums[i])
        l, r = r + 1, farthest
        res += 1
    return res`,
    },
    timeComplexity: "O(N) - Linear two pointer BFS.",
    spaceComplexity: "O(1) - Constant variables.",
    starterCode: `class Solution:
    def jump(self, nums: list[int]) -> int:
        pass
`,
    solutionCode: `class Solution:
    def jump(self, nums: list[int]) -> int:
        jumps = 0
        left = 0
        right = 0

        # Continue BFS levels until window right boundary reaches last index
        while right < len(nums) - 1:
            farthest = 0
            # Search within current jump window for farthest reachable index
            for i in range(left, right + 1):
                farthest = max(farthest, i + nums[i])

            # Next jump level spans from right + 1 to farthest
            left = right + 1
            right = farthest
            jumps += 1

        return jumps
`,
    testCases: [
      { id: 1, inputDesc: "nums = [2,3,1,1,4]", expectedDesc: "2", args: [[2,3,1,1,4]], expected: 2 },
      { id: 2, inputDesc: "nums = [2,3,0,1,4]", expectedDesc: "2", args: [[2,3,0,1,4]], expected: 2 },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.jump([2,3,1,1,4])
r2 = sol.jump([2,3,0,1,4])
passed = (r1 == 2 and r2 == 2)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == 2, "actual": r1, "expected": 2},
    {"testCase": 2, "passed": r2 == 2, "actual": r2, "expected": 2}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-grd-4",
    title: "Gas Station",
    slug: "gas-station",
    level: 4,
    category: "Greedy Algorithms",
    difficulty: "Medium",
    acceptanceRate: "45.6%",
    description: `There are \`n\` gas stations along a circular route, where the amount of gas at the \`i-th\` station is \`gas[i]\`. You have a car with an unlimited gas tank and it costs \`cost[i]\` of gas to travel from the \`i-th\` station to its next \`(i + 1)-th\` station. Return the starting gas station's index if you can travel around the circuit once, otherwise return \`-1\`.`,
    examples: [
      { input: "gas = [1,2,3,4,5], cost = [3,4,5,1,2]", output: "3" },
      { input: "gas = [2,3,4], cost = [3,4,3]", output: "-1" },
    ],
    constraints: ["n == gas.length == cost.length", "1 <= n <= 10^5", "0 <= gas[i], cost[i] <= 10^4"],
    patternIntuition: {
      ruleOfThumb: "1) If `sum(gas) < sum(cost)`, completing a full circuit is impossible (return -1). 2) If `current_tank` dips below 0 starting at index `start`, NO STATION between `start` and `current` can be valid! Reset `start = current + 1` and `current_tank = 0`.",
      recognitionTriggers: ["Circular deficit accumulation"],
      commonPitfalls: ["Simulating full circular tour for every station: O(N^2) instead of O(N)"],
      templateSnippet: `def canCompleteCircuit(gas: list[int], cost: list[int]) -> int:
    if sum(gas) < sum(cost): return -1
    total, start = 0, 0
    for i in range(len(gas)):
        total += gas[i] - cost[i]
        if total < 0:
            total = 0
            start = i + 1
    return start`,
    },
    timeComplexity: "O(N) - Single linear pass.",
    spaceComplexity: "O(1) - Constant variables.",
    starterCode: `class Solution:
    def canCompleteCircuit(self, gas: list[int], cost: list[int]) -> int:
        pass
`,
    solutionCode: `class Solution:
    def canCompleteCircuit(self, gas: list[int], cost: list[int]) -> int:
        # If total gas available is less than total cost, circuit is impossible
        if sum(gas) < sum(cost):
            return -1

        current_tank = 0
        starting_station = 0

        for i in range(len(gas)):
            current_tank += gas[i] - cost[i]

            # If tank dips below 0, station i (and all stations between start and i) cannot be the starting point
            if current_tank < 0:
                current_tank = 0
                starting_station = i + 1

        return starting_station
`,
    testCases: [
      { id: 1, inputDesc: "gas=[1,2,3,4,5], cost=[3,4,5,1,2]", expectedDesc: "3", args: [[1,2,3,4,5], [3,4,5,1,2]], expected: 3 },
      { id: 2, inputDesc: "gas=[2,3,4], cost=[3,4,3]", expectedDesc: "-1", args: [[2,3,4], [3,4,3]], expected: -1 },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.canCompleteCircuit([1,2,3,4,5], [3,4,5,1,2])
r2 = sol.canCompleteCircuit([2,3,4], [3,4,3])
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
    id: "dsa-grd-5",
    title: "Hand of Straights",
    slug: "hand-of-straights",
    level: 3,
    category: "Greedy Algorithms",
    difficulty: "Medium",
    acceptanceRate: "56.4%",
    description: `Alice has some number of cards and she wants to rearrange the cards into groups so that each group is of size \`groupSize\`, and consists of \`groupSize\` consecutive cards. Return \`true\` if she can, or \`false\` otherwise.`,
    examples: [
      { input: "hand = [1,2,3,6,2,3,4,7,8], groupSize = 3", output: "true" },
      { input: "hand = [1,2,3,4,5], groupSize = 4", output: "false" },
    ],
    constraints: ["1 <= hand.length <= 10^4", "0 <= hand[i] <= 10^9", "1 <= groupSize <= hand.length"],
    patternIntuition: {
      ruleOfThumb: "Greedy Smallest Card Match: Count frequencies with Counter. Use a Min-Heap of unique cards. Repeatedly pop the smallest card, and verify that the next `groupSize - 1` consecutive numbers exist and decrement their counts.",
      recognitionTriggers: ["Partitioning into consecutive sequences of length K"],
      commonPitfalls: ["`len(hand) % groupSize != 0` check must be done at the very start"],
      templateSnippet: `def isNStraightHand(hand: list[int], groupSize: int) -> bool:
    if len(hand) % groupSize != 0: return False
    count = collections.Counter(hand)
    min_h = list(count.keys())
    heapq.heapify(min_h)
    while min_h:
        first = min_h[0]
        for i in range(first, first + groupSize):
            if count[i] == 0: return False
            count[i] -= 1
            if count[i] == 0:
                if i != heapq.heappop(min_h): return False
    return True`,
    },
    timeComplexity: "O(N log N) - Sorting unique keys in min-heap.",
    spaceComplexity: "O(N) - Frequency map and heap.",
    starterCode: `class Solution:
    def isNStraightHand(self, hand: list[int], groupSize: int) -> bool:
        pass
`,
    solutionCode: `import heapq
from collections import Counter

class Solution:
    def isNStraightHand(self, hand: list[int], groupSize: int) -> bool:
        # Total cards must be evenly divisible by groupSize
        if len(hand) % groupSize != 0:
            return False

        counts = Counter(hand)
        min_heap = list(counts.keys())
        heapq.heapify(min_heap)

        while min_heap:
            first = min_heap[0]

            # Greedily form group starting with current smallest available card
            for card in range(first, first + groupSize):
                if counts[card] == 0:
                    return False
                counts[card] -= 1
                # If count exhausted, pop from min-heap
                if counts[card] == 0:
                    if card != heapq.heappop(min_heap):
                        return False

        return True
`,
    testCases: [
      { id: 1, inputDesc: "hand = [1,2,3,6,2,3,4,7,8], groupSize = 3", expectedDesc: "true", args: [[1,2,3,6,2,3,4,7,8], 3], expected: true },
      { id: 2, inputDesc: "hand = [1,2,3,4,5], groupSize = 4", expectedDesc: "false", args: [[1,2,3,4,5], 4], expected: false },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.isNStraightHand([1,2,3,6,2,3,4,7,8], 3)
r2 = sol.isNStraightHand([1,2,3,4,5], 4)
passed = (r1 == True and r2 == False)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == True, "actual": r1, "expected": True},
    {"testCase": 2, "passed": r2 == False, "actual": r2, "expected": False}
]}))
print("JSON_OUTPUT_END")
`,
  },
];
