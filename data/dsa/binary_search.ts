import { DSAProblem } from "./types";

export const BINARY_SEARCH_PROBLEMS: DSAProblem[] = [
  {
    id: "dsa-bs-1",
    title: "Binary Search",
    slug: "binary-search",
    level: 1,
    category: "Binary Search",
    difficulty: "Easy",
    acceptanceRate: "58.1%",
    description: `Given an array of integers \`nums\` which is sorted in ascending order, and an integer \`target\`, write a function to search \`target\` in \`nums\`. If \`target\` exists, then return its index. Otherwise, return \`-1\`.

You must write an algorithm with **O(log n)** runtime complexity.`,
    examples: [
      { input: "nums = [-1,0,3,5,9,12], target = 9", output: "4" },
      { input: "nums = [-1,0,3,5,9,12], target = 2", output: "-1" },
    ],
    constraints: ["1 <= nums.length <= 10^4", "-10^4 < nums[i], target < 10^4", "All the integers in nums are unique.", "nums is sorted in ascending order."],
    patternIntuition: {
      ruleOfThumb: "Divide and conquer: Cut search space in half each iteration by comparing target against `mid = left + (right - left) // 2`.",
      recognitionTriggers: ["Sorted array lookup with O(log N) requirement"],
      commonPitfalls: ["Integer overflow on `(left + right) // 2` in C++/Java (use `left + (right - left) // 2`)"],
      templateSnippet: `def search(nums: list[int], target: int) -> int:
    l, r = 0, len(nums) - 1
    while l <= r:
        m = l + (r - l) // 2
        if nums[m] == target: return m
        elif nums[m] < target: l = m + 1
        else: r = m - 1
    return -1`,
    },
    timeComplexity: "O(log N) - Search space halved on each iteration.",
    spaceComplexity: "O(1) - Iterative pointers.",
    starterCode: `class Solution:
    def search(self, nums: list[int], target: int) -> int:
        pass
`,
    solutionCode: `class Solution:
    def search(self, nums: list[int], target: int) -> int:
        left, right = 0, len(nums) - 1

        while left <= right:
            mid = left + (right - left) // 2
            if nums[mid] == target:
                return mid
            elif nums[mid] < target:
                left = mid + 1
            else:
                right = mid - 1

        return -1
`,
    testCases: [
      { id: 1, inputDesc: "nums=[-1,0,3,5,9,12], target=9", expectedDesc: "4", args: [[-1,0,3,5,9,12], 9], expected: 4 },
      { id: 2, inputDesc: "nums=[-1,0,3,5,9,12], target=2", expectedDesc: "-1", args: [[-1,0,3,5,9,12], 2], expected: -1 },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.search([-1,0,3,5,9,12], 9)
r2 = sol.search([-1,0,3,5,9,12], 2)
passed = (r1 == 4 and r2 == -1)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == 4, "actual": r1, "expected": 4},
    {"testCase": 2, "passed": r2 == -1, "actual": r2, "expected": -1}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-bs-2",
    title: "Search a 2D Matrix",
    slug: "search-a-2d-matrix",
    level: 2,
    category: "Binary Search",
    difficulty: "Medium",
    acceptanceRate: "50.1%",
    description: `You are given an \`m x n\` integer matrix \`matrix\` with the following two properties:
1. Each row is sorted in non-decreasing order.
2. The first integer of each row is greater than the last integer of the previous row.

Given an integer \`target\`, return \`true\` if \`target\` is in \`matrix\` or \`false\` otherwise. Must run in **O(log(m * n))** time.`,
    examples: [
      { input: "matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3", output: "true" },
      { input: "matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 13", output: "false" },
    ],
    constraints: ["m == matrix.length", "n == matrix[i].length", "1 <= m, n <= 100", "-10^4 <= matrix[i][j], target <= 10^4"],
    patternIntuition: {
      ruleOfThumb: "Treat the 2D matrix of shape `m x n` as a flattened 1D virtual array of size `m * n`. Virtual index `mid` maps to `matrix[mid // n][mid % n]` in O(1).",
      recognitionTriggers: ["Row and column sorted matrix forming a continuous sorted array"],
      commonPitfalls: ["Converting coordinates incorrectly: row is `mid // cols`, column is `mid % cols`"],
      templateSnippet: `def searchMatrix(matrix: list[list[int]], target: int) -> bool:
    m, n = len(matrix), len(matrix[0])
    l, r = 0, m * n - 1
    while l <= r:
        mid = (l + r) // 2
        val = matrix[mid // n][mid % n]
        if val == target: return True
        elif val < target: l = mid + 1
        else: r = mid - 1
    return False`,
    },
    timeComplexity: "O(log(M * N)) - Standard binary search over M * N elements.",
    spaceComplexity: "O(1) - Constant space coordinate mapping.",
    starterCode: `class Solution:
    def searchMatrix(self, matrix: list[list[int]], target: int) -> bool:
        pass
`,
    solutionCode: `class Solution:
    def searchMatrix(self, matrix: list[list[int]], target: int) -> bool:
        if not matrix or not matrix[0]:
            return False

        rows, cols = len(matrix), len(matrix[0])
        left = 0
        right = rows * cols - 1

        while left <= right:
            mid = left + (right - left) // 2
            # Map 1D virtual index into 2D row and column
            r = mid // cols
            c = mid % cols
            val = matrix[r][c]

            if val == target:
                return True
            elif val < target:
                left = mid + 1
            else:
                right = mid - 1

        return False
`,
    testCases: [
      { id: 1, inputDesc: "matrix=[[1,3,5,7],[10,11,16,20],[23,30,34,60]], target=3", expectedDesc: "true", args: [[[1,3,5,7],[10,11,16,20],[23,30,34,60]], 3], expected: true },
      { id: 2, inputDesc: "matrix=[[1,3,5,7],[10,11,16,20],[23,30,34,60]], target=13", expectedDesc: "false", args: [[[1,3,5,7],[10,11,16,20],[23,30,34,60]], 13], expected: false },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.searchMatrix([[1,3,5,7],[10,11,16,20],[23,30,34,60]], 3)
r2 = sol.searchMatrix([[1,3,5,7],[10,11,16,20],[23,30,34,60]], 13)
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
    id: "dsa-bs-3",
    title: "Koko Eating Bananas",
    slug: "koko-eating-bananas",
    level: 3,
    category: "Binary Search",
    difficulty: "Medium",
    acceptanceRate: "50.8%",
    description: `Koko loves to eat bananas. There are \`n\` piles of bananas, the \`i-th\` pile has \`piles[i]\` bananas. The guards will return in \`h\` hours.

Koko can decide her bananas-per-hour eating speed of \`k\`. Each hour, she chooses some pile of bananas and eats \`k\` bananas from that pile. If the pile has less than \`k\` bananas, she eats all of them instead and will not eat any more bananas during this hour.

Return the minimum integer \`k\` such that she can eat all the bananas within \`h\` hours.`,
    examples: [
      { input: "piles = [3,6,7,11], h = 8", output: "4" },
      { input: "piles = [30,11,23,4,20], h = 5", output: "30" },
      { input: "piles = [30,11,23,4,20], h = 6", output: "23" },
    ],
    constraints: ["1 <= piles.length <= 10^4", "piles.length <= h <= 10^9", "1 <= piles[i] <= 10^9"],
    patternIntuition: {
      ruleOfThumb: "Binary Search on the Answer Space: The speed k must lie in range [1, max(piles)]. For any speed mid, calculate total hours `sum(math.ceil(p / mid))`. If hours <= h, mid is feasible -> try smaller speed (search left).",
      recognitionTriggers: ["Finding the minimum/maximum valid rate/capacity that satisfies a time or cost threshold"],
      commonPitfalls: ["Using floating point ceiling `math.ceil(p/k)` which loses precision for numbers up to 10^9: use integer ceiling `(p + k - 1) // k`"],
      templateSnippet: `def minEatingSpeed(piles: list[int], h: int) -> int:
    l, r = 1, max(piles)
    ans = r
    while l <= r:
        m = (l + r) // 2
        hours = sum((p + m - 1) // m for p in piles)
        if hours <= h:
            ans = m
            r = m - 1
        else:
            l = m + 1
    return ans`,
    },
    timeComplexity: "O(N * log(max(piles))) - Verifying speed takes O(N) over log(max(piles)) range.",
    spaceComplexity: "O(1) - Constant space.",
    starterCode: `class Solution:
    def minEatingSpeed(self, piles: list[int], h: int) -> int:
        pass
`,
    solutionCode: `class Solution:
    def minEatingSpeed(self, piles: list[int], h: int) -> int:
        left = 1
        right = max(piles)
        best_speed = right

        while left <= right:
            speed = left + (right - left) // 2

            # Calculate total hours needed at current eating speed
            # (p + speed - 1) // speed performs integer ceiling division
            total_hours = sum((p + speed - 1) // speed for p in piles)

            if total_hours <= h:
                # Feasible speed -> record and try finding even slower speed
                best_speed = speed
                right = speed - 1
            else:
                # Too slow -> increase speed
                left = speed + 1

        return best_speed
`,
    testCases: [
      { id: 1, inputDesc: "piles=[3,6,7,11], h=8", expectedDesc: "4", args: [[3,6,7,11], 8], expected: 4 },
      { id: 2, inputDesc: "piles=[30,11,23,4,20], h=5", expectedDesc: "30", args: [[30,11,23,4,20], 5], expected: 30 },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.minEatingSpeed([3,6,7,11], 8)
r2 = sol.minEatingSpeed([30,11,23,4,20], 5)
passed = (r1 == 4 and r2 == 30)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == 4, "actual": r1, "expected": 4},
    {"testCase": 2, "passed": r2 == 30, "actual": r2, "expected": 30}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-bs-4",
    title: "Find Minimum in Rotated Sorted Array",
    slug: "find-minimum-in-rotated-sorted-array",
    level: 3,
    category: "Binary Search",
    difficulty: "Medium",
    acceptanceRate: "50.7%",
    description: `Suppose an array of length \`n\` sorted in ascending order is rotated between \`1\` and \`n\` times.

Given the sorted rotated array \`nums\` of **unique** elements, return the minimum element of this array. Must run in **O(log n)** time.`,
    examples: [
      { input: "nums = [3,4,5,1,2]", output: "1" },
      { input: "nums = [4,5,6,7,0,1,2]", output: "0" },
      { input: "nums = [11,13,15,17]", output: "11" },
    ],
    constraints: ["n == nums.length", "1 <= n <= 5000", "-5000 <= nums[i] <= 5000", "All the integers of nums are unique."],
    patternIntuition: {
      ruleOfThumb: "Compare `nums[mid]` against `nums[right]`. If `nums[mid] > nums[right]`, the rotation inflection point (minimum) lies in the right half (`left = mid + 1`). Otherwise, it lies in the left half including mid (`right = mid`).",
      recognitionTriggers: ["Finding inflection point / minimum in rotated sorted sequence"],
      commonPitfalls: ["Using `right = mid - 1` when `nums[mid] < nums[right]`: mid itself could be the minimum element!"],
      templateSnippet: `def findMin(nums: list[int]) -> int:
    l, r = 0, len(nums) - 1
    while l < r:
        m = (l + r) // 2
        if nums[m] > nums[r]: l = m + 1
        else: r = m
    return nums[l]`,
    },
    timeComplexity: "O(log N) - Logarithmic search.",
    spaceComplexity: "O(1) - Constant space.",
    starterCode: `class Solution:
    def findMin(self, nums: list[int]) -> int:
        pass
`,
    solutionCode: `class Solution:
    def findMin(self, nums: list[int]) -> int:
        left, right = 0, len(nums) - 1

        while left < right:
            mid = left + (right - left) // 2

            # If mid element is greater than rightmost element,
            # the pivot (minimum) must be in the right subarray
            if nums[mid] > nums[right]:
                left = mid + 1
            else:
                # Minimum is at mid or in the left subarray
                right = mid

        return nums[left]
`,
    testCases: [
      { id: 1, inputDesc: "nums=[3,4,5,1,2]", expectedDesc: "1", args: [[3,4,5,1,2]], expected: 1 },
      { id: 2, inputDesc: "nums=[4,5,6,7,0,1,2]", expectedDesc: "0", args: [[4,5,6,7,0,1,2]], expected: 0 },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.findMin([3,4,5,1,2])
r2 = sol.findMin([4,5,6,7,0,1,2])
passed = (r1 == 1 and r2 == 0)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == 1, "actual": r1, "expected": 1},
    {"testCase": 2, "passed": r2 == 0, "actual": r2, "expected": 0}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-bs-5",
    title: "Search in Rotated Sorted Array",
    slug: "search-in-rotated-sorted-array",
    level: 4,
    category: "Binary Search",
    difficulty: "Medium",
    acceptanceRate: "40.9%",
    description: `Given the array \`nums\` after the possible rotation and an integer \`target\`, return the index of \`target\` if it is in \`nums\`, or \`-1\` if it is not in \`nums\`. Must run in **O(log n)** time.`,
    examples: [
      { input: "nums = [4,5,6,7,0,1,2], target = 0", output: "4" },
      { input: "nums = [4,5,6,7,0,1,2], target = 3", output: "-1" },
      { input: "nums = [1], target = 0", output: "-1" },
    ],
    constraints: ["1 <= nums.length <= 5000", "-10^4 <= nums[i], target <= 10^4", "All values of nums are unique."],
    patternIntuition: {
      ruleOfThumb: "At any mid index, AT LEAST ONE HALF of the array is normally sorted. Identify which half is sorted (left half if `nums[left] <= nums[mid]`), check if target falls inside that sorted range, and discard the other half.",
      recognitionTriggers: ["Target lookup in sorted rotated array"],
      commonPitfalls: ["Using strictly `<` instead of `<=` for checking if left half is sorted (fails when left == mid)"],
      templateSnippet: `def search(nums: list[int], target: int) -> int:
    l, r = 0, len(nums) - 1
    while l <= r:
        m = (l + r) // 2
        if nums[m] == target: return m
        if nums[l] <= nums[m]: # Left sorted
            if nums[l] <= target < nums[m]: r = m - 1
            else: l = m + 1
        else: # Right sorted
            if nums[m] < target <= nums[r]: l = m + 1
            else: r = m - 1
    return -1`,
    },
    timeComplexity: "O(log N) - Logarithmic search.",
    spaceComplexity: "O(1) - In-place pointers.",
    starterCode: `class Solution:
    def search(self, nums: list[int], target: int) -> int:
        pass
`,
    solutionCode: `class Solution:
    def search(self, nums: list[int], target: int) -> int:
        left, right = 0, len(nums) - 1

        while left <= right:
            mid = left + (right - left) // 2

            if nums[mid] == target:
                return mid

            # Check if left half is normally sorted
            if nums[left] <= nums[mid]:
                if nums[left] <= target < nums[mid]:
                    right = mid - 1
                else:
                    left = mid + 1
            # Otherwise, right half must be normally sorted
            else:
                if nums[mid] < target <= nums[right]:
                    left = mid + 1
                else:
                    right = mid - 1

        return -1
`,
    testCases: [
      { id: 1, inputDesc: "nums=[4,5,6,7,0,1,2], target=0", expectedDesc: "4", args: [[4,5,6,7,0,1,2], 0], expected: 4 },
      { id: 2, inputDesc: "nums=[4,5,6,7,0,1,2], target=3", expectedDesc: "-1", args: [[4,5,6,7,0,1,2], 3], expected: -1 },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.search([4,5,6,7,0,1,2], 0)
r2 = sol.search([4,5,6,7,0,1,2], 3)
passed = (r1 == 4 and r2 == -1)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == 4, "actual": r1, "expected": 4},
    {"testCase": 2, "passed": r2 == -1, "actual": r2, "expected": -1}
]}))
print("JSON_OUTPUT_END")
`,
  },
];
