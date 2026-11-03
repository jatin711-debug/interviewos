import type { DsGuide } from "../types";

const py = (strings: TemplateStringsArray, ...values: unknown[]) => String.raw(strings, ...values).replace(/^\n/, "");

export const RANGE_GUIDES: Record<string, DsGuide> = {
  "fenwick-tree": {
    level: "Advanced",
    analogy: "Think of a shop that keeps sales totals in overlapping ledgers: one for day 1, one for days 1–2, one for day 3, one for days 1–4, and so on, with block sizes that are powers of two. To get the total up to any day, you add just a few ledgers. When a sale on day 3 is corrected, you only fix the few ledgers that cover day 3.",
    explain: [
      "Problem: you have an array of numbers, and you need to (a) change single values and (b) ask for the sum of a range, many times, mixed together. A plain array makes updates O(1) but range sums O(n). A **prefix-sum array** makes range sums O(1) but updates O(n), because every later prefix changes. A **Fenwick tree** (also called a **Binary Indexed Tree**, or BIT) does **both in O(log n)**.",
      "It's a single list `tree`, **1-indexed**. Each `tree[i]` stores the sum of a block of the original array that **ends at i**. The block's length is the lowest set bit of `i`, written `i & -i`. For example, `tree[6]` (6 = 110 in binary, lowest bit 2) covers positions 5–6, and `tree[8]` (1000) covers positions 1–8.",
      "**prefix_sum(i)** adds `tree[i]`, then jumps to `i - (i & -i)`, which is the position just before that block, and repeats until it reaches 0. Each jump removes one set bit from `i`, so there are at most log₂ n jumps. A range sum `[l, r]` is `prefix_sum(r) - prefix_sum(l - 1)`.",
      "**update(i, delta)** adds delta to every block that covers position i: start at `i` and jump to `i + (i & -i)` until you pass n. Again, that's at most log₂ n steps.",
      "The bit trick `i & -i` looks like magic, but you don't need to derive it. Remember: **query walks down by removing the low bit; update walks up by adding it.** It's about 10 lines of code, which is why competitive programmers love it.",
    ],
    simpleCode: py`
# Fenwick tree (Binary Indexed Tree): point update + prefix sum, both O(log n).
# Positions are 1-indexed: tree[i] stores the sum of a block that ENDS at i, of length (i & -i).

class Fenwick:
    def __init__(self, n):
        self.n = n
        self.tree = [0] * (n + 1)            # index 0 is unused

    def update(self, i, delta):
        """Add delta to position i."""
        touched = []
        while i <= self.n:
            self.tree[i] += delta
            touched.append(i)
            i += i & -i                      # jump UP to the next block that also covers i
        return touched

    def prefix_sum(self, i):
        """Sum of positions 1..i."""
        total, used = 0, []
        while i > 0:
            total += self.tree[i]
            used.append(i)
            i -= i & -i                      # jump DOWN to just before this block
        return total, used

    def range_sum(self, left, right):
        return self.prefix_sum(right)[0] - self.prefix_sum(left - 1)[0]


values = [3, 2, -1, 6, 5, 4, -3, 3]          # position 1 holds 3, position 2 holds 2, ...
fen = Fenwick(len(values))
for position, value in enumerate(values, start=1):
    fen.update(position, value)
print("tree:", fen.tree[1:])

for i in [6, 7, 8]:
    print(f"i = {i} = {i:04b} in binary, lowest bit = {i & -i}, so tree[{i}] covers positions {i - (i & -i) + 1}..{i}")

total, used = fen.prefix_sum(7)
print("prefix_sum(7) =", total, "using tree indexes", used)
print("range_sum(3, 6) =", fen.range_sum(3, 6), "| check:", sum(values[2:6]))

print("update(3, +10) touched tree indexes", fen.update(3, 10))
print("range_sum(3, 6) is now", fen.range_sum(3, 6))
`,
    simpleOutput: `tree: [3, 5, -1, 10, 5, 9, -3, 19]
i = 6 = 0110 in binary, lowest bit = 2, so tree[6] covers positions 5..6
i = 7 = 0111 in binary, lowest bit = 1, so tree[7] covers positions 7..7
i = 8 = 1000 in binary, lowest bit = 8, so tree[8] covers positions 1..8
prefix_sum(7) = 16 using tree indexes [7, 6, 4]
range_sum(3, 6) = 14 | check: 14
update(3, +10) touched tree indexes [3, 4, 8]
range_sum(3, 6) is now 24`,
    codeNotes: [
      "`tree` has n + 1 slots because Fenwick trees are 1-indexed. With index 0, `i & -i` would be 0 and the loops would never move.",
      "`update` adds `delta` at `i`, then moves up with `i += i & -i`. Every index it visits is a block that contains position `i`.",
      "`prefix_sum` adds `tree[i]`, then moves down with `i -= i & -i`. prefix_sum(7) uses only indexes 7, 6 and 4, three blocks that cover 7, 5–6 and 1–4.",
      "`range_sum(l, r)` is the usual prefix-sum trick: everything up to r, minus everything up to l − 1.",
      "The binary printout shows the pattern: the lowest set bit of `i` tells you how many positions `tree[i]` covers.",
    ],
    takeaways: [
      "Point update + range sum, both O(log n), in ~10 lines.",
      "1-indexed; `i & -i` = lowest set bit = block length.",
      "Query goes down (`i -= i & -i`); update goes up (`i += i & -i`).",
      "range(l, r) = prefix(r) − prefix(l − 1).",
    ],
  },

  "segment-tree": {
    level: "Advanced",
    analogy: "Think of a company's org chart for sales figures. Each team leader knows their team's total, each manager knows the total of their teams, and the CEO knows the grand total. To answer 'what did departments 3 to 6 sell?', you ask only the few managers whose groups fit inside that range, not every employee.",
    explain: [
      "A **segment tree** answers range questions (sum, minimum, maximum...) over an array, and allows updates, both in **O(log n)**. It's more flexible than a Fenwick tree: it works for any operation that can combine two halves, like `min`, `max` or `gcd`.",
      "It's a binary tree where each node is responsible for a **segment** `[lo, hi]` of the array and stores the answer for it (here, the sum). The root covers the whole array. Each node splits its segment in half: the left child covers `[lo, mid]` and the right child covers `[mid+1, hi]`. Leaves cover single elements.",
      "**Query [l, r]**: start at the root. If a node's segment lies **completely inside** [l, r], use its stored value and stop. If it's **completely outside**, ignore it. If it **partly overlaps**, ask both children and add their answers. Only about 4 nodes per level get visited, so a query is O(log n).",
      "**Update index i**: walk from the root down to the leaf for `i`, change it, then recompute each parent on the way back up (parent = left + right). That's one path, so O(log n).",
      "Building takes O(n) because there are about 2n nodes. In Python, a segment tree is often stored in a list of size 4n, with children at `2k` and `2k+1` like a heap. The recursive version below is easier to read.",
    ],
    simpleCode: py`
# Segment tree for range sums, written recursively for clarity.

class SegmentTree:
    def __init__(self, values):
        self.n = len(values)
        self.sums = [0] * (4 * self.n)       # node k has children 2k and 2k + 1
        self._build(1, 0, self.n - 1, values)

    def _build(self, k, lo, hi, values):
        if lo == hi:                          # a leaf: one array element
            self.sums[k] = values[lo]
            return
        mid = (lo + hi) // 2
        self._build(2 * k, lo, mid, values)
        self._build(2 * k + 1, mid + 1, hi, values)
        self.sums[k] = self.sums[2 * k] + self.sums[2 * k + 1]   # parent = left + right

    def query(self, left, right, k=1, lo=0, hi=None):
        """Sum of values[left..right] (inclusive)."""
        if hi is None:
            hi = self.n - 1
        if right < lo or hi < left:           # completely outside: contributes nothing
            return 0
        if left <= lo and hi <= right:        # completely inside: use the stored sum
            return self.sums[k]
        mid = (lo + hi) // 2                  # partly inside: ask both children
        return self.query(left, right, 2 * k, lo, mid) + self.query(left, right, 2 * k + 1, mid + 1, hi)

    def update(self, index, value, k=1, lo=0, hi=None):
        """Set values[index] = value."""
        if hi is None:
            hi = self.n - 1
        if lo == hi:
            self.sums[k] = value
            return
        mid = (lo + hi) // 2
        if index <= mid:
            self.update(index, value, 2 * k, lo, mid)
        else:
            self.update(index, value, 2 * k + 1, mid + 1, hi)
        self.sums[k] = self.sums[2 * k] + self.sums[2 * k + 1]   # fix sums on the way back up


values = [5, 8, 6, 3, 2, 7, 2, 6]
tree = SegmentTree(values)
print("root (sum of everything):", tree.sums[1])
print("children of the root:", tree.sums[2], "(indexes 0..3) and", tree.sums[3], "(indexes 4..7)")
print("query(2, 5) =", tree.query(2, 5), "| check:", sum(values[2:6]))
print("query(0, 7) =", tree.query(0, 7))

tree.update(3, 10)                            # values[3]: 3 -> 10
print("after update(3, 10): query(2, 5) =", tree.query(2, 5), "| root =", tree.sums[1])
`,
    simpleOutput: `root (sum of everything): 39
children of the root: 22 (indexes 0..3) and 17 (indexes 4..7)
query(2, 5) = 18 | check: 18
query(0, 7) = 39
after update(3, 10): query(2, 5) = 25 | root = 46`,
    codeNotes: [
      "`sums[k]` is the answer for node `k`'s segment. Like a heap, node `k` has children `2k` and `2k + 1`, and the root is node 1. A size of 4n is always enough room.",
      "`_build` recurses down to single elements, then fills each parent with left + right on the way back up.",
      "`query` has the three cases: completely outside → 0; completely inside → stored sum; partial → split and ask both children.",
      "`update` walks one path to the leaf, sets it, and recomputes every parent on the path. Only log₂ n nodes change.",
      "To make it a range-**minimum** tree, replace `+` with `min` and the 'outside' value `0` with `float('inf')`.",
    ],
    takeaways: [
      "Each node stores the answer for a segment; children split it in half.",
      "Query: inside → use it, outside → skip, partial → recurse. O(log n).",
      "Update: change a leaf, recompute its ancestors. O(log n).",
      "Works for sum, min, max, gcd... any operation that combines two halves.",
    ],
  },

  "sparse-table": {
    level: "Advanced",
    analogy: "Before a long road trip, you write down the cheapest petrol price for every 1-day, 2-day, 4-day and 8-day stretch. Later, for any trip window, you can answer 'what's the cheapest price?' by looking at just two overlapping stretches that together cover the window. It costs some prep up front, and then every question is instant.",
    explain: [
      "A **sparse table** answers **range minimum** (or maximum) queries on an array that **never changes**, in **O(1)** per query, after O(n log n) preparation.",
      "We precompute `table[k][i]` = the minimum of the block that starts at `i` and has length `2^k`. Row 0 is the array itself (blocks of length 1). Each next row combines two blocks from the row above: `table[k][i] = min(table[k-1][i], table[k-1][i + 2^(k-1)])`. There are about log₂ n rows, so building takes O(n log n).",
      "To query `[l, r]`: let `length = r - l + 1` and pick the biggest `k` with `2^k ≤ length`. Two blocks of length `2^k`, one starting at `l` and one ending at `r`, together cover the whole range. They may **overlap**, but that's fine for min: counting an element twice doesn't change the minimum. The answer is `min(table[k][l], table[k][r - 2^k + 1])`.",
      "That overlap trick is why sparse tables work for min, max and gcd (**idempotent** operations, where combining a value with itself changes nothing) but **not** for sum: overlapping blocks would count some elements twice. They also can't handle updates. Use a segment tree when values change.",
    ],
    simpleCode: py`
# Sparse table: O(n log n) preparation, then O(1) range-minimum queries on a fixed array.

def build(values):
    table = [values[:]]                         # row 0: blocks of length 1 = the array itself
    k = 1
    while (1 << k) <= len(values):              # 1 << k is 2**k
        half = 1 << (k - 1)
        prev = table[k - 1]
        row = []
        for i in range(len(values) - (1 << k) + 1):
            row.append(min(prev[i], prev[i + half]))   # two half-size blocks side by side
        table.append(row)
        k += 1
    return table


def range_min(table, left, right):
    length = right - left + 1
    k = length.bit_length() - 1                 # biggest k with 2**k <= length
    first = table[k][left]                      # block starting at left
    second = table[k][right - (1 << k) + 1]     # block ending at right (may overlap)
    return min(first, second)


values = [4, 6, 1, 5, 7, 3, 8, 2]
table = build(values)
for k, row in enumerate(table):
    print(f"length {1 << k}: {row}")

for left, right in [(0, 7), (3, 6), (4, 5), (2, 2)]:
    print(f"min of values[{left}..{right}] = {range_min(table, left, right)}"
          f"   (check: {min(values[left:right + 1])})")
`,
    simpleOutput: `length 1: [4, 6, 1, 5, 7, 3, 8, 2]
length 2: [4, 1, 1, 5, 3, 3, 2]
length 4: [1, 1, 1, 3, 2]
length 8: [1]
min of values[0..7] = 1   (check: 1)
min of values[3..6] = 3   (check: 3)
min of values[4..5] = 3   (check: 3)
min of values[2..2] = 1   (check: 1)`,
    codeNotes: [
      "`table[k][i]` is the minimum of `values[i : i + 2**k]`. Row 0 is a copy of the array.",
      "Each new row combines two blocks from the row above that sit side by side: `min(prev[i], prev[i + half])`.",
      "`length.bit_length() - 1` gives the biggest power of two that fits in the range (for length 5, that's k = 2, blocks of 4).",
      "`range_min` looks at exactly two table cells, so every query is O(1). For `[3, 6]` it uses the blocks 3..6 and 3..6. Overlap, or here even identical blocks, is fine for `min`.",
    ],
    takeaways: [
      "Static array + many min/max queries → sparse table.",
      "`table[k][i]` = min of the 2^k elements starting at i.",
      "Query = min of two overlapping power-of-two blocks: O(1).",
      "Only for idempotent operations (min, max, gcd); no updates.",
    ],
  },
};
