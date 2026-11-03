import { DSAProblem } from "./types";

export const HEAPS_PROBLEMS: DSAProblem[] = [
  {
    id: "dsa-hp-1",
    title: "Kth Largest Element in a Stream",
    slug: "kth-largest-element-in-a-stream",
    level: 2,
    category: "Heaps & Priority Queues",
    difficulty: "Easy",
    acceptanceRate: "57.2%",
    description: `Design a class to find the \`k-th\` largest element in a stream. Note that it is the \`k-th\` largest element in the sorted order, not the \`k-th\` distinct element.`,
    examples: [
      { input: '["KthLargest", "add", "add", "add", "add", "add"]\n[[3, [4, 5, 8, 2]], [3], [5], [10], [9], [4]]', output: "[null, 4, 5, 5, 8, 8]" },
    ],
    constraints: ["1 <= k <= 10^4", "0 <= nums.length <= 10^4", "-10^4 <= nums[i] <= 10^4", "-10^4 <= val <= 10^4", "At most 10^4 calls will be made to add."],
    patternIntuition: {
      ruleOfThumb: "Maintain a Min-Heap of fixed capacity K. The root `heap[0]` is always the K-th largest element! When adding a new value, push and if len > K, pop the minimum.",
      recognitionTriggers: ["Streaming top-K or dynamic order statistic"],
      commonPitfalls: ["Using a Max-Heap: requires storing all N elements and popping K times on every call (O(K log N) vs O(log K))"],
      templateSnippet: `class KthLargest:
    def __init__(self, k: int, nums: list[int]):
        self.k, self.heap = k, nums
        heapq.heapify(self.heap)
        while len(self.heap) > k: heapq.heappop(self.heap)
    def add(self, val: int) -> int:
        heapq.heappush(self.heap, val)
        if len(self.heap) > self.k: heapq.heappop(self.heap)
        return self.heap[0]`,
    },
    timeComplexity: "O(log K) per add operation.",
    spaceComplexity: "O(K) - Storing exactly K elements.",
    starterCode: `class KthLargest:
    def __init__(self, k: int, nums: list[int]):
        pass

    def add(self, val: int) -> int:
        pass
`,
    solutionCode: `import heapq

class KthLargest:
    def __init__(self, k: int, nums: list[int]):
        self.k = k
        self.min_heap = nums
        # Transform list into a min-heap in O(N)
        heapq.heapify(self.min_heap)

        # Evict smaller elements until exactly k largest remain
        while len(self.min_heap) > k:
            heapq.heappop(self.min_heap)

    def add(self, val: int) -> int:
        # Push new element into min-heap
        heapq.heappush(self.min_heap, val)

        # Keep size bounded to k
        if len(self.min_heap) > self.k:
            heapq.heappop(self.min_heap)

        # Root of min-heap of size k is the k-th largest element overall
        return self.min_heap[0]
`,
    testCases: [
      { id: 1, inputDesc: "k=3, nums=[4,5,8,2], add(3), add(5), add(10)", expectedDesc: "4, 5, 5", args: [], expected: [4, 5, 5] },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

kl = KthLargest(3, [4, 5, 8, 2])
r1 = kl.add(3)  # 4
r2 = kl.add(5)  # 5
r3 = kl.add(10) # 5
passed = (r1 == 4 and r2 == 5 and r3 == 5)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": passed, "actual": [r1, r2, r3], "expected": [4, 5, 5]}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-hp-2",
    title: "Last Stone Weight",
    slug: "last-stone-weight",
    level: 1,
    category: "Heaps & Priority Queues",
    difficulty: "Easy",
    acceptanceRate: "65.8%",
    description: `You are given an array of integers \`stones\` where \`stones[i]\` is the weight of the \`i-th\` stone. We repeatedly smash the two heaviest stones \`x\` and \`y\` (with \`x <= y\`). If \`x == y\`, both destroyed. If \`x != y\`, stone of weight \`y - x\` is created. Return the weight of the last remaining stone, or \`0\`.`,
    examples: [
      { input: "stones = [2,7,4,1,8,1]", output: "1" },
      { input: "stones = [1]", output: "1" },
    ],
    constraints: ["1 <= stones.length <= 30", "1 <= stones[i] <= 1000"],
    patternIntuition: {
      ruleOfThumb: "Max-Heap: Python's `heapq` is a Min-Heap by default, so negate weights: `[-s for s in stones]`. Pop two largest, if `diff > 0`, push `-diff` back.",
      recognitionTriggers: ["Repeatedly extracting top 2 maximum elements until 1 remains"],
      commonPitfalls: ["Forgetting to negate weights when popping or pushing back in Python"],
      templateSnippet: `def lastStoneWeight(stones: list[int]) -> int:
    h = [-s for s in stones]
    heapq.heapify(h)
    while len(h) > 1:
        s1, s2 = heapq.heappop(h), heapq.heappop(h)
        if s1 != s2: heapq.heappush(h, s1 - s2)
    return -h[0] if h else 0`,
    },
    timeComplexity: "O(N log N) - N-1 smashes with O(log N) heap operations.",
    spaceComplexity: "O(N) - Storing negated weights.",
    starterCode: `class Solution:
    def lastStoneWeight(self, stones: list[int]) -> int:
        pass
`,
    solutionCode: `import heapq

class Solution:
    def lastStoneWeight(self, stones: list[int]) -> int:
        # Negate weights to simulate a Max-Heap using Python's heapq
        max_heap = [-s for s in stones]
        heapq.heapify(max_heap)

        while len(max_heap) > 1:
            first = -heapq.heappop(max_heap)   # Heaviest
            second = -heapq.heappop(max_heap)  # Second heaviest

            # If weights differ, push the remainder back
            if first != second:
                heapq.heappush(max_heap, -(first - second))

        return -max_heap[0] if max_heap else 0
`,
    testCases: [
      { id: 1, inputDesc: "stones = [2,7,4,1,8,1]", expectedDesc: "1", args: [[2,7,4,1,8,1]], expected: 1 },
      { id: 2, inputDesc: "stones = [1]", expectedDesc: "1", args: [[1]], expected: 1 },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.lastStoneWeight([2,7,4,1,8,1])
r2 = sol.lastStoneWeight([1])
passed = (r1 == 1 and r2 == 1)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == 1, "actual": r1, "expected": 1},
    {"testCase": 2, "passed": r2 == 1, "actual": r2, "expected": 1}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-hp-3",
    title: "Kth Largest Element in an Array",
    slug: "kth-largest-element-in-an-array",
    level: 3,
    category: "Heaps & Priority Queues",
    difficulty: "Medium",
    acceptanceRate: "67.1%",
    description: `Given an integer array \`nums\` and an integer \`k\`, return the \`k-th\` largest element in the array. Note that it is the \`k-th\` largest element in the sorted order, not the \`k-th\` distinct element. Must solve without sorting in O(N log K) or QuickSelect O(N).`,
    examples: [
      { input: "nums = [3,2,1,5,6,4], k = 2", output: "5" },
      { input: "nums = [3,2,3,1,2,4,5,5,6], k = 4", output: "4" },
    ],
    constraints: ["1 <= k <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    patternIntuition: {
      ruleOfThumb: "Maintain a Min-Heap of size K. Push each number; whenever heap size exceeds K, pop the minimum. The root `heap[0]` is the K-th largest.",
      recognitionTriggers: ["Unsorted array top-K selection"],
      commonPitfalls: ["Sorting whole array O(N log N) when K is very small (K << N)"],
      templateSnippet: `def findKthLargest(nums: list[int], k: int) -> int:
    h = []
    for n in nums:
        heapq.heappush(h, n)
        if len(h) > k: heapq.heappop(h)
    return h[0]`,
    },
    timeComplexity: "O(N log K) - Bounded min-heap of size K.",
    spaceComplexity: "O(K) - Storing K elements in heap.",
    starterCode: `class Solution:
    def findKthLargest(self, nums: list[int], k: int) -> int:
        pass
`,
    solutionCode: `import heapq

class Solution:
    def findKthLargest(self, nums: list[int], k: int) -> int:
        min_heap = []

        for num in nums:
            heapq.heappush(min_heap, num)
            # Evict smallest element when size exceeds k
            if len(min_heap) > k:
                heapq.heappop(min_heap)

        # Root holds the k-th largest element
        return min_heap[0]
`,
    testCases: [
      { id: 1, inputDesc: "nums=[3,2,1,5,6,4], k=2", expectedDesc: "5", args: [[3,2,1,5,6,4], 2], expected: 5 },
      { id: 2, inputDesc: "nums=[3,2,3,1,2,4,5,5,6], k=4", expectedDesc: "4", args: [[3,2,3,1,2,4,5,5,6], 4], expected: 4 },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.findKthLargest([3,2,1,5,6,4], 2)
r2 = sol.findKthLargest([3,2,3,1,2,4,5,5,6], 4)
passed = (r1 == 5 and r2 == 4)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == 5, "actual": r1, "expected": 5},
    {"testCase": 2, "passed": r2 == 4, "actual": r2, "expected": 4}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-hp-4",
    title: "Task Scheduler",
    slug: "task-scheduler",
    level: 4,
    category: "Heaps & Priority Queues",
    difficulty: "Medium",
    acceptanceRate: "59.8%",
    description: `Given a characters array \`tasks\`, representing the tasks a CPU needs to do, where each letter represents a different task. Tasks could be done in any order. Each task is done in one unit of time. For each unit of time, the CPU could complete either one task or be idle. However, there is a non-negative integer \`n\` that represents the cooldown period between two **same tasks**. Return the least number of units of times that the CPU will take to finish all the given tasks.`,
    examples: [
      { input: 'tasks = ["A","A","A","B","B","B"], n = 2', output: "8", explanation: "A -> B -> idle -> A -> B -> idle -> A -> B" },
      { input: 'tasks = ["A","A","A","B","B","B"], n = 0', output: "6" },
    ],
    constraints: ["1 <= tasks.length <= 10^4", "tasks[i] is uppercase English letter.", "0 <= n <= 100"],
    patternIntuition: {
      ruleOfThumb: "Max-Heap + Cooldown Queue: Greedily pick the task with the highest remaining frequency. Once executed, place `(remaining_count - 1, available_time = time + n)` in a FIFO queue until its cooldown expires.",
      recognitionTriggers: ["CPU task scheduling with cooling intervals"],
      commonPitfalls: ["Simulating CPU idle time one-by-one when heap is empty (advance clock directly to queue's available time)"],
      templateSnippet: `def leastInterval(tasks: list[str], n: int) -> int:
    count = collections.Counter(tasks)
    max_h = [-c for c in count.values()]
    heapq.heapify(max_h)
    q = collections.deque() # (cnt, available_time)
    time = 0
    while max_h or q:
        time += 1
        if max_h:
            cnt = 1 + heapq.heappop(max_h)
            if cnt: q.append((cnt, time + n))
        if q and q[0][1] == time:
            heapq.heappush(max_h, q.popleft()[0])
    return time`,
    },
    timeComplexity: "O(Total Tasks * log 26) = O(N) - Maximum 26 uppercase letters.",
    spaceComplexity: "O(1) - Bounded by 26 distinct tasks.",
    starterCode: `class Solution:
    def leastInterval(self, tasks: list[str], n: int) -> int:
        pass
`,
    solutionCode: `import heapq
from collections import Counter, deque

class Solution:
    def leastInterval(self, tasks: list[str], n: int) -> int:
        # Count frequency of each task
        counts = Counter(tasks)
        # Max-heap storing negated frequencies
        max_heap = [-c for c in counts.values()]
        heapq.heapify(max_heap)

        # Queue tracking (remaining_count, ready_time)
        cooldown_queue = deque()
        current_time = 0

        while max_heap or cooldown_queue:
            current_time += 1

            if max_heap:
                # Execute most frequent available task
                rem = 1 + heapq.heappop(max_heap)
                if rem != 0:
                    cooldown_queue.append((rem, current_time + n))

            # If task at head of cooldown queue is ready to run again
            if cooldown_queue and cooldown_queue[0][1] == current_time:
                heapq.heappush(max_heap, cooldown_queue.popleft()[0])

        return current_time
`,
    testCases: [
      { id: 1, inputDesc: 'tasks=["A","A","A","B","B","B"], n=2', expectedDesc: "8", args: [["A","A","A","B","B","B"], 2], expected: 8 },
      { id: 2, inputDesc: 'tasks=["A","A","A","B","B","B"], n=0', expectedDesc: "6", args: [["A","A","A","B","B","B"], 0], expected: 6 },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.leastInterval(["A","A","A","B","B","B"], 2)
r2 = sol.leastInterval(["A","A","A","B","B","B"], 0)
passed = (r1 == 8 and r2 == 6)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == 8, "actual": r1, "expected": 8},
    {"testCase": 2, "passed": r2 == 6, "actual": r2, "expected": 6}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-hp-5",
    title: "Find Median from Data Stream",
    slug: "find-median-from-data-stream",
    level: 6,
    category: "Heaps & Priority Queues",
    difficulty: "Hard",
    acceptanceRate: "51.8%",
    description: `The **median** is the middle value in an ordered integer list.

Implement the \`MedianFinder\` class:
- \`MedianFinder()\` initializes the MedianFinder object.
- \`void addNum(int num)\` adds integer num from data stream.
- \`double findMedian()\` returns median of all elements so far. Answers within 10^-5 accepted.`,
    examples: [
      { input: 'addNum(1), addNum(2), findMedian()->1.5, addNum(3), findMedian()->2.0', output: "1.5, 2.0" },
    ],
    constraints: ["-10^5 <= num <= 10^5", "There will be at least one element in the data structure before calling findMedian.", "At most 5 * 10^4 calls will be made to addNum and findMedian."],
    patternIntuition: {
      ruleOfThumb: "Two Heaps Pattern: Balance a Max-Heap for the smaller half of numbers (`small`) and a Min-Heap for the larger half of numbers (`large`). Keep sizes equal, or `len(small) == len(large) + 1`.",
      recognitionTriggers: ["Real-time running median calculation on unbounded stream"],
      commonPitfalls: ["Inserting directly into large heap without passing through small heap first: must maintain invariant that all elements in small <= all elements in large!"],
      templateSnippet: `class MedianFinder:
    def __init__(self):
        self.small, self.large = [], [] # max_heap, min_heap
    def addNum(self, num):
        heapq.heappush(self.small, -num)
        if self.small and self.large and (-self.small[0] > self.large[0]):
            heapq.heappush(self.large, -heapq.heappop(self.small))
        if len(self.small) > len(self.large) + 1:
            heapq.heappush(self.large, -heapq.heappop(self.small))
        if len(self.large) > len(self.small):
            heapq.heappush(self.small, -heapq.heappop(self.large))`,
    },
    timeComplexity: "addNum: O(log N); findMedian: O(1).",
    spaceComplexity: "O(N) - Storing numbers in two heaps.",
    starterCode: `class MedianFinder:
    def __init__(self):
        pass

    def addNum(self, num: int) -> None:
        pass

    def findMedian(self) -> float:
        pass
`,
    solutionCode: `import heapq

class MedianFinder:
    def __init__(self):
        # Max-heap for lower half of numbers (stores negated values)
        self.small = []
        # Min-heap for upper half of numbers
        self.large = []

    def addNum(self, num: int) -> None:
        # Default: push to lower half
        heapq.heappush(self.small, -num)

        # Invariant 1: Every element in small must be <= every element in large
        if self.small and self.large and (-self.small[0] > self.large[0]):
            val = -heapq.heappop(self.small)
            heapq.heappush(self.large, val)

        # Invariant 2: Sizes must be balanced (len(small) == len(large) or len(small) == len(large) + 1)
        if len(self.small) > len(self.large) + 1:
            val = -heapq.heappop(self.small)
            heapq.heappush(self.large, val)
        elif len(self.large) > len(self.small):
            val = heapq.heappop(self.large)
            heapq.heappush(self.small, -val)

    def findMedian(self) -> float:
        if len(self.small) > len(self.large):
            return float(-self.small[0])
        return (-self.small[0] + self.large[0]) / 2.0
`,
    testCases: [
      { id: 1, inputDesc: "add(1), add(2), median()=1.5, add(3), median()=2.0", expectedDesc: "1.5, 2.0", args: [], expected: [1.5, 2.0] },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

mf = MedianFinder()
mf.addNum(1)
mf.addNum(2)
m1 = mf.findMedian() # 1.5
mf.addNum(3)
m2 = mf.findMedian() # 2.0
passed = (m1 == 1.5 and m2 == 2.0)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": passed, "actual": [m1, m2], "expected": [1.5, 2.0]}
]}))
print("JSON_OUTPUT_END")
`,
  },
];
