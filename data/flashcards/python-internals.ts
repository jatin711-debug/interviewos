import type { Flashcard } from "../cs_fundamentals";

// "Python Internals" cards (CPython implementation details that come up in senior interviews).
// Ids are fc-pyi-<topic> and must stay stable (saved review state is keyed by id).
type CardSpec = Omit<Flashcard, "category">;

const cards: CardSpec[] = [
  {
    id: "fc-pyi-refcount",
    difficulty: "Medium",
    question: "How does CPython reclaim memory? Explain reference counting and why a cyclic garbage collector is also needed.",
    answer: "Every object carries a reference count (`ob_refcnt`). Binding, storing or passing a reference increments it; dropping one decrements it; at zero the object is deallocated immediately (deterministic — this is why files often close as soon as the last reference goes). Reference cycles (a ↔ b, a list containing itself, parent ↔ child) never reach zero, so a separate cyclic GC periodically finds and frees unreachable cycles.",
    explanation: "`sys.getrefcount(x)` reports one extra reference (its own argument). Refcount updates on every reference are why the GIL existed: non-atomic increments from two threads would corrupt counts. Deterministic cleanup is a CPython detail — use `with` blocks rather than relying on it.",
  },
  {
    id: "fc-pyi-cyclic-gc",
    difficulty: "Hard",
    question: "How does CPython's cyclic GC find garbage cycles, and which tools help you control it?",
    answer: "It only tracks container objects (lists, dicts, instances, ...). For a set of tracked objects it copies each refcount, subtracts references that come from inside the set, and whatever still has a positive count is reachable from outside; everything not reachable from those survivors is an unreachable cycle and is cleared. Collections are triggered by allocation thresholds and are generational (young objects are scanned most often; 3.14 made collection incremental with young/old generations).",
    explanation: "Since PEP 442 (3.4) cycles containing `__del__` methods are collected. Break cycles with `weakref` (parent pointers, caches via WeakValueDictionary). Services sometimes call `gc.freeze()` before forking workers so GC bookkeeping doesn't trigger copy-on-write of shared pages, or tune `gc.set_threshold`.",
  },
  {
    id: "fc-pyi-small-int-cache",
    difficulty: "Medium",
    question: "Why can `a = 256; b = 256; a is b` be True while the same test with 257 is False?",
    answer: "CPython pre-allocates the integers −5 to 256 as shared singletons, so every 256 is the same object. Larger ints are created on demand, so two separately computed 257s are usually distinct objects. But constants within one compiled code block may be shared, so `x = 257; y = 257` in a single function or script can still be identical.",
    explanation: "Object identity of immutable values is an implementation detail and varies by context (REPL vs file, version). Always compare values with `==`; reserve `is` for None and sentinels.",
  },
  {
    id: "fc-pyi-interning",
    difficulty: "Medium",
    question: "What is string interning in CPython, and when would you call `sys.intern` yourself?",
    answer: "Interning keeps one canonical object per string value so equality can short-circuit on identity. CPython automatically interns identifiers (variable, function and attribute names) and identifier-like string constants in code. Strings built at runtime (input, concatenation, parsing) are not interned automatically. `sys.intern(s)` interns explicitly — useful when millions of repeated strings (e.g. keys parsed from a large file) waste memory, or for very hot dict lookups.",
    explanation: "Attribute and global lookups are dict lookups keyed by interned names, so the comparison is usually a pointer check. Never use `is` to compare strings in application code.",
  },
  {
    id: "fc-pyi-dict-impl",
    difficulty: "Hard",
    question: "How is a CPython dict implemented, and why does it preserve insertion order?",
    answer: "Since 3.6 it is a 'compact dict': a sparse index table of small integers plus a dense entries array of (hash, key, value) appended in insertion order. Lookup hashes the key, probes the index table with open addressing (perturbed probing, not chaining), follows the index to the entry, and compares identity → hash → `==`. Iteration walks the dense array, which is why order is insertion order (a language guarantee since 3.7).",
    explanation: "Deletion leaves a dummy marker so probe chains stay intact; the table resizes when about 2/3 full, giving amortised O(1) inserts. The split index/entries layout uses noticeably less memory than the old design, and instance dicts of the same class can share their keys.",
  },
  {
    id: "fc-pyi-set-impl",
    difficulty: "Hard",
    question: "How does set differ from dict internally, and why is set iteration order unpredictable?",
    answer: "A set is a single open-addressed table of (key, hash) entries — no dense insertion-ordered array — probing a few adjacent slots linearly before perturbed jumps. Where an element lands depends on its hash and the current table size, so iteration order is arbitrary and can change after a resize.",
    explanation: "Small ints hash to themselves, so a set of small ints often looks sorted — a coincidence, not a guarantee. When you need ordered de-duplication, use `dict.fromkeys(items)`.",
  },
  {
    id: "fc-pyi-list-overallocation",
    difficulty: "Medium",
    question: "How does `list.append` achieve amortised O(1)?",
    answer: "A list stores an array of object pointers with spare capacity (`allocated >= len`). When it is full, CPython resizes to roughly `newsize + newsize/8 + 6` — about 12.5% headroom. Because capacity grows geometrically, n appends perform O(n) total copying, i.e. amortised O(1) each.",
    explanation: "Watch `sys.getsizeof(lst)` jump in steps as you append. Inserting or deleting at the front is still O(n) because elements shift. Tuples are allocated at exact size, so they are slightly smaller than an equivalent list.",
    codeSnippet: `import sys
lst, last = [], None
for i in range(20):
    size = sys.getsizeof(lst)
    if size != last:
        print(len(lst), size)  # capacity grows in steps
        last = size
    lst.append(i)`,
  },
  {
    id: "fc-pyi-slots",
    difficulty: "Medium",
    question: "What does `__slots__` do, and what are its gotchas?",
    answer: "Declaring `__slots__ = ('x', 'y')` replaces the per-instance `__dict__` with fixed storage slots (exposed through descriptors on the class). Instances use less memory, attribute access is slightly faster, and assigning an undeclared attribute raises AttributeError. Gotchas: no `__dict__` or `__weakref__` unless listed; every subclass must declare its own `__slots__` or it regains a `__dict__`; multiple bases that each define non-empty slots conflict.",
    explanation: "Worth it for classes with millions of instances (points, graph nodes, records). `@dataclass(slots=True)` generates slots for you.",
  },
  {
    id: "fc-pyi-descriptors",
    difficulty: "Hard",
    question: "What is a descriptor, and in what order does `obj.attr` lookup happen?",
    answer: "A descriptor is a class attribute whose type defines `__get__` (and optionally `__set__` / `__delete__`). `object.__getattribute__` resolves `obj.attr` as: (1) find `attr` on the type's MRO — if it is a data descriptor (defines `__set__` or `__delete__`), call its `__get__`; (2) otherwise return `obj.__dict__['attr']` if present; (3) otherwise call a non-data descriptor's `__get__` or return the plain class attribute; (4) otherwise call `__getattr__` if defined, else raise AttributeError.",
    explanation: "property, functions (which become bound methods), classmethod, staticmethod and `__slots__` members are all descriptors. Data descriptors beat the instance dict, which is why a property cannot be shadowed by an instance attribute, while a method can.",
  },
  {
    id: "fc-pyi-bound-methods",
    difficulty: "Medium",
    question: "How does `self` get bound when you access `obj.method`?",
    answer: "Functions are non-data descriptors. `obj.method` calls `function.__get__(obj, type(obj))`, which returns a bound-method object pairing the function with `obj`; calling it prepends `obj` as the first argument. Each access creates a new bound method, so `obj.method is obj.method` is False (while `==` is True).",
    explanation: "CPython optimises the common `obj.method(...)` call so the bound-method object is never allocated. Accessing the function through the class (`Cls.method`) returns the plain function, so you pass self explicitly.",
  },
  {
    id: "fc-pyi-mro-c3",
    difficulty: "Hard",
    question: "What is the MRO, how does C3 linearisation compute it, and what does `super()` actually call?",
    answer: "`Cls.__mro__` is the order searched for attributes. C3 builds it as: the class itself, then a merge of its bases' MROs plus the list of bases, repeatedly taking the first head that does not appear in the tail of any other list. This keeps children before parents and preserves the order bases were listed; inconsistent hierarchies raise TypeError at class creation. `super()` returns the next class after the current one in `type(self).__mro__` — not necessarily the parent.",
    explanation: "Diamond `class D(B, C)` with `B(A)` and `C(A)` gives D → B → C → A → object, so `super()` inside B calls C. Cooperative multiple inheritance requires every class in the chain to call `super()` and to accept and forward `**kwargs`.",
  },
  {
    id: "fc-pyi-eq-hash-contract",
    difficulty: "Medium",
    question: "What is the `__eq__` / `__hash__` contract, and what happens when a class defines only `__eq__`?",
    answer: "Objects that compare equal must have equal hashes, and a hash must not change while the object sits in a set or dict. Defining `__eq__` without `__hash__` sets `__hash__ = None`, making instances unhashable. Implement `__hash__` from the same immutable fields used by `__eq__`, e.g. `hash((self.x, self.y))`.",
    explanation: "Hashing mutable state that later changes leaves the object stranded in the wrong slot: `obj in my_set` becomes False even though it is there. Return `NotImplemented` from `__eq__` for unrelated types so Python can try the reflected operation. `@dataclass(frozen=True)` generates a consistent pair.",
  },
  {
    id: "fc-pyi-generator-frames",
    difficulty: "Hard",
    question: "How are generators implemented in CPython, and why are suspended generators cheap?",
    answer: "A generator object owns a suspended frame: its local variables, value stack and instruction pointer. `yield` saves that state and returns to the caller; `next()` / `send()` resume the same frame where it stopped. The frame lives in the generator object (heap), not on the C stack, so thousands of paused generators cost only their frames' memory.",
    explanation: "`gen.throw(exc)` raises inside the frame at the paused yield; `gen.close()` raises GeneratorExit so `finally` blocks run. Coroutines (`async def`) use the same machinery — `await` is essentially `yield from` an awaitable — which is how one thread can juggle many in-flight tasks.",
  },
  {
    id: "fc-pyi-bytecode-dis",
    difficulty: "Hard",
    question: "What is CPython bytecode, how do you inspect it, and what changed with 3.11's specialising interpreter?",
    answer: "Source compiles to code objects (bytecode, constants, names), cached as .pyc files in `__pycache__`, and executed by a stack-based evaluation loop. `dis.dis(func)` disassembles it. Since 3.11 (PEP 659) the interpreter is adaptive: hot instructions are rewritten in place into type-specialised forms (e.g. an int-specific add, an attribute load that reads a known slot), visible with `dis.dis(func, adaptive=True)`.",
    explanation: "dis explains real behaviour: `n += 1` on a global is a load, add and store (so it is not atomic), and locals use indexed LOAD_FAST while globals need dict lookups (LOAD_GLOBAL). 3.13 added an experimental copy-and-patch JIT that is off by default.",
    codeSnippet: `import dis

def inc():
    global n
    n += 1

dis.dis(inc)
# LOAD_GLOBAL n / LOAD_CONST 1 / BINARY_OP (+=) / STORE_GLOBAL n
# (exact opcode names vary between Python versions)`,
  },
  {
    id: "fc-pyi-gil-details",
    difficulty: "Hard",
    question: "What exactly does the GIL protect, when is it released, and how often do threads switch?",
    answer: "A lock a thread must hold to execute Python bytecode, protecting interpreter state such as reference counts and object internals. It is released around blocking I/O and `time.sleep`, and by C extensions doing long work without touching Python objects (NumPy, hashlib and zlib on large buffers). A thread waiting for the GIL asks the holder to drop it after the switch interval, `sys.getswitchinterval()` = 5 ms by default.",
    explanation: "So I/O-bound threads overlap well, but CPU-bound pure-Python threads take turns on one core. Since 3.12 (PEP 684) each subinterpreter can have its own GIL, and 3.14 exposes subinterpreters through `concurrent.interpreters` / InterpreterPoolExecutor.",
  },
  {
    id: "fc-pyi-free-threading",
    difficulty: "Hard",
    question: "What are CPython's free-threaded builds (3.13+), and what changes for your code?",
    answer: "PEP 703 adds an optional build (`python3.13t`, `python3.14t`) without the GIL, so Python threads can run bytecode in parallel on multiple cores. It was experimental in 3.13 and became officially supported (still not the default) in 3.14. To make it safe the runtime uses biased reference counting, immortal objects, deferred refcounting, the mimalloc allocator and fine-grained per-object locks on built-in containers.",
    explanation: "Single-threaded code runs somewhat slower (a large penalty in 3.13, roughly 5–10% in 3.14). Importing a C extension that hasn't declared free-threading support re-enables the GIL unless you force `PYTHON_GIL=0` / `-X gil=0`; check `sys._is_gil_enabled()`. Your own invariants still need locks — there is no longer even accidental GIL serialisation.",
  },
  {
    id: "fc-pyi-immortal-objects",
    difficulty: "Hard",
    question: "What are immortal objects (PEP 683, Python 3.12), and why were they introduced?",
    answer: "Core shared objects such as None, True/False, Ellipsis and the cached small ints are marked immortal: their reference count is pinned at a special value, so increments and decrements leave it unchanged and they are never deallocated.",
    explanation: "Skipping refcount writes on these heavily shared objects avoids cache-line contention between cores and copy-on-write page faults in forked workers, and it is a prerequisite for per-interpreter GILs and free threading. Visible side effect: `sys.getrefcount(None)` returns a huge constant.",
  },
  {
    id: "fc-pyi-pymalloc",
    difficulty: "Hard",
    question: "Why might a Python process's RSS not shrink after you delete a huge list of small objects?",
    answer: "Small objects (≤ 512 bytes) come from pymalloc, which carves large arenas into pools of fixed-size blocks. Freed blocks return to their pool for reuse, but an arena is only released to the OS when every block in it is free. Scattered survivors pin arenas (fragmentation), so memory is reusable by Python but not returned to the OS.",
    explanation: "Diagnose with `tracemalloc` (allocation sites) rather than RSS alone. Long-running workers often rely on periodic process recycling (e.g. a max-requests setting) for this reason.",
  },
  {
    id: "fc-pyi-locals-fast",
    difficulty: "Medium",
    question: "Why are local variable lookups faster than globals, and why doesn't writing to `locals()` inside a function create a variable?",
    answer: "The compiler resolves function locals to fixed slots in the frame, so LOAD_FAST is an array index. Globals and builtins need dict lookups (LOAD_GLOBAL, cached by specialisation in 3.11+). `locals()` in a function returns a snapshot dict; writes to it do not create or change real local variables (formalised by PEP 667 in 3.13).",
    explanation: "Hence the micro-optimisation of binding `append = out.append` before a hot loop, and the fact that `exec` cannot add new locals to a function. Measure before applying such tricks.",
  },
];

export const PYTHON_INTERNALS_FLASHCARDS: Flashcard[] = cards.map((card) => ({
  ...card,
  category: "Python Internals",
}));
