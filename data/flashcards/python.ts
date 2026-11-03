import type { Flashcard } from "../cs_fundamentals";

// "Python Foundations" cards: roughly two per lesson in data/python-course.ts.
// Ids are fc-py-<lesson-id>-<n> and must stay stable (saved review state is keyed by id).
type CardSpec = Omit<Flashcard, "category">;

const cards: CardSpec[] = [
  // ── Python essentials ────────────────────────────────────────────────
  {
    id: "fc-py-values-1",
    difficulty: "Easy",
    question: "What does `0.1 + 0.2 == 0.3` evaluate to in Python, why, and how should you compare floats or represent money?",
    answer: "False — the sum is 0.30000000000000004. Floats are IEEE-754 binary doubles and 0.1 has no exact binary representation. Compare with `math.isclose(a, b, rel_tol=..., abs_tol=...)`; for exact decimal arithmetic use `decimal.Decimal`, for exact ratios `fractions.Fraction`, or store money as integer cents.",
    explanation: "Python ints have arbitrary precision (no overflow), so integer arithmetic is exact; only floats approximate. `abs_tol` matters when comparing against 0, where a relative tolerance alone never succeeds.",
  },
  {
    id: "fc-py-values-2",
    difficulty: "Easy",
    question: "`==` vs `is`: what does each compare, and when is `is` the right choice?",
    answer: "`==` calls `__eq__` (value equality, overridable). `is` compares identity — the same object in memory (same `id()`). Use `is` only for singletons and sentinels: `x is None`, `x is not None`, `value is MISSING`.",
    explanation: "`x == None` can be hijacked by a custom `__eq__` (NumPy returns an array); `is None` cannot. `a is b` may be True for small ints or interned strings purely as a CPython caching detail — never rely on it for values (Python 3.8+ emits a SyntaxWarning for `is` with a literal).",
  },
  {
    id: "fc-py-control-flow-1",
    difficulty: "Easy",
    question: "Which values are falsy in Python, and what bug does `if not x:` introduce when 0 or \"\" are valid inputs?",
    answer: "Falsy: None, False, 0, 0.0, 0j, empty str/bytes/list/tuple/dict/set/range, and objects whose `__bool__` returns False or `__len__` returns 0. `if not x:` treats a legitimate 0 or \"\" exactly like a missing value; when 0 is valid, test `if x is None:`.",
    explanation: "Truthiness calls `__bool__`, falls back to `__len__`, otherwise the object is truthy. A string containing a space (\" \") is truthy. Classic interview bug: `if not index:` failing for index 0.",
  },
  {
    id: "fc-py-control-flow-2",
    difficulty: "Medium",
    question: "When does the `else` clause of a `for` (or `while`) loop run?",
    answer: "Only when the loop finishes without executing `break` — including when it runs zero iterations. It is the idiomatic 'search failed' branch, replacing a found-flag variable.",
    explanation: "Read it as 'no break'. `return` or an exception also skips it. `range(n)` stops before n, so loops over `range(len(xs))` never index out of bounds.",
    codeSnippet: `for x in items:
    if is_match(x):
        found = x
        break
else:              # no break happened
    found = None`,
  },
  {
    id: "fc-py-functions-1",
    difficulty: "Medium",
    question: "What is wrong with `def add(item, bucket=[]): bucket.append(item); return bucket`?",
    answer: "Default values are evaluated once, at `def` time, and stored on the function (`add.__defaults__`). Every call that omits `bucket` shares and mutates the same list, so items accumulate across calls. Use `bucket=None` and create the list inside: `if bucket is None: bucket = []`.",
    explanation: "Same trap for dict/set defaults and for `datetime.now()` as a default (frozen at import time). Immutable defaults (None, ints, tuples, strings) are safe.",
  },
  {
    id: "fc-py-functions-2",
    difficulty: "Medium",
    question: "Why does `count = 0` followed by `def inc(): count += 1` raise UnboundLocalError when `inc()` is called?",
    answer: "Any assignment to a name inside a function makes it local for the whole function body (decided at compile time). `count += 1` reads the local `count` before it has been bound. Fix by passing and returning values, or declare `global count` / `nonlocal count` (enclosing function scope).",
    explanation: "Name lookup is LEGB: Local, Enclosing, Global, Builtins. Mutating an object (`items.append(x)`) is not rebinding, so it needs no declaration. Arguments are passed by object reference ('call by sharing'): mutating an argument affects the caller; rebinding it does not.",
  },
  {
    id: "fc-py-comprehensions-1",
    difficulty: "Easy",
    question: "List comprehension vs generator expression: how do memory use and reuse differ?",
    answer: "`[f(x) for x in xs]` builds the whole list eagerly — O(n) memory, can be indexed, measured with len(), and iterated many times. `(f(x) for x in xs)` is lazy — O(1) extra memory, single-pass, values computed on demand.",
    explanation: "Feed generator expressions straight into consumers: `sum(x * x for x in xs)`, `any(...)`, `max(...)`. `any`/`all` short-circuit, so a generator avoids computing the remaining items. Errors and side effects are deferred until iteration.",
  },
  {
    id: "fc-py-comprehensions-2",
    difficulty: "Easy",
    question: "What does `zip` do with iterables of different lengths, and how do you make a mismatch an error?",
    answer: "It stops silently at the shortest iterable. Use `zip(a, b, strict=True)` (3.10+) to raise ValueError on a length mismatch, or `itertools.zip_longest(a, b, fillvalue=...)` to pad.",
    explanation: "Silent truncation hides data bugs. Related unpacking idioms: `first, *rest = items`, `a, b = b, a` (swap), and `zip(*matrix)` to transpose rows into columns.",
  },

  // ── Collections & the Python toolkit ─────────────────────────────────
  {
    id: "fc-py-strings-1",
    difficulty: "Medium",
    question: "Why can `s += piece` inside a loop be O(n²), and what is the idiomatic fix?",
    answer: "str is immutable, so each concatenation may allocate a new string and copy everything built so far — quadratic total work for many pieces. Append pieces to a list and call `''.join(parts)` once: O(total length).",
    explanation: "CPython has an in-place resize optimisation when the string's refcount is 1, but it is an implementation detail (absent in PyPy, defeated by another reference). Interviewers expect join; io.StringIO is the alternative for streaming writes.",
  },
  {
    id: "fc-py-strings-2",
    difficulty: "Medium",
    question: "str vs bytes: where do you encode/decode, and what does `len()` of a str count?",
    answer: "str is a sequence of Unicode code points; bytes is raw binary. Decode bytes → str at input boundaries (`data.decode('utf-8')`) and encode str → bytes at output (`text.encode('utf-8')`). `len(str)` counts code points — not bytes and not user-perceived characters: 'é' can be 1 or 2 code points, and '👍🏽' has length 2.",
    explanation: "Mixing str and bytes raises TypeError in Python 3. Normalise with `unicodedata.normalize('NFC', s)` before comparing, and use `casefold()` rather than `lower()` for case-insensitive matching ('ß'.casefold() == 'ss').",
  },
  {
    id: "fc-py-lists-1",
    difficulty: "Easy",
    question: "Give the time complexity of these list operations: append, pop(), pop(0), insert(0, x), `x in lst`, `lst[i]`, `lst[a:b]`, sort().",
    answer: "append: amortized O(1). pop(): O(1). pop(0) / insert(0, x): O(n) — every element shifts. `x in lst`: O(n). Indexing: O(1). Slice of k items: O(k) copy. sort(): O(n log n).",
    explanation: "A list is a dynamic array of object pointers with spare capacity. Using it as a FIFO queue (pop(0)) silently turns BFS into O(V²); use collections.deque.",
  },
  {
    id: "fc-py-lists-2",
    difficulty: "Easy",
    question: "`grid = [[0] * 3] * 3; grid[0][0] = 1` — what is `grid` now, and how do you build the grid correctly?",
    answer: "[[1, 0, 0], [1, 0, 0], [1, 0, 0]] — the outer `* 3` repeats a reference to the same inner list three times. Build independent rows: `[[0] * 3 for _ in range(3)]`.",
    explanation: "Sequence repetition copies references (shallow). `[0] * 3` is fine because ints are immutable. This is the most common bug when initialising a 2D DP table.",
  },
  {
    id: "fc-py-maps-sets-1",
    difficulty: "Medium",
    question: "Why must dict keys and set members be hashable, and why is `(1, [2])` not a valid key?",
    answer: "dict/set find an entry by `hash(key)` and then confirm with `==`. If a key's hash could change after insertion, the entry would sit in the wrong slot and become unfindable. Mutable built-ins (list, dict, set) are unhashable; a tuple is hashable only if every element is, so `(1, [2])` raises TypeError.",
    explanation: "Convert to hashable forms for keys: `tuple(lst)`, `frozenset(s)`, or a canonical string. The required contract is: `a == b` implies `hash(a) == hash(b)`.",
  },
  {
    id: "fc-py-maps-sets-2",
    difficulty: "Easy",
    question: "Average vs worst-case cost of dict/set operations — and are they ordered?",
    answer: "Average O(1) for lookup, insert and delete; worst case O(n) under heavy collisions (adversarial keys or a poor `__hash__`). dicts preserve insertion order (a language guarantee since 3.7); sets make no ordering promise.",
    explanation: "str/bytes hashes are randomised per process (PYTHONHASHSEED) to blunt collision attacks. Updating an existing key keeps its position; deleting and re-inserting moves it to the end. For ordered de-duplication use `list(dict.fromkeys(items))`.",
  },
  {
    id: "fc-py-collections-toolkit-1",
    difficulty: "Medium",
    question: "Counter vs defaultdict(int): what does each add, and what is the defaultdict gotcha?",
    answer: "Counter adds `most_common(k)`, multiset arithmetic (+, -, &, |) and reads missing keys as 0 without inserting them. defaultdict calls its factory and INSERTS a new entry on any `d[k]` access to a missing key — even a read — so lookups can grow the dict and change `k in d` results.",
    explanation: "Check presence with `in` or `.get(k)` on a defaultdict to avoid phantom keys. `Counter.most_common(k)` uses a heap: O(n log k).",
  },
  {
    id: "fc-py-collections-toolkit-2",
    difficulty: "Easy",
    question: "Why use `collections.deque` instead of a list as a BFS queue?",
    answer: "`deque.popleft()` and `appendleft()` are O(1); `list.pop(0)` is O(n) because every remaining element shifts left. With a deque, BFS stays O(V + E).",
    explanation: "A deque is a doubly linked list of fixed-size blocks, so random access in the middle is O(n). `deque(maxlen=k)` gives a bounded buffer that discards from the opposite end — handy for 'last k events'.",
  },
  {
    id: "fc-py-sorting-1",
    difficulty: "Easy",
    question: "`sorted()` vs `list.sort()` — and why does `x = lst.sort()` leave x as None?",
    answer: "`sorted(iterable)` returns a new list and accepts any iterable; `list.sort()` sorts in place and returns None (in-place mutators return None by convention). Both use Timsort: stable, O(n log n) worst case, close to O(n) on already-ordered runs, up to O(n) extra memory.",
    explanation: "Stability means equal keys keep their original relative order, which is what makes multi-pass sorting (secondary key first, primary key second) correct.",
  },
  {
    id: "fc-py-sorting-2",
    difficulty: "Medium",
    question: "How do you sort by score descending and then name ascending?",
    answer: "Use a tuple key, negating the numeric field: `sorted(rows, key=lambda r: (-r.score, r.name))`. For fields that cannot be negated (strings), do two stable sorts: first by the secondary key, then by the primary key with `reverse=True`.",
    explanation: "The key function runs once per element (decorate-sort-undecorate), cheaper than a comparator per comparison. Use `functools.cmp_to_key` only when the order genuinely needs pairwise comparison (e.g. 'largest number' concatenation order).",
  },
  {
    id: "fc-py-sorting-3",
    difficulty: "Medium",
    question: "`bisect_left` vs `bisect_right` on a sorted list — what do they return, and what does `insort` cost?",
    answer: "`bisect_left(a, x)` = first index where x could be inserted keeping order (before equal items) = count of elements < x. `bisect_right(a, x)` = index after equal items = count of elements ≤ x. Both are O(log n). `insort` is O(n) because list insertion shifts elements.",
    explanation: "Occurrences of x = `bisect_right(a, x) - bisect_left(a, x)`. Python 3.10+ accepts `key=`. If you need many inserts with ordered queries, use a heap, a balanced structure (sortedcontainers), or a Fenwick tree instead.",
  },
  {
    id: "fc-py-heapq-1",
    difficulty: "Easy",
    question: "Costs of heapq operations, and how do you get max-heap behaviour?",
    answer: "heapify: O(n). heappush / heappop / heappushpop / heapreplace: O(log n). Peek `heap[0]`: O(1). heapq is a min-heap; for numeric priorities push `-priority`, or wrap items in a class with an inverted `__lt__`.",
    explanation: "A heap only guarantees `heap[i] <= heap[2i+1], heap[2i+2]` — it is not a sorted list. Python 3.14 added public max-heap helpers (`heapify_max`, `heappush_max`, `heappop_max`, ...), but negation remains the portable interview answer.",
  },
  {
    id: "fc-py-heapq-2",
    difficulty: "Medium",
    question: "Why push `(priority, count, item)` instead of `(priority, item)` onto a heap?",
    answer: "With equal priorities, tuple comparison falls through to `item`; if items are not comparable (dicts, custom objects) heappush raises TypeError. A monotonically increasing counter (`itertools.count()`) breaks ties first, so items are never compared and equal priorities pop in FIFO order.",
    explanation: "Top-k largest: keep a min-heap of size k and pop whenever it exceeds k — O(n log k) time, O(k) space; the root is the kth largest. `heapq.nlargest(k, xs)` implements the same idea.",
  },

  // ── Algorithm thinking ───────────────────────────────────────────────
  {
    id: "fc-py-big-o-1",
    difficulty: "Easy",
    question: "`for x in a: if x in b: ...` — what is the complexity when b is a list vs a set?",
    answer: "List: O(n·m), because each `in` scans b. Set: O(m) to build plus O(n) average lookups → O(n + m) average.",
    explanation: "Hidden linear costs inside loops are the most common complexity mistake in Python: `in` on a list, slicing, `list.pop(0)`, string `+=`, and sorting inside a loop. Always say what n and m are.",
  },
  {
    id: "fc-py-big-o-2",
    difficulty: "Medium",
    question: "Do recursion depth and slicing count toward space complexity?",
    answer: "Yes. Auxiliary space includes the call stack (O(h) for tree DFS, O(n) for a skewed tree) and every copy you create. Recursing on `arr[1:]` copies O(n) per call — O(n²) time and memory overall. Pass indices (lo, hi) instead of slices.",
    explanation: "State output space separately from auxiliary space ('O(1) extra, excluding the output array'). Hash-table bounds are average-case unless stated otherwise.",
  },
  {
    id: "fc-py-recursion-1",
    difficulty: "Medium",
    question: "What is Python's default recursion limit, what happens when you exceed it, and how do you handle deep recursion?",
    answer: "`sys.getrecursionlimit()` is 1000 by default; exceeding it raises RecursionError. CPython has no tail-call optimisation. Prefer converting to iteration with an explicit stack/queue; `sys.setrecursionlimit` is a last resort that risks overflowing the C stack.",
    explanation: "DFS over a 10^5-node path-shaped tree or a large grid will hit the limit. Interviewers like hearing 'I'd use an explicit stack here because depth can reach n'.",
  },
  {
    id: "fc-py-recursion-2",
    difficulty: "Easy",
    question: "What three things does every recursive function need, and how does memoisation change naive Fibonacci?",
    answer: "A base case, progress toward it on every call, and a clear contract for what each call returns. Naive fib is exponential (~O(φ^n)) because subproblems overlap; memoising with `@functools.cache` makes it O(n) time and O(n) space; bottom-up iteration is O(n) time and O(1) space.",
    explanation: "Trace a tiny input and write down each call's return value — that verifies the contract. Overlapping subproblems are the signal to cache or convert to DP.",
  },
  {
    id: "fc-py-iterators-generators-1",
    difficulty: "Medium",
    question: "`nums = map(int, line.split()); print(max(nums)); print(sum(nums))` prints the max and then 0. Why?",
    answer: "map returns an iterator, and iterators are single-pass: `max` consumed it, so `sum` sees nothing. A list is an iterable whose `__iter__` returns a fresh iterator each time; an iterator's `__iter__` returns itself. Materialise with `list(...)` if you need several passes.",
    explanation: "map, filter, zip, generators and file objects are all one-shot iterators. `itertools.tee` can split one, but it buffers values, so a list is usually simpler.",
  },
  {
    id: "fc-py-iterators-generators-2",
    difficulty: "Medium",
    question: "When does the body of a function containing `yield` run?",
    answer: "Calling it runs no body code — it returns a generator object. Execution starts at the first `next()`, runs to the next `yield`, and pauses with locals and position preserved; `return value` ends it by raising StopIteration(value).",
    explanation: "Laziness defers errors and side effects until iteration — e.g. argument validation inside a generator fires late. `yield from sub()` delegates to a sub-generator. Generator pipelines process large streams in O(1) memory.",
  },
  {
    id: "fc-py-patterns-1",
    difficulty: "Medium",
    question: "Which pattern fits each: (a) pair with target sum in an unsorted array, (b) the same in a sorted array with O(1) space, (c) longest substring under a constraint, (d) fewest moves in an unweighted grid?",
    answer: "(a) Hash map of complements, O(n). (b) Two pointers converging from both ends, O(n) time, O(1) space. (c) Variable-size sliding window with a frequency map, O(n). (d) BFS with a deque from the source(s), O(rows·cols).",
    explanation: "Name the signal that triggered the pattern out loud: 'sorted + pair' → two pointers; 'contiguous + longest/shortest' → window; 'minimum steps, unit cost' → BFS.",
  },
  {
    id: "fc-py-patterns-2",
    difficulty: "Easy",
    question: "Before calling a solution done, which edge cases should you check?",
    answer: "Empty input, a single element, all duplicates, zeros and negatives, minimum/maximum boundary values, already-sorted and reverse-sorted input, target absent, and for graphs disconnected components and cycles. Trace one small example by hand and restate time/space complexity.",
    explanation: "Clarify constraints first (can the input be mutated? are values bounded?). Starting with a correct brute force and naming its bottleneck is better than jumping to an untested optimisation.",
  },

  // ── Writing dependable Python ────────────────────────────────────────
  {
    id: "fc-py-json-1",
    difficulty: "Medium",
    question: "What happens to int keys, tuples, and datetimes in a `json.dumps` → `json.loads` round trip?",
    answer: "Non-string keys are converted to strings (`{1: 'a'}` comes back as `{'1': 'a'}`). Tuples become JSON arrays and come back as lists. datetime, Decimal, set and bytes raise TypeError unless you pass `default=` (e.g. `default=str`) or a custom encoder.",
    explanation: "JSON round trips are lossy, so define an explicit serialisation format (ISO-8601 dates, base64 bytes). By default json also emits NaN/Infinity, which is not valid JSON; use `allow_nan=False` for strict output.",
  },
  {
    id: "fc-py-json-2",
    difficulty: "Easy",
    question: "Why is `json.loads` not validation?",
    answer: "It only checks syntax and returns arbitrary nested dicts/lists/strings/numbers/booleans/None. Missing fields, wrong types and unexpected extra fields all pass. Validate shape and constraints at the boundary (e.g. Pydantic `Model.model_validate_json(raw)`) before trusting the data.",
    explanation: "Python ints are unbounded, but a JavaScript consumer loses precision above 2^53 — another reason to define the schema explicitly.",
  },
  {
    id: "fc-py-exceptions-1",
    difficulty: "Medium",
    question: "In try / except / else / finally, exactly when does each block run?",
    answer: "`try` runs first. `except` runs only if a matching exception was raised. `else` runs only if `try` completed without an exception (and without return/break). `finally` always runs — on success, on exception, and on return/break/continue.",
    explanation: "Put follow-up code in `else` so its own exceptions are not accidentally caught by the `except`. Never `return` from `finally`: it overrides the earlier return and silently swallows in-flight exceptions (Python 3.14 warns about this, PEP 765).",
  },
  {
    id: "fc-py-exceptions-2",
    difficulty: "Medium",
    question: "Why is `except Exception: pass` dangerous, and what does `raise NewError(...) from err` do?",
    answer: "It hides real bugs (typos, None errors) and leaves state half-updated while reporting success; catch the narrowest exception you can actually handle. A bare `except:` is worse — it also catches KeyboardInterrupt and SystemExit. `raise X from err` sets `__cause__`, so the traceback shows the original root cause; `from None` hides the context.",
    explanation: "Translate low-level errors into domain errors at boundaries while preserving the chain. Inside a handler, `logger.exception(...)` records the traceback.",
  },
  {
    id: "fc-py-context-managers-1",
    difficulty: "Medium",
    question: "What does a `with` statement guarantee, and how do you write a context manager quickly?",
    answer: "It calls `__enter__` (its return value is bound by `as`) and guarantees `__exit__(exc_type, exc, tb)` runs however the block exits — normally, by exception, or by return. If `__exit__` returns a truthy value, the exception is suppressed. `contextlib.contextmanager` turns a generator into one: code before `yield` is enter, code in `finally` after it is exit.",
    explanation: "This gives deterministic cleanup for files, locks, transactions and temporary state, instead of relying on garbage collection.",
    codeSnippet: `from contextlib import contextmanager
import time

@contextmanager
def timed(label):
    start = time.perf_counter()
    try:
        yield
    finally:
        print(label, time.perf_counter() - start)`,
  },
  {
    id: "fc-py-context-managers-2",
    difficulty: "Easy",
    question: "Why pass `encoding='utf-8'` explicitly when opening text files?",
    answer: "Without it, `open()` uses the locale's preferred encoding (often cp1252 on Windows), so the same code can raise UnicodeDecodeError or produce mojibake on another machine. Write `open(path, encoding='utf-8')` or `Path(path).read_text(encoding='utf-8')`.",
    explanation: "PEP 686 makes UTF-8 mode the default in Python 3.15; until then `-X warn_default_encoding` flags the risky calls. Use pathlib for portable paths and never assume the current working directory.",
  },
  {
    id: "fc-py-classes-dataclasses-1",
    difficulty: "Medium",
    question: "Why does a dataclass field `items: list = []` raise ValueError, and what is the fix?",
    answer: "dataclasses reject unhashable defaults such as list/dict/set because the single default object would be shared by every instance (the mutable-default-argument bug). Use `items: list[str] = field(default_factory=list)` so each instance gets a fresh list.",
    explanation: "The generated `__init__` uses the default directly, which is why the check exists. Pydantic and attrs use the same `default_factory` idea.",
  },
  {
    id: "fc-py-classes-dataclasses-2",
    difficulty: "Medium",
    question: "What do `frozen=True`, `order=True` and `slots=True` do on a dataclass — and does it validate field types?",
    answer: "frozen=True blocks attribute assignment (FrozenInstanceError) and, with eq=True, generates `__hash__`, so instances can be dict keys. order=True generates <, <=, >, >= comparing fields as tuples in definition order. slots=True (3.10+) generates `__slots__` for lower memory use. Types are NOT validated: `Point(x='oops')` is accepted.",
    explanation: "Annotations only drive code generation. Validate untrusted input with Pydantic, or with explicit checks in `__post_init__`.",
  },
  {
    id: "fc-py-typing-1",
    difficulty: "Easy",
    question: "Are type hints enforced at runtime?",
    answer: "No. CPython records annotations but never checks them — `def f(x: int)` happily accepts 'a'. They serve static checkers (mypy, pyright), IDEs, and libraries that choose to read them at runtime (Pydantic, FastAPI, dataclasses).",
    explanation: "Python 3.14 evaluates annotations lazily (PEP 649/749), which removes most forward-reference quoting. Accept abstract types (Iterable[T], Sequence[T], Mapping[K, V]) when a function only needs that behaviour.",
  },
  {
    id: "fc-py-typing-2",
    difficulty: "Medium",
    question: "Protocol vs ABC: what is structural typing?",
    answer: "A `typing.Protocol` declares required methods/attributes; any class that has them satisfies it for a type checker — no inheritance needed (static duck typing). An `abc.ABC` is nominal: classes must subclass it (or be registered), and abstract methods block instantiation at runtime.",
    explanation: "`@runtime_checkable` enables isinstance() against a Protocol, but it only checks that the members exist, not their signatures. Protocols keep dependency injection loose: a test fake satisfies the interface without importing the real base class.",
  },
  {
    id: "fc-py-testing-1",
    difficulty: "Easy",
    question: "Why shouldn't `assert` be used to validate user input?",
    answer: "Assertions are removed when Python runs with `-O` (`__debug__` is False), so the check disappears in optimised deployments. Raise explicit exceptions (ValueError, TypeError) for input validation; keep `assert` for tests and internal invariants.",
    explanation: "Another trap: `assert (cond, 'msg')` asserts a non-empty tuple, which is always truthy (Python warns about it). Write `assert cond, 'msg'`.",
  },
  {
    id: "fc-py-testing-2",
    difficulty: "Medium",
    question: "What makes a good unit test, and what should you mock?",
    answer: "Arrange–act–assert on one behaviour through the public interface; deterministic; covers edge cases (empty, one, duplicates, negatives, boundaries) and failure paths (`pytest.raises`). Mock only slow or nondeterministic boundaries — network, clock, randomness, filesystem — and keep a few real integration tests.",
    explanation: "Over-mocking tests the implementation instead of the behaviour. With unittest.mock, patch the name where it is looked up (`mock.patch('mymodule.requests.get')`), not where it is defined.",
  },
  {
    id: "fc-py-environments-1",
    difficulty: "Medium",
    question: "What does `if __name__ == '__main__':` do, and why is it essential with multiprocessing on Windows and macOS?",
    answer: "Code under the guard runs only when the file is executed as a script, not when it is imported (then `__name__` is the module name). The spawn start method (default on Windows and macOS) starts children by importing the main module; without the guard each child re-runs the pool setup, causing recursive spawning or a RuntimeError.",
    explanation: "Keep imports free of side effects (no network calls or heavy work at module top level) — importing should only define things.",
  },
  {
    id: "fc-py-environments-2",
    difficulty: "Easy",
    question: "Why use a virtual environment, and how do you make installs reproducible?",
    answer: "A venv gives each project its own interpreter and site-packages, so dependency versions don't collide across projects or with system Python. For reproducibility, pin versions in a lock file (uv/pip-tools/poetry or `==` requirements), install with `python -m pip` so the right interpreter is used, and run tests in a clean environment.",
    explanation: "On Windows activate with `.venv\\Scripts\\Activate.ps1`. Never commit secrets — read configuration from environment variables or a secret manager.",
  },

  // ── Pydantic & data validation ──────────────────────────────────────
  {
    id: "fc-py-pydantic-models-1",
    difficulty: "Medium",
    question: "Pydantic v2: given `id: int`, what does `User.model_validate({'id': '42'})` do, and how do you serialise back out?",
    answer: "In the default lax mode it coerces '42' to 42. Invalid data raises ValidationError, which lists every failing field with its location, type and message (`err.errors()`). `model_dump()` returns a dict, `model_dump_json()` returns JSON text, and `model_validate_json(raw)` parses and validates in one step.",
    explanation: "v1 names (`parse_obj`, `.dict()`, `.json()`) are deprecated in v2. `model_validate_json` is faster than `json.loads` + `model_validate` because the Rust core (pydantic-core) parses directly.",
  },
  {
    id: "fc-py-pydantic-models-2",
    difficulty: "Medium",
    question: "When do you use a dataclass and when a Pydantic BaseModel?",
    answer: "dataclass: trusted internal data — no runtime validation, minimal overhead. BaseModel: untrusted boundary data (HTTP bodies, config files, queue messages, LLM output) — validation/coercion, constraints, nested models, serialisation and JSON Schema. Validate once at the boundary, then pass typed objects inward.",
    explanation: "`pydantic.dataclasses.dataclass` adds validation with dataclass syntax, and `TypeAdapter(list[int])` validates types that are not models.",
  },
  {
    id: "fc-py-pydantic-fields-1",
    difficulty: "Medium",
    question: "In Pydantic v2, does `x: Optional[int]` make the field optional to provide?",
    answer: "No. `Optional[int]` (`int | None`) only allows None as a value; without a default the field is still required. To make it optional to pass, give it a default: `x: int | None = None`.",
    explanation: "Pydantic v1 implicitly defaulted Optional fields to None; v2 removed that, which is a common migration bug. 'Required' depends on having a default, not on the type.",
  },
  {
    id: "fc-py-pydantic-fields-2",
    difficulty: "Medium",
    question: "What do `ConfigDict(strict=True)` and `extra='forbid'` change, and where do `Field` constraints fit?",
    answer: "strict=True disables lax coercions (the str '42' is no longer accepted for an int). extra='forbid' rejects unknown fields; the default 'ignore' silently drops them and 'allow' keeps them. `Field(ge=1, le=5, min_length=..., pattern=...)` adds value constraints; `default_factory` creates fresh mutable defaults.",
    explanation: "Strict mode differs for JSON input: types with no native JSON form (datetime, UUID) are still parsed from strings. Forbidding extras catches misspelt config keys that would otherwise be ignored silently.",
  },
  {
    id: "fc-py-pydantic-validators-1",
    difficulty: "Hard",
    question: "field_validator vs model_validator: when does each run, and what must they return?",
    answer: "`@field_validator('f')` (a classmethod) validates one field: mode='after' (the default) receives the parsed, typed value; mode='before' receives raw input (e.g. to split 'a,b' into a list). It must return the value to keep. `@model_validator(mode='after')` receives the built model for cross-field rules and must return self. Raise ValueError to report an error.",
    explanation: "Pydantic wraps ValueError and AssertionError raised in validators into ValidationError; other exception types such as TypeError propagate unchanged. Keep validators pure — no I/O or side effects.",
    codeSnippet: `from pydantic import BaseModel, field_validator, model_validator

class Window(BaseModel):
    start: int
    end: int

    @field_validator("start", "end")
    @classmethod
    def non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("must be >= 0")
        return v

    @model_validator(mode="after")
    def ordered(self):
        if self.start >= self.end:
            raise ValueError("start must be < end")
        return self`,
  },
  {
    id: "fc-py-pydantic-validators-2",
    difficulty: "Medium",
    question: "A field validator runs but the field ends up None. What is the most likely bug, and how are nested model errors reported?",
    answer: "The validator forgot to `return` the value — returning None replaces the field. For nested models, validation errors carry a location path such as `('items', 2, 'price')`, so the caller can see exactly which nested element failed.",
    explanation: "Nesting BaseModels validates the whole tree in one call and collects all errors instead of stopping at the first one, which is what API clients need for useful 422 responses.",
  },

  // ── Concurrency & parallel processing ───────────────────────────────
  {
    id: "fc-py-concurrency-models-1",
    difficulty: "Medium",
    question: "Concurrency vs parallelism — and which Python tool fits I/O-bound vs CPU-bound work?",
    answer: "Concurrency means several tasks make progress in overlapping time (interleaving); parallelism means they execute at the same instant on multiple cores. I/O-bound: asyncio (many sockets, one thread) or threads (blocking libraries). CPU-bound pure Python on a GIL build: processes (ProcessPoolExecutor), native code that releases the GIL (NumPy), or a free-threaded 3.13+/3.14 build.",
    explanation: "Identify the bottleneck first and measure. Threads help I/O because the GIL is released while a thread waits on a syscall.",
  },
  {
    id: "fc-py-concurrency-models-2",
    difficulty: "Medium",
    question: "Does the GIL make `counter += 1` thread-safe?",
    answer: "No. `+=` compiles to several bytecodes (load, add, store), and a thread switch between them loses updates. The GIL protects interpreter internals (reference counts, object memory), not your application's invariants. Use a `threading.Lock`, or avoid shared state with queues or per-thread results.",
    explanation: "Some single operations (e.g. list.append) happen to be atomic in CPython, but that is an implementation detail — and free-threaded builds make relying on it even riskier.",
    codeSnippet: `import threading
lock = threading.Lock()
counter = 0

def work():
    global counter
    for _ in range(100_000):
        with lock:          # read-modify-write as one critical section
            counter += 1`,
  },
  {
    id: "fc-py-thread-basics-1",
    difficulty: "Medium",
    question: "What happens to an exception raised inside a `threading.Thread` target?",
    answer: "It does not propagate to the thread that calls `join()`. It is reported through `threading.excepthook` (printed by default), the worker thread ends, and `join()` returns normally. Capture errors yourself, or use ThreadPoolExecutor, where `future.result()` re-raises the worker's exception.",
    explanation: "Daemon threads are killed abruptly at interpreter exit (no cleanup); non-daemon threads keep the process alive until they finish.",
  },
  {
    id: "fc-py-thread-basics-2",
    difficulty: "Easy",
    question: "`thread.start()` vs `thread.run()`, and what does `join()` do?",
    answer: "`start()` creates a new OS thread that calls `run()` (which calls the target). Calling `run()` directly executes the target in the current thread — no concurrency. `join(timeout)` blocks until the thread finishes or the timeout passes; check `is_alive()` afterwards when using a timeout.",
    explanation: "CPython threads are real OS threads, and scheduling order is nondeterministic — never depend on print or completion order.",
  },
  {
    id: "fc-py-thread-locks-1",
    difficulty: "Hard",
    question: "How do deadlocks happen with locks, and how do you prevent them?",
    answer: "Circular wait: thread A holds L1 and waits for L2 while thread B holds L2 and waits for L1. Prevent it by acquiring locks in one global order, holding one lock at a time where possible, keeping critical sections short, not calling unknown code (callbacks, I/O) while holding a lock, and using `acquire(timeout=...)` for detection. Re-acquiring a plain Lock in the same thread self-deadlocks — use RLock if re-entrancy is required.",
    explanation: "Deadlock needs all four Coffman conditions: mutual exclusion, hold-and-wait, no preemption, and circular wait. A consistent lock order removes circular wait.",
  },
  {
    id: "fc-py-thread-locks-2",
    difficulty: "Medium",
    question: "Why write `with lock:` rather than `lock.acquire()` ... `lock.release()`, and what is a check-then-act race?",
    answer: "`with` releases the lock even when the critical section raises; a bare acquire without try/finally leaks the lock and deadlocks every later caller. Check-then-act: `if key not in cache: cache[key] = load()` — two threads can both pass the check; the check and the write must sit in the same critical section.",
    explanation: "Lock the invariant, not individual operations: every read and write that must be consistent together belongs in one `with lock:` block.",
  },
  {
    id: "fc-py-thread-pools-1",
    difficulty: "Medium",
    question: "How do you run many I/O calls with ThreadPoolExecutor and handle per-task failures?",
    answer: "`submit()` returns a Future; `future.result()` blocks and re-raises the worker's exception. `as_completed(futures)` yields futures in completion order; `pool.map()` returns results in input order and raises the first exception when you reach it. The `with` block calls `shutdown(wait=True)`.",
    explanation: "Bound max_workers by the downstream service's limits, not CPU count. Map each future back to its input so failures can be reported or retried.",
    codeSnippet: `from concurrent.futures import ThreadPoolExecutor, as_completed

with ThreadPoolExecutor(max_workers=8) as pool:
    futures = {pool.submit(fetch, url): url for url in urls}
    for fut in as_completed(futures):
        url = futures[fut]
        try:
            data = fut.result()
        except Exception as exc:
            log.warning("fetch %s failed: %s", url, exc)`,
  },
  {
    id: "fc-py-thread-pools-2",
    difficulty: "Hard",
    question: "If `future.result(timeout=5)` times out, is the task stopped? What other pool hazard should you know about?",
    answer: "No. The caller gets TimeoutError but the worker keeps running — Python threads cannot be killed, and `future.cancel()` only works if the task has not started. Enforce timeouts inside the task (socket/HTTP timeouts). Second hazard: a task that waits on another future from the same bounded pool can deadlock once every worker is busy waiting (pool starvation).",
    explanation: "Since 3.11 `concurrent.futures.TimeoutError` is an alias of the built-in TimeoutError. Shutdown also waits for running tasks, so a hung task blocks program exit.",
  },
  {
    id: "fc-py-queues-1",
    difficulty: "Medium",
    question: "How does `queue.Queue(maxsize=N)` give you backpressure?",
    answer: "When N items are waiting, `put()` blocks, so fast producers slow down to the consumers' pace instead of buffering without limit. maxsize=0 means unbounded. `put(timeout=...)` or `put_nowait()` raise `queue.Full`, letting you shed load or report overload.",
    explanation: "Unbounded queues hide overload until memory runs out. asyncio.Queue(maxsize) behaves the same way with `await queue.put(...)`.",
  },
  {
    id: "fc-py-queues-2",
    difficulty: "Medium",
    question: "How do you shut down consumer threads cleanly and wait for all queued work?",
    answer: "Each consumer calls `task_done()` once per `get()` — in a finally block so failures count too. `queue.join()` blocks until every item is marked done. Then send one sentinel (e.g. None) per worker (or call `Queue.shutdown()` on 3.13+) and `join()` the worker threads.",
    explanation: "A missing task_done makes `queue.join()` hang forever; a missing sentinel leaves workers blocked in `get()` and the process unable to exit.",
    codeSnippet: `def worker(q):
    while (item := q.get()) is not None:
        try:
            handle(item)
        finally:
            q.task_done()
    q.task_done()  # account for the sentinel`,
  },
  {
    id: "fc-py-multiprocessing-1",
    difficulty: "Medium",
    question: "Why must ProcessPoolExecutor worker functions be defined at module top level?",
    answer: "Tasks and results are pickled to cross process boundaries, and pickle serialises functions by importable qualified name. Lambdas, nested functions and locally defined classes cannot be pickled. Under spawn, the child imports your module to locate the function.",
    explanation: "Arguments and return values are pickled too, so large payloads cost serialisation time and memory on every call; pass file paths or use `multiprocessing.shared_memory` for big data.",
  },
  {
    id: "fc-py-multiprocessing-2",
    difficulty: "Medium",
    question: "When does multiprocessing make CPU-bound work slower, and can workers update the parent's globals?",
    answer: "When tasks are small relative to the overhead: process start-up (spawn re-imports modules), pickling arguments and results, and IPC. Batch work (`chunksize` in map) and measure. Workers each have their own memory, so changes to globals are never seen by the parent — return results or use explicit IPC (Queue, Pipe, Manager).",
    explanation: "Default start methods: spawn on Windows/macOS; on Linux, Python 3.14 switched the default from fork to forkserver. Mixing fork with threads can deadlock children that inherit held locks.",
  },
  {
    id: "fc-py-asyncio-1",
    difficulty: "Medium",
    question: "What happens if a coroutine calls `time.sleep(1)` or `requests.get(...)`?",
    answer: "It blocks the event loop thread: no other task runs during that time, so latency rises for every concurrent request. Use `await asyncio.sleep`, async libraries (httpx, aiohttp, asyncpg), or offload blocking calls with `await asyncio.to_thread(fn, *args)`.",
    explanation: "asyncio is cooperative — tasks switch only at `await` points. Debug mode (`PYTHONASYNCIODEBUG=1`) logs callbacks that hold the loop too long. CPU-heavy work belongs in a process pool via `loop.run_in_executor`.",
  },
  {
    id: "fc-py-asyncio-2",
    difficulty: "Hard",
    question: "`asyncio.gather` vs `asyncio.TaskGroup`: how do they differ on failure and cancellation?",
    answer: "gather returns results in input order; on the first exception it propagates that error but the other tasks keep running (not cancelled), unless `return_exceptions=True` collects errors as results. TaskGroup (3.11+) is structured concurrency: if any task fails, the remaining tasks are cancelled and all errors are raised together as an ExceptionGroup (handle with `except*`).",
    explanation: "Calling a coroutine function only creates a coroutine object — it runs once awaited or wrapped in a task. Keep references to `create_task` results (the loop holds only weak references), use `asyncio.timeout()` for deadlines, and re-raise CancelledError after cleanup instead of swallowing it.",
  },
  {
    id: "fc-py-concurrency-design-1",
    difficulty: "Hard",
    question: "Design: call an external API for 10,000 items with at most 50 requests in flight. What goes into the solution?",
    answer: "asyncio with an `asyncio.Semaphore(50)` (or 50 workers draining a bounded queue), a per-request timeout, retries only for retryable failures (timeouts, 429, 5xx) with exponential backoff plus jitter and a capped attempt count, idempotency keys for non-idempotent calls, and collecting failures rather than losing them.",
    explanation: "Launching 10,000 unbounded tasks overwhelms the dependency and your own memory. Report throughput, latency and error rate, and make shutdown and cancellation work.",
    codeSnippet: `sem = asyncio.Semaphore(50)

async def call(client, item):
    async with sem:
        for attempt in range(4):
            try:
                async with asyncio.timeout(10):
                    return await client.get(url_for(item))
            except (httpx.TransportError, TimeoutError):
                await asyncio.sleep(min(30, 2 ** attempt) + random.random())
        raise RuntimeError(f"gave up on {item}")`,
  },
  {
    id: "fc-py-concurrency-design-2",
    difficulty: "Medium",
    question: "Why should retries use exponential backoff with jitter, and why does idempotency matter?",
    answer: "Immediate, synchronised retries multiply load on a dependency that is already struggling (retry storm / thundering herd). Exponential backoff spreads retries over time, jitter de-synchronises clients, and caps/retry budgets bound the total work. Retrying a non-idempotent operation (e.g. a payment) can duplicate its side effect, so use idempotency keys or don't retry it.",
    explanation: "Combine with timeouts (so retries happen at all) and circuit breakers (so a dead dependency is not hammered).",
  },

  // ── Advanced Python patterns ─────────────────────────────────────────
  {
    id: "fc-py-mutability-copy-1",
    difficulty: "Medium",
    question: "For a list of lists `a`: what do `b = a`, `b = a[:]` (or `copy.copy(a)`), and `copy.deepcopy(a)` each share?",
    answer: "`b = a`: the same object. Shallow copy: a new outer list whose inner lists are shared, so `b[0].append(1)` also changes `a`. `deepcopy`: recursively copies nested objects (a memo dict handles cycles and shared references) — slower, and not meaningful for files, locks or sockets.",
    explanation: "Prefer immutable values or explicit ownership over defensive deep copies. Classes can customise copying with `__copy__` / `__deepcopy__`.",
  },
  {
    id: "fc-py-mutability-copy-2",
    difficulty: "Hard",
    question: "What does `t = ([1],); t[0] += [2]` do?",
    answer: "Both things: it raises TypeError ('tuple' object does not support item assignment) AND `t` becomes `([1, 2],)`. `+=` calls `list.__iadd__`, which extends the list in place and returns it; Python then tries to store the result back into `t[0]`, which fails.",
    explanation: "Tuple immutability is shallow: the tuple's slots cannot be rebound, but the objects in them can mutate. A tuple containing a list is also unhashable. Use `t[0].extend([2])` instead.",
  },
  {
    id: "fc-py-decorators-1",
    difficulty: "Medium",
    question: "Write a timing decorator that preserves the wrapped function's metadata. Why does `functools.wraps` matter?",
    answer: "The decorator takes a function and returns a wrapper that forwards `*args, **kwargs`. `@functools.wraps(func)` copies `__name__`, `__qualname__`, `__doc__`, `__module__` and sets `__wrapped__`; without it, logs, tracebacks and introspection all report 'wrapper'.",
    explanation: "Decorators run once at definition (import) time; the wrapper runs on each call. A decorator that takes arguments needs one more level of nesting (a factory returning the decorator).",
    codeSnippet: `import functools, time

def timed(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        try:
            return func(*args, **kwargs)
        finally:
            print(func.__name__, time.perf_counter() - start)
    return wrapper`,
  },
  {
    id: "fc-py-decorators-2",
    difficulty: "Medium",
    question: "`fns = [lambda: i for i in range(3)]; [f() for f in fns]` — what is the result and why?",
    answer: "[2, 2, 2]. Closures capture variables, not values; `i` is looked up when the lambda is called, after the loop has finished with i == 2. Fix by binding the value now: `lambda i=i: i` or `functools.partial`.",
    explanation: "Captured variables live in closure cells (`f.__closure__`). Rebinding an enclosing variable from an inner function requires `nonlocal`.",
  },
  {
    id: "fc-py-caching-1",
    difficulty: "Medium",
    question: "How does `functools.lru_cache` work, and what are its pitfalls?",
    answer: "It memoises results keyed by the call arguments, which must be hashable (a list argument raises TypeError). maxsize bounds entries with LRU eviction; `maxsize=None` (or `@cache`) is unbounded. `cache_info()` and `cache_clear()` inspect and reset it. Pitfalls: on methods it keys on `self` and keeps instances alive; results become stale if the function depends on external or mutable state; cached mutable return values are shared by every caller; unbounded caches grow forever.",
    explanation: "`f(1)` and `f(1.0)` share an entry unless `typed=True`. Use `functools.cached_property` for per-instance cached attributes.",
  },
  {
    id: "fc-py-caching-2",
    difficulty: "Medium",
    question: "Does adding `@cache` to a recursive DP fix RecursionError?",
    answer: "No. Memoisation removes repeated subproblems (exponential → polynomial time), but the first call still recurses to full depth — `dp(10_000)` on a chain still exceeds the default limit of 1000. Convert to bottom-up tabulation so dependencies are computed in order.",
    explanation: "A module-level cached helper also keeps state between test cases; define it inside the solution method or call `cache_clear()`.",
  },
  {
    id: "fc-py-debugging-observability-1",
    difficulty: "Easy",
    question: "How do you read a Python traceback efficiently?",
    answer: "Start at the bottom: the last line is the exception type and message, and the frame just above it is where it was raised. Frames run from outermost (top) to innermost. Find the deepest frame in your own code and inspect the values there. 'The above exception was the direct cause' means `raise ... from`; 'During handling ... another exception occurred' means a handler itself failed.",
    explanation: "Use `breakpoint()` or post-mortem debugging (`python -m pdb script.py`, `pdb.pm()`). Python 3.11+ underlines the exact failing sub-expression. Reproduce with the smallest failing input, then add a regression test.",
  },
  {
    id: "fc-py-debugging-observability-2",
    difficulty: "Medium",
    question: "Logs vs metrics vs traces — what is each for, and what must you never log?",
    answer: "Metrics: aggregated numbers (counters, latency histograms) for dashboards and alerts. Logs: individual events with context (request ID, operation, outcome) for diagnosis. Traces: one request's causal path across services as timed spans. Never log passwords, tokens, API keys or full sensitive payloads (PII).",
    explanation: "In Python, call `logger.exception(...)` inside an except block to include the traceback, and use lazy formatting (`log.info('user=%s', uid)`) so messages that are filtered out are never formatted.",
  },
];

export const PYTHON_FOUNDATIONS_FLASHCARDS: Flashcard[] = cards.map((card) => ({
  ...card,
  category: "Python Foundations",
}));
