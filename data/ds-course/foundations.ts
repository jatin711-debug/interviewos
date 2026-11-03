import type { DsModule } from "./types";

/** Python source written flush-left in a raw template: backslashes stay literal and the leading newline is dropped. */
const py = (strings: TemplateStringsArray, ...values: unknown[]) => String.raw(strings, ...values).replace(/^\n/, "");

export const FOUNDATIONS_MODULE: DsModule = {
  id: "foundations",
  title: "Writing data structures the Pythonic way",
  description: "Container protocols, iterators and cost analysis: the habits every implementation in this course follows.",
  lessons: [
    {
      id: "ds-class-design",
      title: "Designing a container class",
      kind: "structure",
      summary: "A well-made container answers to len(), for-loops, `in`, print and == exactly like a built-in. This lesson builds one class (a multiset) and one inherited class (an immutable deck) to show every hook and the reason for each.",
      concepts: [
        "Each special (dunder) method is the hook behind one piece of syntax. Define __len__ and len(x) works, and bool(x) works too because an empty container is falsy. Define __iter__ and for-loops, list(), sum(), sorted() and unpacking work. Define __contains__ and `in` works.",
        "Choose the representation, then state its invariant. Bag stores a dict of counts plus a running size, and the invariant is: every stored count is at least 1 and _size is their sum. Every method either relies on the invariant or restores it, which is why remove() deletes a key whose count reaches 0 and why len() is O(1) instead of summing counts.",
        "Equality and hashing are a pair: if a == b then hash(a) == hash(b) must hold. A mutable object cannot keep that promise (changing it would change its hash while it sits inside a set or dict), so mutable containers set __hash__ = None. An immutable one, like Deck, hashes exactly the data that __eq__ compares.",
        "Do not write what you can inherit. Subclass collections.abc.Sequence, write only __getitem__ and __len__, and Deck receives __iter__, __contains__, __reversed__, index and count. The abstract methods also make Python refuse to build a class that forgot one. MutableSequence, MutableMapping and Set work the same way.",
        "Alternate constructors are classmethods that call cls(), so subclasses build themselves. State stays private (_counts, _size) and facts derived from it are read-only properties (distinct)."
      ],
      complexity: [
        { operation: "Bag.add / remove / `in` / bag[item]", time: "O(1) average", note: "hash lookups in a dict" },
        { operation: "len(bag) / bool(bag)", time: "O(1)", note: "the size is tracked, never recomputed" },
        { operation: "iterate a Bag", time: "O(n)", note: "n counts repeated items; each next() is O(1)" },
        { operation: "bag == other", time: "O(d)", note: "d = number of distinct items" },
        { operation: "Deck[i] / len(deck)", time: "O(1)" },
        { operation: "Deck[a:b]", time: "O(k)", note: "copies the k items it keeps" },
        { operation: "`in`, index, count on a Deck", time: "O(n)", note: "inherited from Sequence: a linear scan" },
        { operation: "hash(deck)", time: "O(n)", note: "hashes every item" }
      ],
      space: "O(d) for a Bag with d distinct items (a duplicate costs one counter increment, not one more slot); O(n) for a Deck of n items.",
      code: py`
from __future__ import annotations

from collections.abc import Collection, Iterable, Iterator, Sequence
from itertools import repeat
from typing import Generic, Self, TypeVar

T = TypeVar("T")


class Bag(Generic[T]):
    """A multiset: an unordered collection that remembers how often each item was added.

    Invariant: _counts maps every stored item to a count >= 1 and _size is the
    sum of the counts. add, remove, "in" and bag[item] are O(1) on average.
    """

    __slots__ = ("_counts", "_size")

    def __init__(self) -> None:
        self._counts: dict[T, int] = {}
        self._size = 0

    @classmethod
    def from_iterable(cls, items: Iterable[T]) -> Self:
        bag = cls()  # cls, not Bag, so a subclass builds a subclass
        for item in items:
            bag.add(item)
        return bag

    @property
    def distinct(self) -> int:
        """How many different items are stored (len() counts repeats)."""
        return len(self._counts)

    def add(self, item: T, times: int = 1) -> None:
        if times < 1:
            raise ValueError(f"times must be at least 1, got {times}")
        self._counts[item] = self._counts.get(item, 0) + times
        self._size += times

    def remove(self, item: T) -> None:
        """Remove one copy of item. Like set.remove, raise KeyError if there is none."""
        if item not in self._counts:
            raise KeyError(item)
        self._counts[item] -= 1
        if self._counts[item] == 0:
            del self._counts[item]  # restore the invariant: counts are >= 1
        self._size -= 1

    def __len__(self) -> int:  # also gives bool(bag) for free
        return self._size

    def __iter__(self) -> Iterator[T]:
        """Yield each item once per copy, in order of first appearance."""
        for item, times in self._counts.items():
            yield from repeat(item, times)

    def __contains__(self, item: object) -> bool:  # O(1); the fallback would scan __iter__
        return item in self._counts

    def __getitem__(self, item: T) -> int:
        """bag[item] is the number of copies (0 when absent), like Counter."""
        return self._counts.get(item, 0)

    def __repr__(self) -> str:
        return f"{type(self).__name__}.from_iterable({list(self)!r})"

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Bag):
            return NotImplemented
        return self._counts == other._counts

    __hash__ = None  # type: ignore[assignment]  # mutable, so unhashable


class Deck(Sequence[T]):
    """An immutable, hashable sequence. We write __getitem__ and __len__;
    Sequence supplies __iter__, __contains__, __reversed__, index and count."""

    __slots__ = ("_cards",)

    def __init__(self, cards: Iterable[T]) -> None:
        self._cards: tuple[T, ...] = tuple(cards)

    def __len__(self) -> int:
        return len(self._cards)

    def __getitem__(self, index: int | slice) -> T | Deck[T]:
        if isinstance(index, slice):
            return Deck(self._cards[index])  # a slice of a Deck is a Deck
        return self._cards[index]  # negative indices and IndexError come for free

    def __repr__(self) -> str:
        return f"Deck({list(self._cards)!r})"

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Deck):
            return NotImplemented
        return self._cards == other._cards

    def __hash__(self) -> int:  # immutable, so hash exactly what __eq__ compares
        return hash(self._cards)


if __name__ == "__main__":
    bag = Bag.from_iterable("banana")
    print(bag, len(bag), bag.distinct)
    print(bag["a"], bag["z"], "n" in bag, "z" in bag)
    print(sorted(bag), bool(Bag()), isinstance(bag, Collection))
    bag.remove("b")
    print(bag == Bag.from_iterable("nanaa"), bag == ["a", "a", "a", "n", "n"])
    for mistake in (lambda: bag.remove("z"), lambda: bag.add("x", 0)):
        try:
            mistake()
        except (KeyError, ValueError) as error:
            print(type(error).__name__, error)

    deck = Deck("AKQJ")
    print(deck, deck[0], deck[-1], deck[1:3])
    print(list(reversed(deck)), deck.index("Q"), "K" in deck, deck.count("A"))
    print(deck == Deck(["A", "K", "Q", "J"]), {deck: "hand"}[Deck("AKQJ")])
`,
      output: `Bag.from_iterable(['b', 'a', 'a', 'a', 'n', 'n']) 6 3
3 0 True False
['a', 'a', 'a', 'b', 'n', 'n'] False True
True False
KeyError 'z'
ValueError times must be at least 1, got 0
Deck(['A', 'K', 'Q', 'J']) A J Deck(['K', 'Q'])
['J', 'Q', 'K', 'A'] 2 True 1
True hand`,
      bestPractices: [
        "Implement __len__ and let bool() fall out of it. Keeping a running _size makes len(bag) O(1) instead of re-summing the counts on every call.",
        "Make __iter__ a generator method (yield from repeat(item, times)). It is lazy, so next(iter(bag)) does O(1) work and no temporary list is built.",
        "Define __contains__ whenever a faster test than scanning exists. Without it `in` falls back to looping over __iter__, which is O(n); with it, Bag answers from the dict in O(1).",
        "Write alternate constructors as @classmethod and call cls(), not Bag(). A subclass then gets its own type back, and __repr__ uses type(self).__name__ for the same reason.",
        "Return NotImplemented (not False, and not raise NotImplementedError) from __eq__ for foreign types, and pair it with __hash__: None for the mutable Bag, hash(self._cards) for the immutable Deck.",
        "Inherit Sequence[T] when you can write __getitem__ and __len__: iteration, `in`, reversed(), index and count are free, and a slice returns a Deck, not a bare tuple.",
        "Raise what the built-ins raise: KeyError for a missing item (as set.remove does) and ValueError for a bad argument. __slots__ and Generic[T] keep instances small and typed."
      ],
      pitfalls: [
        "A class that defines __getitem__ but not __iter__ is iterated by calling __getitem__(0), (1), (2), ... until IndexError. Bag's __getitem__ returns 0 for any missing key and never raises IndexError, so without its explicit __iter__ a for-loop would never end.",
        "Giving a mutable class a content-based __hash__ strands it: put an object in a set, mutate it, and the set looks in the wrong bucket, so `in` and remove fail. If objects must be hashable, make them immutable.",
        "Building a list inside __iter__ (return iter([...])) copies everything before the first item is delivered and uses O(n) extra memory. Yield lazily.",
        "Raising NotImplementedError from __eq__ instead of returning NotImplemented turns bag == 5 into a crash, and Python never gets to try the other operand's __eq__."
      ],
      useWhen: [
        "You are about to write a class that holds items: make it work with len(), for, `in`, print and == like a built-in so other code can use it without knowing it exists.",
        "A function should accept \"anything with a length\" or \"anything iterable\": annotate with Collection, Iterable or Sequence and let your class satisfy it structurally.",
        "You need a value-like container as a dict key or set member: make it immutable and hash what == compares.",
        "You need to count duplicates while keeping membership tests fast: that is a multiset."
      ],
      inPractice: "collections.Counter is the production multiset: a dict subclass with most_common(), elements() and arithmetic between counters. Use tuple (or a frozen dataclass or NamedTuple) for immutable sequences. Subclass collections.abc classes when you build a genuinely new container, as Deck does, and prefer wrapping a list or dict over subclassing them: their C-level methods do not call your overrides, so a subclass can silently bypass its own rules.",
      challenge: {
        prompt: "Write an OrderedSet class: a set that remembers the order in which items were first added. OrderedSet(items=()) builds it from any iterable (repeats are ignored; the first occurrence keeps its position). It needs add(item) (an item that is already present stays where it is), discard(item) (does nothing when absent), len(s) and bool(s), iteration in insertion order that can be repeated, `in` that runs in O(1), s[i] with positive and negative indices (IndexError when out of range) where a slice s[a:b] returns a new OrderedSet, and repr like OrderedSet([1, 'a']). Two OrderedSets are equal when they hold the same items in the same order; comparing with a list must be False (return NotImplemented), and hash(s) must raise TypeError because it is mutable. Indexing may be O(n); add and `in` may not.",
        hint: "A dict already keeps insertion order, has unique keys and O(1) membership, so keep the items as dict keys (dict.fromkeys(items) builds it in one step). For s[i], turn the keys into a list and index it; handle slice objects with isinstance(index, slice).",
        starter: py`
class OrderedSet:
    """A set that remembers the order in which items were first added."""

    def __init__(self, items=()):
        self._items = []  # TODO: choose a representation with O(1) membership

    def add(self, item):
        raise NotImplementedError

    def discard(self, item):
        raise NotImplementedError

    def __len__(self):
        raise NotImplementedError

    def __iter__(self):
        raise NotImplementedError

    def __contains__(self, item):
        raise NotImplementedError

    def __getitem__(self, index):
        raise NotImplementedError

    def __eq__(self, other):
        raise NotImplementedError

    def __repr__(self):
        raise NotImplementedError
`,
        solution: py`
class OrderedSet:
    """A set that remembers the order in which items were first added."""

    def __init__(self, items=()):
        self._items = dict.fromkeys(items)  # keys: unique, ordered, O(1) lookup

    def add(self, item):
        self._items[item] = None  # an existing key keeps its position

    def discard(self, item):
        self._items.pop(item, None)

    def __len__(self):
        return len(self._items)

    def __iter__(self):
        return iter(self._items)

    def __contains__(self, item):
        return item in self._items

    def __getitem__(self, index):
        items = list(self._items)
        if isinstance(index, slice):
            return OrderedSet(items[index])
        return items[index]

    def __eq__(self, other):
        if not isinstance(other, OrderedSet):
            return NotImplemented
        return list(self) == list(other)

    __hash__ = None

    def __repr__(self):
        return f"OrderedSet({list(self)!r})"
`,
        tests: py`
@check("keeps first-insertion order, ignores repeats, can be iterated twice")
def _():
    s = OrderedSet([3, 1, 3, 2, 1])
    eq(list(s), [3, 1, 2])
    eq(list(s), [3, 1, 2])
    eq(len(s), 3)
    s.add(1)
    s.add(9)
    eq(list(s), [3, 1, 2, 9])

@check("discard removes an item and stays silent when it is absent")
def _():
    s = OrderedSet("abc")
    s.discard("b")
    s.discard("zzz")
    eq(list(s), ["a", "c"])
    s.add("b")
    eq(list(s), ["a", "c", "b"])

@check("len, bool and in behave like a built-in container")
def _():
    s = OrderedSet()
    eq(bool(s), False)
    eq(len(s), 0)
    s.add(0)
    eq(bool(s), True)
    eq(0 in s, True)
    eq(1 in s, False)

@check("indexing supports negatives and IndexError; a slice is an OrderedSet")
def _():
    s = OrderedSet([10, 20, 30, 40])
    eq(s[0], 10)
    eq(s[-1], 40)
    part = s[1:3]
    eq(isinstance(part, OrderedSet), True)
    eq(list(part), [20, 30])
    raises(IndexError, lambda: s[4])

@check("equality uses order, rejects foreign types; repr and hash follow the contract")
def _():
    eq(OrderedSet([1, 2]) == OrderedSet([1, 2]), True)
    eq(OrderedSet([1, 2]) == OrderedSet([2, 1]), False)
    eq(OrderedSet([1, 2]) == [1, 2], False)
    eq(repr(OrderedSet([1, "a"])), "OrderedSet([1, 'a'])")
    raises(TypeError, hash, OrderedSet())

@check("100,000 adds and 20,000 lookups stay fast (add and in must be O(1))")
def _():
    s = OrderedSet()
    for n in range(100_000):
        s.add(n)
    eq(len(s), 100_000)
    hits = sum(1 for n in range(-20_000, 0) if n in s)
    eq(hits, 0)
    eq(99_999 in s, True)
`
      },
      practice: ["Arrays & Hashing"],
      source: "https://docs.python.org/3/reference/datamodel.html#emulating-container-types"
    },
    {
      id: "ds-iterators",
      title: "Iterators & generators for data structures",
      kind: "concept",
      summary: "Every traversal in this course is an iterator. Knowing the difference between an iterable and an iterator, how generators and yield from work, and why mutating mid-loop goes wrong lets you write lazy, re-usable and safe traversals.",
      concepts: [
        "An iterable is anything iter() accepts: it can hand out a fresh iterator on demand (lists, dicts, ranges, your containers). An iterator is the cursor that does the walking: next(it) returns the next item and raises StopIteration at the end. A for-loop is just iter() once, then next() until StopIteration.",
        "Iterators are one-shot, iterables are re-iterable. An iterator returns itself from iter(), so a half-used one carries on where it stopped and a used-up one is silently empty. A container's __iter__ must return a NEW iterator every call (Countdown does) so repeated passes and nested loops work. A generator method as __iter__ gives that for free.",
        "A generator function runs lazily: nothing in its body executes until the first next(), and it pauses at every yield. That makes infinite sequences safe and lets a pipeline handle one item at a time in O(1) memory. yield from hands control to another iterable, which keeps recursive walks (trees, nested lists) short.",
        "The standard toolbox: itertools.islice(it, k) takes the first k items lazily and consumes exactly k; iter(callable, sentinel) calls a function repeatedly until it returns the sentinel, ideal for read(), poll or pop-style APIs; generator expressions chain stages without building intermediate lists.",
        "Changing a container while looping over it gives wrong answers. A list iterator walks by position, so removing an item silently skips its neighbour. dict and set raise RuntimeError when their size changes. A container can offer the same protection by keeping a version counter and having each iterator compare it on every step."
      ],
      complexity: [
        { operation: "next(iterator)", time: "O(1) per item", note: "for the iterators written here" },
        { operation: "for-loop / list(it) over n items", time: "O(n)", note: "list() also allocates O(n)" },
        { operation: "islice(it, k)", time: "O(k)", note: "lazy: consumes exactly k items, even from an infinite source" },
        { operation: "flatten(nested)", time: "O(n * depth) worst case", note: "each leaf is passed up through every enclosing generator" },
        { operation: "Ledger version check", time: "O(1) per step" },
        { operation: "iter(callable, sentinel)", time: "O(1) overhead per item", note: "plus whatever the callable costs" }
      ],
      space: "O(1) for iterators that keep only a cursor (Countdown, the Ledger iterator, islice). flatten keeps one suspended generator per nesting level, so O(depth). Materializing with list(...) costs O(n).",
      code: py`
from __future__ import annotations

from collections.abc import Iterable, Iterator
from functools import partial
from io import StringIO
from itertools import islice
from typing import Generic, TypeVar

T = TypeVar("T")


class _CountdownIterator(Iterator[int]):
    """An ITERATOR: it remembers where it is, so one pass uses it up.

    Inheriting collections.abc.Iterator supplies __iter__ (return self),
    so only __next__ is written by hand.
    """

    __slots__ = ("_next_value",)

    def __init__(self, start: int) -> None:
        self._next_value = start

    def __next__(self) -> int:
        if self._next_value < 1:
            raise StopIteration  # the protocol's "finished" signal
        value = self._next_value
        self._next_value -= 1
        return value


class Countdown:
    """An ITERABLE: every iter() call hands out a fresh iterator, so loops can repeat."""

    __slots__ = ("_start",)

    def __init__(self, start: int) -> None:
        self._start = start

    def __iter__(self) -> Iterator[int]:
        return _CountdownIterator(self._start)


class Ledger(Generic[T]):
    """A list-backed log whose iterators notice structural changes.

    Invariant: _version grows with every append. A running iterator compares
    it with the value it started with and raises RuntimeError, the way dict
    does when its size changes mid-loop.
    """

    __slots__ = ("_entries", "_version")

    def __init__(self, entries: Iterable[T] = ()) -> None:
        self._entries = list(entries)
        self._version = 0

    def append(self, entry: T) -> None:
        self._entries.append(entry)
        self._version += 1

    def __iter__(self) -> Iterator[T]:  # a generator method: a fresh iterator per call
        version = self._version
        for entry in self._entries:
            yield entry
            if version != self._version:  # runs when the loop asks for the next item
                raise RuntimeError("Ledger changed during iteration")


def flatten(nested: Iterable[object]) -> Iterator[object]:
    """Yield the leaves of arbitrarily nested lists, left to right (one frame per level)."""
    for item in nested:
        if isinstance(item, list):
            yield from flatten(item)  # delegate to a sub-generator
        else:
            yield item


def naturals() -> Iterator[int]:
    """An infinite generator: safe, because nothing runs until a consumer asks."""
    n = 0
    while True:
        yield n
        n += 1


def blocks(stream: StringIO, size: int) -> Iterator[str]:
    """Yield size-character blocks until read() returns the sentinel "" at the end."""
    return iter(partial(stream.read, size), "")


if __name__ == "__main__":
    countdown = Countdown(3)
    print(list(countdown), list(countdown))  # an iterable can be walked again
    cursor = iter(countdown)
    print(next(cursor), list(cursor), list(cursor))  # an iterator cannot
    print(iter(cursor) is cursor, iter(countdown) is countdown)

    print(list(flatten([1, [2, [3, 4]], [], 5])))
    squares = (n * n for n in naturals())  # infinite, yet nothing is computed yet
    print(list(islice(squares, 5)), list(islice(squares, 3)))
    print(list(blocks(StringIO("abcdefghij"), 4)))

    numbers = [1, 2, 2, 3]
    for number in numbers:
        if number == 2:
            numbers.remove(number)
    print(numbers)  # one 2 survived: the list shifted under the iterator

    ledger = Ledger([1, 2, 3])
    try:
        for entry in ledger:
            if entry == 2:
                ledger.append(entry * 10)
    except RuntimeError as error:
        print("error:", error, list(ledger))
`,
      output: `[3, 2, 1] [3, 2, 1]
3 [2, 1] []
True False
[1, 2, 3, 4, 5]
[0, 1, 4, 9, 16] [25, 36, 49]
['abcd', 'efgh', 'ij']
[1, 2, 3]
error: Ledger changed during iteration [1, 2, 3, 20]`,
      bestPractices: [
        "Separate the iterable from its iterator (Countdown and _CountdownIterator) when a container must be walked many times: __iter__ returns a fresh cursor each call, and the cursor returns itself from iter().",
        "Inherit collections.abc.Iterator and write only __next__: the base class supplies __iter__ returning self, which is the part people forget.",
        "Write __iter__ as a generator method (Ledger, and every container in this course) when the walk is a loop. Hand-write __next__ only when the cursor needs extra state or methods.",
        "Use yield from to recurse (flatten): the sub-generator's items flow straight to the caller and there is no list to build or merge.",
        "Stay lazy. A generator expression over an infinite generator plus islice does only the work asked for, and naturals() is safe because the loop in its body only advances on demand.",
        "Replace while True / read / break loops with iter(callable, sentinel) (blocks), and annotate parameters as Iterable[T] (accept lists, sets, generators) and generator results as Iterator[T]."
      ],
      pitfalls: [
        "Looping twice over a one-shot iterator: after g = (x * x for x in data), sum(g) works and a following max(g) raises ValueError because g is empty. map, filter, zip and generators are all one-shot. Keep a list or tuple when you need a second pass, or hand out an iterable class.",
        "Deleting from a list while looping over it skips items (the demo leaves a 2 behind). Iterate over a copy such as list(numbers), or build a new list. For a dict, loop over list(d) or collect keys first, otherwise RuntimeError.",
        "A generator function validates lazily. If chunked() starts with if size < 1: raise ValueError, the error appears at the first next(), not at the call. Validate in an ordinary function that returns the generator when you need the error immediately.",
        "Calling next(it) with no default inside a generator lets StopIteration escape, and since Python 3.7 that becomes RuntimeError (PEP 479). Use next(it, default) or a for-loop. Also, recursive generators use one frame per level, so a 5,000-deep structure needs an explicit stack."
      ],
      useWhen: [
        "A data structure should be traversable in a loop (list, tree, graph): give it __iter__ instead of a to_list() method.",
        "The sequence is huge, infinite or expensive per item and the consumer may stop early (any, next(it, None), islice): produce items lazily.",
        "A recursive structure needs an in-order, pre-order or flattening walk: write a generator and delegate with yield from.",
        "You process a stream once in O(1) memory: chain generator expressions instead of building a list per stage."
      ],
      inPractice: "Reach for itertools first: islice, chain, chain.from_iterable, count, takewhile, pairwise (3.10+), batched (3.12+, yields tuples) and generator expressions cover most needs. Hand-write an iterator class only when the cursor has extra state (peek, a length hint, a position). For your own containers, a generator-method __iter__ that returns a fresh iterator per call is almost always the right answer.",
      challenge: {
        prompt: "Write two things. (1) class Collatz(start): iterating it yields the Collatz sequence beginning at start and ending at 1 (inclusive): if the current number is even the next one is n // 2, otherwise 3 * n + 1; Collatz(6) yields 6, 3, 10, 5, 16, 8, 4, 2, 1 and Collatz(1) yields just 1. It must be an ITERABLE that can be looped over any number of times (including nested loops), and Collatz(0) or a negative start raises ValueError as soon as it is constructed. (2) a function chunked(iterable, size) that lazily yields lists of up to size items from any iterable, including one-shot iterators; the last list may be shorter, an empty input yields nothing, and size < 1 raises ValueError (raising when iteration starts is fine). chunked must not read ahead: after the first list has been taken it has consumed exactly size items from its source.",
        hint: "Make Collatz.__iter__ a generator method that starts from self._start each time, so every loop gets its own state. For chunked, take it = iter(iterable) and repeatedly call list(islice(it, size)); stop when that list is empty (while chunk := list(islice(it, size)): yield chunk).",
        starter: py`
class Collatz:
    """The Collatz sequence from start down to 1, repeatable."""

    def __init__(self, start):
        pass  # TODO: validate start and remember it

    def __iter__(self):
        raise NotImplementedError


def chunked(iterable, size):
    """Yield lists of up to size items, reading only what each list needs."""
    raise NotImplementedError
`,
        solution: py`
from itertools import islice


class Collatz:
    """The Collatz sequence from start down to 1, repeatable."""

    def __init__(self, start):
        if start < 1:
            raise ValueError(f"start must be at least 1, got {start}")
        self._start = start

    def __iter__(self):
        n = self._start  # local state: every loop starts afresh
        while n != 1:
            yield n
            n = n // 2 if n % 2 == 0 else 3 * n + 1
        yield 1


def chunked(iterable, size):
    """Yield lists of up to size items, reading only what each list needs."""
    if size < 1:
        raise ValueError(f"size must be at least 1, got {size}")
    iterator = iter(iterable)
    while chunk := list(islice(iterator, size)):
        yield chunk
`,
        tests: py`
@check("Collatz yields the sequence down to 1")
def _():
    eq(list(Collatz(6)), [6, 3, 10, 5, 16, 8, 4, 2, 1])
    eq(list(Collatz(1)), [1])
    items = list(Collatz(27))
    eq(len(items), 112)
    eq(max(items), 9232)

@check("Collatz can be iterated repeatedly, even in nested loops")
def _():
    c = Collatz(7)
    first = list(c)
    eq(len(first), 17)
    eq(list(c), first)
    pairs = [(a, b) for a in Collatz(2) for b in Collatz(2)]
    eq(pairs, [(2, 2), (2, 1), (1, 2), (1, 1)])
    eq(sum(1 for _ in c), 17)

@check("Collatz rejects a start below 1 when it is constructed")
def _():
    raises(ValueError, Collatz, 0)
    raises(ValueError, Collatz, -5)

@check("chunked splits into lists; the last list may be shorter")
def _():
    eq(list(chunked(range(7), 3)), [[0, 1, 2], [3, 4, 5], [6]])
    eq(list(chunked("abcde", 2)), [["a", "b"], ["c", "d"], ["e"]])
    eq(list(chunked([1, 2], 5)), [[1, 2]])
    eq(list(chunked([], 3)), [])

@check("chunked works on one-shot iterators and rejects size < 1")
def _():
    eq(list(chunked((x for x in range(5)), 2)), [[0, 1], [2, 3], [4]])
    raises(ValueError, lambda: list(chunked([1, 2], 0)))

@check("chunked is lazy: it reads only what each list needs")
def _():
    consumed = []

    def source():
        for i in range(1000):
            consumed.append(i)
            yield i

    chunks = chunked(source(), 4)
    eq(next(chunks), [0, 1, 2, 3])
    eq(len(consumed), 4)
    eq(next(chunks), [4, 5, 6, 7])
    eq(len(consumed), 8)
`
      },
      practice: ["Arrays & Hashing", "Backtracking & Recursion"],
      source: "https://docs.python.org/3/library/stdtypes.html#iterator-types"
    },
    {
      id: "ds-complexity",
      title: "Analysing algorithms: Big-O, amortized cost & recurrences",
      kind: "concept",
      summary: "Complexity analysis predicts how an algorithm's cost grows with its input before you run it. This lesson counts operations instead of seconds, so you can see Big-O, amortized cost, recurrences and constraint-based reasoning in deterministic numbers.",
      concepts: [
        "Big-O is an upper bound on how cost grows with the input size n, Omega is a lower bound and Theta means both, so the growth rate is pinned down. Constants and lower-order terms are dropped because they stop mattering as n grows: 3n^2 + 50n is Theta(n^2). These symbols describe growth; best, worst and average case say which input you measure. Linear search is Theta(1) in its best case (target first) and Theta(n) in its worst case.",
        "Learn the growth ladder: log n, n, n log n, n^2, n^3, 2^n, n!. The demo asks how large n can get within 10^8 steps: about 4 million for n log n, 10,000 for n^2, 464 for n^3, 26 for 2^n. That is how to reason from constraints: n up to 10^5 needs O(n log n) or better, n up to a few thousand tolerates O(n^2), and n up to about 20 means exponential search. Pure Python is much slower than 10^8 steps a second, so treat these as ceilings.",
        "Amortized cost is the average cost per operation over the worst possible sequence of operations. It is a guarantee, not luck. A dynamic array that doubles when full copies n items occasionally, but the copies happen after 1, 2, 4, ... appends, so n appends copy fewer than 2n items in total: O(1) amortized per append. Growing by a fixed amount (+10) makes the total quadratic.",
        "A recursive algorithm's cost is a recurrence. Merge sort satisfies T(n) = 2T(n/2) + n: two half-size problems plus a linear merge. The recursion tree has log2(n) levels that each cost about n, so the total is Theta(n log n). The master theorem automates this for T(n) = aT(n/b) + Theta(n^d): compare the root's work n^d with the leaves' work n^(log_b a). Root bigger gives Theta(n^d), a tie gives Theta(n^d log n), leaves bigger gives Theta(n^(log_b a)).",
        "Space counts extra memory, including the call stack. A recursion that goes d frames deep uses O(d) space: recursive binary search is O(log n) and the loop version is O(1), while a recursive depth-first search along a path of n nodes is O(n) and, in Python, fails with RecursionError at about 1000 frames."
      ],
      complexity: [
        { operation: "comparisons_linear", time: "O(n) worst case", note: "Theta(1) best case: the target is first" },
        { operation: "comparisons_binary", time: "O(log n)", note: "about log2(n) + 1 comparisons" },
        { operation: "append with doubling", time: "O(1) amortized", note: "fewer than 2n element copies for n appends" },
        { operation: "append with +10 growth", time: "O(n) amortized", note: "about n^2 / 20 copies in total" },
        { operation: "work(n) via T(n) = 2T(n/2) + n", time: "Theta(n log n)", note: "n * (log2(n) + 1) exactly when n is a power of two" },
        { operation: "master_theorem / largest_n", time: "O(1) / O(log answer)", note: "largest_n doubles, then bisects" }
      ],
      space: "O(1) for the loops, master_theorem and largest_n. work() recurses log2(n) frames deep, so O(log n) stack. Nothing here stores more than a few counters.",
      code: py`
from __future__ import annotations

from collections.abc import Callable, Sequence
from math import log


def comparisons_linear(items: Sequence[int], target: int) -> int:
    """Count the comparisons a front-to-back scan makes before it stops."""
    count = 0
    for item in items:
        count += 1
        if item == target:
            break
    return count


def comparisons_binary(items: Sequence[int], target: int) -> int:
    """Count the comparisons binary search makes on sorted items: O(log n)."""
    lo, hi, count = 0, len(items), 0
    while lo < hi:
        mid = (lo + hi) // 2
        count += 1
        if items[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    return count


def doubling(capacity: int) -> int:
    return max(1, 2 * capacity)


def plus_ten(capacity: int) -> int:
    return capacity + 10


def append_copies(n: int, grow: Callable[[int], int]) -> int:
    """Total element copies caused by n appends to an array that starts at capacity 0.

    When the array is full, a buffer of capacity grow(capacity) replaces it
    and every stored element is copied across once.
    """
    capacity = copies = 0
    for size in range(n):  # size elements are stored before this append
        if size == capacity:
            copies += size
            capacity = grow(capacity)
    return copies


def work(n: int) -> int:
    """Operations used by T(n) = T(n // 2) + T(n - n // 2) + n with T(1) = 1.

    The recursion is only log2(n) frames deep, so it needs O(log n) stack.
    """
    if n <= 1:
        return 1
    half = n // 2
    return work(half) + work(n - half) + n


def _power(d: int) -> str:
    return "1" if d == 0 else "n" if d == 1 else f"n^{d}"


def master_theorem(a: int, b: int, d: int) -> str:
    """Solve T(n) = a*T(n/b) + Theta(n^d) for integers a >= 1, b >= 2, d >= 0.

    Compare the work at the root, n^d, with the work at the leaves, n^log_b(a).
    Testing a against b**d avoids floating-point logarithms at the tie.
    """
    if a < 1 or b < 2 or d < 0:
        raise ValueError("need a >= 1, b >= 2, d >= 0")
    if a < b**d:  # the root dominates
        return f"Theta({_power(d)})"
    if a == b**d:  # every level costs the same, and there are log n levels
        return f"Theta({'log n' if d == 0 else _power(d) + ' log n'})"
    exponent = log(a, b)  # the leaves dominate
    if b ** round(exponent) == a:
        return f"Theta({_power(round(exponent))})"
    return f"Theta(n^{exponent:.3f})"


def largest_n(cost: Callable[[int], int], budget: int) -> int:
    """Largest n with cost(n) <= budget, for an increasing cost function."""
    hi = 1
    while cost(hi) <= budget:  # double until the budget is blown...
        hi *= 2
    lo = hi // 2  # ...then binary search: cost(lo) fits, cost(hi) does not
    while hi - lo > 1:
        mid = (lo + hi) // 2
        lo, hi = (mid, hi) if cost(mid) <= budget else (lo, mid)
    return lo


if __name__ == "__main__":
    for n in (10, 1_000, 100_000):
        data = list(range(n))
        best, worst = comparisons_linear(data, 0), comparisons_linear(data, -1)
        print(f"n={n:<7} linear best={best} worst={worst:<7} binary worst={comparisons_binary(data, -1)}")

    for n in (1_000, 100_000):
        fast, slow = append_copies(n, doubling), append_copies(n, plus_ten)
        print(f"{n} appends: doubling copies {fast} ({fast / n:.2f} each), +10 copies {slow} ({slow / n:.2f} each)")

    print([work(n) for n in (1024, 2048, 4096)])  # n * (log2(n) + 1) for powers of two
    recurrences = {"merge sort": (2, 2, 1), "binary search": (1, 2, 0), "scan, halve": (1, 2, 1), "Karatsuba": (3, 2, 1), "8 sub-blocks": (8, 2, 2)}
    for name, (a, b, d) in recurrences.items():
        print(f"{name:14} a={a} b={b} d={d} -> {master_theorem(a, b, d)}")
    try:
        master_theorem(2, 1, 1)
    except ValueError as error:
        print("error:", error)

    costs: dict[str, Callable[[int], int]] = {
        "n": lambda n: n,
        "n log n": lambda n: n * n.bit_length(),  # bit_length() is an integer log2
        "n^2": lambda n: n * n,
        "n^3": lambda n: n**3,
        "2^n": lambda n: 2**n,
    }
    for name, cost in costs.items():
        print(f"{name:8} fits 10^8 steps up to n = {largest_n(cost, 10**8)}")
`,
      output: `n=10      linear best=1 worst=10      binary worst=4
n=1000    linear best=1 worst=1000    binary worst=10
n=100000  linear best=1 worst=100000  binary worst=17
1000 appends: doubling copies 1023 (1.02 each), +10 copies 49500 (49.50 each)
100000 appends: doubling copies 131071 (1.31 each), +10 copies 499950000 (4999.50 each)
[11264, 24576, 53248]
merge sort     a=2 b=2 d=1 -> Theta(n log n)
binary search  a=1 b=2 d=0 -> Theta(log n)
scan, halve    a=1 b=2 d=1 -> Theta(n)
Karatsuba      a=3 b=2 d=1 -> Theta(n^1.585)
8 sub-blocks   a=8 b=2 d=2 -> Theta(n^3)
error: need a >= 1, b >= 2, d >= 0
n        fits 10^8 steps up to n = 100000000
n log n  fits 10^8 steps up to n = 4347826
n^2      fits 10^8 steps up to n = 10000
n^3      fits 10^8 steps up to n = 464
2^n      fits 10^8 steps up to n = 26`,
      bestPractices: [
        "Count operations, not seconds. The counters in comparisons_linear and append_copies make cost visible and identical on every machine, so examples and tests are reproducible. Wall-clock time depends on hardware and load.",
        "Put the cost and the case in the docstring (\"O(log n)\", \"worst case\", \"amortized\"). A reader should not have to re-derive it, and a stated bound is something a test can check.",
        "Prefer exact integer arithmetic to floating-point logarithms where it decides an answer: master_theorem compares a with b**d, and the n log n cost uses n.bit_length() as an integer log2.",
        "Pass the strategy in as a function (grow, cost). append_copies then compares doubling with +10 growth through one simulator, and largest_n works for any increasing cost function.",
        "When a cost has no closed form, double until the budget is exceeded and then bisect (largest_n). That is binary search on the answer, and it needs only O(log answer) evaluations.",
        "Keep recursion shallow and say so: work() is log2(n) frames deep, which is why it is safe, and the docstring records the stack cost."
      ],
      pitfalls: [
        "Mixing up amortized, average and worst case. An amortized O(1) append still has the occasional O(n) append (real-time code feels that spike), and it is a guarantee over any sequence of operations. An average or expected cost assumes something about the inputs, such as random keys for a hash table.",
        "Hiding a linear cost inside a loop body. x in a_list, list.insert(0, x), list.pop(0), slicing and building a string with s += piece inside a loop can each add a factor of n, so a loop that looks O(n) is really O(n^2).",
        "Using one letter for two sizes or multiplying when you should add. Two sequential loops over n and m items cost O(n + m); a loop over m inside a loop over n costs O(n * m). With two inputs, keep both variables in the answer.",
        "Treating Big-O as the whole story at small n. It says what happens as n grows; a simple O(n^2) routine with a tiny constant can beat an O(n log n) one for n around 50, which is why Timsort sorts short runs with insertion sort. Measure when n is small."
      ],
      useWhen: [
        "You must choose between approaches before coding: estimate each one from the input limits (n up to 10^5 means aim for O(n log n)).",
        "A structure advertises an amortized bound: ask what the worst single operation costs as well as the average.",
        "A solution is recursive: write down its recurrence and solve it with the master theorem or by drawing the recursion tree.",
        "An interviewer asks whether you can do better: name the current Theta and the step that dominates it."
      ],
      inPractice: "Measure before optimizing. Use cProfile to find hot spots and timeit to compare alternatives at realistic input sizes; complexity analysis tells you which approach scales, profiling tells you where the time actually goes. Rely on the standard library's already-analysed structures (list, dict, set, collections.deque, heapq, bisect) and consult the TimeComplexity page on the Python wiki when unsure of an operation's cost.",
      challenge: {
        prompt: "Write counter_flips(n). A binary counter starts at 0, stored as a list of bits, and is incremented n times. Each increment flips the trailing 1s to 0 and then one 0 to 1, and every bit that changes counts as one flip. Return the tuple (total_flips, flips_in_the_costliest_increment). counter_flips(0) is (0, 0); counter_flips(3) is (4, 2) because the three increments flip 1, 2 and 1 bits; counter_flips(8) is (15, 4) because the 8th increment turns 0111 into 1000. A negative n raises ValueError. Simulate the counter bit by bit (this is the classic amortized-analysis example: one increment can flip many bits, yet the total stays below 2n) and keep it fast enough for n = 200,000.",
        hint: "Keep bits as a list with the least significant bit first. For each increment, walk from index 0 while the bit is 1, setting it to 0 and counting a flip; then set the first 0 (appending a new bit when you run off the end) to 1 and count one more flip. Track the running total and the maximum.",
        starter: py`
def counter_flips(n):
    """Return (total bit flips, flips in the costliest single increment) for n increments."""
    # TODO: simulate the counter and count every bit that changes
    raise NotImplementedError
`,
        solution: py`
def counter_flips(n):
    """Return (total bit flips, flips in the costliest single increment) for n increments."""
    if n < 0:
        raise ValueError(f"n must be non-negative, got {n}")
    bits = []  # bits[0] is the least significant bit
    total = worst = 0
    for _ in range(n):
        flips = 0
        i = 0
        while i < len(bits) and bits[i] == 1:  # the carry turns trailing 1s into 0s
            bits[i] = 0
            flips += 1
            i += 1
        if i == len(bits):
            bits.append(1)
        else:
            bits[i] = 1
        flips += 1
        total += flips
        worst = max(worst, flips)
    return total, worst
`,
        tests: py`
@check("total flips for 1 to 8 increments")
def _():
    eq([counter_flips(k)[0] for k in range(1, 9)], [1, 3, 4, 7, 8, 10, 11, 15])

@check("reports the costliest single increment")
def _():
    eq(counter_flips(3), (4, 2))
    eq(counter_flips(7)[1], 3)
    eq(counter_flips(8), (15, 4))
    eq(counter_flips(16)[1], 5)

@check("zero increments cost nothing and a negative count is an error")
def _():
    eq(counter_flips(0), (0, 0))
    raises(ValueError, counter_flips, -1)

@check("the amortized cost stays below 2 flips per increment")
def _():
    for k in (1, 5, 50, 500, 5000):
        total, _ = counter_flips(k)
        eq(total < 2 * k, True)

@check("200,000 increments: total = 2n - popcount(n), worst = bit length of n")
def _():
    n = 200_000
    total, worst = counter_flips(n)
    eq(total, 2 * n - bin(n).count("1"))
    eq(worst, n.bit_length())
`
      },
      practice: ["Bit Manipulation", "Arrays & Hashing"],
      source: "https://wiki.python.org/moin/TimeComplexity"
    }
  ],
};
