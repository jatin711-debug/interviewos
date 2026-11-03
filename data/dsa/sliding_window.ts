import { DSAProblem } from "./types";

export const SLIDING_WINDOW_PROBLEMS: DSAProblem[] = [
  {
    id: "dsa-sw-1",
    title: "Best Time to Buy and Sell Stock",
    slug: "best-time-to-buy-and-sell-stock",
    level: 1,
    category: "Sliding Window",
    difficulty: "Easy",
    acceptanceRate: "54.2%",
    description: `You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`i-th\` day.

You want to maximize your profit by choosing a **single day** to buy one stock and choosing a **different day in the future** to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return \`0\`.`,
    examples: [
      { input: "prices = [7,1,5,3,6,4]", output: "5", explanation: "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5." },
      { input: "prices = [7,6,4,3,1]", output: "0", explanation: "In this case, no transactions are done and max profit = 0." },
    ],
    constraints: ["1 <= prices.length <= 10^5", "0 <= prices[i] <= 10^4"],
    patternIntuition: {
      ruleOfThumb: "Maintain a sliding window tracking `min_price` seen so far. At each day, potential profit is `prices[i] - min_price`. Update `max_profit` continuously.",
      recognitionTriggers: ["Finding maximum difference between two elements where later element > earlier element"],
      commonPitfalls: ["Resetting min_price after calculating profit on the same day"],
      templateSnippet: `def maxProfit(prices: list[int]) -> int:
    min_p, max_p = float('inf'), 0
    for p in prices:
        min_p = min(min_p, p)
        max_p = max(max_p, p - min_p)
    return max_p`,
    },
    timeComplexity: "O(N) - Single pass through the prices array.",
    spaceComplexity: "O(1) - Constant auxiliary memory.",
    starterCode: `class Solution:
    def maxProfit(self, prices: list[int]) -> int:
        pass
`,
    solutionCode: `class Solution:
    def maxProfit(self, prices: list[int]) -> int:
        min_price = float('inf')
        max_profit = 0

        for price in prices:
            # Track the lowest buying price seen up to today
            if price < min_price:
                min_price = price
            # Calculate profit if sold today and update max_profit
            elif price - min_price > max_profit:
                max_profit = price - min_price

        return max_profit
`,
    testCases: [
      { id: 1, inputDesc: "prices = [7,1,5,3,6,4]", expectedDesc: "5", args: [[7,1,5,3,6,4]], expected: 5 },
      { id: 2, inputDesc: "prices = [7,6,4,3,1]", expectedDesc: "0", args: [[7,6,4,3,1]], expected: 0 },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.maxProfit([7,1,5,3,6,4])
r2 = sol.maxProfit([7,6,4,3,1])
passed = (r1 == 5 and r2 == 0)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == 5, "actual": r1, "expected": 5},
    {"testCase": 2, "passed": r2 == 0, "actual": r2, "expected": 0}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-sw-2",
    title: "Longest Substring Without Repeating Characters",
    slug: "longest-substring-without-repeating-characters",
    level: 2,
    category: "Sliding Window",
    difficulty: "Medium",
    acceptanceRate: "35.1%",
    description: `Given a string \`s\`, find the length of the **longest substring** without repeating characters.`,
    examples: [
      { input: 's = "abcabcbb"', output: "3" },
      { input: 's = "bbbbb"', output: "1" },
      { input: 's = "pwwkew"', output: "3" },
    ],
    constraints: ["0 <= s.length <= 5 * 10^4", "s consists of English letters, digits, symbols and spaces."],
    patternIntuition: {
      ruleOfThumb: "Use a Variable-Size Sliding Window [left, right] with a Hash Map storing the most recent index of each character to jump the left pointer directly past duplicates.",
      recognitionTriggers: ["Longest contiguous substring matching uniqueness constraint"],
      commonPitfalls: ["Jumping `left` backwards: If duplicate was seen BEFORE `left`, ignore it! (i.e. `left = max(left, char_idx[c] + 1)`)"],
      templateSnippet: `def lengthOfLongestSubstring(s: str) -> int:
    char_map = {}
    l = max_l = 0
    for r, c in enumerate(s):
        if c in char_map and char_map[c] >= l: l = char_map[c] + 1
        char_map[c] = r
        max_l = max(max_l, r - l + 1)
    return max_l`,
    },
    timeComplexity: "O(N) - Right pointer scans once.",
    spaceComplexity: "O(min(N, M)) - Hash map size bounded by alphabet size M.",
    starterCode: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        pass
`,
    solutionCode: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        char_idx = {}
        left = 0
        max_len = 0

        for right, ch in enumerate(s):
            # If duplicate character found within current window, jump left pointer
            if ch in char_idx and char_idx[ch] >= left:
                left = char_idx[ch] + 1

            # Update latest position of character
            char_idx[ch] = right
            # Calculate current valid window length
            max_len = max(max_len, right - left + 1)

        return max_len
`,
    testCases: [
      { id: 1, inputDesc: 's = "abcabcbb"', expectedDesc: "3", args: ["abcabcbb"], expected: 3 },
      { id: 2, inputDesc: 's = "bbbbb"', expectedDesc: "1", args: ["bbbbb"], expected: 1 },
      { id: 3, inputDesc: 's = "pwwkew"', expectedDesc: "3", args: ["pwwkew"], expected: 3 },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.lengthOfLongestSubstring("abcabcbb")
r2 = sol.lengthOfLongestSubstring("bbbbb")
r3 = sol.lengthOfLongestSubstring("pwwkew")
passed = (r1 == 3 and r2 == 1 and r3 == 3)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == 3, "actual": r1, "expected": 3},
    {"testCase": 2, "passed": r2 == 1, "actual": r2, "expected": 1},
    {"testCase": 3, "passed": r3 == 3, "actual": r3, "expected": 3}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-sw-3",
    title: "Longest Repeating Character Replacement",
    slug: "longest-repeating-character-replacement",
    level: 3,
    category: "Sliding Window",
    difficulty: "Medium",
    acceptanceRate: "54.9%",
    description: `You are given a string \`s\` and an integer \`k\`. You can choose any character of the string and change it to any other uppercase English character. You can perform this operation at most \`k\` times.

Return the length of the longest substring containing the same letter you can get after performing the above operations.`,
    examples: [
      { input: 's = "ABAB", k = 2', output: "4", explanation: 'Replace the two "A"s with two "B"s or vice versa.' },
      { input: 's = "AABABBA", k = 1', output: "4", explanation: 'Replace the middle "A" with "B" to get "AABBBBA". The substring "BBBB" has length 4.' },
    ],
    constraints: ["1 <= s.length <= 10^5", "s consists of only uppercase English letters.", "0 <= k <= s.length"],
    patternIntuition: {
      ruleOfThumb: "A window is valid if `(window_length - max_frequency) <= k`. If invalid, shrink from the left by 1. The max_frequency does not need to decrease when shrinking because we only care about beating our best window!",
      recognitionTriggers: ["Longest substring achievable with at most k replacements"],
      commonPitfalls: ["Recalculating max frequency on every shrink (not needed; window only expands when a new global max_f is achieved)"],
      templateSnippet: `def characterReplacement(s: str, k: int) -> int:
    count = collections.defaultdict(int)
    l = max_f = 0
    for r in range(len(s)):
        count[s[r]] += 1
        max_f = max(max_f, count[s[r]])
        if (r - l + 1) - max_f > k:
            count[s[l]] -= 1
            l += 1
    return len(s) - l`,
    },
    timeComplexity: "O(N) - Left and right pointers scan each letter once.",
    spaceComplexity: "O(1) - Bounded by 26 uppercase English letters in frequency map.",
    starterCode: `class Solution:
    def characterReplacement(self, s: str, k: int) -> int:
        pass
`,
    solutionCode: `from collections import defaultdict

class Solution:
    def characterReplacement(self, s: str, k: int) -> int:
        count = defaultdict(int)
        left = 0
        max_freq = 0

        for right in range(len(s)):
            count[s[right]] += 1
            # Track the highest frequency of any single character in the window
            max_freq = max(max_freq, count[s[right]])

            # If characters needing replacement exceed k, shrink window from left
            window_len = right - left + 1
            if window_len - max_freq > k:
                count[s[left]] -= 1
                left += 1

        # Final valid window size
        return len(s) - left
`,
    testCases: [
      { id: 1, inputDesc: 's = "ABAB", k = 2', expectedDesc: "4", args: ["ABAB", 2], expected: 4 },
      { id: 2, inputDesc: 's = "AABABBA", k = 1', expectedDesc: "4", args: ["AABABBA", 1], expected: 4 },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.characterReplacement("ABAB", 2)
r2 = sol.characterReplacement("AABABBA", 1)
passed = (r1 == 4 and r2 == 4)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == 4, "actual": r1, "expected": 4},
    {"testCase": 2, "passed": r2 == 4, "actual": r2, "expected": 4}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-sw-4",
    title: "Permutation in String",
    slug: "permutation-in-string",
    level: 3,
    category: "Sliding Window",
    difficulty: "Medium",
    acceptanceRate: "44.6%",
    description: `Given two strings \`s1\` and \`s2\`, return \`true\` if \`s2\` contains a permutation of \`s1\`, or \`false\` otherwise.

In other words, return \`true\` if one of \`s1\`'s permutations is the **substring** of \`s2\`.`,
    examples: [
      { input: 's1 = "ab", s2 = "eidbaooo"', output: "true", explanation: 's2 contains one permutation of s1 ("ba").' },
      { input: 's1 = "ab", s2 = "eidboaoo"', output: "false" },
    ],
    constraints: ["1 <= s1.length, s2.length <= 10^4", "s1 and s2 consist of lowercase English letters."],
    patternIntuition: {
      ruleOfThumb: "Fixed-size sliding window of length len(s1). Maintain a match count tracking how many of the 26 characters currently have matching frequencies between s1 and the window in s2.",
      recognitionTriggers: ["Checking if substring is an anagram/permutation of a pattern"],
      commonPitfalls: ["Re-comparing 26-character arrays on every slide: use a `matches` counter to achieve true O(N) instead of O(26 * N)"],
      templateSnippet: `def checkInclusion(s1: str, s2: str) -> bool:
    if len(s1) > len(s2): return False
    c1, c2 = [0]*26, [0]*26
    for i in range(len(s1)):
        c1[ord(s1[i]) - 97] += 1
        c2[ord(s2[i]) - 97] += 1
    matches = sum(1 for i in range(26) if c1[i] == c2[i])
    for i in range(len(s1), len(s2)):
        if matches == 26: return True
        # slide window
        ...`,
    },
    timeComplexity: "O(len(s2)) - Fixed window slide with O(1) character updates.",
    spaceComplexity: "O(1) - Two 26-element integer arrays.",
    starterCode: `class Solution:
    def checkInclusion(self, s1: str, s2: str) -> bool:
        pass
`,
    solutionCode: `class Solution:
    def checkInclusion(self, s1: str, s2: str) -> bool:
        if len(s1) > len(s2):
            return False

        s1_count = [0] * 26
        s2_count = [0] * 26

        # Initialize counts for first window of length len(s1)
        for i in range(len(s1)):
            s1_count[ord(s1[i]) - ord('a')] += 1
            s2_count[ord(s2[i]) - ord('a')] += 1

        # Count how many characters already match in frequency
        matches = sum(1 for i in range(26) if s1_count[i] == s2_count[i])

        # Slide fixed-length window across s2
        for i in range(len(s1), len(s2)):
            if matches == 26:
                return True

            # Add new incoming character at right
            idx_in = ord(s2[i]) - ord('a')
            s2_count[idx_in] += 1
            if s1_count[idx_in] == s2_count[idx_in]:
                matches += 1
            elif s1_count[idx_in] + 1 == s2_count[idx_in]:
                matches -= 1

            # Remove outgoing character at left
            idx_out = ord(s2[i - len(s1)]) - ord('a')
            s2_count[idx_out] -= 1
            if s1_count[idx_out] == s2_count[idx_out]:
                matches += 1
            elif s1_count[idx_out] - 1 == s2_count[idx_out]:
                matches -= 1

        return matches == 26
`,
    testCases: [
      { id: 1, inputDesc: 's1 = "ab", s2 = "eidbaooo"', expectedDesc: "true", args: ["ab", "eidbaooo"], expected: true },
      { id: 2, inputDesc: 's1 = "ab", s2 = "eidboaoo"', expectedDesc: "false", args: ["ab", "eidboaoo"], expected: false },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.checkInclusion("ab", "eidbaooo")
r2 = sol.checkInclusion("ab", "eidboaoo")
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
    id: "dsa-sw-5",
    title: "Minimum Window Substring",
    slug: "minimum-window-substring",
    level: 5,
    category: "Sliding Window",
    difficulty: "Hard",
    acceptanceRate: "42.5%",
    description: `Given two strings \`s\` and \`t\` of lengths \`m\` and \`n\` respectively, return the **minimum window substring** of \`s\` such that every character in \`t\` (including duplicates) is included in the window. If there is no such substring, return the empty string \`""\`.`,
    examples: [
      { input: 's = "ADOBECODEBANC", t = "ABC"', output: '"BANC"', explanation: 'The minimum window substring "BANC" includes \'A\', \'B\', and \'C\' from string t.' },
      { input: 's = "a", t = "a"', output: '"a"' },
      { input: 's = "a", t = "aa"', output: '""' },
    ],
    constraints: ["m == s.length", "n == t.length", "1 <= m, n <= 10^5", "s and t consist of uppercase and lowercase English letters."],
    patternIntuition: {
      ruleOfThumb: "Expand `right` until the window contains all required characters (`have == need`). Then shrink `left` as much as possible while maintaining `have == need` to minimize window length.",
      recognitionTriggers: ["Shortest substring containing all target multiset elements"],
      commonPitfalls: ["Comparing entire frequency dictionaries instead of tracking `have` vs `need` counts"],
      templateSnippet: `def minWindow(s: str, t: str) -> str:
    if not t or not s: return ""
    target, window = collections.Counter(t), collections.defaultdict(int)
    have, need = 0, len(target)
    res, res_len = [-1, -1], float("infinity")
    l = 0
    for r, c in enumerate(s):
        window[c] += 1
        if c in target and window[c] == target[c]: have += 1
        while have == need:
            if (r - l + 1) < res_len:
                res, res_len = [l, r], r - l + 1
            window[s[l]] -= 1
            if s[l] in target and window[s[l]] < target[s[l]]: have -= 1
            l += 1
    return s[res[0]:res[1]+1] if res_len != float("infinity") else ""`,
    },
    timeComplexity: "O(M + N) - Where M = len(s), N = len(t). Each character visited at most twice.",
    spaceComplexity: "O(M + N) - Storing character frequency maps.",
    starterCode: `class Solution:
    def minWindow(self, s: str, t: str) -> str:
        pass
`,
    solutionCode: `from collections import Counter, defaultdict

class Solution:
    def minWindow(self, s: str, t: str) -> str:
        if not t or not s or len(s) < len(t):
            return ""

        target_count = Counter(t)
        window_count = defaultdict(int)

        have = 0
        need = len(target_count)

        min_len = float("inf")
        best_window = [-1, -1]
        left = 0

        for right, ch in enumerate(s):
            window_count[ch] += 1

            # If current character satisfies the frequency required for t
            if ch in target_count and window_count[ch] == target_count[ch]:
                have += 1

            # When window has all characters, shrink from left to find minimum
            while have == need:
                window_size = right - left + 1
                if window_size < min_len:
                    min_len = window_size
                    best_window = [left, right]

                # Pop left character
                left_char = s[left]
                window_count[left_char] -= 1
                if left_char in target_count and window_count[left_char] < target_count[left_char]:
                    have -= 1

                left += 1

        l, r = best_window
        return s[l : r + 1] if min_len != float("inf") else ""
`,
    testCases: [
      { id: 1, inputDesc: 's = "ADOBECODEBANC", t = "ABC"', expectedDesc: '"BANC"', args: ["ADOBECODEBANC", "ABC"], expected: "BANC" },
      { id: 2, inputDesc: 's = "a", t = "a"', expectedDesc: '"a"', args: ["a", "a"], expected: "a" },
      { id: 3, inputDesc: 's = "a", t = "aa"', expectedDesc: '""', args: ["a", "aa"], expected: "" },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.minWindow("ADOBECODEBANC", "ABC")
r2 = sol.minWindow("a", "a")
r3 = sol.minWindow("a", "aa")
passed = (r1 == "BANC" and r2 == "a" and r3 == "")

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == "BANC", "actual": r1, "expected": "BANC"},
    {"testCase": 2, "passed": r2 == "a", "actual": r2, "expected": "a"},
    {"testCase": 3, "passed": r3 == "", "actual": r3, "expected": ""}
]}))
print("JSON_OUTPUT_END")
`,
  },
];
