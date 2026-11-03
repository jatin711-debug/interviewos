# Authoring the Data Structures & Algorithms course

The course lives in `data/ds-course/<module>.ts`. Each file exports one `DsModule` whose `lessons` array holds
`DsLesson` objects (see `types.ts`). The reading order and the planned lesson ids are in `PLAN` inside
`scripts/verify-ds-course.mjs`. Two finished lessons are the style reference:

- `linear.ts` -> `stack` (a **structure** lesson: class-based, container protocol, iterators)
- `sorting-searching.ts` -> `binary-search` (an **algorithm** lesson: pure functions, invariants)

Read both completely before writing anything. Match their tone, depth and layout.

## What a lesson contains

| Field | What to write |
| --- | --- |
| `id`, `title`, `kind` | kebab-case id from the plan; `structure` (a class), `algorithm` (functions), `technique` (a reusable pattern), `concept` (background) |
| `summary` | 1-2 sentences: what it is and why it matters |
| `concepts` | 3-5 items of 1-3 sentences each. The mental model first: how it works, what the invariant is, why the cost is what it is. Plain language, no jargon without a definition |
| `complexity`, `space` | One row per important operation; say *amortized*, *expected* or *worst case* when it matters; include auxiliary and recursion-stack space |
| `code` | Runnable Python (about 60-130 lines): the implementation plus a demo under `if __name__ == "__main__":` |
| `output` | The exact stdout of `code` |
| `bestPractices` | 3-6 items naming a Pythonic choice **visible in the code** and why it is right |
| `pitfalls` | 2-4 common bugs and interview traps, concrete (what goes wrong and when) |
| `useWhen` | 2-4 problem signals that point to this structure/algorithm |
| `inPractice` | What to use in production (usually the standard library) and when hand-rolling is right |
| `challenge` | An auto-graded exercise (below) |
| `practice` | DSA practice categories to continue with (exact `DSACategory` strings from `data/dsa/types.ts`) |
| `source` | docs.python.org page for stdlib topics, otherwise a stable reference article |

## Code rules (this is the point of the course)

**Structures** are classes:
- One main class plus a private node/helper class. Nodes use `__slots__` (or `@dataclass(slots=True)`).
- Generic over the element type (`Generic[T]` with `TypeVar`), with type hints on every signature.
- Docstrings state the invariant and the cost of the main operations.
- Implement the container protocol that makes sense: `__len__` (which also gives `bool()`), `__iter__`,
  `__contains__`, `__repr__`, `__eq__` (return `NotImplemented` for foreign types; set `__hash__ = None` when mutable),
  `__getitem__`/`__setitem__`/`__delitem__` for indexable things, `__reversed__` when natural.
- Iteration is lazy: `__iter__` is a generator method (or returns a small iterator class when the lesson is about that).
  Traversals use `yield` / `yield from`, never build a list just to loop over it.
- Inherit from `collections.abc` (`MutableSequence`, `MutableMapping`, `Set`, ...) when it gives you the rest of the API for free.
- Raise the exception the built-ins raise (`IndexError` for empty pop/peek, `KeyError` for a missing key, `ValueError` for bad
  arguments) with a clear message. Never return `None` to signal "empty" when `None` could be a stored value.
- Private state is `_name`; read-only views are `@property`; alternate constructors are `@classmethod` (`from_iterable`).
- No mutable default arguments, no bare `except`, no globals.

**Algorithms** are pure functions:
- Type hints and a docstring that states what is returned, the precondition, and the complexity.
- Do not mutate the caller's input unless the name says so (`sort_in_place`) or the docstring does.
- State the loop invariant in a comment at the loop head or in the docstring.
- Anything that enumerates (permutations, traversals, matches, primes) is a generator, with a list-returning wrapper if useful.
- Prefer `heapq`, `bisect`, `collections.deque`, `itertools`, `functools.cache` when they are not the thing being taught;
  show the hand-written version AND mention the library one.
