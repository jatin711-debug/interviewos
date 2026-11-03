import { DSAProblem } from "./types";

export const ARRAYS_HASHING_PROBLEMS: DSAProblem[] = [
  {
    id: "dsa-ah-1",
    title: "Two Sum",
    slug: "two-sum",
    level: 1,
    category: "Arrays & Hashing",
    difficulty: "Easy",
    acceptanceRate: "52.4%",
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice. You can return the answer in any order.`,
    examples: [
      {
        input: "nums = [2, 7, 11, 15], target = 9",
        output: "[0, 1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
      },
      {
        input: "nums = [3, 2, 4], target = 6",
        output: "[1, 2]",
      },
    ],
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists.",
    ],
    patternIntuition: {
      ruleOfThumb: "When looking for complementary pairs (x + y = target), turn O(N^2) brute force into O(N) by storing seen values in a HashMap.",
      recognitionTriggers: [
        "Unsorted array searching for pairs summing/differing by target",
        "Need exact index retrieval (so sorting would lose original indices unless paired with tuples)",
        "O(N) time required with O(N) space acceptable",
      ],
      commonPitfalls: [
        "Re-using the same element (e.g. nums[i] + nums[i] == target)",
        "Inserting everything into the hash map first before checking (fails if duplicate numbers exist like [3, 3])",
      ],
      templateSnippet: `def twoSum(nums: list[int], target: int) -> list[int]:
    seen = {} # val -> index
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []`,
    },
    timeComplexity: "O(N) - Single pass through the array with O(1) average hash map lookups.",
    spaceComplexity: "O(N) - Hash map storing up to N elements.",
    starterCode: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        # Write your solution here
        pass
`,
    solutionCode: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        # seen stores value -> index of previously visited elements
        seen = {}
        for i, num in enumerate(nums):
            # Calculate the complement required to reach target
            complement = target - num
            # If complement already seen, we found our unique pair
            if complement in seen:
                return [seen[complement], i]
            # Record current number and its index
            seen[num] = i
        return []
`,
    testCases: [
      { id: 1, inputDesc: "nums=[2, 7, 11, 15], target=9", expectedDesc: "[0, 1]", args: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { id: 2, inputDesc: "nums=[3, 2, 4], target=6", expectedDesc: "[1, 2]", args: [[3, 2, 4], 6], expected: [1, 2] },
      { id: 3, inputDesc: "nums=[3, 3], target=6", expectedDesc: "[0, 1]", args: [[3, 3], 6], expected: [0, 1] },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

test_cases = [
    ([2, 7, 11, 15], 9, [0, 1]),
    ([3, 2, 4], 6, [1, 2]),
    ([3, 3], 6, [0, 1]),
    ([-1, -2, -3, -4, -5], -8, [2, 4])
]
sol = Solution()
results = []
all_passed = True
for idx, (nums, target, expected) in enumerate(test_cases):
    try:
        actual = sol.twoSum(list(nums), target)
        passed = (sorted(actual) == sorted(expected)) if isinstance(actual, list) else False
        if not passed: all_passed = False
        results.append({"testCase": idx + 1, "passed": passed, "actual": actual, "expected": expected})
    except Exception as e:
        all_passed = False
        results.append({"testCase": idx + 1, "passed": False, "error": str(e)})

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": all_passed, "results": results}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-ah-2",
    title: "Contains Duplicate",
    slug: "contains-duplicate",
    level: 1,
    category: "Arrays & Hashing",
    difficulty: "Easy",
    acceptanceRate: "61.8%",
    description: `Given an integer array \`nums\`, return \`true\` if any value appears **at least twice** in the array, and return \`false\` if every element is distinct.`,
    examples: [
      { input: "nums = [1, 2, 3, 1]", output: "true" },
      { input: "nums = [1, 2, 3, 4]", output: "false" },
      { input: "nums = [1, 1, 1, 3, 3, 4, 3, 2, 4, 2]", output: "true" },
    ],
    constraints: ["1 <= nums.length <= 10^5", "-10^9 <= nums[i] <= 10^9"],
    patternIntuition: {
      ruleOfThumb: "Use a HashSet to record unique elements encountered. If an element is already in the set, a duplicate exists.",
      recognitionTriggers: ["Checking for duplicates or uniqueness in an unconstrained array", "O(N) time with O(N) space acceptable"],
      commonPitfalls: ["Using nested loops O(N^2) which TLEs on 10^5 elements"],
      templateSnippet: `def containsDuplicate(nums: list[int]) -> bool:
    return len(nums) != len(set(nums))`,
    },
    timeComplexity: "O(N) - Traversing nums once with O(1) hash set lookups.",
    spaceComplexity: "O(N) - Storing up to N distinct elements in the hash set.",
    starterCode: `class Solution:
    def containsDuplicate(self, nums: list[int]) -> bool:
        pass
`,
    solutionCode: `class Solution:
    def containsDuplicate(self, nums: list[int]) -> bool:
        # seen stores all unique elements visited so far
        seen = set()
        for num in nums:
            # If the current number already exists in set, we found a duplicate
            if num in seen:
                return True
            seen.add(num)
        # All elements were distinct
        return False
`,
    testCases: [
      { id: 1, inputDesc: "nums = [1, 2, 3, 1]", expectedDesc: "true", args: [[1, 2, 3, 1]], expected: true },
      { id: 2, inputDesc: "nums = [1, 2, 3, 4]", expectedDesc: "false", args: [[1, 2, 3, 4]], expected: false },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

test_cases = [([1, 2, 3, 1], True), ([1, 2, 3, 4], False), ([1, 1, 1, 3, 3, 4, 3, 2, 4, 2], True)]
sol = Solution()
results = []
all_passed = True
for idx, (nums, expected) in enumerate(test_cases):
    try:
        actual = sol.containsDuplicate(list(nums))
        passed = (actual == expected)
        if not passed: all_passed = False
        results.append({"testCase": idx + 1, "passed": passed, "actual": actual, "expected": expected})
    except Exception as e:
        all_passed = False
        results.append({"testCase": idx + 1, "passed": False, "error": str(e)})

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": all_passed, "results": results}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-ah-3",
    title: "Valid Anagram",
    slug: "valid-anagram",
    level: 1,
    category: "Arrays & Hashing",
    difficulty: "Easy",
    acceptanceRate: "64.1%",
    description: `Given two strings \`s\` and \`t\`, return \`true\` if \`t\` is an anagram of \`s\`, and \`false\` otherwise.

An **Anagram** is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.`,
    examples: [
      { input: 's = "anagram", t = "nagaram"', output: "true" },
      { input: 's = "rat", t = "car"', output: "false" },
    ],
    constraints: ["1 <= s.length, t.length <= 5 * 10^4", "s and t consist of lowercase English letters."],
    patternIntuition: {
      ruleOfThumb: "Two strings are anagrams if and only if their character frequencies match identically across all characters.",
      recognitionTriggers: ["Permutation check between two strings", "Checking if two sets of characters can form each other"],
      commonPitfalls: ["Sorting takes O(N log N) — frequency counter array of size 26 is O(N) time and O(1) auxiliary space!"],
      templateSnippet: `def isAnagram(s: str, t: str) -> bool:
    if len(s) != len(t): return False
    return collections.Counter(s) == collections.Counter(t)`,
    },
    timeComplexity: "O(N) - Counting frequencies across both strings.",
    spaceComplexity: "O(1) - Bounded by English alphabet size (26 characters).",
    starterCode: `class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        pass
`,
    solutionCode: `class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        # Anagrams must have identical length
        if len(s) != len(t):
            return False

        # Fixed-size array for 26 lowercase English letters
        count = [0] * 26
        for ch1, ch2 in zip(s, t):
            # Increment frequency for character in s
            count[ord(ch1) - ord('a')] += 1
            # Decrement frequency for character in t
            count[ord(ch2) - ord('a')] -= 1

        # If any count is non-zero, frequencies mismatch
        for c in count:
            if c != 0:
                return False
        return True
`,
    testCases: [
      { id: 1, inputDesc: 's = "anagram", t = "nagaram"', expectedDesc: "true", args: ["anagram", "nagaram"], expected: true },
      { id: 2, inputDesc: 's = "rat", t = "car"', expectedDesc: "false", args: ["rat", "car"], expected: false },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

test_cases = [("anagram", "nagaram", True), ("rat", "car", False), ("a", "ab", False)]
sol = Solution()
results = []
all_passed = True
for idx, (s, t, expected) in enumerate(test_cases):
    try:
        actual = sol.isAnagram(s, t)
        passed = (actual == expected)
        if not passed: all_passed = False
        results.append({"testCase": idx + 1, "passed": passed, "actual": actual, "expected": expected})
    except Exception as e:
        all_passed = False
        results.append({"testCase": idx + 1, "passed": False, "error": str(e)})

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": all_passed, "results": results}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-ah-4",
    title: "Group Anagrams",
    slug: "group-anagrams",
    level: 2,
    category: "Arrays & Hashing",
    difficulty: "Medium",
    acceptanceRate: "68.2%",
    description: `Given an array of strings \`strs\`, group the anagrams together. You can return the answer in any order.`,
    examples: [
      { input: 'strs = ["eat","tea","tan","ate","nat","bat"]', output: '[["bat"],["nat","tan"],["ate","eat","tea"]]' },
      { input: 'strs = [""]', output: '[[""]]' },
    ],
    constraints: ["1 <= strs.length <= 10^4", "0 <= strs[i].length <= 100", "strs[i] consists of lowercase English letters."],
    patternIntuition: {
      ruleOfThumb: "Use a canonical representation as the hash map key: either the sorted string tuple(sorted(s)) or a 26-element character count tuple.",
      recognitionTriggers: ["Partitioning a collection of strings by anagram equivalence classes"],
      commonPitfalls: ["Using a list as a dictionary key (lists are mutable and unhashable in Python; use tuple)"],
      templateSnippet: `def groupAnagrams(strs: list[str]) -> list[list[str]]:
    groups = collections.defaultdict(list)
    for s in strs:
        key = [0] * 26
        for c in s: key[ord(c) - ord('a')] += 1
        groups[tuple(key)].append(s)
    return list(groups.values())`,
    },
    timeComplexity: "O(N * K) - Where N is number of strings and K is maximum string length.",
    spaceComplexity: "O(N * K) - Hash map storing all strings.",
    starterCode: `class Solution:
    def groupAnagrams(self, strs: list[str]) -> list[list[str]]:
        pass
`,
    solutionCode: `from collections import defaultdict

class Solution:
    def groupAnagrams(self, strs: list[str]) -> list[list[str]]:
        # Hash map mapping canonical character frequency tuple -> list of anagrams
        groups = defaultdict(list)

        for s in strs:
            # Count character frequencies for lowercase English letters
            count = [0] * 26
            for ch in s:
                count[ord(ch) - ord('a')] += 1
            # Lists cannot be dict keys, so convert to immutable tuple
            groups[tuple(count)].append(s)

        return list(groups.values())
`,
    testCases: [
      { id: 1, inputDesc: 'strs = ["eat","tea","tan","ate","nat","bat"]', expectedDesc: "3 groups", args: [["eat","tea","tan","ate","nat","bat"]], expected: [["bat"],["nat","tan"],["ate","eat","tea"]] },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
res = sol.groupAnagrams(["eat","tea","tan","ate","nat","bat"])
# Normalize result for comparison
norm_res = sorted([sorted(g) for g in res])
expected = [["ate", "eat", "tea"], ["bat"], ["nat", "tan"]]
norm_exp = sorted([sorted(g) for g in expected])
passed = (norm_res == norm_exp)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [{"testCase": 1, "passed": passed, "actual": res, "expected": expected}]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-ah-5",
    title: "Top K Frequent Elements",
    slug: "top-k-frequent-elements",
    level: 3,
    category: "Arrays & Hashing",
    difficulty: "Medium",
    acceptanceRate: "63.0%",
    description: `Given an integer array \`nums\` and an integer \`k\`, return the \`k\` most frequent elements. You may return the answer in any order.`,
    examples: [
      { input: "nums = [1,1,1,2,2,3], k = 2", output: "[1, 2]" },
      { input: "nums = [1], k = 1", output: "[1]" },
    ],
    constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4", "k is in the range [1, the number of unique elements in the array].", "It is guaranteed that the answer is unique."],
    patternIntuition: {
      ruleOfThumb: "Achieve O(N) linear time using Bucket Sort! The maximum frequency of any number is bounded by N. Create N+1 buckets where bucket[freq] contains numbers appearing freq times.",
      recognitionTriggers: ["Finding top K elements with optimal O(N) time bypassing O(N log K) min-heap"],
      commonPitfalls: ["Sorting dictionary items: O(N log N) instead of O(N)"],
      templateSnippet: `def topKFrequent(nums: list[int], k: int) -> list[int]:
    count = collections.Counter(nums)
    buckets = [[] for _ in range(len(nums) + 1)]
    for n, c in count.items(): buckets[c].append(n)
    res = []
    for i in range(len(buckets) - 1, 0, -1):
        for n in buckets[i]:
            res.append(n)
            if len(res) == k: return res`,
    },
    timeComplexity: "O(N) - Linear time using bucket sort on frequencies 0 to N.",
    spaceComplexity: "O(N) - Frequency map and bucket array of size N + 1.",
    starterCode: `class Solution:
    def topKFrequent(self, nums: list[int], k: int) -> list[int]:
        pass
`,
    solutionCode: `from collections import Counter

class Solution:
    def topKFrequent(self, nums: list[int], k: int) -> list[int]:
        # Count frequency of each number: O(N)
        counts = Counter(nums)

        # Buckets where index represents frequency (0 to len(nums))
        buckets = [[] for _ in range(len(nums) + 1)]
        for num, freq in counts.items():
            buckets[freq].append(num)

        # Traverse buckets in descending order from highest frequency
        result = []
        for freq in range(len(buckets) - 1, 0, -1):
            for num in buckets[freq]:
                result.append(num)
                # When k elements gathered, return immediately
                if len(result) == k:
                    return result
        return result
`,
    testCases: [
      { id: 1, inputDesc: "nums = [1,1,1,2,2,3], k = 2", expectedDesc: "[1, 2]", args: [[1,1,1,2,2,3], 2], expected: [1, 2] },
      { id: 2, inputDesc: "nums = [1], k = 1", expectedDesc: "[1]", args: [[1], 1], expected: [1] },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sorted(sol.topKFrequent([1,1,1,2,2,3], 2))
r2 = sorted(sol.topKFrequent([1], 1))
passed = (r1 == [1, 2] and r2 == [1])

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == [1, 2], "actual": r1, "expected": [1, 2]},
    {"testCase": 2, "passed": r2 == [1], "actual": r2, "expected": [1]}
]}))
print("JSON_OUTPUT_END")
`,
  },
];
