import type { Flashcard } from "../cs_fundamentals";

// "DSA Patterns" cards: for each DSA category, a recognition card (signals → pattern)
// and an invariant/checkpoint card. Ids are fc-dsa-<category>-signals / -invariant
// and must stay stable (saved review state is keyed by id).
type CardSpec = Omit<Flashcard, "category">;

const cards: CardSpec[] = [
  // ── Arrays & Hashing ────────────────────────────────────────────────
  {
    id: "fc-dsa-arrays-hashing-signals",
    difficulty: "Easy",
    question: "Signals: unsorted input; find a complement pair, detect duplicates, count frequencies or group items by a shared signature; O(n) time expected with O(n) extra space allowed. Which pattern, and why?",
    answer: "Hash map / set. One pass that remembers what you've seen replaces the O(n²) compare-every-pair search with O(n) average: Two Sum stores value → index and checks `target - x`; Group Anagrams keys on a canonical signature (sorted string or 26-count tuple); Longest Consecutive Sequence starts counting only at x where x − 1 is not in the set.",
    explanation: "If the input is sorted or O(1) extra space is required, think two pointers instead. If keys are small bounded integers (e.g. 26 letters), a fixed-size array is a faster 'hash map'.",
  },
  {
    id: "fc-dsa-arrays-hashing-invariant",
    difficulty: "Medium",
    question: "Checkpoint: why is a hash lookup O(1) only on average, and in one-pass Two Sum why do you check the map before inserting the current element?",
    answer: "A good hash spreads keys evenly and resizing keeps the load factor bounded, so the expected probe length is constant; adversarial collisions or a bad hash degrade it to O(n). Invariant: while processing index i, the map holds exactly elements 0..i−1. Checking `target − nums[i]` before inserting nums[i] prevents pairing an element with itself, and duplicates still work ([3, 3], target 6: the first 3 is already stored).",
    explanation: "Stating the 'map contains the prefix' invariant is the quickest proof of correctness for most one-pass hashing solutions.",
    codeSnippet: `seen = {}
for i, x in enumerate(nums):
    if target - x in seen:
        return [seen[target - x], i]
    seen[x] = i`,
  },

  // ── Prefix Sums ─────────────────────────────────────────────────────
  {
    id: "fc-dsa-prefix-sums-signals",
    difficulty: "Medium",
    question: "Signals: many range-sum queries on a static array, or 'count subarrays whose sum equals k' where values can be negative. Which pattern, and why not a sliding window?",
    answer: "Prefix sums. Precompute P where P[0] = 0 and P[i+1] = P[i] + nums[i]; any range sum is P[r+1] − P[l] in O(1). To count subarrays summing to k, keep a hash map of prefix-sum frequencies and add `count[P − k]` at each step. A sliding window needs monotonicity (growing the window always increases the sum), which negative numbers break.",
    explanation: "Variants: prefix XOR, prefix sums mod k ('subarray sum divisible by k'), 2D prefix sums for submatrix queries, and difference arrays for batched range updates.",
    codeSnippet: `count = {0: 1}          # the empty prefix
prefix = ans = 0
for x in nums:
    prefix += x
    ans += count.get(prefix - k, 0)
    count[prefix] = count.get(prefix, 0) + 1`,
  },
  {
    id: "fc-dsa-prefix-sums-invariant",
    difficulty: "Medium",
    question: "Checkpoint: why does prefix[j] − prefix[i] give the sum between two boundaries, and why seed the frequency map with {0: 1}?",
    answer: "With P[i] = nums[0] + … + nums[i−1], subtracting P[i] from P[j] cancels the shared first i terms and leaves nums[i..j−1] (a half-open range). Seeding {0: 1} represents the empty prefix, so a subarray that starts at index 0 — whose prefix itself equals k — is counted.",
    explanation: "Using an n + 1 length prefix array with P[0] = 0 removes most off-by-one errors. Update the map after querying it, so a subarray never has length zero.",
  },

  // ── Two Pointers ────────────────────────────────────────────────────
  {
    id: "fc-dsa-two-pointers-signals",
    difficulty: "Easy",
    question: "Signals: sorted array (or sorting is allowed), find a pair/triplet hitting a target, palindrome check, container with most water, remove duplicates in place, O(1) extra space. Which pattern, and why?",
    answer: "Two pointers. Opposite ends converging for sorted pair sums, palindromes and area problems; same-direction read/write pointers for in-place compaction. Each pointer move rules out a whole row or column of the n² candidate pairs, so the scan is O(n). 3Sum = sort + fix one element + two pointers → O(n²).",
    explanation: "Sorting first costs O(n log n) but often unlocks an O(1)-space scan. If original indices must be returned, either sort (value, index) pairs or use a hash map instead.",
  },
  {
    id: "fc-dsa-two-pointers-invariant",
    difficulty: "Medium",
    question: "Checkpoint: in sorted Two Sum and Container With Most Water, what can you safely discard whenever a pointer moves?",
    answer: "Two Sum: if nums[l] + nums[r] < target, nums[l] plus any remaining element is also too small (nums[r] is the largest left), so index l can never be in a solution — discard it. Symmetric when the sum is too large. Container: the area is limited by the shorter line; moving the taller line inward only shrinks the width without raising that minimum, so always move the shorter one.",
    explanation: "Invariant: if an answer exists, it lies within [l, r]. Each move must provably preserve that invariant — that is the whole correctness argument.",
  },

  // ── Sliding Window ──────────────────────────────────────────────────
  {
    id: "fc-dsa-sliding-window-signals",
    difficulty: "Medium",
    question: "Signals: contiguous subarray or substring; longest/shortest/count satisfying a constraint (no repeats, at most k distinct, contains every char of t, sum ≥ target with positive numbers). Which pattern, and what property must hold?",
    answer: "Variable-size sliding window: extend the right edge each step and move the left edge while the window violates (for 'longest') or satisfies (for 'shortest') the condition. Each index enters and leaves at most once → O(n). It requires monotonicity: shrinking a valid window keeps it valid (or growing an invalid one keeps it invalid). A fixed-size window handles 'every window of size k'.",
    explanation: "When negative numbers break monotonicity, switch to prefix sums + hash map, or a monotonic deque for constrained sums.",
  },
  {
    id: "fc-dsa-sliding-window-invariant",
    difficulty: "Hard",
    question: "Checkpoint: in Longest Repeating Character Replacement, when is the window valid, when must it shrink, and why can `max_freq` stay stale?",
    answer: "Window [l, r] is valid iff (window length − count of its most frequent char) ≤ k. After adding s[r], move l right while that is violated. `max_freq` never needs to decrease: the answer only improves when a window has a higher max frequency than seen before, so an overestimate can never produce a wrong larger answer.",
    explanation: "Minimum Window Substring is the mirror image: track how many required characters are satisfied, shrink while all are satisfied, and record the minimum length at each valid state.",
    codeSnippet: `count, l, max_freq, best = {}, 0, 0, 0
for r, ch in enumerate(s):
    count[ch] = count.get(ch, 0) + 1
    max_freq = max(max_freq, count[ch])
    while (r - l + 1) - max_freq > k:
        count[s[l]] -= 1
        l += 1
    best = max(best, r - l + 1)`,
  },

  // ── Stack & Monotonic Queue ─────────────────────────────────────────
  {
    id: "fc-dsa-stack-signals",
    difficulty: "Medium",
    question: "Signals: next greater/smaller element, daily temperatures, stock span, largest rectangle in a histogram, sliding window maximum, or matching nested brackets. Which pattern, and why is it linear?",
    answer: "Stack. Brackets, nested expressions and RPN: a plain stack, because the most recent unmatched opener must close first (LIFO). Next greater/smaller and histogram problems: a monotonic stack of indices — when the current value breaks monotonicity it is the answer for every element it pops. Sliding window maximum: a monotonic deque, also dropping expired indices from the front. Every index is pushed and popped at most once → O(n).",
    explanation: "Store indices rather than values so you can compute distances and widths and check whether an entry has left the window.",
  },
  {
    id: "fc-dsa-stack-invariant",
    difficulty: "Hard",
    question: "Checkpoint: in a monotonic stack for Next Greater Element, what does each entry represent and when is it removed? How does Largest Rectangle in Histogram use the same idea?",
    answer: "The stack holds indices still waiting for their next greater element, with values strictly decreasing from bottom to top. When nums[i] exceeds the top's value, nums[i] is the first greater element to the right of that index: pop, record, repeat, then push i. Indices left at the end have no answer (−1). Histogram: keep increasing heights; when a shorter bar arrives at i, the popped bar's right limit is i and its left limit is the new top, so width = i − top − 1.",
    explanation: "Appending a sentinel bar of height 0 flushes the stack at the end so no special post-loop handling is needed.",
    codeSnippet: `ans = [-1] * len(nums)
stack = []                      # indices, values decreasing
for i, x in enumerate(nums):
    while stack and nums[stack[-1]] < x:
        ans[stack.pop()] = x
    stack.append(i)`,
  },

  // ── Sorting ─────────────────────────────────────────────────────────
  {
    id: "fc-dsa-sorting-signals",
    difficulty: "Medium",
    question: "Signals: relative order unlocks the solution (two pointers, greedy, interval merging, de-duplication); count inversions; kth element; values with a small range (colours 0/1/2). Which sorting technique fits each?",
    answer: "Sort first (O(n log n)) when order enables a linear scan afterwards. Merge sort when you need stability, a guaranteed O(n log n), or to count inversions while merging. Quickselect (average O(n)) for the kth element. Counting/bucket sort for a small key range (O(n + k)). Dutch national flag 3-way partition to sort 0/1/2 in one pass with O(1) space.",
    explanation: "Say which property you need — stability, worst case, in-place or partial order — and pick the algorithm that provides exactly that.",
  },
  {
    id: "fc-dsa-sorting-invariant",
    difficulty: "Hard",
    question: "Checkpoint: compare merge sort with in-place quicksort partitioning, and state the Dutch national flag invariant.",
    answer: "Merge sort: O(n log n) always, O(n) auxiliary space, stable, natural for linked lists and external sorting. Quicksort: O(n log n) average, O(n²) worst case with bad pivots (randomise), O(log n) stack, in-place, not stable, cache-friendly. Dutch flag: [0, low) are 0s, [low, mid) are 1s, (high, n−1] are 2s, [mid, high] is unexamined; loop while mid ≤ high.",
    explanation: "After swapping nums[mid] with nums[high], do not advance mid — the value swapped in has not been examined yet. That one detail is the usual bug.",
  },

  // ── Binary Search ───────────────────────────────────────────────────
  {
    id: "fc-dsa-binary-search-signals",
    difficulty: "Medium",
    question: "Signals: sorted or rotated array lookup in O(log n); first/last occurrence; or 'minimum speed / capacity / days such that the plan is feasible'. Which pattern, and what makes it applicable?",
    answer: "Binary search — on indices or on the answer space. It applies whenever a predicate is monotone over the search range (false … false, true … true): the boundary is found in O(log range) predicate evaluations. Koko Eating Bananas, Ship Packages in D Days and Split Array Largest Sum binary-search the answer and check feasibility in O(n) → O(n log range).",
    explanation: "Rotated arrays work because at least one half around mid is always sorted, which tells you which half can contain the target.",
  },
  {
    id: "fc-dsa-binary-search-invariant",
    difficulty: "Medium",
    question: "Checkpoint: write a 'first true' binary search and state its invariant and why it terminates.",
    answer: "Invariant: everything below lo is false and everything at or above hi is true; [lo, hi) is still unknown. Because mid < hi, setting hi = mid or lo = mid + 1 always shrinks the interval, and the loop ends with lo == hi = the first true index (or n if none).",
    explanation: "Common bugs: `lo = mid` with a floor midpoint (infinite loop when hi = lo + 1), and mixing inclusive and half-open bounds within one loop. Pick one convention and state it.",
    codeSnippet: `lo, hi = 0, n            # answer in [lo, hi]; n means 'none'
while lo < hi:
    mid = (lo + hi) // 2
    if pred(mid):
        hi = mid             # mid may be the answer
    else:
        lo = mid + 1         # mid and everything left of it are false
return lo`,
  },

  // ── Linked List ─────────────────────────────────────────────────────
  {
    id: "fc-dsa-linked-list-signals",
    difficulty: "Medium",
    question: "Signals: detect a cycle or its start, find the middle, remove the kth node from the end, reorder or check a palindrome list, all with O(1) extra space; or O(1) get + O(1) recency eviction. Which techniques?",
    answer: "Fast & slow pointers (Floyd): fast moves 2, slow moves 1 — they meet iff there is a cycle, and when fast reaches the end slow is at the middle. Kth from end: advance a lead pointer k steps, then move both. A dummy head node for any operation that might change the head. In-place reversal (prev/curr/next) for reorder and palindrome. LRU cache: hash map + doubly linked list.",
    explanation: "Draw the pointer changes before writing them, and always save `curr.next` before rewiring `curr`.",
  },
  {
    id: "fc-dsa-linked-list-invariant",
    difficulty: "Hard",
    question: "Checkpoint: after slow and fast meet inside a cycle, why does moving one pointer back to the head and stepping both by one find the cycle's start?",
    answer: "Let a = head → cycle start, b = start → meeting point, c = cycle length. Slow walked a + b; fast walked 2(a + b) = a + b + kc, so a + b = kc and a = kc − b. Walking a steps from the meeting point therefore lands exactly on the cycle start — the same place a pointer from the head reaches after a steps.",
    explanation: "For reversal, the invariant is: `prev` is the already-reversed prefix and `curr` is the untouched remainder; each step moves one node from the remainder onto the reversed prefix.",
    codeSnippet: `prev, curr = None, head
while curr:
    nxt = curr.next
    curr.next = prev
    prev, curr = curr, nxt
return prev`,
  },

  // ── Trees & BST ─────────────────────────────────────────────────────
  {
    id: "fc-dsa-trees-bst-signals",
    difficulty: "Medium",
    question: "Signals: hierarchical data; height, diameter, path sums, lowest common ancestor, level-by-level views, kth smallest in a BST or validating one. Which traversal fits which question?",
    answer: "DFS post-order when a node needs its children's results (height, diameter, balanced check, max path sum); DFS pre-order to push state down (path sums, BST bounds). BFS with a queue, processing `len(queue)` nodes per round, for level order, right side view and minimum depth. BST: in-order traversal is sorted, and the ordering lets you descend one side only (O(h) search or LCA).",
    explanation: "State h explicitly: O(log n) for a balanced tree, O(n) for a skewed one — this affects both time and recursion-stack space.",
  },
  {
    id: "fc-dsa-trees-bst-invariant",
    difficulty: "Hard",
    question: "Checkpoint: why isn't comparing each node with its children enough to validate a BST? And in Diameter of Binary Tree, how does what the recursion returns differ from what it records?",
    answer: "The BST property is global: every node in the left subtree must be < the node < every node in the right subtree. Pass (low, high) bounds down — the left child gets (low, node.val), the right child (node.val, high). In [5, 4, 6, null, null, 3, 7], 3 is fine under 6 locally but violates the root bound of 5. Diameter: the function returns the height (the longest downward path a parent can extend) but records left + right (the path through this node) in an outer best variable.",
    explanation: "'Return one thing, record another' also solves Binary Tree Maximum Path Sum — return `node.val + max(0, left, right)`, record `node.val + max(0, left) + max(0, right)`.",
  },

  // ── Tries ───────────────────────────────────────────────────────────
  {
    id: "fc-dsa-tries-signals",
    difficulty: "Medium",
    question: "Signals: many prefix queries (autocomplete, startsWith), searching a dictionary of words on a board (Word Search II), wildcard '.' matching, replacing words with their shortest root, maximum XOR pair. Which structure, and why?",
    answer: "A trie (prefix tree): each node has a children map and an end-of-word flag. Insert and search cost O(L) for word length L, independent of how many words are stored, and shared prefixes are stored once. Word Search II: build a trie of the words and DFS the board guided by it, pruning as soon as a prefix doesn't exist. Maximum XOR: a binary trie of bits from most significant down, greedily taking the opposite bit.",
    explanation: "Versus a hash set of words: a set answers 'is this a word?' but not 'can any word start with this prefix?' without scanning everything.",
  },
  {
    id: "fc-dsa-tries-invariant",
    difficulty: "Medium",
    question: "Checkpoint: how do you distinguish a valid prefix from a stored word, and what pruning makes Word Search II fast?",
    answer: "Reaching the node for the last character proves the prefix exists; it is a complete word only if that node's end flag (or stored word) is set — after inserting 'apple', search('app') is False while startsWith('app') is True. Word Search II pruning: stop when the next character isn't a child, mark cells visited in place and restore them on backtrack, clear a node's word once found (no duplicates), and delete childless nodes so dead branches are never explored again.",
    explanation: "Storing the whole word at its terminal node avoids rebuilding strings during DFS.",
    codeSnippet: `class TrieNode:
    def __init__(self):
        self.children = {}
        self.word = None     # set at the node that ends a word`,
  },

  // ── Heaps & Priority Queues ─────────────────────────────────────────
  {
    id: "fc-dsa-heaps-signals",
    difficulty: "Medium",
    question: "Signals: top-k / kth largest, merge k sorted lists, running median of a stream, repeatedly process the cheapest/earliest/largest available item (task scheduling, Dijkstra). Which structure, and what are the costs?",
    answer: "A heap / priority queue: O(log n) push and pop, O(1) peek. Top-k largest: a min-heap of size k (pop whenever it exceeds k) → O(n log k), and its root is the kth largest. Merge k lists: a heap of the current heads → O(N log k). Running median: two heaps. Shortest paths: a heap as the Dijkstra frontier.",
    explanation: "For a one-shot kth element on an in-memory array, quickselect is O(n) on average; the heap wins for streams and when k ≪ n.",
  },
  {
    id: "fc-dsa-heaps-invariant",
    difficulty: "Hard",
    question: "Checkpoint: in the two-heap running median, what does each heap contain, and how do you keep them balanced?",
    answer: "`low` is a max-heap (negated values in Python) of the smaller half; `high` is a min-heap of the larger half. Invariants: every value in low ≤ every value in high, and len(low) equals len(high) or exceeds it by one. Insert: push into low, move low's max to high, and if high is now larger move high's min back. Median: low's top (odd count) or the average of both tops.",
    explanation: "Each insert is O(log n) and each median query O(1). Routing every insert through both heaps keeps the ordering invariant without special-case comparisons.",
    codeSnippet: `heapq.heappush(low, -num)
heapq.heappush(high, -heapq.heappop(low))
if len(high) > len(low):
    heapq.heappush(low, -heapq.heappop(high))`,
  },

  // ── Backtracking & Recursion ────────────────────────────────────────
  {
    id: "fc-dsa-backtracking-signals",
    difficulty: "Medium",
    question: "Signals: 'return all' subsets, permutations, combinations or partitions; N-Queens, Sudoku, word search on a grid; n is small (≲ 20). Which pattern, and why is exponential time acceptable?",
    answer: "Backtracking: a DFS over the decision tree — choose, explore, un-choose — pruning partial states that cannot lead to an answer. The output itself is exponential (2^n subsets, n! permutations), so no algorithm can beat output size; costs are typically O(n·2^n) for subsets and O(n·n!) for permutations. Small n in the constraints is the signal that exponential search is intended.",
    explanation: "Pruning (sorting candidates and breaking early, constraint checks like column/diagonal sets in N-Queens) changes the constant factor dramatically, even though the worst-case bound stays exponential.",
  },
  {
    id: "fc-dsa-backtracking-invariant",
    difficulty: "Hard",
    question: "Checkpoint: define the state, choices and termination for Combination Sum, and explain how you avoid duplicate combinations.",
    answer: "State = (start index, remaining target, current path). Choices = candidates[i] for i ≥ start; because reuse is allowed, recurse with i (not i + 1). Record a copy of the path when remaining == 0; with sorted candidates, stop as soon as a candidate exceeds remaining. The start index forces non-decreasing order, so each multiset is generated exactly once. With duplicate inputs (Combination Sum II, Subsets II), sort and skip `if i > start and c[i] == c[i - 1]`.",
    explanation: "Always append `path[:]` (a copy) when recording, and undo exactly what you did before returning — the un-choose step is what makes it backtracking.",
    codeSnippet: `def dfs(start, remaining, path):
    if remaining == 0:
        result.append(path[:])
        return
    for i in range(start, len(cands)):
        if cands[i] > remaining:
            break                  # sorted: later ones are larger
        path.append(cands[i])
        dfs(i, remaining - cands[i], path)
        path.pop()`,
  },

  // ── Graphs & Shortest Path ──────────────────────────────────────────
  {
    id: "fc-dsa-graphs-signals",
    difficulty: "Medium",
    question: "Signals: count islands / connected regions; fewest steps with unit cost; spreading from several sources at once (rotting oranges); prerequisites or build order; shortest path with non-negative weights. Which algorithm for each?",
    answer: "Connected regions: DFS/BFS flood fill. Fewest steps, unit cost: BFS — the first time a node is reached is its shortest distance. Multiple sources: multi-source BFS, seeding the queue with every source at distance 0. Ordering / cycle detection in a directed graph: topological sort (Kahn's in-degree BFS or DFS post-order). Non-negative weights: Dijkstra with a heap, O((V + E) log V).",
    explanation: "Model first: what is a node (cell, word, state tuple), what is an edge, are edges weighted or directed? Implicit graphs (Word Ladder, lock combinations) use the same algorithms on generated neighbours.",
  },
  {
    id: "fc-dsa-graphs-invariant",
    difficulty: "Hard",
    question: "Checkpoint: why mark BFS nodes as visited when they are enqueued (not dequeued), and why does Dijkstra require non-negative edge weights?",
    answer: "Marking at enqueue time puts each node in the queue at most once, keeping BFS O(V + E); marking at dequeue lets the same node be enqueued many times. BFS invariant: the queue holds nodes in non-decreasing distance (at most two adjacent levels). Dijkstra: when the node with the smallest tentative distance is popped, no other path can be shorter, because any detour adds non-negative weight — a negative edge breaks that argument.",
    explanation: "In heap-based Dijkstra, skip stale entries whose popped distance is greater than the best recorded distance (lazy deletion) instead of trying to decrease keys.",
    codeSnippet: `dist = {src: 0}
heap = [(0, src)]
while heap:
    d, u = heapq.heappop(heap)
    if d > dist[u]:
        continue                     # stale entry
    for v, w in graph[u]:
        if d + w < dist.get(v, float('inf')):
            dist[v] = d + w
            heapq.heappush(heap, (d + w, v))`,
  },

  // ── Advanced Graphs ─────────────────────────────────────────────────
  {
    id: "fc-dsa-advanced-graphs-signals",
    difficulty: "Hard",
    question: "Signals: connect every node at minimum total cost; shortest path using at most k edges/stops; negative edge weights; time for a signal to reach all nodes; lexicographically smallest valid ordering (alien dictionary). Which algorithm for each?",
    answer: "Minimum total connection cost: a minimum spanning tree — Kruskal (sort edges + union-find, O(E log E)) or Prim (heap). At most k stops, or negative weights: Bellman-Ford (relax all edges in rounds; detects negative cycles); for k stops run k + 1 rounds. Signal reaching all nodes (non-negative weights): Dijkstra and take the maximum distance. Smallest valid ordering: Kahn's topological sort using a min-heap instead of a queue.",
    explanation: "MST minimises the total edge weight, not individual path lengths — don't confuse it with shortest-path trees.",
  },
  {
    id: "fc-dsa-advanced-graphs-invariant",
    difficulty: "Hard",
    question: "Checkpoint: in Cheapest Flights Within K Stops, why must each Bellman-Ford round relax from a copy of the previous distances? And why is Kruskal's greedy edge choice safe?",
    answer: "After round i, distances must reflect paths using at most i edges. Relaxing in place lets an edge build on a distance updated earlier in the same round, chaining several edges and silently exceeding the stop limit; relaxing from `prev = dist[:]` prevents it. Kruskal relies on the cut property: the lightest edge crossing any cut belongs to some MST, and skipping edges whose endpoints are already connected avoids cycles.",
    explanation: "Plain Bellman-Ford (no stop limit) may relax in place — it only speeds convergence. The copy matters only when the edge count is constrained.",
  },

  // ── Union Find ──────────────────────────────────────────────────────
  {
    id: "fc-dsa-union-find-signals",
    difficulty: "Medium",
    question: "Signals: undirected edges arrive over time and you must answer connectivity or count components; find the redundant edge that forms a cycle; merge accounts or equations by equivalence; Kruskal's MST. Which structure, and what are its limits?",
    answer: "Union-Find (disjoint set union) with path compression and union by size/rank: near-constant amortised O(α(n)) per find/union, better than re-running BFS after every new edge. Limits: it does not support deleting edges, and it models undirected equivalence, not directed reachability.",
    explanation: "Weighted variants (storing a ratio or offset to the parent) solve problems like Evaluate Division.",
    codeSnippet: `parent = list(range(n)); size = [1] * n

def find(x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]   # path halving
        x = parent[x]
    return x

def union(a, b):
    ra, rb = find(a), find(b)
    if ra == rb:
        return False                    # already connected: cycle
    if size[ra] < size[rb]:
        ra, rb = rb, ra
    parent[rb] = ra
    size[ra] += size[rb]
    return True`,
  },
  {
    id: "fc-dsa-union-find-invariant",
    difficulty: "Medium",
    question: "Checkpoint: why does only joining two different roots change the component count, and what do path compression and union by size buy you?",
    answer: "Each component is a tree identified by its root. If find(a) == find(b), a and b are already in one component: the edge is redundant (it closes a cycle) and the count is unchanged. Different roots means two components merge into one, so count −= 1. Union by size keeps trees O(log n) tall; path compression flattens paths during find; together they give amortised O(α(n)), effectively constant.",
    explanation: "Start with count = n and decrement only when union returns True. The number of components after processing all edges is the answer to 'number of provinces' style questions.",
  },

  // ── 1D Dynamic Programming ──────────────────────────────────────────
  {
    id: "fc-dsa-dp-1d-signals",
    difficulty: "Medium",
    question: "Signals: count ways, minimum cost or maximum value where the answer at position i depends on a few earlier answers (climbing stairs, house robber, coin change, decode ways, word break, longest increasing subsequence); brute-force recursion repeats subproblems. Which pattern, and how do you set it up?",
    answer: "1D dynamic programming. Define dp[i] in words, write the recurrence over its predecessors, set base cases, and choose an iteration order where dependencies are already computed. Implement top-down (`@cache`) or bottom-up, then compress to a few variables when only the last few states are read. Examples: coin change dp[a] = 1 + min(dp[a − c]); LIS is O(n²) DP, or O(n log n) with a 'tails' array and bisect.",
    explanation: "'Count/min/max over choices' plus 'overlapping subproblems' is the DP signal; if a local choice can be proven safe, greedy may be simpler.",
  },
  {
    id: "fc-dsa-dp-1d-invariant",
    difficulty: "Medium",
    question: "Checkpoint: state the House Robber recurrence in words, explain why two variables suffice, and handle the circular variant.",
    answer: "dp[i] = the most money from houses 0..i = max(dp[i−1] (skip house i), dp[i−2] + nums[i] (rob house i)). Only the previous two states are read, so keep `prev2, prev1` for O(1) space. Circular (House Robber II): the first and last houses can't both be robbed, so return max(rob(nums[1:]), rob(nums[:-1])), handling n == 1 separately.",
    explanation: "Writing the recurrence in words before coding is the checkpoint; most DP bugs are a state definition that doesn't match the recurrence.",
    codeSnippet: `prev2 = prev1 = 0
for x in nums:
    prev2, prev1 = prev1, max(prev1, prev2 + x)
return prev1`,
  },

  // ── 2D Dynamic Programming ──────────────────────────────────────────
  {
    id: "fc-dsa-dp-2d-signals",
    difficulty: "Medium",
    question: "Signals: two sequences (LCS, edit distance, interleaving strings), grid paths moving right/down, knapsack with a capacity, stock trading with cooldown/holding states. Which pattern?",
    answer: "2D dynamic programming: dp[i][j] = the answer for prefixes s[:i] and t[:j], for grid cell (i, j), or for the first i items with capacity j. Edit distance: dp[i][j] = dp[i−1][j−1] if the characters match, else 1 + min(insert dp[i][j−1], delete dp[i−1][j], replace dp[i−1][j−1]). Typically O(m·n) time, reducible to O(min(m, n)) space with rolling rows.",
    explanation: "State machines (hold / sold / cooldown in stock problems) are 2D DP too: one dimension is time, the other is the state.",
  },
  {
    id: "fc-dsa-dp-2d-invariant",
    difficulty: "Hard",
    question: "Checkpoint: in LCS, what does a cell mean, which cells does it depend on, and how do you reduce memory? How does 0/1 vs unbounded knapsack change the loop direction?",
    answer: "dp[i][j] = LCS length of s[:i] and t[:j]. If s[i−1] == t[j−1], dp[i][j] = dp[i−1][j−1] + 1; otherwise max(dp[i−1][j], dp[i][j−1]). Row 0 and column 0 are 0 (empty prefix). Fill row by row, keeping only the previous row (or one row plus a saved diagonal). In a 1D knapsack array, iterate capacity downward for 0/1 (each item used once) and upward for unbounded (items reusable).",
    explanation: "The dependency picture (up, left, up-left) determines the fill order — draw it before coding.",
  },

  // ── Greedy Algorithms ───────────────────────────────────────────────
  {
    id: "fc-dsa-greedy-signals",
    difficulty: "Medium",
    question: "Signals: maximum subarray, jump game reachability, gas station, maximum non-overlapping intervals, partition labels, hand of straights — a locally optimal choice looks right. When is greedy valid?",
    answer: "Greedy is valid when you can prove the local choice never makes the optimum worse — an exchange argument or a 'greedy stays ahead' argument. Typical shapes: Kadane `cur = max(x, cur + x)`; Jump Game tracking the farthest reachable index; interval scheduling sorted by end time; usually O(n) or O(n log n) after sorting.",
    explanation: "If you can construct a counterexample (coin change with coins [1, 3, 4] and amount 6: greedy picks 4 + 1 + 1, the optimum is 3 + 3), switch to DP.",
  },
  {
    id: "fc-dsa-greedy-invariant",
    difficulty: "Hard",
    question: "Checkpoint: in Gas Station, why is the answer the index right after the last point where the running tank went negative (when total gas ≥ total cost)?",
    answer: "If starting at s you run dry before reaching station j, then every start between s and j also fails: you arrived at each of them from s with a non-negative tank, so starting there with an empty tank can only be worse. So restart at j + 1 with an empty tank. If total gas ≥ total cost, a valid start exists and the final candidate is it; otherwise return −1. One pass, O(n).",
    explanation: "The general skill is turning 'skip these candidates' into a proof. For interval scheduling the exchange argument is: the interval that ends earliest leaves the most room for everything after it.",
  },

  // ── Intervals & Sweepline ───────────────────────────────────────────
  {
    id: "fc-dsa-intervals-signals",
    difficulty: "Medium",
    question: "Signals: merge overlapping intervals, insert an interval, minimum removals to make intervals disjoint, can one person attend all meetings, minimum meeting rooms, maximum concurrent events. Which approach for each?",
    answer: "Merge/insert: sort by start and merge into the last kept interval. Minimum removals: greedily keep intervals sorted by end time; removals = n − kept. Attend all: sort by start and check adjacent overlaps. Minimum rooms / maximum concurrency: a min-heap of end times, or a sweep line over +1 (start) / −1 (end) events. All O(n log n) due to sorting.",
    explanation: "Sorting by start suits merging; sorting by end suits 'maximum set of non-overlapping intervals'. Pick deliberately.",
  },
  {
    id: "fc-dsa-intervals-invariant",
    difficulty: "Medium",
    question: "Checkpoint: do touching intervals like [1, 2] and [2, 3] overlap, and how does the answer change the code?",
    answer: "Clarify with the interviewer. Meetings are usually half-open [start, end): they don't conflict, so overlap means start < prev_end, and in a sweep line process end events before start events at the same time. When merging closed intervals they do overlap, so merge when start ≤ prev_end. Merge invariant: the output is sorted and disjoint, and the last interval's end is the maximum seen — update it with max(prev_end, end) to handle containment such as [1, 10], [2, 3].",
    explanation: "Asking the touching-endpoint question up front is itself a signal interviewers look for.",
    codeSnippet: `intervals.sort()
merged = []
for start, end in intervals:
    if merged and start <= merged[-1][1]:
        merged[-1][1] = max(merged[-1][1], end)
    else:
        merged.append([start, end])`,
  },

  // ── Bit Manipulation ────────────────────────────────────────────────
  {
    id: "fc-dsa-bit-manipulation-signals",
    difficulty: "Medium",
    question: "Signals: every element appears twice except one; the missing number in 0..n; count set bits; check power of two; enumerate subsets as masks for n ≤ ~20; O(1) extra space. Which tricks?",
    answer: "XOR cancels pairs (x ^ x = 0, x ^ 0 = x), so XOR of everything leaves the single number; XOR of all indices and values reveals the missing number. `x & (x − 1)` clears the lowest set bit (Kernighan popcount; power of two iff x > 0 and x & (x − 1) == 0). `x & -x` isolates the lowest set bit. Bitmasks represent subsets for enumeration or bitmask DP.",
    explanation: "Python helpers: `int.bit_count()` (3.10+), `int.bit_length()`, and `bin(x)`.",
  },
  {
    id: "fc-dsa-bit-manipulation-invariant",
    difficulty: "Hard",
    question: "Checkpoint: why does XOR-ing everything find the single number, and what Python-specific behaviour affects bit tricks with negative numbers?",
    answer: "XOR is associative and commutative, has identity 0, and every value is its own inverse, so pairs cancel regardless of order and only the unpaired value remains. Python ints are arbitrary precision with infinite sign extension: `~x == -x - 1`, `-1 >> 1 == -1`, and nothing ever overflows at 32 bits. To emulate 32-bit arithmetic, mask with 0xFFFFFFFF and convert back to signed at the end.",
    explanation: "This matters for problems like Sum of Two Integers (add without +), where a Python loop never terminates without the mask.",
    codeSnippet: `MASK = 0xFFFFFFFF
def to_signed(x):
    x &= MASK
    return x if x <= 0x7FFFFFFF else ~(x ^ MASK)`,
  },

  // ── Math & Number Theory ────────────────────────────────────────────
  {
    id: "fc-dsa-number-theory-signals",
    difficulty: "Medium",
    question: "Signals: GCD/LCM, simplifying fractions, huge exponents modulo m, all primes up to n, digit manipulation, a repeated transformation that may loop (Happy Number). Which tools?",
    answer: "Euclid's algorithm: gcd in O(log min(a, b)); lcm = a // gcd(a, b) * b. Fast exponentiation by squaring in O(log e) — Python's built-in `pow(b, e, m)`. Sieve of Eratosthenes, O(n log log n), for all primes ≤ n. Repeated transformations: detect the cycle with a set or Floyd's fast/slow pointers.",
    explanation: "Reduce modulo m at every step to keep numbers small; Python won't overflow, but huge integers make arithmetic slow.",
  },
  {
    id: "fc-dsa-number-theory-invariant",
    difficulty: "Medium",
    question: "Checkpoint: why does gcd(a, b) = gcd(b, a mod b), and why can the sieve start crossing out at p·p?",
    answer: "Any d dividing a and b also divides a − q·b = a mod b; conversely any d dividing b and a mod b divides a = q·b + (a mod b). The sets of common divisors are identical, and the remainder strictly decreases, so the process ends at gcd(g, 0) = g. Sieve: any composite m < p² that is divisible by p has a smaller prime factor and was already crossed out, so start at p·p and stop the outer loop at √n.",
    explanation: "The sieve's inner loop is `range(p * p, n + 1, p)`; slice assignment `is_prime[p*p::p] = [False] * len(...)` is a fast Python idiom.",
  },

  // ── Math & Geometry ─────────────────────────────────────────────────
  {
    id: "fc-dsa-geometry-signals",
    difficulty: "Medium",
    question: "Signals: rotate an n×n matrix in place, spiral-order traversal, set matrix zeroes with O(1) extra space, points on a line / slopes, multiply big numbers given as strings. Which techniques?",
    answer: "Rotate 90° clockwise = transpose, then reverse each row (or a four-way cyclic swap per layer). Spiral = four shrinking boundaries (top, bottom, left, right). Set zeroes = use the first row and column as markers plus two flags for themselves. Slopes = reduce (dy, dx) by their gcd and normalise the sign — never use float slopes as keys. String multiplication = schoolbook digit products into a result array of length m + n.",
    explanation: "Coordinate-transformation problems are about index algebra: write the mapping for one cell, then verify the corners and the centre.",
  },
  {
    id: "fc-dsa-geometry-invariant",
    difficulty: "Medium",
    question: "Checkpoint: for a clockwise rotation, where does cell (i, j) move? And which boundary checks stop spiral traversal from visiting cells twice?",
    answer: "(i, j) → (j, n − 1 − i). Transposing maps (i, j) → (j, i); reversing each row maps (j, i) → (j, n − 1 − i). Spiral: after the top row (top += 1) and the right column (right −= 1), traverse the bottom row only if top ≤ bottom and the left column only if left ≤ right — otherwise a single leftover row or column is visited twice.",
    explanation: "Test 1×1, 1×n, n×1 and non-square matrices; they expose missing boundary checks immediately.",
  },

  // ── Segment & Fenwick Trees ─────────────────────────────────────────
  {
    id: "fc-dsa-segment-fenwick-signals",
    difficulty: "Hard",
    question: "Signals: an array with interleaved point updates and range queries (sum / min / max), 'Range Sum Query – Mutable', 'Count of Smaller Numbers After Self', online inversion counting; n and q up to ~10^5. Which structure, and why not prefix sums?",
    answer: "A Fenwick tree (binary indexed tree) for prefix-style queries with point updates: O(log n) each with tiny code; it needs an invertible operation (sum, XOR) so range = prefix(r) − prefix(l − 1). A segment tree for any associative operation (min, max, gcd, sum): O(log n) range queries, and range updates via lazy propagation. Prefix sums fail because every update costs O(n). For counting problems, coordinate-compress values and use them as tree indices.",
    explanation: "Choose Fenwick when sums suffice (less code, fewer bugs); choose a segment tree for min/max, range assignment, or a custom merge function.",
  },
  {
    id: "fc-dsa-segment-fenwick-invariant",
    difficulty: "Hard",
    question: "Checkpoint: what range does each Fenwick tree index cover, and why are update and query O(log n)?",
    answer: "tree[i] stores the sum of a[i − lowbit(i) + 1 .. i], where lowbit(i) = i & −i. A query repeatedly strips the lowest set bit, decomposing [1, i] into at most log n disjoint power-of-two blocks. An update repeatedly adds lowbit, visiting every block that contains i (at most log n). The tree must be 1-indexed — index 0 would loop forever because 0 & −0 == 0.",
    explanation: "Segment tree invariant, for comparison: every node stores op(left child, right child) over exactly its segment, and a query visits O(log n) nodes whose segments tile the range.",
    codeSnippet: `def update(i, delta):          # 1-indexed
    while i <= n:
        tree[i] += delta
        i += i & -i

def query(i):                  # sum of a[1..i]
    s = 0
    while i > 0:
        s += tree[i]
        i -= i & -i
    return s`,
  },

  // ── String Algorithms ───────────────────────────────────────────────
  {
    id: "fc-dsa-string-algorithms-signals",
    difficulty: "Hard",
    question: "Signals: find all occurrences of a pattern in O(n + m); repeated substring pattern; shortest palindrome by adding characters in front; longest duplicate substring; comparing many substrings quickly. Which algorithms?",
    answer: "KMP (prefix/failure function) for exact matching in O(n + m) without moving backwards in the text; the Z-algorithm is an equivalent alternative. Rabin–Karp rolling hash for substring equality and multiple patterns, often with binary search on length (Longest Duplicate Substring) — verify matches or use double hashing to avoid collisions. Shortest palindrome: the prefix function of s + '#' + reversed(s). Manacher's algorithm for all palindromes in O(n) (expand-around-centre O(n²) is usually acceptable).",
    explanation: "Python's `str.find` / `in` are fast in practice, but interviews testing these problems expect you to explain the linear-time guarantee.",
  },
  {
    id: "fc-dsa-string-algorithms-invariant",
    difficulty: "Hard",
    question: "Checkpoint: what does the KMP prefix function store, and why is matching O(n + m)?",
    answer: "pi[i] = the length of the longest proper prefix of p[:i + 1] that is also a suffix of it. On a mismatch after matching j characters, fall back to j = pi[j − 1] instead of restarting, so the text pointer never moves backwards. Each text character raises j by at most 1 and every fallback lowers it, so total fallbacks ≤ total increments: O(n) matching plus O(m) preprocessing.",
    explanation: "The same amortised argument proves the prefix-function construction itself is O(m). Rolling-hash update: h(next window) = (h − s[i]·B^(m−1))·B + s[i + m] mod M.",
    codeSnippet: `def prefix_function(p):
    pi = [0] * len(p)
    j = 0
    for i in range(1, len(p)):
        while j and p[i] != p[j]:
            j = pi[j - 1]
        if p[i] == p[j]:
            j += 1
        pi[i] = j
    return pi`,
  },

  // ── Advanced DP ─────────────────────────────────────────────────────
  {
    id: "fc-dsa-advanced-dp-signals",
    difficulty: "Hard",
    question: "Signals: n ≤ ~20 and you must visit or assign every item (TSP-like); the cost of combining a range depends on how it is split (burst balloons, matrix chain, minimum cost to merge stones); count numbers ≤ N with a digit property; optimise a choice at every tree node. Which DP family fits each?",
    answer: "Bitmask DP: dp[mask][i] over subsets, O(2^n · n²). Interval DP: dp[l][r] = best over split points k in the range, filled by increasing length, O(n³). Digit DP: memoise over (position, tight flag, extra state such as digit sum or leading zeros). Tree DP: each node returns a small tuple, e.g. (best if robbed, best if skipped) in House Robber III.",
    explanation: "Constraints are the tell: n ≤ 20 suggests 2^n states, n ≤ 500 allows O(n³) interval DP, and N up to 10^18 means digit DP over ~19 positions.",
  },
  {
    id: "fc-dsa-advanced-dp-invariant",
    difficulty: "Hard",
    question: "Checkpoint: in Burst Balloons, why define k as the LAST balloon burst in the open interval (l, r), and what fill order does interval DP need?",
    answer: "If k bursts last inside (l, r), its neighbours at that moment are exactly l and r (fixed boundaries), so the subproblems (l, k) and (k, r) are independent: dp[l][r] = max over k of dp[l][k] + dp[k][r] + v[l]·v[k]·v[r], with the array padded by 1s at both ends. Choosing the FIRST balloon instead makes later neighbours depend on future choices, so the problem doesn't decompose. Fill by increasing interval length so every shorter interval is ready; O(n³).",
    explanation: "'Think about the last action, not the first' is the standard trick for interval DP whenever removing an element changes its neighbours.",
  },
];

export const DSA_PATTERN_FLASHCARDS: Flashcard[] = cards.map((card) => ({
  ...card,
  category: "DSA Patterns",
}));
