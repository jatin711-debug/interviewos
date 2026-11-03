import type { DsModule } from "./types";

/** Python source written flush-left in a raw template: backslashes stay literal and the leading newline is dropped. */
const py = (strings: TemplateStringsArray, ...values: unknown[]) => String.raw(strings, ...values).replace(/^\n/, "");

export const LINEAR_MODULE: DsModule = {
  id: "linear",
  title: "Linear structures",
  description: "Arrays, linked lists, stacks and queues: how sequences are stored and what each layout costs.",
  lessons: [
    {
      id: "dynamic-array",
      title: "Dynamic array",
      kind: "structure",
      summary: "An array that grows on demand: a fixed-size block of memory plus a size, replaced by a bigger block when it fills up. It gives O(1) indexing and O(1) amortized append, and it is exactly how Python's list works.",
      concepts: [
        "A dynamic array keeps its items side by side in a fixed-size buffer and tracks two numbers: size (slots in use) and capacity (slots available). Reaching slot i is one address calculation, so a[i] and a[i] = x are O(1). The unused slots at the end are what make appending cheap.",
        "When the buffer is full, append allocates a buffer twice as large and copies every item across. That one append costs O(n), but the copies happen after 1, 2, 4, 8, ... appends, so n appends copy fewer than 2n items in total: O(1) amortized. Growing by a fixed amount instead would make n appends cost O(n^2).",
        "Inserting or deleting in the middle shifts every later item by one slot, which is O(n - i); the end is the cheap end. That is why a stack lives at the END of a list and why list.pop(0) is a trap. Shrinking when the array is only a quarter full (not half) keeps memory O(n) without thrashing: right after halving, the array is half full, so Theta(n) operations must happen before the next resize.",
        "Python's list is this structure: a C array of references with a size and an allocated capacity. It over-allocates by roughly 12.5% instead of doubling (any constant factor above 1 gives amortized O(1)), so append, pop() and l[i] are fast while insert(0, x) and pop(0) are O(n). array.array stores raw numbers instead of references.",
        "collections.abc.MutableSequence needs only __getitem__, __setitem__, __delitem__, __len__ and insert. From those it derives append, extend, pop, remove, reverse, clear, +=, index, count, `in` and reversed(), with the same behaviour as list."
      ],
      complexity: [
        { operation: "a[i] / a[i] = x", time: "O(1)", note: "negative indices are normalized first" },
        { operation: "append", time: "O(1) amortized", note: "O(n) on the one append that resizes" },
        { operation: "pop() (last item)", time: "O(1) amortized", note: "occasionally halves the buffer" },
        { operation: "insert(i, x) / del a[i] / pop(i)", time: "O(n - i)", note: "shifts the tail; O(n) at the front" },
        { operation: "`in` / index / count / remove", time: "O(n)", note: "linear scan" },
        { operation: "iterate / a[i:j]", time: "O(n) / O(j - i)" }
      ],
      space: "O(n): capacity stays below 4x the size (above the minimum buffer) and never under it. A resize briefly holds the old and the new buffer together.",
      code: py`
from __future__ import annotations

import operator
from collections.abc import Iterable, Iterator, MutableSequence
from typing import Any, TypeVar

T = TypeVar("T")
_MIN_CAPACITY = 4


class DynamicArray(MutableSequence[T]):
    """A growable array on top of a fixed-capacity buffer.

    Invariant: slots [0, _size) hold the items and the rest are None. A full
    buffer is replaced by one twice as large, so append is O(1) amortized. The
    buffer halves once it is only a quarter full, so memory stays O(n).
    """

    __slots__ = ("_buffer", "_size", "_resizes")

    def __init__(self, items: Iterable[T] = ()) -> None:
        self._buffer: list[Any] = [None] * _MIN_CAPACITY  # never append/pop on this list
        self._size = 0
        self._resizes = 0
        self.extend(items)  # extend, append, pop, remove, reverse, clear, += come from the ABC

    @property
    def capacity(self) -> int:
        return len(self._buffer)

    @property
    def resizes(self) -> int:
        return self._resizes

    def _resize(self, capacity: int) -> None:
        """Replace the buffer by one of the given capacity and copy the items: O(n)."""
        new_buffer: list[Any] = [None] * capacity
        new_buffer[: self._size] = self._buffer[: self._size]
        self._buffer = new_buffer
        self._resizes += 1

    def _locate(self, index: int) -> int:
        """Turn index (negative allowed) into a buffer slot, or raise IndexError."""
        slot = operator.index(index)  # a slice or str raises TypeError, as in list
        if slot < 0:
            slot += self._size
        if not 0 <= slot < self._size:
            raise IndexError("DynamicArray index out of range")
        return slot

    def __len__(self) -> int:
        return self._size

    def __getitem__(self, index: int | slice) -> T | DynamicArray[T]:
        if isinstance(index, slice):
            return DynamicArray(self._buffer[i] for i in range(*index.indices(self._size)))
        return self._buffer[self._locate(index)]

    def __setitem__(self, index: int, item: T) -> None:
        self._buffer[self._locate(index)] = item

    def __delitem__(self, index: int) -> None:
        slot = self._locate(index)
        for i in range(slot, self._size - 1):  # shift the tail left: O(n - slot)
            self._buffer[i] = self._buffer[i + 1]
        self._size -= 1
        self._buffer[self._size] = None  # drop the stale reference
        if self._size <= len(self._buffer) // 4 and len(self._buffer) > _MIN_CAPACITY:
            self._resize(len(self._buffer) // 2)

    def insert(self, index: int, item: T) -> None:
        """Insert before index, clamping like list.insert. O(n - index) to shift."""
        index = operator.index(index)
        if index < 0:
            index = max(0, index + self._size)
        index = min(index, self._size)
        if self._size == len(self._buffer):
            self._resize(2 * len(self._buffer))  # geometric growth
        for i in range(self._size, index, -1):  # shift the tail right, last item first
            self._buffer[i] = self._buffer[i - 1]
        self._buffer[index] = item
        self._size += 1

    def __iter__(self) -> Iterator[T]:
        i = 0
        while i < self._size:  # re-read the size each step, like list's iterator
            yield self._buffer[i]
            i += 1

    def __repr__(self) -> str:
        return f"DynamicArray({list(self)!r})"

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, DynamicArray):
            return NotImplemented
        return self._size == other._size and all(a == b for a, b in zip(self, other))

    __hash__ = None  # type: ignore[assignment]  # mutable, so unhashable


if __name__ == "__main__":
    grown: DynamicArray[int] = DynamicArray()
    capacities = []
    for n in range(100):
        grown.append(n)
        if grown.capacity not in capacities:
            capacities.append(grown.capacity)
    print(len(grown), grown.capacity, grown.resizes, capacities)

    items = DynamicArray([10, 20, 30])
    items.insert(1, 15)
    items[-1] = 99
    print(items, items[-1], items[1:3], 20 in items, items.index(20))
    print(items.pop(), items.pop(0), items, list(reversed(items)))
    items.extend([7, 7])
    items.remove(7)
    print(items, items == DynamicArray([15, 20, 7]), items == [15, 20, 7])

    while len(grown) > 10:
        grown.pop()
    print(len(grown), grown.capacity, grown.resizes)
    try:
        DynamicArray()[0]
    except IndexError as error:
        print("error:", error)
`,
      output: `100 128 5 [4, 8, 16, 32, 64, 128]
DynamicArray([10, 15, 20, 99]) 99 DynamicArray([15, 20]) True 2
99 10 DynamicArray([15, 20]) [20, 15]
DynamicArray([15, 20, 7]) True False
10 32 7
error: DynamicArray index out of range`,
      bestPractices: [
        "Inherit MutableSequence and write only the five required methods. extend (used in __init__), append, pop, remove, reverse, clear, index, count, `in` and reversed() then come from the base class and behave like list.",
        "State the invariant in the docstring (slots [0, _size) hold items, the rest are None) and clear a slot when it is freed (self._buffer[self._size] = None), so a popped object can be garbage-collected.",
        "Grow geometrically (2 * capacity), never additively, and shrink at a QUARTER full rather than half. Halving at half-full would make an append/pop pair on the boundary resize every time.",
        "Funnel every index through one helper (_locate) that handles negatives and bounds. operator.index accepts anything integer-like and raises TypeError for slices and strings, exactly as list does.",
        "Use a slice copy for the bulk resize and explicit loops for the shifts: the loop makes the O(n - i) cost of insert and delete visible, and the slice copies the buffer in one C-level step.",
        "Write __iter__ as a generator that re-reads _size on each step, like list's iterator, and expose capacity and resizes as read-only properties instead of letting callers touch the buffer."
      ],
      pitfalls: [
        "Shifting in the wrong order. insert must move the tail right starting from the LAST item (range(size, index, -1)); going left to right overwrites each item before it has been copied. Delete shifts left, starting from the first.",
        "Growing by a constant (capacity + 10) instead of a factor. Each resize still copies everything, so n appends cost O(n^2) in total. Only multiplicative growth gives amortized O(1).",
        "Leaving the old reference in a freed slot after pop. The array looks correct but keeps the object alive, and any later bug that reads past _size returns stale data.",
        "Calling list.insert(0, x) or pop(0) in a loop as if it were O(1): each call shifts the whole array, so draining 100,000 items this way moves about 5 billion references. Use collections.deque for queues."
      ],
      useWhen: [
        "You need O(1) access by index and mostly add or remove at the end: results lists, stacks, buffers.",
        "Memory footprint and cache-friendly scanning matter more than cheap insertion in the middle.",
        "The final size is unknown in advance, so you cannot allocate a fixed array.",
        "A sorted array with binary search is enough because inserts are rare."
      ],
      inPractice: "Use list: it already is a dynamic array, written in C. Pair it with bisect.insort for sorted data, use collections.deque when you need fast operations at both ends, and array.array or NumPy for compact arrays of numbers. Write your own only to learn, or when you need a policy list does not offer (a hard maximum, a different growth factor, instrumentation like the resize counter here).",
      challenge: {
        prompt: "Write a Vector class: a dynamic array that counts the element moves it performs. Store the items in a fixed-length list [None] * capacity and never call append, insert or pop on that list. Vector() starts empty with capacity 1 and moves 0. It needs: capacity (the buffer length), moves (an int), len(v), v[i] (negative indices allowed, IndexError when out of range) and iteration in order. append(item) is insert(len(v), item). insert(index, item) takes 0 <= index <= len(v) (IndexError otherwise): if the buffer is full, first replace it with one of twice the capacity, which counts one move per stored item copied; then shift the items from index onward one slot right (one move each) and store item. pop(index=-1) returns and removes an item (negative index allowed, IndexError when empty or out of range): shift the later items one slot left (one move each); afterwards, if capacity > 1 and the size is at most capacity // 4, replace the buffer with one of half the capacity (one move per stored item copied). Reading or storing a single item is not a move.",
        hint: "Write one private _resize(capacity) that allocates [None] * capacity, copies the first size items, swaps the buffer in and adds size to self.moves. insert grows when size == capacity, then shifts with for i in range(size, index, -1): buffer[i] = buffer[i - 1]. pop shifts with for i in range(index, size - 1), then clears the last slot and checks the shrink rule.",
        starter: py`
class Vector:
    """A dynamic array that counts every element move."""

    def __init__(self):
        self._buffer = [None]
        self._size = 0
        self.moves = 0

    @property
    def capacity(self):
        return len(self._buffer)

    def append(self, item):
        raise NotImplementedError  # TODO: this is insert at the end

    def insert(self, index, item):
        raise NotImplementedError

    def pop(self, index=-1):
        raise NotImplementedError

    def __len__(self):
        return self._size

    def __getitem__(self, index):
        raise NotImplementedError

    def __iter__(self):
        raise NotImplementedError
`,
        solution: py`
class Vector:
    """A dynamic array that counts every element move."""

    def __init__(self):
        self._buffer = [None]
        self._size = 0
        self.moves = 0

    @property
    def capacity(self):
        return len(self._buffer)

    def _resize(self, capacity):
        new_buffer = [None] * capacity
        for i in range(self._size):
            new_buffer[i] = self._buffer[i]
        self._buffer = new_buffer
        self.moves += self._size

    def _locate(self, index):
        slot = index + self._size if index < 0 else index
        if not 0 <= slot < self._size:
            raise IndexError("index out of range")
        return slot

    def append(self, item):
        self.insert(self._size, item)

    def insert(self, index, item):
        if not 0 <= index <= self._size:
            raise IndexError("insert position out of range")
        if self._size == len(self._buffer):
            self._resize(2 * len(self._buffer))
        for i in range(self._size, index, -1):
            self._buffer[i] = self._buffer[i - 1]
            self.moves += 1
        self._buffer[index] = item
        self._size += 1

    def pop(self, index=-1):
        slot = self._locate(index)
        item = self._buffer[slot]
        for i in range(slot, self._size - 1):
            self._buffer[i] = self._buffer[i + 1]
            self.moves += 1
        self._size -= 1
        self._buffer[self._size] = None
        if len(self._buffer) > 1 and self._size <= len(self._buffer) // 4:
            self._resize(len(self._buffer) // 2)
        return item

    def __len__(self):
        return self._size

    def __getitem__(self, index):
        return self._buffer[self._locate(index)]

    def __iter__(self):
        for i in range(self._size):
            yield self._buffer[i]
`,
        tests: py`
@check("append doubles the capacity when the buffer is full")
def _():
    v = Vector()
    eq((v.capacity, v.moves), (1, 0))
    capacities = []
    for n in range(9):
        v.append(n)
        capacities.append(v.capacity)
    eq(capacities, [1, 2, 4, 4, 8, 8, 8, 8, 16])
    eq(v.moves, 1 + 2 + 4 + 8)
    eq(list(v), list(range(9)))

@check("insert shifts the later items right and counts each shift")
def _():
    v = Vector()
    for n in (1, 2, 3, 4, 5):
        v.append(n)
    before = v.moves
    v.insert(0, 0)
    eq(v.moves - before, 5)
    eq(list(v), [0, 1, 2, 3, 4, 5])
    before = v.moves
    v.insert(6, 99)
    eq(v.moves - before, 0)
    v.insert(3, 42)
    eq(v.moves - before, 4)
    eq(list(v), [0, 1, 2, 42, 3, 4, 5, 99])
    before = v.moves
    v.append(7)
    eq((v.capacity, v.moves - before), (16, 8))

@check("pop shifts the later items left and shrinks at a quarter full")
def _():
    v = Vector()
    for n in range(8):
        v.append(n)
    before = v.moves
    eq(v.pop(0), 0)
    eq(v.moves - before, 7)
    eq(v.capacity, 8)
    for _ in range(4):
        v.pop()
    eq(list(v), [1, 2, 3])
    eq(v.capacity, 8)
    before = v.moves
    eq(v.pop(), 3)
    eq((v.capacity, v.moves - before), (4, 2))
    eq(list(v), [1, 2])

@check("emptying the vector shrinks the buffer back to capacity 1")
def _():
    v = Vector()
    for n in range(16):
        v.append(n)
    eq(v.capacity, 16)
    for expected in reversed(range(16)):
        eq(v.pop(), expected)
    eq((len(v), v.capacity), (0, 1))
    v.append("again")
    eq(list(v), ["again"])

@check("negative indices work and bad indices raise IndexError")
def _():
    v = Vector()
    raises(IndexError, v.pop)
    raises(IndexError, lambda: v[0])
    for n in (10, 20, 30):
        v.append(n)
    eq((v[-1], v[-3], v[1]), (30, 10, 20))
    eq(v.pop(-2), 20)
    eq(list(v), [10, 30])
    raises(IndexError, lambda: v[2])
    raises(IndexError, lambda: v[-3])
    raises(IndexError, v.insert, 3, 0)
    raises(IndexError, v.insert, -1, 0)

@check("100,000 appends cost fewer than 2 moves each (amortized O(1))")
def _():
    v = Vector()
    for n in range(100_000):
        v.append(n)
    eq(len(v), 100_000)
    eq(v.capacity, 131_072)
    eq(v.moves < 2 * 100_000, True)
    eq(v[-1], 99_999)
`
      },
      practice: ["Arrays & Hashing", "Two Pointers"],
      source: "https://docs.python.org/3/faq/design.html#how-are-lists-implemented-in-cpython"
    },
    {
      id: "singly-linked-list",
      title: "Singly linked list",
      kind: "structure",
      summary: "A chain of nodes where each node points to the next. It trades random access for cheap relinking: with a pointer in hand, inserting or removing after it is O(1), and many interview problems are really pointer puzzles on this shape.",
      concepts: [
        "A singly linked list is a chain of nodes; each node holds a value and a reference to the next node, and the list keeps a head (first node) and, here, a tail (last node). There is no index arithmetic: reaching the i-th item means following i links, so lookup is O(n). Each node is its own heap object, which costs extra memory and cache locality compared with an array.",
        "Its strength is cheap relinking. prepend, and append when a tail pointer is kept, change a couple of references with no shifting, and once you hold the node before a position, inserting or removing there is O(1). Python's list wins at almost everything else, so linked lists matter for the technique and as the node layer of other structures (queues, hash-table chains, LRU caches).",
        "State the invariant and keep it: _head is None exactly when _tail is None exactly when _size is 0; otherwise following next from _head visits _size nodes and ends at _tail, whose next is None. Most linked-list bugs are a forgotten tail or head update after a removal or an insertion at the end.",
        "The dummy-node technique puts a throwaway node in front of the head and works on prev.next instead of node. Removing the head then uses exactly the same code as removing any other node, so the 'is it the head?' branch disappears. It is the first thing to reach for when a pointer problem has a special case at the front.",
        "Two pointer patterns recur. Reversing in place keeps prev, node and following, flipping one link per step in O(n) time and O(1) space. Fast and slow pointers move at different speeds: when fast (two steps at a time) falls off the end, slow is at the middle; and if the list has a cycle, fast eventually meets slow."
      ],
      complexity: [
        { operation: "prepend", time: "O(1)" },
        { operation: "append", time: "O(1)", note: "thanks to the tail pointer; O(n) without it" },
        { operation: "insert_after(anchor, v)", time: "O(n)", note: "O(n) to find the anchor, O(1) to link; O(1) if you already hold the node" },
        { operation: "remove(value)", time: "O(n)", note: "a singly linked node cannot unlink itself: it needs its predecessor" },
        { operation: "reverse", time: "O(n)", note: "in place, O(1) extra space" },
        { operation: "middle", time: "O(n)", note: "a single pass with two pointers" },
        { operation: "len / bool", time: "O(1)" },
        { operation: "iterate / `in` / index i", time: "O(n) / O(n) / O(i)" }
      ],
      space: "O(n): one node object per item. reverse, middle and remove use O(1) extra space, and the dummy node is a single temporary object.",
      code: py`
from __future__ import annotations

from collections.abc import Iterable, Iterator
from typing import Any, Generic, TypeVar

T = TypeVar("T")


class _Node(Generic[T]):
    """One link in the chain: a value and a reference to the next node."""

    __slots__ = ("value", "next")

    def __init__(self, value: T, next_node: _Node[T] | None = None) -> None:
        self.value = value
        self.next = next_node


class LinkedList(Generic[T]):
    """A singly linked list with head and tail pointers.

    Invariant: _head is None exactly when _tail is None exactly when _size is 0;
    otherwise following next from _head visits _size nodes and ends at _tail,
    whose next is None. prepend, append and len are O(1); anything that
    searches is O(n); there is no O(1) indexing.
    """

    __slots__ = ("_head", "_tail", "_size")

    def __init__(self, items: Iterable[T] = ()) -> None:
        self._head: _Node[T] | None = None
        self._tail: _Node[T] | None = None
        self._size = 0
        for item in items:
            self.append(item)

    def prepend(self, value: T) -> None:
        self._head = _Node(value, self._head)
        if self._tail is None:
            self._tail = self._head
        self._size += 1

    def append(self, value: T) -> None:
        node = _Node(value)
        if self._tail is None:
            self._head = node
        else:
            self._tail.next = node
        self._tail = node
        self._size += 1

    def insert_after(self, anchor: T, value: T) -> None:
        """Insert value after the first node holding anchor: O(n) to find, O(1) to link."""
        for node in self._nodes():
            if node.value == anchor:
                node.next = _Node(value, node.next)
                if node is self._tail:
                    self._tail = node.next
                self._size += 1
                return
        raise ValueError(f"{anchor!r} is not in the list")

    def remove(self, value: T) -> None:
        """Remove the first node holding value; raise ValueError if there is none.

        A dummy node in front of the head means the head is removed by exactly
        the same code as any other node.
        """
        dummy: _Node[Any] = _Node(None, self._head)
        prev = dummy
        while prev.next is not None and prev.next.value != value:
            prev = prev.next
        if prev.next is None:
            raise ValueError(f"{value!r} is not in the list")
        if prev.next is self._tail:
            self._tail = None if prev is dummy else prev
        prev.next = prev.next.next
        self._head = dummy.next
        self._size -= 1

    def reverse(self) -> None:
        """Reverse the list in place: O(n) time, O(1) extra space."""
        prev: _Node[T] | None = None
        node = self._head
        self._tail = node  # the old head becomes the tail
        while node is not None:
            following = node.next  # save it before the link is overwritten
            node.next = prev
            prev, node = node, following
        self._head = prev

    def middle(self) -> T:
        """Return the middle value (the second of two for even sizes) in one pass.

        fast moves two nodes per step and slow one, so slow is halfway when fast
        runs off the end.
        """
        if self._head is None:
            raise IndexError("middle of an empty list")
        slow = fast = self._head
        while fast is not None and fast.next is not None:
            slow = slow.next
            fast = fast.next.next
        return slow.value

    def _nodes(self) -> Iterator[_Node[T]]:
        node = self._head
        while node is not None:
            yield node
            node = node.next

    def __iter__(self) -> Iterator[T]:
        for node in self._nodes():
            yield node.value

    def __len__(self) -> int:
        return self._size

    def __repr__(self) -> str:
        return f"LinkedList({list(self)!r})"

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, LinkedList):
            return NotImplemented
        return self._size == other._size and all(a == b for a, b in zip(self, other))

    __hash__ = None  # type: ignore[assignment]  # mutable, so unhashable


if __name__ == "__main__":
    items = LinkedList([2, 3])
    items.prepend(1)
    items.append(4)
    items.insert_after(3, 35)
    print(items, len(items), 35 in items)

    items.remove(1)  # the head
    items.remove(4)  # the tail
    print(items, len(items), items.middle())
    items.reverse()
    print(items, items == LinkedList([35, 3, 2]), items == [35, 3, 2])
    items.append(0)  # the tail pointer survived remove and reverse
    print(items, items.middle())

    for action in (lambda: items.remove(99), lambda: items.insert_after(99, 1), LinkedList().middle):
        try:
            action()
        except (ValueError, IndexError) as error:
            print(type(error).__name__, error)
`,
      output: `LinkedList([1, 2, 3, 35, 4]) 5 True
LinkedList([2, 3, 35]) 3 3
LinkedList([35, 3, 2]) True False
LinkedList([35, 3, 2, 0]) 2
ValueError 99 is not in the list
ValueError 99 is not in the list
IndexError middle of an empty list`,
      bestPractices: [
        "Make the node a private class with __slots__ (_Node). Callers deal in values, never nodes, and without a per-node __dict__ each of the many small objects stays small.",
        "Keep a tail pointer so append is O(1), write the invariant (head, tail and size move together) in the docstring, and re-check it in every method that can touch an end. The demo appends after remove and reverse to prove the tail survived.",
        "Use a dummy node when the head is a special case (remove). One code path then handles every position, and the head and tail are fixed up once at the end.",
        "Compare nodes with is None and is not None, and write reverse as a plain loop that saves node.next before overwriting it. Both are O(1) in space, and the loop avoids recursion that would exceed Python's limit of about 1000 frames.",
        "Walk the nodes lazily with a generator (_nodes, then __iter__ on top of it) so len, iteration, `in` and ==, which Python builds on iteration, never copy the list.",
        "Raise what list raises: ValueError for a missing value (remove, insert_after) and IndexError for asking the middle of nothing. Do not return None, which could also be a stored value."
      ],
      pitfalls: [
        "Overwriting node.next before saving it while reversing: the rest of the list becomes unreachable. Always take following = node.next first, then flip the link.",
        "Forgetting the head or tail after removing the first or last node (or the only node). A stale _tail makes the next append hook onto a node that is no longer in the list, so the new items silently vanish.",
        "Creating a cycle by accident (linking a node to one that is earlier in the chain, or splicing the same node into two lists). Every loop over the list then never ends. Fast and slow pointers detect it: they meet inside the loop.",
        "Writing reverse, length or search recursively. A list of 100,000 nodes needs 100,000 frames and raises RecursionError long before the work is done; use loops."
      ],
      useWhen: [
        "You insert or remove at the front, or at a position you already hold a pointer to, and never need indexing.",
        "The problem hands you a head pointer and asks for O(1) extra space: reverse, find the middle, detect or find a cycle, reorder, merge two sorted chains.",
        "You are building something on top of nodes: a queue, hash-table buckets, an adjacency chain, an LRU cache.",
        "An interviewer asks for 'one pass, constant space' on a sequence you can only walk forward."
      ],
      inPractice: "Python has no built-in singly linked list because list and collections.deque beat it on speed and memory for nearly every real workload (each node is a separate heap object with poor cache locality). Use list for stacks and sequences and deque for queues. Hand-write nodes when the problem gives you a node chain (interviews), when you need O(1) splicing at positions you hold, or when a larger structure needs chained buckets.",
      challenge: {
        prompt: "Write remove_nth_from_end(head, n). head is the first node of a singly linked list made of ListNode objects (given in the starter: attributes val and next; an empty list is head = None). Remove the n-th node counting from the END (n = 1 removes the last node, n = the list length removes the head) by relinking the existing nodes, and return the head of the resulting list (None if the only node was removed). Raise ValueError if n < 1 or the list has fewer than n nodes. Do it in a single pass without recursion: the checks use a list of 100,000 nodes. Watch the case where the head itself is removed.",
        hint: "Put a dummy node in front of head so that removing the head needs no special case. Advance a lead pointer n nodes from the dummy (raise ValueError if it runs off the end), then move lead and trail together until lead.next is None. trail now sits just before the node to delete: set trail.next = trail.next.next and return dummy.next.",
        starter: py`
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def remove_nth_from_end(head, n):
    """Remove the n-th node from the end (1 = the last node) and return the new head."""
    # TODO: use a dummy node and two pointers that are n nodes apart
    raise NotImplementedError
`,
        solution: py`
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def remove_nth_from_end(head, n):
    """Remove the n-th node from the end (1 = the last node) and return the new head."""
    if n < 1:
        raise ValueError(f"n must be at least 1, got {n}")
    dummy = ListNode(0, head)  # removing the head needs no special case
    lead = trail = dummy
    for _ in range(n):  # open a gap of n nodes between trail and lead
        lead = lead.next
        if lead is None:
            raise ValueError(f"the list has fewer than {n} nodes")
    while lead.next is not None:  # slide the gap to the end of the list
        lead = lead.next
        trail = trail.next
    trail.next = trail.next.next  # trail is the node just before the target
    return dummy.next
`,
        tests: py`
def build(values):
    head = None
    for value in reversed(values):
        head = ListNode(value, head)
    return head

def dump(head, limit=300_000):
    out = []
    while head is not None:
        out.append(head.val)
        if len(out) > limit:
            raise AssertionError("the list is cyclic or far too long")
        head = head.next
    return out

@check("removes the n-th node from the end")
def _():
    eq(dump(remove_nth_from_end(build([1, 2, 3, 4, 5]), 2)), [1, 2, 3, 5])
    eq(dump(remove_nth_from_end(build([1, 2, 3, 4, 5]), 1)), [1, 2, 3, 4])
    eq(dump(remove_nth_from_end(build([1, 2]), 1)), [1])

@check("removing the head (n equals the length) returns the second node")
def _():
    head = build([1, 2, 3])
    second = head.next
    result = remove_nth_from_end(head, 3)
    eq(result is second, True)
    eq(dump(result), [2, 3])
    eq(remove_nth_from_end(build([7]), 1), None)

@check("relinks the existing nodes instead of copying them")
def _():
    head = build([1, 2, 3, 4])
    nodes = [head, head.next, head.next.next, head.next.next.next]
    result = remove_nth_from_end(head, 2)
    eq(result is nodes[0], True)
    eq(nodes[1].next is nodes[3], True)
    eq(dump(result), [1, 2, 4])

@check("n below 1 or beyond the length raises ValueError")
def _():
    raises(ValueError, remove_nth_from_end, build([1, 2, 3]), 0)
    raises(ValueError, remove_nth_from_end, build([1, 2, 3]), 4)
    raises(ValueError, remove_nth_from_end, None, 1)

@check("handles 100,000 nodes in a single pass without recursion")
def _():
    n = 100_000
    head = remove_nth_from_end(build(list(range(n))), 50_000)
    out = dump(head)
    eq(len(out), n - 1)
    eq(out[49_999:50_001], [49_999, 50_001])
    head = remove_nth_from_end(head, n - 1)
    eq(dump(head)[:3], [1, 2, 3])
`
      },
      practice: ["Linked List", "Two Pointers"],
      source: "https://en.wikipedia.org/wiki/Linked_list"
    },
    {
      id: "stack",
      title: "Stack",
      kind: "structure",
      summary: "A last-in, first-out collection: the most recent item is always the next one out. It is the structure behind undo, nested parsing and depth-first search.",
      concepts: [
        "A stack exposes only one end, the top. push adds to the top, pop removes it, and peek reads it without removing. Because nothing else is reachable, the most recently added item is always the next to leave.",
        "In Python the cheapest layout is a list with the top at the END: append and pop(-1) touch only the right-hand end, so both are O(1) amortized. Putting the top at the front (insert(0, x), pop(0)) shifts every element and costs O(n).",
        "Stacks appear whenever the latest unfinished thing must be finished first: matching brackets, nested function calls, backtracking, undo history and iterative depth-first search.",
        "Extending a stack keeps its invariant by carrying extra state with each item. MinStack stores the minimum seen at every depth, so popping the current minimum reveals the previous one in O(1)."
      ],
      complexity: [
        { operation: "push", time: "O(1) amortized", note: "list.append occasionally resizes the backing array" },
        { operation: "pop / peek", time: "O(1)" },
        { operation: "len / bool", time: "O(1)" },
        { operation: "iterate / `in`", time: "O(n)" },
        { operation: "MinStack.minimum", time: "O(1)", note: "paid for with O(n) extra space" }
      ],
      space: "O(n) for n items (MinStack stores a second list of the same length).",
      code: py`
from __future__ import annotations

from collections.abc import Iterable, Iterator
from typing import Generic, TypeVar

T = TypeVar("T")


class Stack(Generic[T]):
    """A last-in, first-out stack backed by a Python list.

    Invariant: the top of the stack is the END of the list, so push and pop
    only touch the right-hand end and cost O(1) amortized.
    """

    __slots__ = ("_items",)

    def __init__(self, items: Iterable[T] = ()) -> None:
        self._items: list[T] = list(items)  # the last item is the top

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        if not self._items:
            raise IndexError("pop from empty stack")
        return self._items.pop()

    def peek(self) -> T:
        if not self._items:
            raise IndexError("peek at empty stack")
        return self._items[-1]

    def __len__(self) -> int:  # also gives bool(stack) for free
        return len(self._items)

    def __iter__(self) -> Iterator[T]:
        """Yield items top first: the order repeated pop() calls would return."""
        return reversed(self._items)

    def __repr__(self) -> str:
        return f"Stack({self._items!r})"  # bottom ... top

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Stack):
            return NotImplemented
        return self._items == other._items

    __hash__ = None  # type: ignore[assignment]  # mutable, so unhashable


class MinStack(Stack[int]):
    """A stack of numbers that also reports its minimum in O(1)."""

    __slots__ = ("_mins",)

    def __init__(self) -> None:
        super().__init__()
        self._mins: list[int] = []  # _mins[-1] is the minimum of everything below the top

    def push(self, item: int) -> None:
        super().push(item)
        self._mins.append(item if not self._mins else min(item, self._mins[-1]))

    def pop(self) -> int:
        item = super().pop()
        self._mins.pop()
        return item

    def minimum(self) -> int:
        if not self._mins:
            raise IndexError("minimum of empty stack")
        return self._mins[-1]


def is_balanced(text: str) -> bool:
    """Return True if every bracket in text is closed in the right order."""
    pairs = {")": "(", "]": "[", "}": "{"}
    open_brackets: Stack[str] = Stack()
    for char in text:
        if char in pairs.values():
            open_brackets.push(char)
        elif char in pairs:
            if not open_brackets or open_brackets.pop() != pairs[char]:
                return False
    return not open_brackets


if __name__ == "__main__":
    stack = Stack([1, 2, 3])
    stack.push(4)
    print(stack, len(stack), stack.peek())
    print(list(stack), 3 in stack)
    print(stack.pop(), stack.pop(), bool(stack))
    print(stack == Stack([1, 2]), stack == [1, 2])

    for text in ("([]{})", "(]", "(("):
        print(f"{text!r:10} balanced={is_balanced(text)}")

    lows = MinStack()
    for value in (5, 3, 7, 3):
        lows.push(value)
    print("minimum:", lows.minimum())
    print([(lows.pop(), lows.minimum()) for _ in range(3)])

    try:
        Stack().pop()
    except IndexError as error:
        print("error:", error)
`,
      output: `Stack([1, 2, 3, 4]) 4 4
[4, 3, 2, 1] True
4 3 True
True False
'([]{})'   balanced=True
'(]'       balanced=False
'(('       balanced=False
minimum: 3
[(3, 3), (7, 3), (3, 5)]
error: pop from empty stack`,
      bestPractices: [
        "Keep the top at the end of a list. append and pop are O(1) amortized there, while insert(0, x) and pop(0) are O(n).",
        "Be a good container citizen. __len__ (which also makes bool(stack) work), __iter__, __repr__ and __eq__ let len(), for-loops, print and == behave like the built-ins, and `in` works through __iter__ with no extra code.",
        "Raise the exception built-ins raise (IndexError for popping an empty stack) with a clear message. Returning None would be indistinguishable from a stored None.",
        "__slots__ drops the per-instance __dict__, saving memory when you create many small objects, and turns attribute typos into errors instead of silent new attributes.",
        "Generic[T] plus type hints document what the stack holds and let a type checker reject Stack[int].push(\"x\").",
        "Return NotImplemented from __eq__ for foreign types so Python can try the other operand, and set __hash__ = None because a mutable container must not be hashable."
      ],
      pitfalls: [
        "Using list.pop(0) as \"pop\" makes every operation O(n). If you need first-in, first-out, use collections.deque.",
        "Popping before checking: `open_brackets.pop()` on an empty stack raises IndexError. Guard with `if not stack` first, as is_balanced does.",
        "Returning True at the end of a bracket check without testing the stack: \"((\" never fails inside the loop and is only caught by `return not open_brackets`.",
        "Tracking a single running minimum in a MinStack breaks the moment that minimum is popped. Store the minimum at every depth."
      ],
      useWhen: [
        "Matching or nesting (brackets, tags, nested calls): the most recent unclosed item must close first.",
        "Undo/redo, backtracking, or an iterative DFS that has to retrace its steps in reverse order.",
        "Evaluating postfix expressions or anything that processes items in the reverse of their arrival order.",
        "\"Next greater\" or \"previous smaller\" questions, which use a monotonic stack."
      ],
      inPractice: "A plain list already is a stack: stack.append(x) and stack.pop(). Write a class like this when you want a narrower API, an extra invariant (MinStack) or a meaningful name inside a larger design. For a thread-safe stack use queue.LifoQueue; for fast access at both ends use collections.deque.",
      challenge: {
        prompt: "Write a MaxStack class for numbers. It needs push(item), pop(), peek(), maximum(), len(stack), bool(stack) and iteration from the top down (so list(stack) is the order repeated pop() calls would return). pop, peek and maximum raise IndexError on an empty stack. maximum() must run in O(1), even with duplicates: a stack holding 5, 5 still reports 5 after one of them is popped.",
        hint: "Keep a second list parallel to the items: after each push, append the larger of the new item and the previous maximum. Popping removes from both lists, so maximum() is always the last entry.",
        starter: py`
class MaxStack:
    """A stack of numbers whose maximum() takes O(1) time."""

    def __init__(self):
        self._items = []

    def push(self, item):
        self._items.append(item)

    def pop(self):
        raise NotImplementedError

    def peek(self):
        raise NotImplementedError

    def maximum(self):
        raise NotImplementedError

    def __len__(self):
        return len(self._items)

    def __iter__(self):
        raise NotImplementedError
`,
        solution: py`
class MaxStack:
    """A stack of numbers whose maximum() takes O(1) time."""

    def __init__(self):
        self._items = []
        self._maxes = []  # _maxes[i] is the maximum of _items[: i + 1]

    def push(self, item):
        self._items.append(item)
        self._maxes.append(item if not self._maxes else max(item, self._maxes[-1]))

    def pop(self):
        if not self._items:
            raise IndexError("pop from empty stack")
        self._maxes.pop()
        return self._items.pop()

    def peek(self):
        if not self._items:
            raise IndexError("peek at empty stack")
        return self._items[-1]

    def maximum(self):
        if not self._maxes:
            raise IndexError("maximum of empty stack")
        return self._maxes[-1]

    def __len__(self):
        return len(self._items)

    def __iter__(self):
        return reversed(self._items)
`,
        tests: py`
@check("push, pop and peek follow last-in, first-out order")
def _():
    s = MaxStack()
    for value in (3, 1, 4):
        s.push(value)
    eq(s.peek(), 4)
    eq(s.pop(), 4)
    eq(s.pop(), 1)
    eq(len(s), 1)
    eq(s.peek(), 3)

@check("maximum follows the stack as items come and go")
def _():
    s = MaxStack()
    for value in (2, 9, 4):
        s.push(value)
        eq(s.maximum(), max(s))
    eq(s.pop(), 4)
    eq(s.maximum(), 9)
    eq(s.pop(), 9)
    eq(s.maximum(), 2)

@check("duplicate maximums are counted separately")
def _():
    s = MaxStack()
    for value in (5, 1, 5):
        s.push(value)
    s.pop()
    eq(s.maximum(), 5)
    s.pop()
    s.pop()
    eq(len(s), 0)

@check("empty stack raises IndexError and is falsy")
def _():
    s = MaxStack()
    eq(bool(s), False)
    raises(IndexError, s.pop)
    raises(IndexError, s.peek)
    raises(IndexError, s.maximum)
    s.push(1)
    eq(bool(s), True)

@check("iterates top first, repeatably, without changing the stack")
def _():
    s = MaxStack()
    for value in (1, 2, 3):
        s.push(value)
    eq(list(s), [3, 2, 1])
    eq(list(s), [3, 2, 1])
    eq(len(s), 3)

@check("100,000 operations stay fast (maximum must be O(1))")
def _():
    s = MaxStack()
    for value in range(100_000):
        s.push((value * 7919) % 100_003)
    seen = 0
    for _ in range(100_000):
        seen = max(seen, s.maximum())
        s.pop()
    eq(len(s), 0)
    eq(seen > 99_000, True)
`
      },
      practice: ["Stack & Monotonic Queue"],
      source: "https://docs.python.org/3/tutorial/datastructures.html#using-lists-as-stacks"
    }
  ],
};
