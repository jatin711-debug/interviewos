import { DSAProblem } from "./types";

export const TRIES_PROBLEMS: DSAProblem[] = [
  {
    id: "dsa-tr-trie-1",
    title: "Implement Trie (Prefix Tree)",
    slug: "implement-trie-prefix-tree",
    level: 3,
    category: "Tries",
    difficulty: "Medium",
    acceptanceRate: "65.2%",
    description: `A **trie** (pronounced as "try") or **prefix tree** is a tree data structure used to efficiently store and retrieve keys in a dataset of strings.

Implement the Trie class:
- \`Trie()\` Initializes the trie object.
- \`void insert(String word)\` Inserts string word into trie.
- \`boolean search(String word)\` Returns true if string word is in trie, false otherwise.
- \`boolean startsWith(String prefix)\` Returns true if there is a previously inserted string word that has the prefix prefix, false otherwise.`,
    examples: [
      { input: '["Trie", "insert", "search", "search", "startsWith", "insert", "search"]\n[[], ["apple"], ["apple"], ["app"], ["app"], ["app"], ["app"]]', output: "[null, null, true, false, true, null, true]" },
    ],
    constraints: ["1 <= word.length, prefix.length <= 2000", "word and prefix consist only of lowercase English letters.", "At most 3 * 10^4 calls will be made to insert, search, and startsWith."],
    patternIntuition: {
      ruleOfThumb: "Each TrieNode holds a dictionary `children: {char -> TrieNode}` and boolean flag `is_end_of_word`. Traversal descends child by child.",
      recognitionTriggers: ["Prefix autocomplete or dictionary lookup in O(L) time where L is word length"],
      commonPitfalls: ["Confusing `search` (requires `node.is_end_of_word == True`) with `startsWith` (only requires prefix path to exist)"],
      templateSnippet: `class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False

class Trie:
    def __init__(self): self.root = TrieNode()
    def insert(self, word):
        node = self.root
        for c in word:
            if c not in node.children: node.children[c] = TrieNode()
            node = node.children[c]
        node.is_end = True`,
    },
    timeComplexity: "O(L) for insert, search, and startsWith where L is word length.",
    spaceComplexity: "O(Total Characters * Alphabet Size).",
    starterCode: `class Trie:
    def __init__(self):
        pass

    def insert(self, word: str) -> None:
        pass

    def search(self, word: str) -> bool:
        pass

    def startsWith(self, prefix: str) -> bool:
        pass
`,
    solutionCode: `class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end_of_word = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word: str) -> None:
        curr = self.root
        for ch in word:
            if ch not in curr.children:
                curr.children[ch] = TrieNode()
            curr = curr.children[ch]
        curr.is_end_of_word = True

    def search(self, word: str) -> bool:
        curr = self.root
        for ch in word:
            if ch not in curr.children:
                return False
            curr = curr.children[ch]
        # Must be an exact marked terminal word
        return curr.is_end_of_word

    def startsWith(self, prefix: str) -> bool:
        curr = self.root
        for ch in prefix:
            if ch not in curr.children:
                return False
            curr = curr.children[ch]
        # Valid if the prefix path exists
        return True
`,
    testCases: [
      { id: 1, inputDesc: "insert('apple'), search('apple')=true, search('app')=false, startsWith('app')=true", expectedDesc: "true, false, true", args: [], expected: [true, false, true] },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

t = Trie()
t.insert("apple")
s1 = t.search("apple")
s2 = t.search("app")
p1 = t.startsWith("app")
t.insert("app")
s3 = t.search("app")
passed = (s1 == True and s2 == False and p1 == True and s3 == True)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": passed, "actual": [s1, s2, p1, s3], "expected": [True, False, True, True]}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-tr-trie-2",
    title: "Design Add and Search Words Data Structure",
    slug: "design-add-and-search-words-data-structure",
    level: 4,
    category: "Tries",
    difficulty: "Medium",
    acceptanceRate: "45.1%",
    description: `Design a data structure that supports adding new words and finding if a string matches any previously added string with '.' wildcard character.`,
    examples: [
      { input: 'addWord("bad"), addWord("dad"), search("pad")->false, search("bad")->true, search(".ad")->true, search("b..")->true', output: "false, true, true, true" },
    ],
    constraints: ["1 <= word.length <= 25", "word in addWord consists of lowercase English letters.", "word in search consist of '.' or lowercase letters."],
    patternIntuition: {
      ruleOfThumb: "Use a Trie combined with DFS Backtracking: When encountering '.', recursively branch across all existing children of the current node.",
      recognitionTriggers: ["Prefix tree search with wildcard or fuzzy matching"],
      commonPitfalls: ["Forgetting that '.' must match exactly one character"],
      templateSnippet: `def dfs(j, root):
    curr = root
    for i in range(j, len(word)):
        c = word[i]
        if c == '.':
            for child in curr.children.values():
                if dfs(i + 1, child): return True
            return False
        else:
            if c not in curr.children: return False
            curr = curr.children[c]
    return curr.is_end`,
    },
    timeComplexity: "addWord: O(M); search: O(M) best case, O(26^M) worst case with wildcards.",
    spaceComplexity: "O(Total Characters in Dictionary).",
    starterCode: `class WordDictionary:
    def __init__(self):
        pass

    def addWord(self, word: str) -> None:
        pass

    def search(self, word: str) -> bool:
        pass
`,
    solutionCode: `class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False

class WordDictionary:
    def __init__(self):
        self.root = TrieNode()

    def addWord(self, word: str) -> None:
        curr = self.root
        for ch in word:
            if ch not in curr.children:
                curr.children[ch] = TrieNode()
            curr = curr.children[ch]
        curr.is_end = True

    def search(self, word: str) -> bool:
        def dfs(idx: int, node: TrieNode) -> bool:
            curr = node
            for i in range(idx, len(word)):
                ch = word[i]
                if ch == ".":
                    # Wildcard: test all available branch children
                    for child in curr.children.values():
                        if dfs(i + 1, child):
                            return True
                    return False
                else:
                    if ch not in curr.children:
                        return False
                    curr = curr.children[ch]
            return curr.is_end

        return dfs(0, self.root)
`,
    testCases: [
      { id: 1, inputDesc: "add('bad'), add('dad'), search('.ad')", expectedDesc: "true", args: [], expected: true },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

wd = WordDictionary()
wd.addWord("bad")
wd.addWord("dad")
r1 = wd.search("pad") # False
r2 = wd.search("bad") # True
r3 = wd.search(".ad") # True
passed = (r1 == False and r2 == True and r3 == True)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": passed, "actual": [r1, r2, r3], "expected": [False, True, True]}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-tr-trie-3",
    title: "Word Search II",
    slug: "word-search-ii",
    level: 7,
    category: "Tries",
    difficulty: "Hard",
    acceptanceRate: "37.5%",
    description: `Given an \`m x n\` board of characters and a list of strings \`words\`, return all words on the board. Each word must be constructed from letters of sequentially adjacent cells (horizontal or vertical).`,
    examples: [
      { input: 'board = [["o","a","a","n"],["e","t","a","e"],["i","h","k","r"],["i","f","l","v"]], words = ["oath","pea","eat","rain"]', output: '["eat","oath"]' },
    ],
    constraints: ["m == board.length", "n == board[i].length", "1 <= m, n <= 12", "1 <= words.length <= 3 * 10^4", "1 <= words[i].length <= 10"],
    patternIntuition: {
      ruleOfThumb: "Insert all target words into a Trie. Then run DFS from each board cell simultaneously matching against the Trie. Prune Trie nodes after finding a word to avoid re-searching!",
      recognitionTriggers: ["Searching a large dictionary of words on a 2D boggle board"],
      commonPitfalls: ["Running Word Search I separately for every word: O(W * M * N * 4^L) which times out. Trie combines all words into single simultaneous search!"],
      templateSnippet: `def findWords(board, words):
    root = TrieNode()
    for w in words: root.addWord(w)
    res = set()
    def dfs(r, c, node, word):
        if r < 0 or c < 0 or r == rows or c == cols or (r,c) in visited or board[r][c] not in node.children: return
        # explore and backtrack
        ...`,
    },
    timeComplexity: "O(M * N * 4^L) where L is max word length.",
    spaceComplexity: "O(Total characters in words) for Trie.",
    starterCode: `class Solution:
    def findWords(self, board: list[list[str]], words: list[str]) -> list[str]:
        pass
`,
    solutionCode: `class TrieNode:
    def __init__(self):
        self.children = {}
        self.word = None

class Solution:
    def findWords(self, board: list[list[str]], words: list[str]) -> list[str]:
        # Build Trie from word list
        root = TrieNode()
        for w in words:
            curr = root
            for ch in w:
                if ch not in curr.children:
                    curr.children[ch] = TrieNode()
                curr = curr.children[ch]
            curr.word = w

        rows, cols = len(board), len(board[0])
        result = []

        def dfs(r: int, c: int, parent_node: TrieNode):
            char = board[r][c]
            curr_node = parent_node.children.get(char)
            if not curr_node:
                return

            # Match found
            if curr_node.word:
                result.append(curr_node.word)
                curr_node.word = None  # Prevent duplicate additions

            # Mark cell visited
            board[r][c] = "#"

            # Explore 4 cardinal directions
            for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nr, nc = r + dr, c + dc
                if 0 <= nr < rows and 0 <= nc < cols and board[nr][nc] != "#":
                    dfs(nr, nc, curr_node)

            # Backtrack
            board[r][c] = char

            # Optimization: prune leaf nodes without words
            if not curr_node.children:
                del parent_node.children[char]

        for r in range(rows):
            for c in range(cols):
                if board[r][c] in root.children:
                    dfs(r, c, root)

        return result
`,
    testCases: [
      { id: 1, inputDesc: "board with 'oath','pea','eat','rain'", expectedDesc: "['eat', 'oath']", args: [], expected: ["eat", "oath"] },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

board = [["o","a","a","n"],["e","t","a","e"],["i","h","k","r"],["i","f","l","v"]]
words = ["oath","pea","eat","rain"]
sol = Solution()
res = sorted(sol.findWords(board, words))
passed = (res == ["eat", "oath"])

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": passed, "actual": res, "expected": ["eat", "oath"]}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-tr-trie-4",
    title: "Maximum XOR of Two Numbers in an Array",
    slug: "maximum-xor-of-two-numbers-in-an-array",
    level: 5,
    category: "Tries",
    difficulty: "Medium",
    acceptanceRate: "54.2%",
    description: `Given an integer array \`nums\`, return the maximum result of \`nums[i] XOR nums[j]\`, where \`0 <= i <= j < n\`. Must run in **O(n)** time.`,
    examples: [
      { input: "nums = [3,10,5,25,2,8]", output: "28", explanation: "The maximum result is 5 XOR 25 = 28." },
      { input: "nums = [14,70,53,83,49,91,36,80,92,51,66,70]", output: "127" },
    ],
    constraints: ["1 <= nums.length <= 2 * 10^5", "0 <= nums[i] <= 2^31 - 1"],
    patternIntuition: {
      ruleOfThumb: "Binary Prefix Trie (Bit Trie): Insert numbers into a binary trie of 31 bits (0 or 1). To maximize XOR for a number X, greedily pick the opposite bit `1 - bit` at every position if available!",
      recognitionTriggers: ["Maximizing XOR sum across integer pairs"],
      commonPitfalls: ["Iterating from least significant bit (bit 0): XOR must be maximized from Most Significant Bit (bit 31) downwards!"],
      templateSnippet: `def findMaximumXOR(nums: list[int]) -> int:
    trie = {}
    for n in nums:
        node = trie
        for i in range(31, -1, -1):
            bit = (n >> i) & 1
            if bit not in node: node[bit] = {}
            node = node[bit]
    max_xor = 0
    # Greedily search opposite bit
    ...`,
    },
    timeComplexity: "O(32 * N) = O(N) - Linear time bit trie traversal.",
    spaceComplexity: "O(32 * N) = O(N) - Storing binary bits.",
    starterCode: `class Solution:
    def findMaximumXOR(self, nums: list[int]) -> int:
        pass
`,
    solutionCode: `class Solution:
    def findMaximumXOR(self, nums: list[int]) -> int:
        # Build Bit Trie (31-bit integers)
        root = {}
        for num in nums:
            curr = root
            for bit_pos in range(30, -1, -1):
                bit = (num >> bit_pos) & 1
                if bit not in curr:
                    curr[bit] = {}
                curr = curr[bit]

        max_xor = 0

        # For each number, greedily find the path with opposite bits
        for num in nums:
            curr = root
            curr_xor = 0
            for bit_pos in range(30, -1, -1):
                bit = (num >> bit_pos) & 1
                opposite = 1 - bit
                # If opposite bit exists, taking it yields 1 at this position
                if opposite in curr:
                    curr_xor |= (1 << bit_pos)
                    curr = curr[opposite]
                else:
                    curr = curr[bit]

            max_xor = max(max_xor, curr_xor)

        return max_xor
`,
    testCases: [
      { id: 1, inputDesc: "nums = [3,10,5,25,2,8]", expectedDesc: "28", args: [[3,10,5,25,2,8]], expected: 28 },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.findMaximumXOR([3,10,5,25,2,8])
passed = (r1 == 28)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": passed, "actual": r1, "expected": 28}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-tr-trie-5",
    title: "Replace Words",
    slug: "replace-words",
    level: 3,
    category: "Tries",
    difficulty: "Medium",
    acceptanceRate: "64.2%",
    description: `In English, we have what we call root words. If a root word can be followed by some other word to form another longer word, we can replace the successor word with the root. Given a dictionary of roots and a sentence, replace all successors in sentence with the shortest root forming it.`,
    examples: [
      { input: 'dictionary = ["cat","bat","rat"], sentence = "the cattle was rattled by the battery"', output: '"the cat was rat by the bat"' },
    ],
    constraints: ["1 <= dictionary.length <= 1000", "1 <= sentence.length <= 10^6", "sentence consists of words separated by a single space."],
    patternIntuition: {
      ruleOfThumb: "Store dictionary roots in a Trie. For each word in the sentence, walk down the Trie. Return the earliest root found (`is_end == True`).",
      recognitionTriggers: ["Replacing tokens with shortest matching prefix from a dictionary"],
      commonPitfalls: ["Returning longer root when a shorter prefix root already matched"],
      templateSnippet: `def replaceWords(dictionary, sentence):
    trie = Trie()
    for root in dictionary: trie.insert(root)
    # search shortest prefix
    ...`,
    },
    timeComplexity: "O(D * L + S) - Where D is dictionary words, L is length, S is sentence length.",
    spaceComplexity: "O(D * L) - Trie storage.",
    starterCode: `class Solution:
    def replaceWords(self, dictionary: list[str], sentence: str) -> str:
        pass
`,
    solutionCode: `class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False

class Solution:
    def replaceWords(self, dictionary: list[str], sentence: str) -> str:
        root = TrieNode()

        # Insert all root prefixes into Trie
        for word in dictionary:
            curr = root
            for ch in word:
                if ch not in curr.children:
                    curr.children[ch] = TrieNode()
                curr = curr.children[ch]
            curr.is_end = True

        def find_shortest_root(word: str) -> str:
            curr = root
            prefix = []
            for ch in word:
                if ch not in curr.children:
                    return word  # No matching root
                curr = curr.children[ch]
                prefix.append(ch)
                if curr.is_end:
                    # Found shortest root
                    return "".join(prefix)
            return word

        words = sentence.split(" ")
        return " ".join(find_shortest_root(w) for w in words)
`,
    testCases: [
      { id: 1, inputDesc: 'dictionary=["cat","bat","rat"], sentence="the cattle was rattled by the battery"', expectedDesc: '"the cat was rat by the bat"', args: [], expected: "the cat was rat by the bat" },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
res = sol.replaceWords(["cat","bat","rat"], "the cattle was rattled by the battery")
passed = (res == "the cat was rat by the bat")

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": passed, "actual": res, "expected": "the cat was rat by the bat"}
]}))
print("JSON_OUTPUT_END")
`,
  },
];
