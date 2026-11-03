import { DSAProblem } from "./types";

export const LINKED_LIST_PROBLEMS: DSAProblem[] = [
  {
    id: "dsa-ll-1",
    title: "Reverse Linked List",
    slug: "reverse-linked-list",
    level: 1,
    category: "Linked List",
    difficulty: "Easy",
    acceptanceRate: "76.4%",
    description: `Given the \`head\` of a singly linked list, reverse the list, and return the reversed list.`,
    examples: [
      { input: "head = [1,2,3,4,5]", output: "[5,4,3,2,1]" },
      { input: "head = [1,2]", output: "[2,1]" },
      { input: "head = []", output: "[]" },
    ],
    constraints: ["The number of nodes in the list is the range [0, 5000].", "-5000 <= Node.val <= 5000"],
    patternIntuition: {
      ruleOfThumb: "Three-pointer in-place reversal: `prev = None`, `curr = head`. Save `next_temp = curr.next`, rewire `curr.next = prev`, then advance `prev = curr`, `curr = next_temp`.",
      recognitionTriggers: ["Inverting direction of pointer linkages", "O(1) memory requirement"],
      commonPitfalls: ["Losing reference to `curr.next` before rewiring"],
      templateSnippet: `def reverseList(head: Optional[ListNode]) -> Optional[ListNode]:
    prev, curr = None, head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev`,
    },
    timeComplexity: "O(N) - Single pass through list.",
    spaceComplexity: "O(1) - In-place pointer manipulation.",
    starterCode: `# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        pass
`,
    solutionCode: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class Solution:
    def reverseList(self, head: ListNode) -> ListNode:
        prev = None
        curr = head

        while curr:
            # Temporarily save reference to next node
            next_node = curr.next
            # Reverse pointer
            curr.next = prev
            # Advance prev and curr forward
            prev = curr
            curr = next_node

        # prev points to the new head of reversed list
        return prev
`,
    testCases: [
      { id: 1, inputDesc: "head = [1,2,3,4,5]", expectedDesc: "[5,4,3,2,1]", args: [[1,2,3,4,5]], expected: [5,4,3,2,1] },
      { id: 2, inputDesc: "head = [1,2]", expectedDesc: "[2,1]", args: [[1,2]], expected: [2,1] },
    ],
    runWrapper: (userCode: string) => `
import sys, json

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def build_list(vals):
    dummy = ListNode()
    curr = dummy
    for v in vals:
        curr.next = ListNode(v)
        curr = curr.next
    return dummy.next

def to_list(node):
    res = []
    while node:
        res.append(node.val)
        node = node.next
    return res

from typing import Optional
${userCode}

sol = Solution()
r1 = to_list(sol.reverseList(build_list([1,2,3,4,5])))
r2 = to_list(sol.reverseList(build_list([1,2])))
passed = (r1 == [5,4,3,2,1] and r2 == [2,1])

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == [5,4,3,2,1], "actual": r1, "expected": [5,4,3,2,1]},
    {"testCase": 2, "passed": r2 == [2,1], "actual": r2, "expected": [2,1]}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-ll-2",
    title: "Merge Two Sorted Lists",
    slug: "merge-two-sorted-lists",
    level: 1,
    category: "Linked List",
    difficulty: "Easy",
    acceptanceRate: "64.8%",
    description: `You are given the heads of two sorted linked lists \`list1\` and \`list2\`.

Merge the two lists into one **sorted** list. The list should be made by splicing together the nodes of the first two lists. Return the head of the merged linked list.`,
    examples: [
      { input: "list1 = [1,2,4], list2 = [1,3,4]", output: "[1,1,2,3,4,4]" },
      { input: "list1 = [], list2 = []", output: "[]" },
    ],
    constraints: ["The number of nodes in both lists is in the range [0, 50].", "-100 <= Node.val <= 100", "Both lists are sorted in non-decreasing order."],
    patternIntuition: {
      ruleOfThumb: "Use a Sentinel Dummy Head to avoid edge-case null checks. Compare node values from list1 and list2, attach the smaller one, and advance pointers.",
      recognitionTriggers: ["Combining two sorted sequences into a single sequence"],
      commonPitfalls: ["Forgetting to attach the remainder of non-empty list at the end"],
      templateSnippet: `def mergeTwoLists(l1, l2):
    dummy = ListNode()
    curr = dummy
    while l1 and l2:
        if l1.val < l2.val:
            curr.next, l1 = l1, l1.next
        else:
            curr.next, l2 = l2, l2.next
        curr = curr.next
    curr.next = l1 or l2
    return dummy.next`,
    },
    timeComplexity: "O(N + M) - Visiting every node in both lists.",
    spaceComplexity: "O(1) - In-place pointer rewiring.",
    starterCode: `class Solution:
    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:
        pass
`,
    solutionCode: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class Solution:
    def mergeTwoLists(self, list1: ListNode, list2: ListNode) -> ListNode:
        # Dummy sentinel node eliminates edge-case checks for merged head
        dummy = ListNode(0)
        tail = dummy

        while list1 and list2:
            if list1.val <= list2.val:
                tail.next = list1
                list1 = list1.next
            else:
                tail.next = list2
                list2 = list2.next
            tail = tail.next

        # Splice the remainder of whichever list is not exhausted
        tail.next = list1 if list1 else list2

        return dummy.next
`,
    testCases: [
      { id: 1, inputDesc: "list1 = [1,2,4], list2 = [1,3,4]", expectedDesc: "[1,1,2,3,4,4]", args: [[1,2,4], [1,3,4]], expected: [1,1,2,3,4,4] },
    ],
    runWrapper: (userCode: string) => `
import sys, json

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def build_list(vals):
    dummy = ListNode()
    curr = dummy
    for v in vals:
        curr.next = ListNode(v)
        curr = curr.next
    return dummy.next

def to_list(node):
    res = []
    while node:
        res.append(node.val)
        node = node.next
    return res

from typing import Optional
${userCode}

sol = Solution()
r1 = to_list(sol.mergeTwoLists(build_list([1,2,4]), build_list([1,3,4])))
passed = (r1 == [1,1,2,3,4,4])

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": passed, "actual": r1, "expected": [1,1,2,3,4,4]}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-ll-3",
    title: "Reorder List",
    slug: "reorder-list",
    level: 3,
    category: "Linked List",
    difficulty: "Medium",
    acceptanceRate: "56.8%",
    description: `You are given the head of a singly linked-list:
\`L0 → L1 → … → Ln - 1 → Ln\`

Reorder the list to be on the following form:
\`L0 → Ln → L1 → Ln - 1 → L2 → Ln - 2 → …\`

You may not modify the values in the list's nodes. Only nodes themselves may be changed.`,
    examples: [
      { input: "head = [1,2,3,4]", output: "[1,4,2,3]" },
      { input: "head = [1,2,3,4,5]", output: "[1,5,2,4,3]" },
    ],
    constraints: ["The number of nodes in the list is in the range [1, 5 * 10^4].", "1 <= Node.val <= 1000"],
    patternIntuition: {
      ruleOfThumb: "Triple combo: 1) Find middle of list using Slow & Fast pointers; 2) Reverse second half of list; 3) Merge two halves alternately.",
      recognitionTriggers: ["Folding list in half or interleaving ends inwards"],
      commonPitfalls: ["Creating circular pointers: disconnect `slow.next = None` after splitting halves!"],
      templateSnippet: `def reorderList(head: Optional[ListNode]) -> None:
    # 1. Find mid
    slow, fast = head, head.next
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
    # 2. Reverse 2nd half
    second = slow.next
    slow.next = None
    prev = None
    while second:
        tmp = second.next
        second.next = prev
        prev = second
        second = tmp
    # 3. Interleave merge
    first, second = head, prev
    while second:
        tmp1, tmp2 = first.next, second.next
        first.next = second
        second.next = tmp1
        first, second = tmp1, tmp2`,
    },
    timeComplexity: "O(N) - Linear passes for mid, reversal, and merge.",
    spaceComplexity: "O(1) - In-place manipulation.",
    starterCode: `class Solution:
    def reorderList(self, head: Optional[ListNode]) -> None:
        pass
`,
    solutionCode: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class Solution:
    def reorderList(self, head: ListNode) -> None:
        if not head or not head.next:
            return

        # Step 1: Find middle using slow and fast pointers
        slow, fast = head, head.next
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next

        # Step 2: Split and reverse second half
        second = slow.next
        slow.next = None  # Cut first half
        prev = None
        while second:
            next_node = second.next
            second.next = prev
            prev = second
            second = next_node

        # Step 3: Interleave first and second halves
        first, second = head, prev
        while second:
            tmp1, tmp2 = first.next, second.next
            first.next = second
            second.next = tmp1
            first = tmp1
            second = tmp2
`,
    testCases: [
      { id: 1, inputDesc: "head = [1,2,3,4]", expectedDesc: "[1,4,2,3]", args: [[1,2,3,4]], expected: [1,4,2,3] },
      { id: 2, inputDesc: "head = [1,2,3,4,5]", expectedDesc: "[1,5,2,4,3]", args: [[1,2,3,4,5]], expected: [1,5,2,4,3] },
    ],
    runWrapper: (userCode: string) => `
import sys, json

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def build_list(vals):
    dummy = ListNode()
    curr = dummy
    for v in vals:
        curr.next = ListNode(v)
        curr = curr.next
    return dummy.next

def to_list(node):
    res = []
    while node:
        res.append(node.val)
        node = node.next
    return res

from typing import Optional
${userCode}

sol = Solution()
l1 = build_list([1,2,3,4])
sol.reorderList(l1)
r1 = to_list(l1)

l2 = build_list([1,2,3,4,5])
sol.reorderList(l2)
r2 = to_list(l2)

passed = (r1 == [1,4,2,3] and r2 == [1,5,2,4,3])

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == [1,4,2,3], "actual": r1, "expected": [1,4,2,3]},
    {"testCase": 2, "passed": r2 == [1,5,2,4,3], "actual": r2, "expected": [1,5,2,4,3]}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-ll-4",
    title: "Remove Nth Node From End of List",
    slug: "remove-nth-node-from-end-of-list",
    level: 2,
    category: "Linked List",
    difficulty: "Medium",
    acceptanceRate: "46.2%",
    description: `Given the \`head\` of a linked list, remove the \`n-th\` node from the end of the list and return its head. Must do in one pass.`,
    examples: [
      { input: "head = [1,2,3,4,5], n = 2", output: "[1,2,3,5]" },
      { input: "head = [1], n = 1", output: "[]" },
      { input: "head = [1,2], n = 1", output: "[1]" },
    ],
    constraints: ["The number of nodes in the list is sz.", "1 <= sz <= 30", "0 <= Node.val <= 100", "1 <= n <= sz"],
    patternIntuition: {
      ruleOfThumb: "Two pointers separated by an N-node gap: Advance `fast` pointer N steps ahead. Then move both `slow` and `fast` together until `fast.next` is null. `slow.next` is now the target node!",
      recognitionTriggers: ["Single-pass lookup from end of singly linked list"],
      commonPitfalls: ["Removing the head node itself (use dummy node before head to handle cleanly)"],
      templateSnippet: `def removeNthFromEnd(head: Optional[ListNode], n: int) -> Optional[ListNode]:
    dummy = ListNode(0, head)
    slow = fast = dummy
    for _ in range(n): fast = fast.next
    while fast.next:
        slow, fast = slow.next, fast.next
    slow.next = slow.next.next
    return dummy.next`,
    },
    timeComplexity: "O(N) - Single pass through list.",
    spaceComplexity: "O(1) - Constant auxiliary space.",
    starterCode: `class Solution:
    def removeNthFromEnd(self, head: Optional[ListNode], n: int) -> Optional[ListNode]:
        pass
`,
    solutionCode: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class Solution:
    def removeNthFromEnd(self, head: ListNode, n: int) -> ListNode:
        # Dummy node simplifies edge case of removing head node
        dummy = ListNode(0, head)
        slow = dummy
        fast = dummy

        # Advance fast pointer n steps ahead
        for _ in range(n):
            fast = fast.next

        # Move both pointers until fast reaches last node
        while fast.next:
            slow = slow.next
            fast = fast.next

        # slow.next is the n-th node from end; skip it
        slow.next = slow.next.next

        return dummy.next