- Avoid recursion deeper than ~900 frames (CPython's default limit is 1000). Use an explicit stack, or say so in `pitfalls`.

**Everything** must be deterministic and run in both CPython 3.12 and the browser (Pyodide, Python 3.14):
- Standard library only. No threads, processes, asyncio, files, network, `input()`, `time`, `os`, `sys`.
- No `id()`/address output; no iterating a `set` or `frozenset` of strings without `sorted()`; never print `hash()` of a `str`
  (string hashing is randomized per process). Use ints or a deterministic hash of your own.
- `random` only as `random.Random(<int seed>)` and only its `.random()` method (the one sequence Python guarantees across
  versions); for anything else write a tiny LCG.
- Keep output to ~25 lines. Demos should show normal use AND one edge case (empty, missing key, error message).

## The challenge

`challenge` is `{ prompt, hint, starter, tests, solution }`. It is graded by `lib/python-challenge.ts`: your learner's code runs
as the main module, then each `@check("name")` function in `tests` runs in its own thread with a 2-second limit; the whole run
should stay well under the local limits (keep the solution under ~1.5 s in total). On the site the same script runs in browser Python (Pyodide), which is slower, so it gets a 6-second limit per check; challenges that need threads or processes are graded by downloading the checks and running them locally (`needsLocalPython` in `lib/python-challenge.ts`).

```python
@check("pushes and pops in LIFO order")
def _():
    s = MaxStack()
    s.push(3)
    eq(s.pop(), 3)              # eq(actual, expected) with a readable failure message
    raises(IndexError, s.pop)   # raises(ExceptionType, func, *args) returns the exception
```

- Ask for something **different from the demo** but built on the same idea (the lesson shows MinStack; the challenge asks for MaxStack).
- The prompt names every function/class/method, its arguments, return value and edge cases. A learner must be able to solve it
  from the prompt alone. State complexity requirements when the checks enforce them.
- 4-6 checks with descriptive names: the main behaviour, edge cases (empty, single, duplicates, boundaries), error cases, and
  where complexity is the lesson, one **performance check with a wide margin** (the naive version must take 20x or more of the
  time limit while the intended one finishes in well under a second). Never rely on tight timing.
- `starter`: valid Python (no syntax errors) with the signatures and a TODO comment; it must fail the checks (use
  `raise NotImplementedError` or a plain `pass`/wrong stub). `solution`: clean, idiomatic, passes every check.
- Inputs and outputs are plain Python values (lists, dicts, ints, strings, tuples). Make answers unique (specify ordering).

## Verify before you finish

```
node scripts/verify-ds-course.mjs data/ds-course/<module>.ts --partial --pyodide C:/Windows/Temp/ds-pyodide
```

It checks the data shape and the code rules above, runs `code` under two hash seeds and under Pyodide and compares with
`output`, and grades `solution` (must pass all) and `starter` (must fail). Fix every ERROR. Warnings are advice.
Drop `--partial` once the module has all its planned lessons. Add `--only <lesson-id>` to re-check one lesson.

## Facts must be right

Double-check costs and Python specifics before writing them down: `list.pop(0)` is O(n); `collections.deque` appends/pops are
O(1) at both ends but indexing the middle is O(n); `heapq` is a min-heap; `dict` keeps insertion order; `bisect` works on
sorted sequences; `sorted` is stable (Timsort); recursion limit is 1000. If you are not sure of a claim, leave it out.

## The beginner layer: guides and visualizations

Every lesson page leads with a beginner-first layer, and the polished `code` above sits behind "Go deeper".
A new lesson needs both parts below. Without them it falls back to the old layout.

**Guide** (`data/ds-course/guides/<module>.ts`, keyed by lesson id, type `DsGuide` in `types.ts`):

| Field | What to write |
| --- | --- |
| `level` | `Beginner`, `Intermediate` or `Advanced`, for someone who knows basic Python |
| `analogy` | A real-world picture in 2-4 sentences (a cloakroom, a stack of plates, a treasure hunt) |
| `explain` | 3-6 short paragraphs in plain English. Define every term the first time (`**bold**` it) and give the why, not just the what. `` `code` `` and `**bold**` are rendered |
| `simpleCode` | The smallest clear version: plain functions/classes, no `Generic`/`TypeVar`/`__slots__`/`collections.abc`, comments on the important lines, and a demo that prints what is happening. Aim for 30-70 lines, and keep it deterministic (same rules as `code`) |
| `simpleOutput` | Leave it as an empty template; `--write` fills it in from a real run |
| `codeNotes` | One bullet per important part of `simpleCode`, in reading order, pointing at the printed output |
| `takeaways` | 3-5 one-line things to remember |

**Visualization** (`lib/ds-viz/traces/<module>.ts`, registered in `traces/index.ts`): a function that runs the algorithm
in TypeScript and records a snapshot with `Recorder.step(caption, ...panels)` after every interesting change.
Panels are `array` (with markers like `lo`/`hi`, ranges, or bars), `stack`, `linked`, `buckets`, `tree`, `graph`, `grid`, `vars` and `text`
(see `lib/ds-viz/types.ts`). Colours are roles (`active`, `compare`, `done`, `found`, `muted`, `new`, `removed`, `path`), and
`visual(title, intro, legend)` names them for the legend. Captions say what just happened **and why**, in one or two sentences,
using the real values. Use the same example input as `simpleCode` when you can.

```
node scripts/verify-ds-guides.mjs --write          # run every simpleCode, store its output, check guides and traces
node scripts/verify-ds-guides.mjs --show --only bst  # print a lesson's output and every caption, to proofread
node scripts/render-ds-viz.cjs                     # server-render every step of every visual (catches render crashes)
```

**Motion.** Give things a stable identity and the visualizer animates them between steps: `ids` on an array panel
makes cells slide to their new index (swaps, shifts, queue moves), `id` on linked-list nodes does the same, and tree nodes
glide to their new layout position (they default to their value via `toTree`/`heapTree`). Ids must be unique within
a panel (the verifier checks). Cells that turn `active`/`new`/`found`/`removed` pop, graph edges in `compare`/`active`/`new`
get marching dashes, and the current graph/tree node pulses. Every visual needs an `intro` saying what the example is and what to watch for.

**Solutions** (`data/ds-course/guides/solutions.ts`): 3-5 `notes` explaining how the challenge solution works, in
plain words. If the reference `solution` is written in library style, add a simpler `code` too. The verifier grades it
against the challenge checks, and the page shows it first, with the polished reference one click away.
