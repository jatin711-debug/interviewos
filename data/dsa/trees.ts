import { DSAProblem } from "./types";

export const TREES_PROBLEMS: DSAProblem[] = [
  {
    id: "dsa-tr-1",
    title: "Invert Binary Tree",
    slug: "invert-binary-tree",
    level: 1,
    category: "Trees & BST",
    difficulty: "Easy",
    acceptanceRate: "76.8%",
    description: `Given the \`root\` of a binary tree, invert the tree, and return its root.`,
    examples: [
      { input: "root = [4,2,7,1,3,6,9]", output: "[4,7,2,9,6,3,1]" },
      { input: "root = [2,1,3]", output: "[2,3,1]" },
      { input: "root = []", output: "[]" },
    ],
    constraints: ["The number of nodes in the tree is in the range [0, 100].", "-100 <= Node.val <= 100"],
    patternIntuition: {
      ruleOfThumb: "Postorder or Preorder DFS: Swap `root.left` and `root.right`, then recursively invert left and right subtrees.",
      recognitionTriggers: ["Mirroring or transforming binary tree structures recursively"],
      commonPitfalls: ["Inverting left subtree and then mistakenly using inverted left child as original right child"],
      templateSnippet: `def invertTree(root: Optional[TreeNode]) -> Optional[TreeNode]:
    if not root: return None
    root.left, root.right = invertTree(root.right), invertTree(root.left)
    return root`,
    },
    timeComplexity: "O(N) - Visiting every tree node once.",
    spaceComplexity: "O(H) - Recursion call stack height.",
    starterCode: `class Solution:
    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:
        pass
`,
    solutionCode: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

class Solution:
    def invertTree(self, root: TreeNode) -> TreeNode:
        if not root:
            return None

        # Swap left and right children recursively
        root.left, root.right = self.invertTree(root.right), self.invertTree(root.left)

        return root
`,
    testCases: [
      { id: 1, inputDesc: "root = [2,1,3]", expectedDesc: "[2,3,1]", args: [[2,1,3]], expected: [2,3,1] },
    ],
    runWrapper: (userCode: string) => `
import sys, json

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

from typing import Optional
${userCode}

root = TreeNode(2, TreeNode(1), TreeNode(3))
sol = Solution()
inv = sol.invertTree(root)
passed = (inv.val == 2 and inv.left.val == 3 and inv.right.val == 1)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": passed, "actual": [inv.val, inv.left.val, inv.right.val], "expected": [2, 3, 1]}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-tr-2",
    title: "Maximum Depth of Binary Tree",
    slug: "maximum-depth-of-binary-tree",
    level: 1,
    category: "Trees & BST",
    difficulty: "Easy",
    acceptanceRate: "75.2%",
    description: `Given the \`root\` of a binary tree, return its maximum depth.

A binary tree's **maximum depth** is the number of nodes along the longest path from the root node down to the farthest leaf node.`,
    examples: [
      { input: "root = [3,9,20,null,null,15,7]", output: "3" },
      { input: "root = [1,null,2]", output: "2" },
    ],
    constraints: ["The number of nodes in the tree is in the range [0, 10^4].", "-100 <= Node.val <= 100"],
    patternIntuition: {
      ruleOfThumb: "Postorder DFS: `maxDepth(root) = 1 + max(maxDepth(root.left), maxDepth(root.right))`. Base case: `if not root: return 0`.",
      recognitionTriggers: ["Finding height or maximum distance to leaf"],
      commonPitfalls: ["Stack overflow on degenerate linked-list trees in Python (recursion limit)"],
      templateSnippet: `def maxDepth(root: Optional[TreeNode]) -> int:
    if not root: return 0
    return 1 + max(maxDepth(root.left), maxDepth(root.right))`,
    },
    timeComplexity: "O(N) - Visits each node once.",
    spaceComplexity: "O(H) - Tree height recursion call stack.",
    starterCode: `class Solution:
    def maxDepth(self, root: Optional[TreeNode]) -> int:
        pass
`,
    solutionCode: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

class Solution:
    def maxDepth(self, root: TreeNode) -> int:
        # Base case: empty tree has depth 0
        if not root:
            return 0

        # Postorder DFS: height is 1 + maximum of left and right subtree heights
        left_depth = self.maxDepth(root.left)
        right_depth = self.maxDepth(root.right)

        return 1 + max(left_depth, right_depth)
`,
    testCases: [
      { id: 1, inputDesc: "root = [3,9,20,null,null,15,7]", expectedDesc: "3", args: [], expected: 3 },
    ],
    runWrapper: (userCode: string) => `
import sys, json

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

from typing import Optional
${userCode}

root = TreeNode(3, TreeNode(9), TreeNode(20, TreeNode(15), TreeNode(7)))
sol = Solution()
r1 = sol.maxDepth(root)
passed = (r1 == 3)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": passed, "actual": r1, "expected": 3}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-tr-3",
    title: "Diameter of Binary Tree",
    slug: "diameter-of-binary-tree",
    level: 2,
    category: "Trees & BST",
    difficulty: "Easy",
    acceptanceRate: "60.4%",
    description: `Given the \`root\` of a binary tree, return the length of the **diameter** of the tree.

The **diameter** of a binary tree is the length of the longest path between any two nodes in a tree. This path may or may not pass through the root.`,
    examples: [
      { input: "root = [1,2,3,4,5]", output: "3", explanation: "3 is the length of the path [4,2,1,3] or [5,2,1,3]." },
      { input: "root = [1,2]", output: "1" },
    ],
    constraints: ["The number of nodes in the tree is in the range [1, 10^4].", "-100 <= Node.val <= 100"],
    patternIntuition: {
      ruleOfThumb: "At every node, the longest path passing through that node is `left_height + right_height`. Maintain a global `max_diameter` variable while returning `1 + max(left_height, right_height)` to caller.",
      recognitionTriggers: ["Longest path between any two tree nodes"],
      commonPitfalls: ["Assuming the diameter path must pass through the root node (it might be entirely contained in a deep subtree!)"],
      templateSnippet: `def diameterOfBinaryTree(root: Optional[TreeNode]) -> int:
    diameter = 0
    def dfs(node):
        nonlocal diameter
        if not node: return 0
        l, r = dfs(node.left), dfs(node.right)
        diameter = max(diameter, l + r)
        return 1 + max(l, r)
    dfs(root)
    return diameter`,
    },
    timeComplexity: "O(N) - Linear postorder traversal.",
    spaceComplexity: "O(H) - Tree height call stack.",
    starterCode: `class Solution:
    def diameterOfBinaryTree(self, root: Optional[TreeNode]) -> int:
        pass
`,
    solutionCode: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

class Solution:
    def diameterOfBinaryTree(self, root: TreeNode) -> int:
        max_diameter = 0

        def dfs(node: TreeNode) -> int:
            nonlocal max_diameter
            if not node:
                return 0

            # Calculate heights of left and right subtrees
            left_h = dfs(node.left)
            right_h = dfs(node.right)

            # Longest path with current node as pivot
            max_diameter = max(max_diameter, left_h + right_h)

            # Return height of this subtree to parent
            return 1 + max(left_h, right_h)

        dfs(root)
        return max_diameter
`,
    testCases: [
      { id: 1, inputDesc: "root = [1,2,3,4,5]", expectedDesc: "3", args: [], expected: 3 },
    ],
    runWrapper: (userCode: string) => `
import sys, json

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

from typing import Optional
${userCode}

root = TreeNode(1, TreeNode(2, TreeNode(4), TreeNode(5)), TreeNode(3))
sol = Solution()
r1 = sol.diameterOfBinaryTree(root)
passed = (r1 == 3)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": passed, "actual": r1, "expected": 3}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-tr-4",
    title: "Lowest Common Ancestor of a BST",
    slug: "lowest-common-ancestor-of-a-bst",
    level: 3,
    category: "Trees & BST",
    difficulty: "Medium",
    acceptanceRate: "64.1%",
    description: `Given a binary search tree (BST), find the lowest common ancestor (LCA) node of two given nodes \`p\` and \`q\` in the BST.`,
    examples: [
      { input: "root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 8", output: "6" },
      { input: "root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 4", output: "2" },
    ],
    constraints: ["The number of nodes in the tree is in the range [2, 10^5].", "-10^9 <= Node.val <= 10^9", "All Node.val are unique.", "p and q exist in the BST."],
    patternIntuition: {
      ruleOfThumb: "Leverage BST ordering: If both `p` and `q` are smaller than `curr.val`, search left. If both are greater, search right. The first node where `p` and `q` split across sides is the LCA!",
      recognitionTriggers: ["LCA query specifically in a Binary Search Tree"],
      commonPitfalls: ["Treating it as a general binary tree with O(N) traversal instead of O(H) BST descent"],
      templateSnippet: `def lowestCommonAncestor(root, p, q):
    curr = root
    while curr:
        if p.val > curr.val and q.val > curr.val: curr = curr.right
        elif p.val < curr.val and q.val < curr.val: curr = curr.left
        else: return curr`,
    },
    timeComplexity: "O(H) - Where H is height of BST (O(log N) average).",
    spaceComplexity: "O(1) - Iterative traversal with no extra memory.",
    starterCode: `class Solution:
    def lowestCommonAncestor(self, root: 'TreeNode', p: 'TreeNode', q: 'TreeNode') -> 'TreeNode':
        pass
`,
    solutionCode: `class TreeNode:
    def __init__(self, x):
        self.val = x
        self.left = None
        self.right = None

class Solution:
    def lowestCommonAncestor(self, root: TreeNode, p: TreeNode, q: TreeNode) -> TreeNode:
        curr = root

        while curr:
            # Both nodes lie in right subtree
            if p.val > curr.val and q.val > curr.val:
                curr = curr.right
            # Both nodes lie in left subtree
            elif p.val < curr.val and q.val < curr.val:
                curr = curr.left
            else:
                # Split point found: curr is the lowest common ancestor
                return curr

        return None
`,
    testCases: [
      { id: 1, inputDesc: "root=[6,2,8,0,4,7,9], p=2, q=8", expectedDesc: "6", args: [], expected: 6 },
    ],
    runWrapper: (userCode: string) => `
import sys, json

class TreeNode:
    def __init__(self, x):
        self.val = x
        self.left = None
        self.right = None

from typing import Optional
${userCode}

root = TreeNode(6)
p = TreeNode(2)
q = TreeNode(8)
root.left = p
root.right = q
sol = Solution()
lca = sol.lowestCommonAncestor(root, p, q)
passed = (lca.val == 6)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": passed, "actual": lca.val, "expected": 6}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-tr-5",
    title: "Binary Tree Maximum Path Sum",
    slug: "binary-tree-maximum-path-sum",
    level: 6,
    category: "Trees & BST",
    difficulty: "Hard",
    acceptanceRate: "40.1%",
    description: `A **path** in a binary tree is a sequence of nodes where each pair of adjacent nodes in the sequence has an edge connecting them. A node can only appear in the sequence **at most once**.

Given the \`root\` of a binary tree, return the **maximum path sum** of any non-empty path.`,
    examples: [
      { input: "root = [1,2,3]", output: "6", explanation: "The optimal path is 2 -> 1 -> 3 with a path sum of 2 + 1 + 3 = 6." },
      { input: "root = [-10,9,20,null,null,15,7]", output: "42", explanation: "The optimal path is 15 -> 20 -> 7 with a path sum of 15 + 20 + 7 = 42." },
    ],
    constraints: ["The number of nodes in the tree is in the range [1, 3 * 10^4].", "-1000 <= Node.val <= 1000"],
    patternIntuition: {
      ruleOfThumb: "Postorder DFS: At each node, compute `max_left = max(dfs(node.left), 0)` and `max_right = max(dfs(node.right), 0)`. Update global `max_sum = max(max_sum, node.val + max_left + max_right)`. Return `node.val + max(max_left, max_right)` to parent (since parent can only branch down one side!).",
      recognitionTriggers: ["Maximum sum along continuous tree paths", "Negative node values requiring `max(..., 0)` branch pruning"],
      commonPitfalls: ["Returning `node.val + max_left + max_right` to the parent: a valid path cannot branch into both left and right children AND continue up to parent!"],
      templateSnippet: `def maxPathSum(root: Optional[TreeNode]) -> int:
    res = float("-inf")
    def dfs(node):
        nonlocal res
        if not node: return 0
        l = max(dfs(node.left), 0)
        r = max(dfs(node.right), 0)
        res = max(res, node.val + l + r)
        return node.val + max(l, r)
    dfs(root)
    return res`,
    },
    timeComplexity: "O(N) - Visiting every node once.",
    spaceComplexity: "O(H) - Tree height recursion call stack.",
    starterCode: `class Solution:
    def maxPathSum(self, root: Optional[TreeNode]) -> int:
        pass
`,
    solutionCode: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

class Solution:
    def maxPathSum(self, root: TreeNode) -> int:
        max_sum = float("-inf")

        def dfs(node: TreeNode) -> int:
            nonlocal max_sum
            if not node:
                return 0

            # Prune negative subtree paths with max(..., 0)
            left_gain = max(dfs(node.left), 0)
            right_gain = max(dfs(node.right), 0)

            # Price of path where current node is the arch/peak connecting left and right
            current_path_sum = node.val + left_gain + right_gain
            max_sum = max(max_sum, current_path_sum)

            # Return maximum gain if continuing path up to parent (can only pick one branch)
            return node.val + max(left_gain, right_gain)

        dfs(root)
        return max_sum
`,
    testCases: [
      { id: 1, inputDesc: "root = [1,2,3]", expectedDesc: "6", args: [], expected: 6 },
      { id: 2, inputDesc: "root = [-10,9,20,null,null,15,7]", expectedDesc: "42", args: [], expected: 42 },
    ],
    runWrapper: (userCode: string) => `
import sys, json

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

from typing import Optional
${userCode}

r1_node = TreeNode(1, TreeNode(2), TreeNode(3))
r2_node = TreeNode(-10, TreeNode(9), TreeNode(20, TreeNode(15), TreeNode(7)))

sol = Solution()
r1 = sol.maxPathSum(r1_node)
r2 = sol.maxPathSum(r2_node)
passed = (r1 == 6 and r2 == 42)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == 6, "actual": r1, "expected": 6},
    {"testCase": 2, "passed": r2 == 42, "actual": r2, "expected": 42}
]}))
print("JSON_OUTPUT_END")
`,
  },
];