`,
    testCases: [
      { id: 1, inputDesc: "head = [1,2,3,4,5], n = 2", expectedDesc: "[1,2,3,5]", args: [[1,2,3,4,5], 2], expected: [1,2,3,5] },
      { id: 2, inputDesc: "head = [1], n = 1", expectedDesc: "[]", args: [[1], 1], expected: [] },
    ],
    runWrapper: (userCode: string) => `
import sys, json

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def build_list(vals):
    dummy = ListNode()
    curr = dummy
    for v in vals:
        curr.next = ListNode(v)
        curr = curr.next
    return dummy.next

def to_list(node):
    res = []
    while node:
        res.append(node.val)
        node = node.next
    return res

from typing import Optional
${userCode}

sol = Solution()
r1 = to_list(sol.removeNthFromEnd(build_list([1,2,3,4,5]), 2))
r2 = to_list(sol.removeNthFromEnd(build_list([1]), 1))
passed = (r1 == [1,2,3,5] and r2 == [])

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == [1,2,3,5], "actual": r1, "expected": [1,2,3,5]},
    {"testCase": 2, "passed": r2 == [], "actual": r2, "expected": []}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-ll-5",
    title: "LRU Cache",
    slug: "lru-cache",
    level: 4,
    category: "Linked List",
    difficulty: "Medium",
    acceptanceRate: "42.8%",
    description: `Design a data structure that follows the constraints of a **Least Recently Used (LRU) cache**.

Implement the \`LRUCache\` class:
- \`LRUCache(int capacity)\`: Initialize LRU cache with positive size capacity.
- \`int get(int key)\`: Return value of key if key exists, otherwise -1.
- \`void put(int key, int value)\`: Update value of key if key exists. Otherwise add key-value pair. If size exceeds capacity, evict the least recently used key.

Must run in **O(1)** average time complexity.`,
    examples: [
      { input: '["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]\n[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]', output: "[null, null, null, 1, null, -1, null, -1, 3, 4]" },
    ],
    constraints: ["1 <= capacity <= 3000", "0 <= key <= 10^4", "0 <= value <= 10^5", "At most 2 * 10^5 calls to get and put."],
    patternIntuition: {
      ruleOfThumb: "Combine a Doubly Linked List (O(1) removal and insertion to head) with a Hash Map (O(1) node pointer lookup). Use dummy head and tail sentinel nodes.",
      recognitionTriggers: ["O(1) key access AND O(1) recency eviction"],
      commonPitfalls: ["Forgetting to delete evicted key from hash map upon tail eviction"],
      templateSnippet: `class Node:
    def __init__(self, k=0, v=0): self.k, self.v, self.prev, self.next = k, v, None, None

class LRUCache:
    def __init__(self, capacity: int):
        self.cap, self.map = capacity, {}
        self.head, self.tail = Node(), Node()
        self.head.next, self.tail.prev = self.tail, self.head`,
    },
    timeComplexity: "O(1) for both get and put operations.",
    spaceComplexity: "O(capacity) - Storing up to capacity nodes and hash table entries.",
    starterCode: `class LRUCache:
    def __init__(self, capacity: int):
        pass

    def get(self, key: int) -> int:
        pass

    def put(self, key: int, value: int) -> None:
        pass
`,
    solutionCode: `class Node:
    def __init__(self, key=0, value=0):
        self.key = key
        self.value = value
        self.prev = None
        self.next = None

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}
        # Sentinel dummy nodes
        self.head = Node()
        self.tail = Node()
        self.head.next = self.tail
        self.tail.prev = self.head

    def _remove(self, node: Node):
        node.prev.next = node.next
        node.next.prev = node.prev

    def _add_front(self, node: Node):
        node.next = self.head.next
        node.prev = self.head
        self.head.next.prev = node
        self.head.next = node

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        node = self.cache[key]
        self._remove(node)
        self._add_front(node)
        return node.value

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            node = self.cache[key]
            node.value = value
            self._remove(node)
            self._add_front(node)
        else:
            if len(self.cache) >= self.capacity:
                lru = self.tail.prev
                self._remove(lru)
                del self.cache[lru.key]
            new_node = Node(key, value)
            self.cache[key] = new_node
            self._add_front(new_node)
`,
    testCases: [
      { id: 1, inputDesc: "cap=2, put(1,1), put(2,2), get(1), put(3,3), get(2)", expectedDesc: "get(1)=1, get(2)=-1", args: [], expected: [1, -1] },
    ],
    runWrapper: (userCode: string) => `
import sys, json
from typing import Optional
${userCode}

c = LRUCache(2)
c.put(1, 1)
c.put(2, 2)
g1 = c.get(1) # 1
c.put(3, 3)   # evicts key 2
g2 = c.get(2) # -1
passed = (g1 == 1 and g2 == -1)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": passed, "actual": [g1, g2], "expected": [1, -1]}
]}))
print("JSON_OUTPUT_END")
`,
  },
];
