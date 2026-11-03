import { ADVANCED_CHALLENGES } from "./python-challenges/advanced";
import { FOUNDATION_CHALLENGES } from "./python-challenges/foundations";
import { INTERNALS_MODULE } from "./python-course-internals";
import { PYTHON_EXPANSIONS } from "./python-course-expanded";

export type LessonRuntime = "browser" | "local" | "pydantic";
/**
 * An auto-graded exercise. `tests` is Python source of named checks written as
 * `@check("name")` functions; they run against the learner's code through
 * buildChallengeScript (lib/python-challenge.ts) on the local server's Python.
 */
export interface LessonChallenge { prompt: string; hint?: string; starter: string; tests: string; solution: string }
export interface PythonLesson { id: string; title: string; summary: string; concepts: string[]; code: string; output: string; exercise: string; hint: string; runtime: LessonRuntime; source: string; challenge?: LessonChallenge }
export interface PythonModule { id: string; title: string; description: string; lessons: PythonLesson[] }
const tutorial = "https://docs.python.org/3/tutorial/";
function lesson(id: string, title: string, summary: string, concepts: string[], code: string, output: string, exercise: string, hint: string, runtime: LessonRuntime = "browser", source: string = tutorial): PythonLesson { return { id, title, summary, concepts, code, output, exercise, hint, runtime, source }; }
/** Python source written flush-left in a raw template: backslashes stay literal and the leading newline is dropped. */
function py(strings: TemplateStringsArray, ...values: unknown[]): string { return String.raw(strings, ...values).replace(/^\n/, ""); }
const MODULES: PythonModule[] = [
  { id:"essentials",title:"Python essentials",description:"Build a reliable mental model of values, control flow, and functions.",lessons:[
    lesson("values","Values, types & expressions","Start with Python's basic values and how expressions produce results.",[
      "Variables are names bound to objects; assignment does not declare a fixed type. Use descriptive names and keep conversions explicit.",
      "Integers have arbitrary precision, floats are binary approximations, and True and False are booleans. Use None to represent the absence of a value.",
      "Use == for value equality and is None for the None singleton. Formatting with f-strings makes computed values readable."
    ],py`
# Names refer to values; conversion from text is explicit.
count_text = "7"
count = int(count_text)
price = 2.5
total = count * price
print(f"{count} items cost {total:.2f}")
print(type(count_text).__name__, type(count).__name__)

# Equality compares values. None represents an absent value.
discount = None
print(count == 7, discount is None)
`, `7 items cost 17.50\nstr int\nTrue True`,`Convert the text "42" to an integer, add 8, and print the result. Why does adding 8 directly to the text fail?`,`Use int("42") before arithmetic.`),
    lesson("control-flow","Conditions & loops","Make decisions and walk through data without losing sight of edge cases.",[
      "if / elif / else select branches using truth values. Empty collections, zero and None are falsy; a space-containing string is truthy.",
      "for iterates over values, while repeats while a condition remains true. break exits the loop and continue skips to the next iteration.",
      "enumerate yields index-value pairs; range(n) stops before n. A loop invariant describes what remains true before each iteration."
    ],py`
values = [3, -1, 4, 0]
positive = 0
for index, value in enumerate(values):
    if value > 0:
        positive += 1
        print("positive:", index, value)
    elif value == 0:
        print("zero:", index)
print("count:", positive)

# A while loop must make progress toward its stopping condition.
remaining = 2
while remaining > 0:
    print("remaining:", remaining)
    remaining -= 1
`, `positive: 0 3\npositive: 2 4\nzero: 3\ncount: 2\nremaining: 2\nremaining: 1`,`Find the first index containing a negative value, or -1 if there is none. Try an empty list.`,`Initialize the answer to -1 and break on the first match.`),
    lesson("functions","Functions & scope","Design small functions with predictable inputs and outputs.",[
      "A function returns None when it reaches the end without returning a value. Prefer explicit return values over modifying unrelated global state.",
      "Positional, keyword and default arguments make APIs expressive. Default expressions are evaluated once at definition time, so use None instead of a mutable default.",
      "A name assigned inside a function is local unless declared otherwise; pass dependencies explicitly. Mutating an argument affects the caller's object."
    ],py`
def add_tag(tag, tags=None):
    """Append a tag, creating a fresh list when none is supplied."""
    if tags is None:
        tags = []
    tags.append(tag)
    return tags

print(add_tag("python"))
print(add_tag("dsa"))  # independent default list
existing = ["algorithms"]
result = add_tag("trees", existing)
print(existing, result is existing)  # a supplied list is mutated
`, `['python']\n['dsa']\n['algorithms', 'trees'] True`,`Write a function that returns the average of a list; decide and document what happens for an empty list.`,`Return or raise explicitly when the list is empty.`),
    lesson("comprehensions","Comprehensions & unpacking","Transform collections clearly while keeping complex logic readable.",[
      "A comprehension combines iteration, optional filtering and an expression. List, set and dictionary comprehensions produce their respective containers.",
      "Tuple unpacking assigns multiple names at once; zip pairs elements until the shortest iterable ends. Use enumerate when you need an index too.",
      "Comprehensions allocate a result; a generator expression computes values lazily. Avoid deeply nested comprehensions when a loop is clearer."
    ],py`
names = ["Ada", "Lin", "Grace"]
scores = [92, 75, 88]
passed = {name: score for name, score in zip(names, scores) if score >= 80}
print(passed)

# A list comprehension creates a list; a generator produces values lazily.
squares = [n * n for n in range(5) if n % 2 == 0]
square_stream = (n * n for n in range(3))
print(squares)
print(next(square_stream), list(square_stream))
`, `{'Ada': 92, 'Grace': 88}\n[0, 4, 16]\n0 [1, 4]`,`Build a list of the squares of even numbers from 0 through 10.`,`Use range(11) and filter with n % 2 == 0.`),
  ]},
  { id:"collections",title:"Collections & the Python toolkit",description:"Choose the right data structure and understand its cost.",lessons:[
    lesson("strings", "Strings, bytes & text", "Process text safely and avoid accidental quadratic work.", [
      "Strings are immutable sequences of Unicode code points. Indexing accesses a code point; len counts code points, which need not match user-perceived characters.",
      "Use split, join, strip and casefold for common text operations. Repeatedly concatenating many strings can be expensive; collect parts and join them.",
      "Bytes represent encoded binary data. Encode text to bytes and decode bytes with an explicit encoding such as UTF-8 at boundaries."
    ], `text = "  Python makes DSA fun  "\nwords = text.strip().split()\nprint("-".join(words).casefold())\nprint("café".encode("utf-8").decode("utf-8"))\n`, `python-makes-dsa-fun\ncafé`, `Write a function that counts words after trimming whitespace, then test repeated spaces and an empty string.`, `split() without arguments handles repeated whitespace.`),
    lesson("lists","Lists, tuples & slicing","Work with ordered collections and understand mutation.",[
      "Lists are mutable dynamic arrays: indexing and append are typically O(1) amortized; inserting or popping near the front shifts elements and is O(n).",
      "A slice creates a new shallow list in O(k) time and space for k copied references. Nested objects remain shared unless explicitly copied.",
      "Tuples are immutable containers and are often useful for fixed records and hashable keys, provided their contents are hashable."
    ],`items = ["a", "b", "c"]\ncopy = items[:]\ncopy.append("d")\nprint(items, copy)\nprint(items[-1], items[1:])\n`,`['a', 'b', 'c'] ['a', 'b', 'c', 'd']\nc ['b', 'c']`,`Reverse a list using both slicing and an in-place method. Which one changes the original?`,`Compare values before and after list.reverse().`),
    lesson("maps-sets","Dictionaries, sets & hashing","Use hash-based containers for fast lookups and counting.",[
      "dict maps keys to values; set stores unique hashable values. Average lookup, insertion and deletion are O(1), but hashing and collisions matter and worst cases can be O(n).",
      "Use dict.get for a default and membership with in when presence matters. Dictionaries preserve insertion order in modern Python.",
      "Keys must be hashable and stable: strings, integers and tuples of hashable values work; lists and dictionaries cannot be keys."
    ],`words = ["tree", "graph", "tree"]\ncounts = {}\nfor word in words:\n    counts[word] = counts.get(word, 0) + 1\nprint(counts)\nprint("graph" in counts, len(set(words)))\n`,`{'tree': 2, 'graph': 1}\nTrue 2`,`Return the first repeated value in a list in a single pass.`,`Keep a set of values already seen.`),
    lesson("collections-toolkit","Counter, defaultdict & deque","Use standard-library tools that frequently simplify interview solutions.",[
      "Counter counts hashable values, while defaultdict creates a missing value through its factory. Accessing a missing defaultdict key creates an entry.",
      "deque supports append and popleft efficiently at both ends, making it a good BFS queue; list.pop(0) shifts the remaining elements.",
      "Prefer the simplest structure that expresses the invariant, and know the operations you depend on."
    ],`from collections import Counter, defaultdict, deque\ncounts = Counter(["a", "b", "a"])\ngroups = defaultdict(list)\ngroups["x"].append(2)\nqueue = deque([1, 2, 3])\nprint(counts["a"], groups["x"], queue.popleft())\n`,`2 [2] 1`,`Use a deque to implement a queue: add three values, remove one, and inspect what remains.`,`Use append() and popleft().`,"browser","https://docs.python.org/3/library/collections.html"),
    lesson("sorting","Sorting, keys & binary search","Sort by the value you care about and use boundaries safely.",[
      "sorted returns a new list; list.sort modifies the existing list and returns None. Both use a stable sort: equal keys keep their original relative order.",
      "A key function is evaluated for each item, so tuples such as (priority, name) can express multiple ordering rules.",
      "bisect finds insertion points in sorted sequences in O(log n); inserting into a list still costs O(n) due to shifting."
    ],`from bisect import bisect_left\nitems = [("B", 2), ("A", 3), ("C", 2)]\nprint(sorted(items, key=lambda item: (item[1], item[0])))\nprint(bisect_left([1, 3, 3, 8], 3))\n`,`[('B', 2), ('C', 2), ('A', 3)]\n1`,`Sort a list of people by age, breaking ties by name.`,`Return a tuple from the key function.`),
    lesson("heapq","Heaps & priority queues","Keep the smallest available item at the front of a heap.",[
      "heapq provides a min-heap: heapify is O(n), reading heap[0] is O(1), and push/pop are O(log n). A heap is not a fully sorted list.",
      "To model a max-heap for numeric priorities, negate them. For ties involving objects that cannot be compared, include a unique sequence number.",
      "Heaps are useful for top-k, streaming medians, task scheduling and Dijkstra's frontier."
    ],`import heapq\nheap = [5, 1, 3]\nheapq.heapify(heap)\nheapq.heappush(heap, 2)\nprint(heapq.heappop(heap), heapq.heappop(heap))\n`,`1 2`,`Maintain the three largest numbers seen in a stream using a min-heap of size three.`,`Push each number; pop the smallest when the heap gets too large.`,"browser","https://docs.python.org/3/library/heapq.html"),
  ]},
  { id:"algorithm-thinking",title:"Algorithm thinking",description:"Reason about complexity, recursion, and common problem-solving patterns.",lessons:[
    lesson("big-o","Time & space complexity","Explain how cost grows as input size increases.",[
      "O(1), O(log n), O(n), O(n log n) and O(n²) describe asymptotic upper bounds. State what n represents and whether you are discussing average or worst case.",
      "Count auxiliary memory as well as the output, recursion stack and data copies. A slice of k elements takes O(k), even when indexing is O(1).",
      "Two sequential loops are typically O(n + m); nested loops can multiply. Hash-table lookups are O(1) on average, not a universal worst-case guarantee."
    ],`def pairs(values):\n    result = []\n    for i in range(len(values)):\n        for j in range(i + 1, len(values)):\n            result.append((values[i], values[j]))\n    return result\n\nprint(pairs([1, 2, 3]))\n`,`[(1, 2), (1, 3), (2, 3)]`,`Explain the time and output-space complexity for pairs(n). What changes if you yield pairs instead?`,`There are n(n-1)/2 pairs; a generator avoids storing all of them at once.`),
    lesson("recursion","Recursion & the call stack","Decompose a problem into smaller calls with a well-defined base case.",[
      "Every recursive solution needs a base case, progress toward that case, and a clear contract for what each call returns.",
      "Calls use stack space proportional to recursion depth. Python has a recursion limit, and deeply skewed structures may be better handled iteratively.",
      "Trace a small example by recording each call and its return value. Overlapping subproblems can often be cached or converted to dynamic programming."
    ],`def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n\nprint(factorial(5))\n`,`120`,`Write a recursive sum of a list using an index. Identify the base case and stack depth.`,`Stop at index == len(values); add the current value to the recursive result.`),
    lesson("iterators-generators","Iterators & generators","Process sequences lazily and understand when an iterator is exhausted.",[
      "An iterable provides an iterator; an iterator produces values one at a time and is exhausted after traversal. A list can produce multiple fresh iterators.",
      "yield turns a function into a generator. It retains its state between values, which is useful for large streams and pipelines.",
      "Laziness saves intermediate memory but can defer errors and side effects. Materialize with list() only when you actually need all results."
    ],`def squares(limit):\n    for n in range(limit):\n        yield n * n\n\nstream = squares(4)\nprint(next(stream))\nprint(list(stream))\n`,`0\n[1, 4, 9]`,`Create a generator that yields only even numbers from an input iterable.`,`Use a for loop with an if condition before yield.`),
    lesson("patterns","Invariants, edge cases & interview habits","Connect Python mechanics to a repeatable problem-solving process.",[
      "Clarify the input, output, constraints and whether mutation is allowed. Start with a correct straightforward solution and identify the bottleneck.",
      "Choose a pattern: hash map for complements, two pointers for ordered boundaries, sliding window for contiguous ranges, and BFS for shortest unweighted paths.",
      "State an invariant, trace a small input, and test empty/singleton cases, duplicates, boundaries and negative values. Explain time and space before coding."
    ],`def has_pair(values, target):\n    seen = set()\n    for value in values:\n        if target - value in seen:\n            return True\n        seen.add(value)\n    return False\n\nprint(has_pair([3, 3], 6), has_pair([3], 6))\n`,`True False`,`Explain why checking before insertion prevents using the same list element twice.`,`At the check, seen contains only earlier elements.`),
  ]},
  { id:"programming",title:"Writing dependable Python",description:"Functions, objects, errors, files, and tests for real projects.",lessons:[
    lesson("json", "JSON & data interchange", "Convert between structured data and JSON at application boundaries.", [
      "json.loads parses JSON text into Python values; json.dumps serializes supported Python values to JSON text. JSON null, true and false map to None, True and False.",
      "JSON objects become dictionaries with string keys. Custom Python objects, dates and bytes need an explicit serialization strategy.",
      "Parsing is not the same as validating: check required fields and constraints before using untrusted data, or use a validation library such as Pydantic."
    ], `import json\n\npayload = '{"name": "Ada", "active": true}'\nrecord = json.loads(payload)\nprint(record["name"], record["active"])\nprint(json.dumps({"count": 2}, sort_keys=True))\n`, `Ada True\n{"count": 2}`, `Parse a JSON object and reject it if an integer count field is missing or negative.`, `Check the value explicitly, then raise ValueError for invalid data.`, "browser", "https://docs.python.org/3/library/json.html"),
    lesson("exceptions","Exceptions & error handling","Handle failures without hiding useful information.",[
      "Use try / except for expected failures, catch specific exception types, and add context when re-raising. Avoid a broad except that silently returns success.",
      "else runs only when the try block succeeds; finally runs whether an exception occurs or not. Use finally for cleanup that must happen in either case.",
      "Raise ValueError for invalid values and choose explicit error contracts for your callers. Do not treat exceptions as a replacement for ordinary branching."
    ],`def parse_port(text):\n    port = int(text)\n    if not 1 <= port <= 65535:\n        raise ValueError("port out of range")\n    return port\n\ntry:\n    print(parse_port("9000"))\n    parse_port("0")\nexcept ValueError as error:\n    print("Invalid:", error)\n`,`9000\nInvalid: port out of range`,`Handle invalid numeric text and out-of-range values with an informative message.`,`int(text) can itself raise ValueError.`),
    lesson("context-managers","Files & context managers","Ensure resources are released even when a failure occurs.",[
      "with calls a context manager's enter and exit methods, making it suitable for files, locks and other resources that need deterministic cleanup.",
      "When opening text files, choose an encoding such as UTF-8. Use pathlib for portable paths and avoid assuming the current working directory.",
      "This example uses an in-memory text stream so it runs without creating files. In real code, use with open(path, encoding='utf-8') as file."
    ],`from io import StringIO\n\nwith StringIO("alpha\\nbeta\\n") as file:\n    lines = [line.strip() for line in file]\n    print(lines)\nprint(file.closed)\n`,`['alpha', 'beta']\nTrue`,`Read a UTF-8 file and count non-empty lines. How would you handle a missing file?`,`Use a with block and catch FileNotFoundError at an appropriate boundary.`),
    lesson("classes-dataclasses","Classes & dataclasses","Model related state with clear behavior and safe defaults.",[
      "A class groups behavior and state. Instance methods take self; keep invariants explicit and avoid putting unrelated responsibilities into one object.",
      "dataclass can generate initialization and representation methods. Use field(default_factory=list) for per-instance mutable collections.",
      "A dataclass organizes trusted Python data; type hints alone do not validate external input. Use an explicit validation boundary for untrusted data."
    ],`from dataclasses import dataclass, field\n\n@dataclass\nclass Task:\n    title: str\n    tags: list[str] = field(default_factory=list)\n\na = Task("Review")\nb = Task("Practice")\na.tags.append("python")\nprint(a.tags, b.tags)\n`,`['python'] []`,`Add a method that marks a task complete without changing the tags of other tasks.`,`Give each instance its own state and use self to update it.`),
    lesson("typing","Type hints & protocols","Communicate contracts and catch errors earlier with static tooling.",[
      "Annotations describe intended types for tools and readers; Python does not automatically enforce them at runtime.",
      "Use list[int], dict[str, int], and T | None on supported Python versions. Choose interfaces such as Iterable when a function only needs iteration.",
      "A Protocol describes structural behavior: an object can satisfy it by implementing the required methods without inheriting from it."
    ],`from typing import Iterable\n\ndef total(values: Iterable[int]) -> int:\n    return sum(values)\n\nprint(total([1, 2, 3]))\nprint(total((4, 5)))\n`,`6\n9`,`Annotate a function that looks up a name and can return either an integer or None.`,`The return type can be int | None.`,"browser","https://docs.python.org/3/library/typing.html"),
    lesson("testing","Testing, assertions & edge cases","Build confidence with examples that test behavior instead of implementation details.",[
      "A useful test identifies a behavior, arranges a focused input, performs the operation and checks the result. Test zero, one, duplicate, negative and boundary cases where relevant.",
      "assert is convenient for tests and local invariants; do not use it as the only validation for untrusted input because optimized Python can disable assertions.",
      "Isolate external I/O with fakes or mocks, but keep meaningful integration tests for important boundaries. Test failures as well as success."
    ],`def is_even(n):\n    return n % 2 == 0\n\nassert is_even(0)\nassert is_even(-2)\nassert not is_even(3)\nprint("3 checks passed")\n`,`3 checks passed`,`Write tests for an empty input, duplicate values and a single-element input of your pair-finding function.`,`Include both a valid pair and a case where the same element must not be reused.`),
    lesson("environments","Modules, environments & dependencies","Keep projects reproducible and avoid dependency surprises.",[
      "A module is a Python file; a package groups modules. Use an if __name__ == '__main__' guard for executable entry points and keep imports free of expensive side effects.",
      "Create an isolated environment with python -m venv .venv. On Windows activate it with .venv\\Scripts\\Activate.ps1, then install project dependencies in that environment.",
      "Record compatible dependency versions and run tests in a clean environment. Never commit secrets; load configuration from environment variables or a secret manager."
    ],`import sys\nfrom pathlib import Path\n\nprint("Python major version:", sys.version_info.major)\nprint("File name:", Path("data/events.json").name)\n`,`Python major version: 3\nFile name: events.json`,`Create a virtual environment and explain why installing a library globally can cause conflicts between projects.`,`Two projects may need incompatible versions of the same package.`),
  ]},
  { id:"pydantic",title:"Pydantic & data validation",description:"Validate external data, enforce constraints, and serialize models using Pydantic v2.",lessons:[
    lesson("pydantic-models","Models & parsing","Validate data at application boundaries with Pydantic v2.",[
      "Pydantic BaseModel defines typed fields and validates input at construction or with model_validate. In its default mode, it may coerce compatible inputs, such as a numeric string to an integer.",
      "model_dump returns a Python dictionary and model_dump_json returns JSON text. A validation error contains field locations and error details.",
      "Pydantic is a third-party library; install it in a local environment with python -m pip install 'pydantic>=2,<3'. This course uses the v2 API."
    ],`from pydantic import BaseModel\n\nclass Event(BaseModel):\n    name: str\n    retries: int = 0\n\nevent = Event.model_validate({"name": "email", "retries": "2"})\nprint(event.retries, type(event.retries).__name__)\nprint(event.model_dump())\n`,`2 int\n{'name': 'email', 'retries': 2}`,`Add a required integer field called priority. Try a valid integer and a value that cannot be parsed.`,`Inspect the resulting ValidationError and its field location.`,"pydantic","https://docs.pydantic.dev/latest/concepts/models/"),
    lesson("pydantic-fields","Fields, constraints & strict mode","Constrain inputs and decide when coercion is acceptable.",[
      "Field describes metadata and constraints: for example ge=1 and le=5 restrict a numeric value. Required fields have no default; Optional does not itself make a field optional to provide.",
      "ConfigDict(strict=True) rejects many coercions for Python inputs, while extra='forbid' rejects unexpected fields. Strict behavior can differ for JSON input types; check the relevant type documentation.",
      "Use default_factory for values that need a fresh default. Apply validation at API/config boundaries rather than assuming every internal operation must re-validate."
    ],`from pydantic import BaseModel, ConfigDict, Field, ValidationError\n\nclass Job(BaseModel):\n    model_config = ConfigDict(strict=True, extra="forbid")\n    priority: int = Field(ge=1, le=5)\n    tags: list[str] = Field(default_factory=list)\n\nprint(Job(priority=2).model_dump())\ntry:\n    Job(priority="2")\nexcept ValidationError:\n    print("invalid priority")\n`,`{'priority': 2, 'tags': []}\ninvalid priority`,`Add a name with a minimum length of three and test missing, short, and valid values.`,`Use Field(min_length=3) on the string field.`,"pydantic","https://docs.pydantic.dev/latest/concepts/fields/"),
    lesson("pydantic-validators","Validators & nested models","Encode business rules and report invalid data precisely.",[
      "Use nested BaseModel types for structured objects, then validate them together. A field_validator can normalize or reject one field after Pydantic parses its type.",
      "Return the validated value from a validator; raise ValueError for invalid data. For rules involving multiple fields, a model_validator can inspect the model.",
      "Validators should be predictable and free of side effects. Validate data once at the boundary and surface useful errors to the caller."
    ],`from pydantic import BaseModel, field_validator\n\nclass User(BaseModel):\n    name: str\n\n    @field_validator("name")\n    @classmethod\n    def clean_name(cls, value: str) -> str:\n        value = value.strip()\n        if not value:\n            raise ValueError("name cannot be blank")\n        return value\n\nclass Request(BaseModel):\n    user: User\n\nprint(Request.model_validate({"user": {"name": "  Ada  "}}).user.name)\n`,`Ada`,`Add a nested address model and require its city to contain non-whitespace characters.`,`Reuse a field validator and test the nested error location.`,"pydantic","https://docs.pydantic.dev/latest/concepts/validators/"),
  ]},
  { id:"concurrency",title:"Concurrency & parallel processing",description:"Choose between threads, processes, and async; manage shared state safely.",lessons:[
    lesson("concurrency-models","Concurrency, parallelism & the GIL","Choose a model based on the work and the runtime you are using.",[
      "Concurrency means managing multiple tasks that make progress over time; parallelism means work actually executes at the same time. They are related but not interchangeable.",
      "In ordinary GIL-enabled CPython, only one thread executes Python bytecode at a time; threads can still overlap blocking I/O and native extensions may release the GIL. CPU-heavy pure Python often benefits from processes.",
      "Optional free-threaded CPython builds have been available since Python 3.13; the GIL may be enabled by configuration or an extension. Measure the actual workload and runtime rather than relying on a slogan."
    ],`import sys\n\nprint("Implementation:", sys.implementation.name)\nprint("Python:", sys.version_info.major, sys.version_info.minor)\n`,`Implementation: cpython\nPython: (your installed major/minor version)`,`For each workload—fetching many URLs, CPU-heavy image transforms, and 10,000 idle network connections—choose a starting concurrency model and justify it.`,`Consider threads or async for I/O and processes for CPU-heavy pure Python; benchmark realistic workloads.`,"browser","https://docs.python.org/3/howto/free-threading-python.html"),
    lesson("thread-basics","Threads: start, join & shared state","Start threads and wait for them to finish.",[
      "threading.Thread runs a callable in the same process. start schedules it; join waits for it. Thread scheduling is nondeterministic, so do not depend on print or completion order.",
      "Threads share memory and can overlap blocking I/O. Unhandled worker exceptions do not automatically propagate to the thread calling join; executor futures provide a convenient way to surface exceptions.",
      "The browser's Pyodide runtime does not support normal operating-system threading. Run these concurrency examples in local Python."
    ],`from threading import Thread\n\nresults = [None, None]\ndef work(index):\n    results[index] = index * 10\n\nthreads = [Thread(target=work, args=(i,)) for i in range(2)]\nfor thread in threads:\n    thread.start()\nfor thread in threads:\n    thread.join()\nprint(results)\n`,`[0, 10]`,`Start three threads that write to separate result slots, then join them and print the results.`,`Use a separate index for each worker and join before reading the list.`,"local","https://docs.python.org/3/library/threading.html"),
    lesson("thread-locks","Race conditions & locks","Protect multi-step invariants when threads share mutable state.",[
      "A race occurs when correctness depends on interleaving. Read-modify-write operations can race; the GIL is not a substitute for application-level synchronization.",
      "Use with lock to acquire and release even on exceptions. Keep critical sections short and use a consistent lock order to reduce deadlock risk.",
      "Whenever possible, avoid shared mutable state altogether; use a queue or collect independent return values."
    ],`from threading import Lock, Thread\n\nlock = Lock()\ncount = 0\ndef increment():\n    global count\n    for _ in range(1000):\n        with lock:\n            count += 1\n\nworkers = [Thread(target=increment) for _ in range(2)]\nfor worker in workers: worker.start()\nfor worker in workers: worker.join()\nprint(count)\n`,`2000`,`Protect a shared inventory count from two concurrent buyers. Which check and update must be inside the same lock?`,`The availability check and decrement form one invariant.`,"local","https://docs.python.org/3/library/threading.html#lock-objects"),
    lesson("thread-pools","Thread pools, futures & errors","Run bounded I/O-style work and handle results explicitly.",[
      "ThreadPoolExecutor reuses a bounded number of threads. submit returns a Future; future.result waits for a result and re-raises the worker's exception.",
      "The context manager shuts down the executor and waits for running work. A result timeout limits the wait, but does not forcibly stop an already-running function.",
      "Avoid a task waiting for another future from the same exhausted pool: that can deadlock. Choose worker counts based on external service limits and measurement."
    ],`from concurrent.futures import ThreadPoolExecutor\n\ndef work(value):\n    return value * 2\n\nwith ThreadPoolExecutor(max_workers=2) as pool:\n    futures = [pool.submit(work, n) for n in (1, 2, 3)]\n    print([future.result() for future in futures])\n`,`[2, 4, 6]`,`Submit three functions where one raises ValueError. Handle that future's exception without silently discarding it.`,`Call future.result() inside a try/except for the expected error.`,"local","https://docs.python.org/3/library/concurrent.futures.html"),
    lesson("queues","Queues, backpressure & coordination","Move work safely between threads without unbounded memory growth.",[
      "queue.Queue coordinates producers and consumers with locks. maxsize makes put block when the queue is full, providing a simple form of backpressure.",
      "Each get should be matched by task_done, even on failure; queue.join waits for all enqueued work to be marked complete.",
      "Use a sentinel or another explicit shutdown signal and join workers. Decide how to handle timeouts, failures and retries instead of assuming every job succeeds."
    ],`from queue import Queue\nfrom threading import Thread\n\nqueue = Queue(maxsize=2)\nresults = []\ndef worker():\n    while True:\n        item = queue.get()\n        try:\n            if item is None: return\n            results.append(item * 2)\n        finally:\n            queue.task_done()\n\nt = Thread(target=worker)\nt.start()\nfor item in [1, 2, 3, None]: queue.put(item)\nqueue.join()\nt.join()\nprint(results)\n`,`[2, 4, 6]`,`Add a second worker and use one sentinel per worker. Why might output order change?`,`Workers can finish in a different order even if jobs enter the queue in order.`,"local","https://docs.python.org/3/library/queue.html"),
    lesson("multiprocessing","Processes & CPU parallelism","Use multiple processes for CPU-bound Python work.",[
      "ProcessPoolExecutor runs workers in separate processes, each with its own interpreter and memory. This can use multiple cores for CPU-heavy Python code but adds startup and serialization overhead.",
      "Worker functions and arguments must be picklable. Define functions at module scope and use the if __name__ == '__main__' guard, especially with spawn on Windows.",
      "Do not use a process pool for tiny tasks without measuring overhead. Return results or use explicit inter-process communication instead of assuming ordinary globals are shared."
    ],`from concurrent.futures import ProcessPoolExecutor\n\ndef square(n):\n    return n * n\n\nif __name__ == "__main__":\n    with ProcessPoolExecutor(max_workers=2) as pool:\n        print(list(pool.map(square, [2, 3, 4])))\n`,`[4, 9, 16]`,`Compare a sequential computation with a process pool using sufficiently large independent inputs. Include startup time in the measurement.`,`Keep the worker at module scope and protect the entry point.`,"local","https://docs.python.org/3/library/multiprocessing.html"),
    lesson("asyncio","Asyncio, tasks & cancellation","Coordinate many waiting operations without blocking the event loop.",[
      "async def defines a coroutine; await yields control while an awaitable completes. Calling a coroutine does not run it until it is awaited or scheduled.",
      "Use asyncio.gather or TaskGroup to run related I/O tasks concurrently. Blocking calls inside a coroutine block the event loop; use a nonblocking library or explicitly offload blocking I/O.",
      "Cancellation is a normal control path: use try/finally for cleanup, and avoid swallowing CancelledError. asyncio.run belongs at the program entry point, not inside an already-running event loop."
    ],`import asyncio\n\nasync def work(value):\n    await asyncio.sleep(0.01)\n    return value * 2\n\nasync def main():\n    results = await asyncio.gather(work(1), work(2))\n    print(results)\n\nif __name__ == "__main__":\n    asyncio.run(main())\n`,`[2, 4]`,`Run three coroutines concurrently and add a timeout for the whole operation. What cleanup should run if it expires?`,`Use asyncio.timeout on Python 3.11+ and put cleanup in finally.`,"local","https://docs.python.org/3/library/asyncio-task.html"),
    lesson("concurrency-design","Choosing a model & avoiding common failures","Connect the tools to real backend decisions.",[
      "Start from the bottleneck: threads or asyncio are good candidates for waiting on I/O; processes can parallelize CPU-bound work in standard GIL-enabled CPython. Native extensions and free-threaded builds change the trade-off.",
      "Bound concurrency and queue sizes; add timeouts, cancellation, error propagation, retries with backoff and idempotency where appropriate. Avoid indefinite waits or retry storms.",
      "Measure end-to-end throughput, latency, memory and failure behavior. A faster happy path is not enough if errors are lost or shutdown cannot complete."
    ],`from concurrent.futures import ThreadPoolExecutor\n\ndef fetch_simulated(item):\n    if item < 0:\n        raise ValueError("invalid item")\n    return item * 10\n\nwith ThreadPoolExecutor(max_workers=2) as pool:\n    future = pool.submit(fetch_simulated, 3)\n    print(future.result(timeout=1))\n`,`30`,`Design a bounded pipeline that reads tasks, runs four workers, collects failures, and shuts down cleanly.`,`Decide on the queue capacity, worker shutdown signal and error channel before implementation.`,"local","https://docs.python.org/3/library/concurrent.futures.html"),
  ]},
  { id:"advanced",title:"Advanced Python patterns",description:"Develop practical fluency in language internals and production-oriented design.",lessons:[
    lesson("mutability-copy","References, mutability & copying","Understand why a change in one place can appear somewhere else.",[
      "Assignment creates another reference to an object. A shallow copy creates a new outer container but shares nested objects.",
      "copy.deepcopy recursively copies many object graphs, but it is not always appropriate for files, locks, sockets or objects with custom copy behavior.",
      "Prefer explicit ownership and immutable values when possible; they make concurrency and testing easier to reason about."
    ],`from copy import deepcopy\n\noriginal = [[1], [2]]\nshallow = original.copy()\ndeep = deepcopy(original)\nshallow[0].append(9)\nprint(original, deep)\n`,`[[1, 9], [2]] [[1], [2]]`,`Predict the result of changing an inner list after a shallow copy, then check it.`,`Only the outer list was copied.`),
    lesson("decorators","Closures & decorators","Wrap behavior while keeping functions composable.",[
      "A closure retains access to names from an enclosing scope. A decorator takes a callable and returns a callable, often adding behavior around it.",
      "Use functools.wraps to preserve the wrapped function's metadata. Forward both positional and keyword arguments with *args and **kwargs.",
      "Decorators are useful for timing, caching and authorization, but hidden side effects can make debugging harder. Keep error behavior explicit."
    ],`from functools import wraps\n\ndef announce(function):\n    @wraps(function)\n    def wrapper(*args, **kwargs):\n        print("calling", function.__name__)\n        return function(*args, **kwargs)\n    return wrapper\n\n@announce\ndef square(n):\n    return n * n\n\nprint(square(4))\n`,`calling square\n16`,`Create a decorator that counts calls without changing the wrapped function's return value.`,`Use a closure or object to hold the counter and functools.wraps for metadata.`),
    lesson("caching","Memoization & caching","Trade memory for repeated work when inputs and outputs are stable.",[
      "functools.lru_cache caches function results by arguments, which must be hashable. Repeated calls can reuse results, but caching mutable or changing external state can be incorrect.",
      "A bounded maxsize limits entries. Cache size, invalidation and stale values are real design decisions; inspect cache_info to understand behavior.",
      "Memoization can remove repeated subproblems, but recursion still consumes stack space and Python's recursion limit still applies."
    ],`from functools import lru_cache\n\n@lru_cache(maxsize=128)\ndef fib(n):\n    if n < 2: return n\n    return fib(n - 1) + fib(n - 2)\n\nprint(fib(10))\nprint(fib.cache_info().hits > 0)\n`,`55\nTrue`,`Compare the number of calls for Fibonacci with and without caching for a small n.`,`Count function calls and avoid testing huge uncached inputs.`),
    lesson("debugging-observability","Debugging & observability","Make failures diagnosable without exposing sensitive data.",[
      "Use tracebacks to find the earliest relevant application frame and reproduce the failure with the smallest input. Use a debugger or structured logs to inspect state.",
      "Log useful context such as an operation or request ID, but avoid passwords, tokens and sensitive payloads. Prefer logger.exception in an exception handler when you need the traceback.",
      "Separate metrics (counts and latency), logs (events and context), and traces (request flow). Use tests to prevent a fixed bug from returning."
    ],`import logging\n\nlogging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")\nlogger = logging.getLogger("demo")\nlogger.info("processed %s events", 3)\n`,`INFO: processed 3 events`,`A function fails only on empty input. Write the smallest reproduction and a regression test before fixing it.`,`Start with [] and make the expected behavior explicit.`),
  ]},
];
const CHALLENGES: Record<string, LessonChallenge> = { ...FOUNDATION_CHALLENGES, ...ADVANCED_CHALLENGES };
export const PYTHON_COURSE: PythonModule[] = [...MODULES, INTERNALS_MODULE].map(module => ({
  ...module,
  lessons: module.lessons.flatMap(item => [
    CHALLENGES[item.id] ? { ...item, challenge: CHALLENGES[item.id] } : item,
    ...PYTHON_EXPANSIONS.filter(entry => entry.after === item.id).map(entry => entry.lesson),
  ]),
}));
export const PYTHON_LESSONS = PYTHON_COURSE.flatMap(module => module.lessons);
