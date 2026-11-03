import { DSAProblem } from "./types";

export const TWO_POINTERS_PROBLEMS: DSAProblem[] = [
  {
    id: "dsa-tp-1",
    title: "Valid Palindrome",
    slug: "valid-palindrome",
    level: 1,
    category: "Two Pointers",
    difficulty: "Easy",
    acceptanceRate: "47.8%",
    description: `A phrase is a **palindrome** if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.

Given a string \`s\`, return \`true\` if it is a palindrome, or \`false\` otherwise.`,
    examples: [
      { input: 's = "A man, a plan, a canal: Panama"', output: "true", explanation: '"amanaplanacanalpanama" is a palindrome.' },
      { input: 's = "race a car"', output: "false", explanation: '"raceacar" is not a palindrome.' },
      { input: 's = " "', output: "true" },
    ],
    constraints: ["1 <= s.length <= 2 * 10^5", "s consists only of printable ASCII characters."],
    patternIntuition: {
      ruleOfThumb: "Use Two Pointers converging from left (index 0) and right (index len - 1), skipping non-alphanumeric characters and comparing in O(1) extra space.",
      recognitionTriggers: ["Checking symmetry from outer boundaries inwards", "O(1) memory requirement without creating new reversed string copies"],
      commonPitfalls: ["Forgetting that digits are alphanumeric (`c.isalnum()`)", "Index out of bounds when skipping non-alphanumeric characters"],
      templateSnippet: `def isPalindrome(s: str) -> bool:
    l, r = 0, len(s) - 1
    while l < r:
        while l < r and not s[l].isalnum(): l += 1
        while l < r and not s[r].isalnum(): r -= 1
        if s[l].lower() != s[r].lower(): return False
        l, r = l + 1, r - 1
    return True`,
    },
    timeComplexity: "O(N) - Left and right pointers traverse the string at most once.",
    spaceComplexity: "O(1) - In-place two pointer comparison.",
    starterCode: `class Solution:
    def isPalindrome(self, s: str) -> bool:
        pass
`,
    solutionCode: `class Solution:
    def isPalindrome(self, s: str) -> bool:
        # Pointers converging from outer edges
        left, right = 0, len(s) - 1

        while left < right:
            # Skip non-alphanumeric characters from left
            while left < right and not s[left].isalnum():
                left += 1
            # Skip non-alphanumeric characters from right
            while left < right and not s[right].isalnum():
                right -= 1

            # Case-insensitive character comparison
            if s[left].lower() != s[right].lower():
                return False

            left += 1
            right -= 1

        return True
`,
    testCases: [
      { id: 1, inputDesc: 's = "A man, a plan, a canal: Panama"', expectedDesc: "true", args: ["A man, a plan, a canal: Panama"], expected: true },
      { id: 2, inputDesc: 's = "race a car"', expectedDesc: "false", args: ["race a car"], expected: false },
      { id: 3, inputDesc: 's = " "', expectedDesc: "true", args: [" "], expected: true },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
t1 = sol.isPalindrome("A man, a plan, a canal: Panama")
t2 = sol.isPalindrome("race a car")
t3 = sol.isPalindrome(" ")
passed = (t1 == True and t2 == False and t3 == True)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": t1 == True, "actual": t1, "expected": True},
    {"testCase": 2, "passed": t2 == False, "actual": t2, "expected": False},
    {"testCase": 3, "passed": t3 == True, "actual": t3, "expected": True}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-tp-2",
    title: "Two Sum II - Input Array Is Sorted",
    slug: "two-sum-ii-input-array-is-sorted",
    level: 2,
    category: "Two Pointers",
    difficulty: "Medium",
    acceptanceRate: "61.3%",
    description: `Given a **1-indexed** array of integers \`numbers\` that is already **sorted in non-decreasing order**, find two numbers such that they add up to a specific \`target\` number.

Return the indices of the two numbers, \`index1\` and \`index2\`, added by one as an integer array \`[index1, index2]\` of length 2.

You may not use the same element twice. Your solution must use only **O(1) extra space**.`,
    examples: [
      { input: "numbers = [2,7,11,15], target = 9", output: "[1,2]" },
      { input: "numbers = [2,3,4], target = 6", output: "[1,3]" },
      { input: "numbers = [-1,0], target = -1", output: "[1,2]" },
    ],
    constraints: ["2 <= numbers.length <= 3 * 10^4", "-1000 <= numbers[i] <= 1000", "numbers is sorted in non-decreasing order.", "Exactly one solution exists."],
    patternIntuition: {
      ruleOfThumb: "Because array is sorted, sum(left, right) > target means right pointer must move left; sum < target means left pointer must move right.",
      recognitionTriggers: ["Sorted array pair search", "O(1) auxiliary space required"],
      commonPitfalls: ["Forgetting 1-indexed output conversion"],
      templateSnippet: `def twoSum(numbers: list[int], target: int) -> list[int]:
    l, r = 0, len(numbers) - 1
    while l < r:
        s = numbers[l] + numbers[r]
        if s == target: return [l + 1, r + 1]
        elif s < target: l += 1
        else: r -= 1`,
    },
    timeComplexity: "O(N) - Linear two pointer traversal.",
    spaceComplexity: "O(1) - Constant auxiliary space.",
    starterCode: `class Solution:
    def twoSum(self, numbers: list[int], target: int) -> list[int]:
        pass
`,
    solutionCode: `class Solution:
    def twoSum(self, numbers: list[int], target: int) -> list[int]:
        left = 0
        right = len(numbers) - 1

        while left < right:
            current_sum = numbers[left] + numbers[right]

            # Exact match found: convert to 1-based indexing
            if current_sum == target:
                return [left + 1, right + 1]
            elif current_sum < target:
                # Sum too small -> increment left to increase sum
                left += 1
            else:
                # Sum too large -> decrement right to decrease sum
                right -= 1

        return []
`,
    testCases: [
      { id: 1, inputDesc: "numbers = [2,7,11,15], target = 9", expectedDesc: "[1,2]", args: [[2,7,11,15], 9], expected: [1,2] },
      { id: 2, inputDesc: "numbers = [2,3,4], target = 6", expectedDesc: "[1,3]", args: [[2,3,4], 6], expected: [1,3] },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.twoSum([2,7,11,15], 9)
r2 = sol.twoSum([2,3,4], 6)
passed = (r1 == [1, 2] and r2 == [1, 3])

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == [1, 2], "actual": r1, "expected": [1, 2]},
    {"testCase": 2, "passed": r2 == [1, 3], "actual": r2, "expected": [1, 3]}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-tp-3",
    title: "3Sum",
    slug: "3sum",
    level: 3,
    category: "Two Pointers",
    difficulty: "Medium",
    acceptanceRate: "34.7%",
    description: `Given an integer array \`nums\`, return all the triplets \`[nums[i], nums[j], nums[k]]\` such that \`i != j\`, \`i != k\`, and \`j != k\`, and \`nums[i] + nums[j] + nums[k] == 0\`.

Notice that the solution set must not contain duplicate triplets.`,
    examples: [
      { input: "nums = [-1,0,1,2,-1,-4]", output: "[[-1,-1,2],[-1,0,1]]" },
      { input: "nums = [0,1,1]", output: "[]" },
      { input: "nums = [0,0,0]", output: "[[0,0,0]]" },
    ],
    constraints: ["3 <= nums.length <= 3000", "-10^5 <= nums[i] <= 10^5"],
    patternIntuition: {
      ruleOfThumb: "Sort the array in O(N log N). Fix the first element nums[i], then run Two Pointers on the remaining subarray to find pairs summing to -nums[i]. Skip duplicate elements to guarantee uniqueness.",
      recognitionTriggers: ["Finding 3 elements summing to target with duplicate prevention", "Reducing O(N^3) brute force to O(N^2)"],
      commonPitfalls: ["Failing to advance pointers past identical numbers, leading to duplicate output triplets"],
      templateSnippet: `def threeSum(nums: list[int]) -> list[list[int]]:
    nums.sort()
    res = []
    for i in range(len(nums) - 2):
        if i > 0 and nums[i] == nums[i-1]: continue
        l, r = i + 1, len(nums) - 1
        while l < r:
            s = nums[i] + nums[l] + nums[r]
            if s == 0:
                res.append([nums[i], nums[l], nums[r]])
                while l < r and nums[l] == nums[l+1]: l += 1
                while l < r and nums[r] == nums[r-1]: r -= 1
                l, r = l + 1, r - 1
            elif s < 0: l += 1
            else: r -= 1
    return res`,
    },
    timeComplexity: "O(N^2) - Sorting takes O(N log N); outer loop runs N times with nested O(N) two pointer search.",
    spaceComplexity: "O(1) or O(N) depending on Python sort implementation.",
    starterCode: `class Solution:
    def threeSum(self, nums: list[int]) -> list[list[int]]:
        pass
`,
    solutionCode: `class Solution:
    def threeSum(self, nums: list[int]) -> list[list[int]]:
        # Sort array to enable two-pointer convergence: O(N log N)
        nums.sort()
        triplets = []
        n = len(nums)

        for i in range(n - 2):
            # If current minimum number is > 0, three positive numbers cannot sum to 0
            if nums[i] > 0:
                break
            # Skip duplicate values for the fixed first element
            if i > 0 and nums[i] == nums[i - 1]:
                continue

            left = i + 1
            right = n - 1

            while left < right:
                total = nums[i] + nums[left] + nums[right]

                if total == 0:
                    triplets.append([nums[i], nums[left], nums[right]])
                    # Skip duplicate values for second element
                    while left < right and nums[left] == nums[left + 1]:
                        left += 1
                    # Skip duplicate values for third element
                    while left < right and nums[right] == nums[right - 1]:
                        right -= 1
                    left += 1
                    right -= 1
                elif total < 0:
                    left += 1
                else:
                    right -= 1

        return triplets
`,
    testCases: [
      { id: 1, inputDesc: "nums = [-1,0,1,2,-1,-4]", expectedDesc: "[[-1,-1,2],[-1,0,1]]", args: [[-1,0,1,2,-1,-4]], expected: [[-1,-1,2],[-1,0,1]] },
      { id: 2, inputDesc: "nums = [0,0,0]", expectedDesc: "[[0,0,0]]", args: [[0,0,0]], expected: [[0,0,0]] },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sorted([sorted(t) for t in sol.threeSum([-1,0,1,2,-1,-4])])
exp1 = sorted([sorted(t) for t in [[-1,-1,2],[-1,0,1]]])
r2 = sol.threeSum([0,0,0])
passed = (r1 == exp1 and r2 == [[0,0,0]])

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == exp1, "actual": r1, "expected": exp1},
    {"testCase": 2, "passed": r2 == [[0,0,0]], "actual": r2, "expected": [[0,0,0]]}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-tp-4",
    title: "Container With Most Water",
    slug: "container-with-most-water",
    level: 3,
    category: "Two Pointers",
    difficulty: "Medium",
    acceptanceRate: "55.4%",
    description: `You are given an integer array \`height\` of length \`n\`. There are \`n\` vertical lines drawn such that the two endpoints of the \`i-th\` line are \`(i, 0)\` and \`(i, height[i])\`.

Find two lines that together with the x-axis form a container, such that the container contains the most water.

Return the maximum amount of water a container can store. Notice that you may not slant the container.`,
    examples: [
      { input: "height = [1,8,6,2,5,4,8,3,7]", output: "49", explanation: "The above vertical lines are represented by array [1,8,6,2,5,4,8,3,7]. In this case, the max area is 49." },
      { input: "height = [1,1]", output: "1" },
    ],
    constraints: ["n == height.length", "2 <= n <= 10^5", "0 <= height[i] <= 10^4"],
    patternIntuition: {
      ruleOfThumb: "Area = min(height[left], height[right]) * (right - left). Since width always decreases as pointers converge, the ONLY way to find a larger area is to move the shorter boundary inwards!",
      recognitionTriggers: ["Maximizing volume/area bounded by two endpoints", "Greedy pointer convergence"],
      commonPitfalls: ["Moving the taller pointer (which guarantees a strictly smaller area since width shrinks and height cannot increase)"],
      templateSnippet: `def maxArea(height: list[int]) -> int:
    l, r = 0, len(height) - 1
    max_a = 0
    while l < r:
        max_a = max(max_a, min(height[l], height[r]) * (r - l))
        if height[l] < height[r]: l += 1
        else: r -= 1
    return max_a`,
    },
    timeComplexity: "O(N) - Single pass with two pointers.",
    spaceComplexity: "O(1) - Constant auxiliary space.",
    starterCode: `class Solution:
    def maxArea(self, height: list[int]) -> int:
        pass
`,
    solutionCode: `class Solution:
    def maxArea(self, height: list[int]) -> int:
        left = 0
        right = len(height) - 1
        max_water = 0

        while left < right:
            # Width between vertical lines
            width = right - left
            # Bottleneck height is determined by the shorter line
            min_height = min(height[left], height[right])
            # Update maximum area
            max_water = max(max_water, width * min_height)

            # Greedily move the shorter boundary in search of a taller line
            if height[left] < height[right]:
                left += 1
            else:
                right -= 1

        return max_water
`,
    testCases: [
      { id: 1, inputDesc: "height = [1,8,6,2,5,4,8,3,7]", expectedDesc: "49", args: [[1,8,6,2,5,4,8,3,7]], expected: 49 },
      { id: 2, inputDesc: "height = [1,1]", expectedDesc: "1", args: [[1,1]], expected: 1 },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.maxArea([1,8,6,2,5,4,8,3,7])
r2 = sol.maxArea([1,1])
passed = (r1 == 49 and r2 == 1)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == 49, "actual": r1, "expected": 49},
    {"testCase": 2, "passed": r2 == 1, "actual": r2, "expected": 1}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-tp-5",
    title: "Trapping Rain Water",
    slug: "trapping-rain-water",
    level: 4,
    category: "Two Pointers",
    difficulty: "Hard",
    acceptanceRate: "61.2%",
    description: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.`,
    examples: [
      { input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]", output: "6" },
      { input: "height = [4,2,0,3,2,5]", output: "9" },
    ],
    constraints: ["n == height.length", "1 <= n <= 2 * 10^4", "0 <= height[i] <= 10^5"],
    patternIntuition: {
      ruleOfThumb: "Water at index i is determined by min(max_left, max_right) - height[i]. With two pointers, whichever side has the lower max bound acts as the true bottleneck!",
      recognitionTriggers: ["Trapped liquid/volume calculations", "Subproblem bounded by prefix and suffix maximums"],
      commonPitfalls: ["Moving the larger boundary pointer first"],
      templateSnippet: `def trap(height: list[int]) -> int:
    l, r = 0, len(height) - 1
    max_l = max_r = water = 0
    while l < r:
        if height[l] < height[r]:
            if height[l] >= max_l: max_l = height[l]
            else: water += max_l - height[l]
            l += 1
        else:
            if height[r] >= max_r: max_r = height[r]
            else: water += max_r - height[r]
            r -= 1
    return water`,
    },
    timeComplexity: "O(N) - Linear two pointer pass.",
    spaceComplexity: "O(1) - Constant auxiliary memory.",
    starterCode: `class Solution:
    def trap(self, height: list[int]) -> int:
        pass
`,
    solutionCode: `class Solution:
    def trap(self, height: list[int]) -> int:
        if not height:
            return 0

        left, right = 0, len(height) - 1
        left_max = height[left]
        right_max = height[right]
        total_water = 0

        while left < right:
            # The side with smaller boundary is the bottleneck
            if left_max < right_max:
                left += 1
                left_max = max(left_max, height[left])
                total_water += left_max - height[left]
            else:
                right -= 1
                right_max = max(right_max, height[right])
                total_water += right_max - height[right]

        return total_water
`,
    testCases: [
      { id: 1, inputDesc: "height = [0,1,0,2,1,0,1,3,2,1,2,1]", expectedDesc: "6", args: [[0,1,0,2,1,0,1,3,2,1,2,1]], expected: 6 },
      { id: 2, inputDesc: "height = [4,2,0,3,2,5]", expectedDesc: "9", args: [[4,2,0,3,2,5]], expected: 9 },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.trap([0,1,0,2,1,0,1,3,2,1,2,1])
r2 = sol.trap([4,2,0,3,2,5])
passed = (r1 == 6 and r2 == 9)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == 6, "actual": r1, "expected": 6},
    {"testCase": 2, "passed": r2 == 9, "actual": r2, "expected": 9}
]}))
print("JSON_OUTPUT_END")
`,
  },
];
