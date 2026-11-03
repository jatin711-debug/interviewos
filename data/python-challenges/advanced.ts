import type { LessonChallenge } from "../python-course";

/** Python source written flush-left in a raw template: backslashes stay literal and the leading newline is dropped. */
const py = (strings: TemplateStringsArray, ...values: unknown[]) => String.raw(strings, ...values).replace(/^\n/, "");

// Auto-graded challenges for the pydantic, concurrency, advanced and internals modules. Key: lesson id.
export const ADVANCED_CHALLENGES: Record<string, LessonChallenge> = {
  // ---------------------------------------------------------------- pydantic
  "pydantic-models": {
    prompt: "Define a Pydantic model Order with id: int, customer: str, quantity: int = 1 and notes: str | None = None, keeping the default lax mode so \"7\" becomes 7. Then write parse_orders(rows), which validates each dict with Order.model_validate and returns (orders, errors): the valid Order objects in input order, plus one (row_index, field_name) pair for every field error, taken from the error's loc. One bad row must not stop the rest, and an empty list returns ([], []).",
    hint: "Catch ValidationError for each row and loop over error.errors(). Each entry's \"loc\" is a tuple whose first item is the field name.",
    starter: py`
from pydantic import BaseModel, ValidationError

class Order(BaseModel):
    id: int
    customer: str
    # Add quantity (default 1) and notes (optional text, default None).

def parse_orders(rows):
    orders, errors = [], []
    # Validate each row and record (index, field) for every error.
    return orders, errors
`,
    solution: py`
from pydantic import BaseModel, ValidationError

class Order(BaseModel):
    id: int
    customer: str
    quantity: int = 1
    notes: str | None = None

def parse_orders(rows):
    orders, errors = [], []
    for index, row in enumerate(rows):
        try:
            orders.append(Order.model_validate(row))
        except ValidationError as error:
            errors.extend((index, str(detail["loc"][0])) for detail in error.errors())
    return orders, errors
`,
    tests: py`
@check("coerces numeric strings and applies defaults")
def _():
    order = Order.model_validate({"id": "7", "customer": "Ada"})
    eq((order.id, order.customer, order.quantity, order.notes), (7, "Ada", 1, None))

@check("keeps valid rows as Order objects in input order")
def _():
    orders, errors = parse_orders([
        {"id": 2, "customer": "Lin"},
        {"id": "bad", "customer": "X"},
        {"id": 1, "customer": "Ada", "quantity": "3"},
    ])
    assert all(isinstance(order, Order) for order in orders), "return Order instances, not dicts"
    eq([(order.id, order.quantity) for order in orders], [(2, 1), (1, 3)])

@check("reports every failing field with its row index")
def _():
    rows = [{"id": 1, "customer": "Ada"}, {"id": "x", "customer": "Lin"}, {"quantity": "many"}]
    orders, errors = parse_orders(rows)
    eq(len(orders), 1)
    eq(sorted(errors), [(1, "id"), (2, "customer"), (2, "id"), (2, "quantity")])

@check("returns empty lists for no rows")
def _():
    eq(parse_orders([]), ([], []))
`,
  },
  "pydantic-fields": {
    prompt: "Define a Pydantic model Job that is strict and forbids unknown fields: model_config = ConfigDict(strict=True, extra=\"forbid\"). It has name: str of 3 to 40 characters, priority: int from 1 to 5 inclusive with a default of 3, and tags: list[str] defaulting to a new empty list for each job. Anything else, including a numeric string for priority or an unexpected field, must raise ValidationError.",
    hint: "Field(min_length=3, max_length=40), Field(default=3, ge=1, le=5) and Field(default_factory=list) express the three field rules.",
    starter: py`
from pydantic import BaseModel, ConfigDict, Field

class Job(BaseModel):
    # Add the config and the constraints.
    name: str
    priority: int = 3
    tags: list[str] = []
`,
    solution: py`
from pydantic import BaseModel, ConfigDict, Field

class Job(BaseModel):
    model_config = ConfigDict(strict=True, extra="forbid")

    name: str = Field(min_length=3, max_length=40)
    priority: int = Field(default=3, ge=1, le=5)
    tags: list[str] = Field(default_factory=list)
`,
    tests: py`
from pydantic import ValidationError

@check("applies defaults and gives each job its own tags list")
def _():
    first, second = Job(name="build"), Job(name="deploy")
    eq((first.priority, first.tags), (3, []))
    first.tags.append("urgent")
    eq(second.tags, [], "jobs share one tags list")

@check("enforces the name length and priority range")
def _():
    for value in ("ab", "x" * 41):
        raises(ValidationError, Job, name=value)
    for value in (0, 6):
        raises(ValidationError, Job, name="build", priority=value)
    eq(Job(name="abc", priority=1).priority, 1)
    eq(Job(name="x" * 40, priority=5).priority, 5)

@check("strict mode rejects numeric strings and other coercions")
def _():
    raises(ValidationError, Job, name="build", priority="2")
    raises(ValidationError, Job, name=12345)

@check("rejects unknown fields")
def _():
    raises(ValidationError, Job, name="build", owner="ada")
`,
  },
  "pydantic-validators": {
    prompt: "Define Address with city: str and postcode: str, using field validators that strip the city (rejecting it if it is blank) and upper-case the postcode with its spaces removed. Define Stay with guest: str, address: Address, check_in: date and check_out: date, plus a model_validator(mode=\"after\") that raises ValueError unless check_out is after check_in. Invalid input must raise ValidationError, and a blank city must be reported at the location (\"address\", \"city\").",
    hint: "Field validators are classmethods that return the cleaned value. An after-mode model validator receives the built model and must return self.",
    starter: py`
from datetime import date
from pydantic import BaseModel, field_validator, model_validator

class Address(BaseModel):
    city: str
    postcode: str

class Stay(BaseModel):
    guest: str
    address: Address
    check_in: date
    check_out: date
`,
    solution: py`
from datetime import date
from pydantic import BaseModel, field_validator, model_validator

class Address(BaseModel):
    city: str
    postcode: str

    @field_validator("city")
    @classmethod
    def strip_city(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("city cannot be blank")
        return value

    @field_validator("postcode")
    @classmethod
    def normalize_postcode(cls, value: str) -> str:
        return value.replace(" ", "").upper()

class Stay(BaseModel):
    guest: str
    address: Address
    check_in: date
    check_out: date

    @model_validator(mode="after")
    def check_dates(self):
        if self.check_out <= self.check_in:
            raise ValueError("check_out must be after check_in")
        return self
`,
    tests: py`
from datetime import date
from pydantic import ValidationError

def _stay(**changes):
    data = {
        "guest": "Ada",
        "address": {"city": "  Lisbon ", "postcode": "1100 148"},
        "check_in": "2025-05-01",
        "check_out": "2025-05-04",
    }
    data.update(changes)
    return Stay.model_validate(data)

@check("normalizes the nested address")
def _():
    stay = _stay()
    eq((stay.address.city, stay.address.postcode), ("Lisbon", "1100148"))
    eq(_stay(address={"city": "London", "postcode": "sw1a 1aa"}).address.postcode, "SW1A1AA")

@check("parses ISO date strings")
def _():
    stay = _stay()
    eq((stay.check_in, stay.check_out), (date(2025, 5, 1), date(2025, 5, 4)))

@check("a blank city fails at the nested location")
def _():
    error = raises(ValidationError, _stay, address={"city": "   ", "postcode": "1100"})
    locations = [tuple(detail["loc"]) for detail in error.errors()]
    assert ("address", "city") in locations, "expected an error at ('address', 'city'), got %r" % (locations,)

@check("check_out must be after check_in")
def _():
    raises(ValidationError, _stay, check_out="2025-05-01")
    raises(ValidationError, _stay, check_out="2025-04-30")
`,
  },

  // ------------------------------------------------------------- concurrency
  "concurrency-models": {
    prompt: "Threads and asyncio both overlap waiting. Write fetch_threaded(keys, fetch, max_workers=8), which calls the blocking fetch(key) for every key on a thread pool, and async def fetch_async(keys, afetch), which awaits the coroutine function afetch(key) for every key concurrently on the event loop. Both return a dict mapping each key to its result, and an empty key list returns {}; ThreadPoolExecutor rejects max_workers=0, so don't size the pool from an empty list.",
    hint: "ThreadPoolExecutor.map keeps input order, and so does asyncio.gather(*(afetch(key) for key in keys)). Zip either result with the keys.",
    starter: py`
import asyncio
from concurrent.futures import ThreadPoolExecutor

def fetch_threaded(keys, fetch, max_workers=8):
    # One call at a time: each fetch waits for the previous one.
    return {key: fetch(key) for key in keys}

async def fetch_async(keys, afetch):
    return {key: await afetch(key) for key in keys}
`,
    solution: py`
import asyncio
from concurrent.futures import ThreadPoolExecutor

def fetch_threaded(keys, fetch, max_workers=8):
    keys = list(keys)
    if not keys:
        return {}
    with ThreadPoolExecutor(max_workers=min(max_workers, len(keys))) as pool:
        return dict(zip(keys, pool.map(fetch, keys)))

async def fetch_async(keys, afetch):
    keys = list(keys)
    results = await asyncio.gather(*(afetch(key) for key in keys))
    return dict(zip(keys, results))
`,
    tests: py`
import asyncio
import time

@check("fetch_threaded overlaps blocking calls")
def _():
    def fetch(key):
        time.sleep(0.2)
        return key * 2
    began = time.perf_counter()
    result = fetch_threaded([1, 2, 3, 4, 5], fetch)
    elapsed = time.perf_counter() - began
    eq(result, {1: 2, 2: 4, 3: 6, 4: 8, 5: 10})
    assert elapsed < 0.7, "five 0.2 s calls took %.2f s; they should overlap" % elapsed

@check("fetch_async overlaps awaits")
def _():
    async def afetch(key):
        await asyncio.sleep(0.2)
        return key * 2
    began = time.perf_counter()
    result = asyncio.run(fetch_async([1, 2, 3, 4, 5], afetch))
    elapsed = time.perf_counter() - began
    eq(result, {1: 2, 2: 4, 3: 6, 4: 8, 5: 10})
    assert elapsed < 0.7, "five 0.2 s awaits took %.2f s; they should overlap" % elapsed

@check("results are keyed by the original keys")
def _():
    async def aupper(key):
        return key.upper()
    keys = ["b", "a", "c"]
    eq(fetch_threaded(keys, str.upper), {"a": "A", "b": "B", "c": "C"})
    eq(asyncio.run(fetch_async(keys, aupper)), {"a": "A", "b": "B", "c": "C"})

@check("an empty key list returns an empty dict")
def _():
    async def aupper(key):
        return key.upper()
    eq(fetch_threaded([], str.upper), {})
    eq(asyncio.run(fetch_async([], aupper)), {})
`,
  },
  "thread-basics": {
    prompt: "Write run_in_threads(func, items), which starts one threading.Thread per item to compute func(item), joins every thread, and returns the results in input order; have each thread write into its own slot of a pre-sized list. If any call raises, still wait for all threads, then re-raise the exception from the earliest failing item in input order. An empty list returns [].",
    hint: "Wrap func in a small target that stores either the result or the exception at its index. An exception inside a Thread never reaches join(), so you have to carry it back yourself.",
    starter: py`
import threading

def run_in_threads(func, items):
    # Runs one item at a time. Start a thread per item instead.
    return [func(item) for item in items]
`,
    solution: py`
import threading

def run_in_threads(func, items):
    items = list(items)
    results = [None] * len(items)
    errors = [None] * len(items)

    def work(index, item):
        try:
            results[index] = func(item)
        except Exception as error:
            errors[index] = error

    threads = [threading.Thread(target=work, args=(index, item)) for index, item in enumerate(items)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()
    for error in errors:
        if error is not None:
            raise error
    return results
`,
    tests: py`
import time

@check("returns results in input order")
def _():
    def slow_square(n):
        time.sleep(0.05 * (3 - n))  # later items finish first
        return n * n
    eq(run_in_threads(slow_square, [0, 1, 2, 3]), [0, 1, 4, 9])

@check("runs the calls at the same time")
def _():
    def nap(n):
        time.sleep(0.2)
        return n
    began = time.perf_counter()
    eq(run_in_threads(nap, [0, 1, 2, 3, 4]), [0, 1, 2, 3, 4])
    elapsed = time.perf_counter() - began
    assert elapsed < 0.7, "five 0.2 s calls took %.2f s; start every thread before joining any" % elapsed

@check("waits for every thread, then re-raises the earliest item's error")
def _():
    finished = []
    def task(name):
        if name == "slow":
            time.sleep(0.15)
            finished.append(name)
            return name
        if name == "value":
            time.sleep(0.05)
            raise ValueError("value failed")
        raise KeyError("key failed")
    raises(ValueError, run_in_threads, task, ["slow", "value", "key"])
    eq(finished, ["slow"], "run_in_threads raised before every thread had finished")

@check("an empty list returns []")
def _():
    eq(run_in_threads(lambda n: n, []), [])
`,
  },
  "thread-locks": {
    prompt: "Write a thread-safe Account(balance=0) with deposit(amount), a read-only balance property, and withdraw(amount), which subtracts and returns True only if the balance covers the amount, otherwise returning False and changing nothing. Then write transfer(source, target, amount), which moves money atomically and returns True or False the same way. Two threads transferring in opposite directions between the same two accounts must never deadlock, so always acquire the two locks in a consistent order.",
    hint: "Give each account its own Lock, and do the balance check and the update under it. In transfer, sort the two accounts by a stable key such as id() before acquiring their locks.",
    starter: py`
import threading

class Account:
    def __init__(self, balance=0):
        self._balance = balance

    @property
    def balance(self):
        return self._balance

    def deposit(self, amount):
        self._balance += amount

    def withdraw(self, amount):
        # The check and the update must happen as one step.
        self._balance -= amount
        return True

def transfer(source, target, amount):
    raise NotImplementedError
`,
    solution: py`
import threading

class Account:
    def __init__(self, balance=0):
        self._balance = balance
        self._lock = threading.Lock()

    @property
    def balance(self):
        with self._lock:
            return self._balance

    def deposit(self, amount):
        with self._lock:
            self._balance += amount

    def withdraw(self, amount):
        with self._lock:
            if amount > self._balance:
                return False
            self._balance -= amount
            return True

def transfer(source, target, amount):
    if source is target:
        return amount <= source.balance
    first, second = sorted((source, target), key=id)
    with first._lock, second._lock:
        if amount > source._balance:
            return False
        source._balance -= amount
        target._balance += amount
        return True
`,
    tests: py`
import threading

def _run_all(targets, limit=1.5):
    threads = [threading.Thread(target=target, daemon=True) for target in targets]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join(limit)
    return not any(thread.is_alive() for thread in threads)

@check("concurrent deposits add up exactly")
def _():
    account = Account()
    def deposit_many():
        for _ in range(2000):
            account.deposit(1)
    assert _run_all([deposit_many] * 8), "deposit threads did not finish"
    eq(account.balance, 16000)

@check("withdraw refuses amounts above the balance")
def _():
    account = Account(50)
    eq(account.withdraw(80), False)
    eq(account.balance, 50)
    eq(account.withdraw(50), True)
    eq(account.balance, 0)

@check("concurrent withdrawals never overdraw")
def _():
    account = Account(100)
    wins = []
    def drain():
        for _ in range(25):
            if account.withdraw(1):
                wins.append(1)
    assert _run_all([drain] * 8), "withdraw threads did not finish"
    eq(account.balance, 0)
    eq(len(wins), 100, "exactly 100 withdrawals of 1 should succeed, got %d" % len(wins))

@check("transfer moves money and refuses short balances")
def _():
    source, target = Account(30), Account(0)
    eq(transfer(source, target, 20), True)
    eq((source.balance, target.balance), (10, 20))
    eq(transfer(source, target, 11), False)
    eq((source.balance, target.balance), (10, 20))

@check("opposite transfers finish without deadlock")
def _():
    a, b = Account(1000), Account(1000)
    def forward():
        for _ in range(500):
            transfer(a, b, 1)
    def backward():
        for _ in range(500):
            transfer(b, a, 1)
    assert _run_all([forward, backward], limit=0.8), "transfers deadlocked: acquire both locks in the same order every time"
    eq(a.balance + b.balance, 2000)
`,
  },
  "thread-pools": {
    prompt: "Write fetch_all(urls, fetch, max_workers=4), which runs fetch(url) for every URL on a ThreadPoolExecutor with at most max_workers threads and returns (results, errors). results maps each URL that succeeded to its return value, and errors maps each URL that failed to the exception it raised, so one failure never hides the other results. An empty list returns ({}, {}).",
    hint: "Submit every URL, keep a future-to-URL dict, and call future.result() inside try/except. pool.map would stop at the first exception.",
    starter: py`
from concurrent.futures import ThreadPoolExecutor, as_completed

def fetch_all(urls, fetch, max_workers=4):
    results = {}
    for url in urls:
        results[url] = fetch(url)
    return results, {}
`,
    solution: py`
from concurrent.futures import ThreadPoolExecutor, as_completed

def fetch_all(urls, fetch, max_workers=4):
    results, errors = {}, {}
    with ThreadPoolExecutor(max_workers=max_workers) as pool:
        futures = {pool.submit(fetch, url): url for url in urls}
        for future in as_completed(futures):
            url = futures[future]
            try:
                results[url] = future.result()
            except Exception as error:
                errors[url] = error
    return results, errors
`,
    tests: py`
import threading
import time

def _tracked(delay, fail=()):
    lock = threading.Lock()
    state = {"active": 0, "peak": 0}
    def fetch(url):
        with lock:
            state["active"] += 1
            state["peak"] = max(state["peak"], state["active"])
        try:
            time.sleep(delay)
            if url in fail:
                raise ConnectionError(url)
            return url.upper()
        finally:
            with lock:
                state["active"] -= 1
    return fetch, state

@check("collects results and errors separately")
def _():
    fetch, state = _tracked(0.01, fail={"b"})
    results, errors = fetch_all(["a", "b", "c"], fetch)
    eq(results, {"a": "A", "c": "C"})
    eq(sorted(errors), ["b"])
    assert isinstance(errors["b"], ConnectionError), "errors should map the URL to the exception instance"

@check("never runs more than max_workers fetches at once")
def _():
    fetch, state = _tracked(0.03)
    results, errors = fetch_all(["u%d" % n for n in range(8)], fetch, max_workers=2)
    eq((len(results), errors), (8, {}))
    assert state["peak"] <= 2, "%d fetches ran at once with max_workers=2" % state["peak"]

@check("runs fetches concurrently")
def _():
    fetch, state = _tracked(0.1)
    began = time.perf_counter()
    results, errors = fetch_all(["u%d" % n for n in range(6)], fetch, max_workers=3)
    elapsed = time.perf_counter() - began
    eq(len(results), 6)
    assert elapsed < 0.45, "six 0.1 s fetches on 3 workers took %.2f s; they should overlap" % elapsed

@check("an empty list returns two empty dicts")
def _():
    eq(fetch_all([], lambda url: url), ({}, {}))
`,
  },
  "queues": {
    prompt: "Define a sentinel STOP = object() and write worker(jobs, transform, results). It loops on jobs.get(), appends transform(item) to the results list (or the exception instance if transform raises), returns when it receives STOP, and calls jobs.task_done() exactly once for every get. Then write run_pipeline(items, transform, workers=2, maxsize=4): start workers threads reading from a Queue(maxsize=maxsize), put the items in lazily (items may be a generator, so a full queue makes the producer wait), put one STOP per worker, and join the queue and every thread before returning the results list in any order.",
    hint: "Put task_done() in a finally block so it also runs for STOP and for failed items. Don't call list(items): feeding the queue one item at a time is what gives you backpressure.",
    starter: py`
from queue import Queue
from threading import Thread

STOP = object()

def worker(jobs, transform, results):
    # Loop until STOP arrives, and call jobs.task_done() for every get().
    item = jobs.get()
    results.append(transform(item))

def run_pipeline(items, transform, workers=2, maxsize=4):
    return [transform(item) for item in items]
`,
    solution: py`
from queue import Queue
from threading import Thread

STOP = object()

def worker(jobs, transform, results):
    while True:
        item = jobs.get()
        try:
            if item is STOP:
                return
            try:
                results.append(transform(item))
            except Exception as error:
                results.append(error)
        finally:
            jobs.task_done()

def run_pipeline(items, transform, workers=2, maxsize=4):
    jobs = Queue(maxsize=maxsize)
    results = []
    threads = [Thread(target=worker, args=(jobs, transform, results)) for _ in range(workers)]
    for thread in threads:
        thread.start()
    for item in items:
        jobs.put(item)
    for _ in threads:
        jobs.put(STOP)
    jobs.join()
    for thread in threads:
        thread.join()
    return results
`,
    tests: py`
import threading
import time
from queue import Queue

def _drained(jobs, limit=0.5):
    waiter = threading.Thread(target=jobs.join, daemon=True)
    waiter.start()
    waiter.join(limit)
    return not waiter.is_alive()

@check("worker stops at STOP and marks every item done")
def _():
    jobs = Queue()
    for item in (1, 2, 3, STOP):
        jobs.put(item)
    results = []
    worker(jobs, lambda n: n * 10, results)
    eq(sorted(results), [10, 20, 30])
    assert _drained(jobs), "jobs.join() would block: call task_done() once per get(), including for STOP"

@check("worker records an exception and keeps going")
def _():
    jobs = Queue()
    for item in (1, 0, 5, STOP):
        jobs.put(item)
    results = []
    worker(jobs, lambda n: 10 // n, results)
    errors = [item for item in results if isinstance(item, ZeroDivisionError)]
    eq(len(errors), 1, "expected the ZeroDivisionError instance in results")
    eq(sorted(item for item in results if not isinstance(item, BaseException)), [2, 10])
    assert _drained(jobs), "jobs.join() would block: call task_done() even when transform raises"

@check("run_pipeline processes every item and joins its workers")
def _():
    before = threading.active_count()
    results = run_pipeline(range(10), lambda n: n * n, workers=3, maxsize=2)
    eq(sorted(results), [n * n for n in range(10)])
    eq(threading.active_count(), before, "worker threads were still running after run_pipeline returned")

@check("run_pipeline handles empty input")
def _():
    eq(run_pipeline([], lambda n: n), [])

@check("a full queue makes the producer wait")
def _():
    lock = threading.Lock()
    state = {"produced": 0, "consumed": 0, "ahead": 0}
    def source():
        for n in range(20):
            with lock:
                state["produced"] += 1
                state["ahead"] = max(state["ahead"], state["produced"] - state["consumed"])
            yield n
    def slow(n):
        with lock:
            state["consumed"] += 1
        time.sleep(0.01)
        return n
    results = run_pipeline(source(), slow, workers=2, maxsize=2)
    eq(sorted(results), list(range(20)))
    # At most maxsize queued + one item per worker + the one the producer holds.
    assert state["ahead"] <= 5, "the producer ran %d items ahead; read items lazily into a bounded queue" % state["ahead"]
`,
  },
  "multiprocessing": {
    prompt: "Write square_sum(chunk), which returns (sum of the squares in chunk, os.getpid()); chunked(items, size), which returns a list of consecutive lists of at most size items; and parallel_square_sum(numbers, workers=2, chunk_size=1000), which runs square_sum on every chunk in a ProcessPoolExecutor(max_workers=workers) and returns (total, pids), where pids is the set of process ids that did the work. An empty list returns (0, set()). Keep square_sum at module level and create the pool only inside a function: Windows uses the spawn start method, which re-imports your file in every worker, so top-level pool code would run again in each child.",
    hint: "pool.map(square_sum, chunked(numbers, chunk_size)) returns (partial, pid) pairs. Add up the partials and collect the pids into a set.",
    starter: py`
import os
from concurrent.futures import ProcessPoolExecutor

def square_sum(chunk):
    return sum(n * n for n in chunk), os.getpid()

def chunked(items, size):
    return [items]

def parallel_square_sum(numbers, workers=2, chunk_size=1000):
    # Runs in this process. Send the chunks to a process pool instead.
    total, pid = square_sum(numbers)
    return total, {pid}
`,
    solution: py`
import os
from concurrent.futures import ProcessPoolExecutor

def square_sum(chunk):
    return sum(n * n for n in chunk), os.getpid()

def chunked(items, size):
    return [items[start:start + size] for start in range(0, len(items), size)]

def parallel_square_sum(numbers, workers=2, chunk_size=1000):
    if not numbers:
        return 0, set()
    with ProcessPoolExecutor(max_workers=workers) as pool:
        parts = list(pool.map(square_sum, chunked(numbers, chunk_size)))
    return sum(total for total, _ in parts), {pid for _, pid in parts}
`,
    tests: py`
import os
from functools import lru_cache

@lru_cache(maxsize=None)
def _parallel():
    return parallel_square_sum(list(range(10_000)), workers=2, chunk_size=2_500)

@check("chunked keeps order and a short final chunk")
def _():
    eq(chunked([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]])
    eq(chunked([], 3), [])

@check("the parallel total matches the sequential sum")
def _():
    total, pids = _parallel()
    eq(total, sum(n * n for n in range(10_000)))

@check("chunks run in worker processes, not the caller")
def _():
    total, pids = _parallel()
    assert os.getpid() not in pids, "square_sum ran in the calling process; use a ProcessPoolExecutor"
    assert 1 <= len(pids) <= 2, "expected 1 or 2 worker process ids with workers=2, got %r" % (pids,)

@check("an empty list returns (0, set())")
def _():
    eq(parallel_square_sum([]), (0, set()))
`,
  },
  "asyncio": {
    prompt: "Write async def fetch_all(keys, fetch, limit=3, timeout=1.0), which awaits fetch(key) for every key concurrently, with at most limit calls in flight at once (use asyncio.Semaphore), and returns the results in input order. If the whole operation takes longer than timeout seconds, cancel every outstanding fetch, let them finish cancelling, and raise TimeoutError.",
    hint: "Wrap each call in async with semaphore, gather them, and put the gather inside async with asyncio.timeout(timeout). Cancelling the gather cancels its children, and TimeoutError surfaces after they have unwound.",
    starter: py`
import asyncio

async def fetch_all(keys, fetch, limit=3, timeout=1.0):
    # One fetch at a time, with no limit and no timeout.
    results = []
    for key in keys:
        results.append(await fetch(key))
    return results
`,
    solution: py`
import asyncio

async def fetch_all(keys, fetch, limit=3, timeout=1.0):
    semaphore = asyncio.Semaphore(limit)

    async def bounded(key):
        async with semaphore:
            return await fetch(key)

    async with asyncio.timeout(timeout):
        return await asyncio.gather(*(bounded(key) for key in keys))
`,
    tests: py`
import asyncio
import time

@check("returns results in input order")
def _():
    async def fetch(n):
        await asyncio.sleep(0.05 * (3 - n))  # later keys finish first
        return n * 10
    eq(asyncio.run(fetch_all([0, 1, 2, 3], fetch, limit=4)), [0, 10, 20, 30])

@check("runs fetches concurrently")
def _():
    async def fetch(n):
        await asyncio.sleep(0.2)
        return n
    began = time.perf_counter()
    eq(asyncio.run(fetch_all([1, 2, 3, 4, 5], fetch, limit=5)), [1, 2, 3, 4, 5])
    elapsed = time.perf_counter() - began
    assert elapsed < 0.7, "five 0.2 s fetches took %.2f s; they should overlap" % elapsed

@check("never has more than limit fetches in flight")
def _():
    state = {"active": 0, "peak": 0}
    async def fetch(n):
        state["active"] += 1
        state["peak"] = max(state["peak"], state["active"])
        try:
            await asyncio.sleep(0.02)
            return n
        finally:
            state["active"] -= 1
    eq(asyncio.run(fetch_all(list(range(6)), fetch, limit=2)), list(range(6)))
    assert state["peak"] <= 2, "%d fetches ran at once with limit=2" % state["peak"]

@check("on timeout, cancels in-flight fetches before raising TimeoutError")
def _():
    started, cleaned = [], []
    async def stuck(key):
        started.append(key)
        try:
            await asyncio.sleep(10)
        finally:
            cleaned.append(key)
    async def scenario():
        try:
            await fetch_all(["a", "b", "c", "d"], stuck, limit=2, timeout=0.2)
        except TimeoutError:
            return sorted(started), sorted(cleaned)
        raise AssertionError("expected TimeoutError")
    began = time.perf_counter()
    started_keys, cleaned_keys = asyncio.run(scenario())
    assert time.perf_counter() - began < 0.8, "fetch_all did not stop at its timeout"
    eq(len(started_keys), 2, "with limit=2, exactly two fetches should have started")
    eq(cleaned_keys, started_keys, "started fetches must be cancelled and cleaned up before TimeoutError is raised")
`,
  },
  "concurrency-design": {
    prompt: "Write process_batch(items, handler, workers=4, retries=2), which calls handler(item) for every (hashable) item using at most workers threads and returns (results, failures): results maps each item to its return value, and failures maps each item to its final exception. Retry an item only when handler raises ConnectionError or TimeoutError, up to retries extra attempts; any other exception fails the item immediately. Every worker thread must have finished when the function returns.",
    hint: "Put the retry loop inside the function you submit to a ThreadPoolExecutor, and let the with block's shutdown wait for the threads. Real code would also add backoff with jitter between attempts.",
    starter: py`
from concurrent.futures import ThreadPoolExecutor

def process_batch(items, handler, workers=4, retries=2):
    # Sequential, with no retries yet.
    results, failures = {}, {}
    for item in items:
        try:
            results[item] = handler(item)
        except Exception as error:
            failures[item] = error
    return results, failures
`,
    solution: py`
from concurrent.futures import ThreadPoolExecutor

RETRYABLE = (ConnectionError, TimeoutError)

def _attempt(handler, item, retries):
    for attempt in range(retries + 1):
        try:
            return handler(item)
        except RETRYABLE:
            if attempt == retries:
                raise

def process_batch(items, handler, workers=4, retries=2):
    results, failures = {}, {}
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(_attempt, handler, item, retries): item for item in items}
        for future, item in futures.items():
            try:
                results[item] = future.result()
            except Exception as error:
                failures[item] = error
    return results, failures
`,
    tests: py`
import threading
import time

class _Attempts:
    def __init__(self):
        self.lock = threading.Lock()
        self.counts = {}

    def bump(self, item):
        with self.lock:
            self.counts[item] = self.counts.get(item, 0) + 1
            return self.counts[item]

@check("returns results and failures for every item")
def _():
    def handler(item):
        if item < 0:
            raise ValueError("negative: %d" % item)
        return item * 10
    results, failures = process_batch([1, -1, 2], handler, workers=2)
    eq(results, {1: 10, 2: 20})
    eq(sorted(failures), [-1])
    assert isinstance(failures[-1], ValueError), "failures should map the item to its exception"

@check("retries ConnectionError and TimeoutError up to the limit")
def _():
    attempts = _Attempts()
    def handler(item):
        count = attempts.bump(item)
        if item == "flaky" and count < 3:
            raise ConnectionError("try again")
        if item == "down":
            raise TimeoutError("still down")
        return item.upper()
    results, failures = process_batch(["flaky", "down", "ok"], handler, workers=2, retries=2)
    eq(results, {"flaky": "FLAKY", "ok": "OK"})
    assert isinstance(failures.get("down"), TimeoutError), "an item that keeps timing out should end in failures"
    eq(attempts.counts, {"flaky": 3, "down": 3, "ok": 1})

@check("does not retry other exceptions")
def _():
    attempts = _Attempts()
    def handler(item):
        attempts.bump(item)
        raise KeyError(item)
    results, failures = process_batch(["a", "b"], handler, retries=3)
    eq(results, {})
    eq(attempts.counts, {"a": 1, "b": 1}, "a KeyError should not be retried")
    assert all(isinstance(error, KeyError) for error in failures.values())

@check("never runs more than workers handlers at once")
def _():
    lock = threading.Lock()
    state = {"active": 0, "peak": 0}
    def handler(item):
        with lock:
            state["active"] += 1
            state["peak"] = max(state["peak"], state["active"])
        try:
            time.sleep(0.02)
            return item
        finally:
            with lock:
                state["active"] -= 1
    results, failures = process_batch(list(range(8)), handler, workers=2)
    eq(len(results), 8)
    assert state["peak"] <= 2, "%d handlers ran at once with workers=2" % state["peak"]

@check("every worker thread has finished when it returns")
def _():
    before = threading.active_count()
    process_batch(list(range(6)), lambda item: time.sleep(0.01) or item, workers=3)
    eq(threading.active_count(), before, "worker threads were still running after process_batch returned")
`,
  },

  // ---------------------------------------------------------------- advanced
  "mutability-copy": {
    prompt: "Write merge_config(base, override), which returns a new dict containing the keys of both: when both values are dicts, merge them recursively; otherwise the override value (including a list) replaces the base value. Neither input may change, and the result must not share any nested dict or list with either input, so editing the result can never leak back into them.",
    hint: "Deep-copy base once, then walk override: recurse into pairs where both sides are dicts and assign deepcopy(value) everywhere else.",
    starter: py`
from copy import deepcopy

def merge_config(base, override):
    # A shallow merge: nested dicts are replaced and still shared.
    return {**base, **override}
`,
    solution: py`
from copy import deepcopy

def merge_config(base, override):
    merged = deepcopy(base)
    _merge_into(merged, override)
    return merged

def _merge_into(target, override):
    for key, value in override.items():
        if isinstance(target.get(key), dict) and isinstance(value, dict):
            _merge_into(target[key], value)
        else:
            target[key] = deepcopy(value)
`,
    tests: py`
from copy import deepcopy

def _inputs():
    base = {
        "db": {"host": "localhost", "port": 5432, "options": {"ssl": False}},
        "hosts": ["a", "b"],
        "cache": {"ttl": 5},
        "debug": False,
    }
    override = {
        "db": {"host": "db.internal", "options": {"ssl": True}},
        "hosts": ["c"],
        "debug": True,
        "extra": {"tags": ["x"]},
    }
    return base, override

@check("merges nested dicts recursively")
def _():
    base, override = _inputs()
    merged = merge_config(base, override)
    eq(merged["db"], {"host": "db.internal", "port": 5432, "options": {"ssl": True}})
    eq(merged["cache"], {"ttl": 5})
    eq(merged["extra"], {"tags": ["x"]})

@check("override replaces lists and other non-dict values")
def _():
    base, override = _inputs()
    merged = merge_config(base, override)
    eq((merged["hosts"], merged["debug"]), (["c"], True))
    eq(merge_config({"a": {"x": 1}}, {"a": 3}), {"a": 3})
    eq(merge_config({"a": 3}, {"a": {"x": 1}}), {"a": {"x": 1}})

@check("leaves both inputs unchanged")
def _():
    base, override = _inputs()
    before = deepcopy((base, override))
    merge_config(base, override)
    eq((base, override), before)

@check("result shares no nested dict or list with the inputs")
def _():
    base, override = _inputs()
    before = deepcopy((base, override))
    merged = merge_config(base, override)
    merged["cache"]["ttl"] = 99
    merged["db"]["options"]["ssl"] = "changed"
    merged["hosts"].append("z")
    merged["extra"]["tags"].append("y")
    eq((base, override), before, "changing the merged config changed one of the inputs")
`,
  },
  "decorators": {
    prompt: "Write a decorator factory retry(times, exceptions=(Exception,)). The decorated function is called up to times times in total, retrying only when it raises one of exceptions; any other exception propagates immediately, and after the last failed attempt the last exception is re-raised. Forward all positional and keyword arguments, return the first successful result, and use functools.wraps so the wrapper keeps the original __name__ and __doc__.",
    hint: "Loop over the attempts, catch only the listed exceptions, and re-raise on the last attempt. Exceptions that aren't in the tuple pass straight through the except clause.",
    starter: py`
from functools import wraps

def retry(times, exceptions=(Exception,)):
    def decorate(func):
        def wrapper(*args, **kwargs):
            return func(*args, **kwargs)
        return wrapper
    return decorate
`,
    solution: py`
from functools import wraps

def retry(times, exceptions=(Exception,)):
    def decorate(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(1, times + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions:
                    if attempt == times:
                        raise
        return wrapper
    return decorate
`,
    tests: py`
@check("keeps the wrapped function's name and docstring")
def _():
    @retry(3)
    def fetch_profile(user_id):
        """Load a profile."""
        return user_id
    eq(fetch_profile.__name__, "fetch_profile")
    eq(fetch_profile.__doc__, "Load a profile.")

@check("retries until a call succeeds")
def _():
    calls = []
    @retry(3, exceptions=(ConnectionError,))
    def flaky():
        calls.append(1)
        if len(calls) < 3:
            raise ConnectionError("not yet")
        return "ok"
    eq(flaky(), "ok")
    eq(len(calls), 3)

@check("re-raises the last error after the final attempt")
def _():
    calls = []
    @retry(3)
    def broken():
        calls.append(1)
        raise ConnectionError("attempt %d" % len(calls))
    error = raises(ConnectionError, broken)
    eq(str(error), "attempt 3")
    eq(len(calls), 3)

@check("does not retry exceptions outside the list")
def _():
    calls = []
    @retry(5, exceptions=(ConnectionError,))
    def invalid():
        calls.append(1)
        raise ValueError("bad input")
    raises(ValueError, invalid)
    eq(len(calls), 1)

@check("forwards positional and keyword arguments")
def _():
    @retry(2)
    def power(base, exponent=2):
        return base ** exponent
    eq(power(3), 9)
    eq(power(2, exponent=5), 32)
`,
  },
  "caching": {
    prompt: "Write a decorator factory ttl_cache(ttl, clock=time.monotonic) that caches results by the call's positional arguments and reuses an entry only while clock() - stored_at < ttl; after that, the function runs again and the entry is refreshed. Give the wrapper a cache_clear() method, keep the wrapped function's __name__ with functools.wraps, and let unhashable arguments raise TypeError, as lru_cache does. The clock is injected so the checks can move time without sleeping.",
    hint: "Store (value, stored_at) in a dict keyed by the args tuple; looking up an unhashable key raises TypeError for you. Attach the method with wrapper.cache_clear = cache.clear.",
    starter: py`
import time
from functools import wraps

def ttl_cache(ttl, clock=time.monotonic):
    def decorate(func):
        cache = {}

        @wraps(func)
        def wrapper(*args):
            # Entries never expire yet.
            if args not in cache:
                cache[args] = func(*args)
            return cache[args]

        return wrapper
    return decorate
`,
    solution: py`
import time
from functools import wraps

def ttl_cache(ttl, clock=time.monotonic):
    def decorate(func):
        cache = {}

        @wraps(func)
        def wrapper(*args):
            now = clock()
            entry = cache.get(args)
            if entry is not None and now - entry[1] < ttl:
                return entry[0]
            value = func(*args)
            cache[args] = (value, now)
            return value

        wrapper.cache_clear = cache.clear
        return wrapper
    return decorate
`,
    tests: py`
class _Clock:
    def __init__(self):
        self.now = 1000.0

    def __call__(self):
        return self.now

def _counted(ttl):
    clock = _Clock()
    calls = []
    @ttl_cache(ttl, clock=clock)
    def price(sku):
        calls.append(sku)
        return "%s@%d" % (sku, len(calls))
    return price, clock, calls

@check("reuses a result within the ttl")
def _():
    price, clock, calls = _counted(10)
    first = price("apple")
    clock.now += 9.5
    eq(price("apple"), first)
    eq(calls, ["apple"])

@check("recomputes once the ttl has passed")
def _():
    price, clock, calls = _counted(10)
    first = price("apple")
    clock.now += 10
    second = price("apple")
    assert second != first, "an entry exactly ttl seconds old should be recomputed"
    clock.now += 5
    eq(price("apple"), second, "the refreshed entry should be reused")
    eq(calls, ["apple", "apple"])

@check("caches each argument tuple separately")
def _():
    price, clock, calls = _counted(10)
    for sku in ("apple", "pear", "apple", "pear"):
        price(sku)
    eq(calls, ["apple", "pear"])

@check("cache_clear forces a fresh call")
def _():
    price, clock, calls = _counted(10)
    price("apple")
    price.cache_clear()
    price("apple")
    eq(calls, ["apple", "apple"])

@check("keeps __name__ and rejects unhashable arguments")
def _():
    price, clock, calls = _counted(10)
    eq(price.__name__, "price")
    raises(TypeError, price, ["apple"])
`,
  },
  "debugging-observability": {
    prompt: "Write redact(data), which returns a copy of a JSON-like value in which every dict value whose key is password, token, secret or api_key (in any letter case) becomes \"***\", searching nested dicts and lists without changing the input. Write log_event(logger, event, request_id, payload), which emits exactly one INFO record whose message is f\"{event} request_id={request_id}\" and attaches the redacted payload with extra={\"payload\": ...}. Finally, write safe_call(logger, func, *args), which returns func(*args), or logs the failure with logger.exception(...), keeping the traceback, and returns None.",
    hint: "Recurse into dicts and lists and return other values unchanged. Pass values to the logger as arguments rather than formatting the payload into the message yourself.",
    starter: py`
import logging

def redact(data):
    return data

def log_event(logger, event, request_id, payload):
    logger.info("%s request_id=%s payload=%s", event, request_id, payload)

def safe_call(logger, func, *args):
    try:
        return func(*args)
    except Exception as error:
        logger.error("call failed: %s", error)
        return None
`,
    solution: py`
import logging

SENSITIVE = {"password", "token", "secret", "api_key"}

def redact(data):
    if isinstance(data, dict):
        return {key: "***" if str(key).lower() in SENSITIVE else redact(value) for key, value in data.items()}
    if isinstance(data, list):
        return [redact(item) for item in data]
    return data

def log_event(logger, event, request_id, payload):
    logger.info("%s request_id=%s", event, request_id, extra={"payload": redact(payload)})

def safe_call(logger, func, *args):
    try:
        return func(*args)
    except Exception:
        logger.exception("call to %s failed", getattr(func, "__name__", func))
        return None
`,
    tests: py`
import logging

class _Capture(logging.Handler):
    def __init__(self):
        super().__init__(logging.DEBUG)
        self.records = []

    def emit(self, record):
        self.records.append(record)

def _logger(name):
    logger = logging.getLogger("lesson-check." + name)
    logger.handlers.clear()
    logger.setLevel(logging.DEBUG)
    logger.propagate = False
    capture = _Capture()
    logger.addHandler(capture)
    return logger, capture

def _payload():
    return {
        "user": "ada",
        "Password": "hunter2",
        "auth": {"TOKEN": "tok-123", "scopes": ["read"]},
        "items": [{"api_key": "key-456", "id": 1}],
        "note": None,
    }

@check("redacts sensitive keys at any depth and in any case")
def _():
    eq(redact(_payload()), {
        "user": "ada",
        "Password": "***",
        "auth": {"TOKEN": "***", "scopes": ["read"]},
        "items": [{"api_key": "***", "id": 1}],
        "note": None,
    })
    eq(redact({"Secret": {"nested": 1}}), {"Secret": "***"})

@check("redact leaves the original payload unchanged")
def _():
    payload = _payload()
    redact(payload)
    eq(payload, _payload())

@check("log_event emits one INFO record with the request id")
def _():
    logger, capture = _logger("event")
    log_event(logger, "login", "req-42", _payload())
    eq(len(capture.records), 1, "expected exactly one log record")
    record = capture.records[0]
    eq(record.levelno, logging.INFO)
    eq(record.getMessage(), "login request_id=req-42")

@check("the logged payload is redacted and no secret is printed")
def _():
    logger, capture = _logger("payload")
    log_event(logger, "login", "req-42", _payload())
    record = capture.records[0]
    payload = getattr(record, "payload", None)
    assert isinstance(payload, dict), "attach the redacted payload with extra={'payload': ...}"
    eq(payload["Password"], "***")
    text = logging.Formatter("%(message)s %(payload)s").format(record)
    for secret in ("hunter2", "tok-123", "key-456"):
        assert secret not in text, "a secret value leaked into the log output"

@check("safe_call logs the traceback and returns None")
def _():
    logger, capture = _logger("safe")
    eq(safe_call(logger, lambda a, b: a / b, 6, 3), 2.0)
    eq(capture.records, [], "a successful call should not log")
    eq(safe_call(logger, lambda a, b: a / b, 1, 0), None)
    eq(len(capture.records), 1)
    record = capture.records[0]
    eq(record.levelno, logging.ERROR)
    assert record.exc_info and record.exc_info[0] is ZeroDivisionError, "use logger.exception so the record keeps the traceback"
`,
  },

  // --------------------------------------------------------------- internals
  "object-model": {
    prompt: "Define a module-level sentinel MISSING = object() and write lookup(mapping, key, default=MISSING). Return mapping[key] when the key is present (even if the value is None or 0); otherwise return default whenever the caller passed one, including None, 0 or False, and raise KeyError(key) only when no default was given. Also write unique_objects(items), which keeps the first occurrence of each distinct object, comparing by identity rather than equality, preserves order, and works for unhashable items such as lists.",
    hint: "Compare default is MISSING, never default is None. For unique_objects, keep a set of id(item): the ids stay valid because the input list keeps every item alive.",
    starter: py`
def lookup(mapping, key, default=None):
    if key in mapping:
        return mapping[key]
    if default is None:
        raise KeyError(key)
    return default

def unique_objects(items):
    result = []
    for item in items:
        if item not in result:
            result.append(item)
    return result
`,
    solution: py`
MISSING = object()

def lookup(mapping, key, default=MISSING):
    if key in mapping:
        return mapping[key]
    if default is MISSING:
        raise KeyError(key)
    return default

def unique_objects(items):
    seen = set()
    result = []
    for item in items:
        if id(item) not in seen:
            seen.add(id(item))
            result.append(item)
    return result
`,
    tests: py`
@check("returns stored values, even falsy ones")
def _():
    eq(lookup({"a": 0}, "a"), 0)
    eq(lookup({"a": None}, "a", "fallback"), None)

@check("returns an explicit default of None, 0 or False")
def _():
    eq(lookup({}, "x", None), None)
    eq(lookup({}, "x", 0), 0)
    assert lookup({}, "x", False) is False

@check("raises KeyError only when no default is given")
def _():
    error = raises(KeyError, lookup, {"a": 1}, "missing")
    eq(error.args, ("missing",))

@check("unique_objects compares identity, not equality")
def _():
    a, b = [1], [1]
    result = unique_objects([a, b, a, b, a])
    eq(len(result), 2, "two equal but distinct lists are different objects")
    assert result[0] is a and result[1] is b, "keep the first occurrence of each object, in order"

@check("unique_objects keeps order and accepts unhashable items")
def _():
    x, y = {"k": 1}, {"k": 2}
    result = unique_objects([y, x, y, x])
    assert len(result) == 2 and result[0] is y and result[1] is x
    eq(unique_objects([]), [])
`,
  },
  "memory-gc": {
    prompt: "Write SessionRegistry(on_evict=None), which remembers sessions (any object with an id attribute) without keeping them alive. add(session) registers it under session.id, get(session_id) returns the session or None once it has been garbage-collected, and len(registry) counts only live sessions. If on_evict is given, call on_evict(session_id) exactly once when a registered session is collected, and make sure that callback holds no reference to the session itself.",
    hint: "weakref.WeakValueDictionary handles get and len. For the callback, weakref.finalize(session, on_evict, session.id) passes only the id, not the session.",
    starter: py`
import weakref

class SessionRegistry:
    def __init__(self, on_evict=None):
        self._sessions = {}  # strong references keep every session alive

    def add(self, session):
        self._sessions[session.id] = session

    def get(self, session_id):
        return self._sessions.get(session_id)

    def __len__(self):
        return len(self._sessions)
`,
    solution: py`
import weakref

class SessionRegistry:
    def __init__(self, on_evict=None):
        self._sessions = weakref.WeakValueDictionary()
        self._on_evict = on_evict

    def add(self, session):
        self._sessions[session.id] = session
        if self._on_evict is not None:
            weakref.finalize(session, self._on_evict, session.id)

    def get(self, session_id):
        return self._sessions.get(session_id)

    def __len__(self):
        return len(self._sessions)
`,
    tests: py`
import gc

class Session:
    def __init__(self, id):
        self.id = id

@check("returns registered sessions while they are alive")
def _():
    registry = SessionRegistry()
    a, b = Session("a"), Session("b")
    registry.add(a)
    registry.add(b)
    assert registry.get("a") is a and registry.get("b") is b, "get should return the registered session object"
    eq(registry.get("missing"), None)

@check("does not keep sessions alive")
def _():
    registry = SessionRegistry()
    session = Session("temp")
    registry.add(session)
    del session
    gc.collect()
    eq(registry.get("temp"), None, "the registry kept the session alive; hold it with a weak reference")

@check("len counts only live sessions")
def _():
    registry = SessionRegistry()
    keep, drop = Session("keep"), Session("drop")
    registry.add(keep)
    registry.add(drop)
    eq(len(registry), 2)
    del drop
    gc.collect()
    eq(len(registry), 1)
    assert registry.get("keep") is keep

@check("calls on_evict once with the id when a session is collected")
def _():
    evicted = []
    registry = SessionRegistry(on_evict=evicted.append)
    session = Session("s-1")
    registry.add(session)
    eq(evicted, [], "on_evict ran before the session was collected")
    del session
    gc.collect()
    eq(evicted, ["s-1"])
    gc.collect()
    eq(evicted, ["s-1"], "on_evict ran more than once")
`,
  },
  "slots-memory": {
    prompt: "Write Vector2(x, y) using __slots__, so instances have no __dict__ and assigning any undeclared attribute raises AttributeError. v + w returns a new Vector2, and repr(Vector2(1, 2)) is \"Vector2(1, 2)\". Then write Vector3(Vector2), which adds a z coordinate: declare only the new slot (\"z\",) in the subclass, so its instances have no __dict__ either.",
    hint: "A subclass without its own __slots__ gets a __dict__ again, and repeating the parent's names wastes space. Call super().__init__(x, y) from Vector3.",
    starter: py`
class Vector2:
    def __init__(self, x, y):
        self.x = x
        self.y = y

class Vector3(Vector2):
    def __init__(self, x, y, z):
        super().__init__(x, y)
        self.z = z
`,
    solution: py`
class Vector2:
    __slots__ = ("x", "y")

    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __add__(self, other):
        if not isinstance(other, Vector2):
            return NotImplemented
        return Vector2(self.x + other.x, self.y + other.y)

    def __repr__(self):
        return f"Vector2({self.x!r}, {self.y!r})"

class Vector3(Vector2):
    __slots__ = ("z",)

    def __init__(self, x, y, z):
        super().__init__(x, y)
        self.z = z
`,
    tests: py`
@check("Vector2 instances have no __dict__")
def _():
    v = Vector2(1, 2)
    assert not hasattr(v, "__dict__"), "declare __slots__ so instances have no __dict__"
    eq((v.x, v.y), (1, 2))

@check("assigning an undeclared attribute raises AttributeError")
def _():
    v = Vector2(1, 2)
    raises(AttributeError, setattr, v, "z", 3)
    v.x = 5
    eq(v.x, 5)

@check("addition returns a new Vector2 with a readable repr")
def _():
    a, b = Vector2(1, 2), Vector2(10, 20)
    c = a + b
    assert isinstance(c, Vector2) and c is not a and c is not b, "a + b should return a new Vector2"
    eq((c.x, c.y), (11, 22))
    eq((a.x, a.y), (1, 2), "a + b must not change a")
    eq(repr(Vector2(1, 2)), "Vector2(1, 2)")

@check("Vector3 declares only z and still has no __dict__")
def _():
    v = Vector3(1, 2, 3)
    eq((v.x, v.y, v.z), (1, 2, 3))
    assert not hasattr(v, "__dict__"), "declare __slots__ in Vector3 too, or its instances get a __dict__"
    slots = Vector3.__dict__.get("__slots__", ())
    names = (slots,) if isinstance(slots, str) else tuple(slots)
    eq(names, ("z",), "Vector3 should declare only its new slot")
`,
  },
  "data-model": {
    prompt: "Write a Money(amount, currency) class, where amount is an integer number of cents. Two Money objects are equal when both fields match, comparing with any other type is simply unequal (return NotImplemented), and equal objects must hash equally so Money works in sets and as a dict key. Support <, <=, > and >= (functools.total_ordering is fine), raising ValueError when the currencies differ, and give it a repr like Money(250, 'EUR').",
    hint: "Hash the same (amount, currency) tuple that __eq__ compares. Check the currency inside __lt__, so every comparison total_ordering derives from it raises the ValueError too.",
    starter: py`
from functools import total_ordering

class Money:
    def __init__(self, amount, currency):
        self.amount = amount
        self.currency = currency

    def __eq__(self, other):
        return self.amount == other.amount and self.currency == other.currency
`,
    solution: py`
from functools import total_ordering

@total_ordering
class Money:
    def __init__(self, amount, currency):
        self.amount = amount
        self.currency = currency

    def _key(self):
        return (self.amount, self.currency)

    def __eq__(self, other):
        if not isinstance(other, Money):
            return NotImplemented
        return self._key() == other._key()

    def __hash__(self):
        return hash(self._key())

    def __lt__(self, other):
        if not isinstance(other, Money):
            return NotImplemented
        if self.currency != other.currency:
            raise ValueError(f"cannot compare {self.currency} with {other.currency}")
        return self.amount < other.amount

    def __repr__(self):
        return f"Money({self.amount!r}, {self.currency!r})"
`,
    tests: py`
@check("equal fields compare equal; other types compare unequal")
def _():
    eq(Money(100, "USD"), Money(100, "USD"))
    assert Money(100, "USD") != Money(100, "EUR")
    assert Money(100, "USD") != Money(101, "USD")
    assert (Money(100, "USD") == 100) is False, "comparing with an int should be False, not an error"
    assert Money(100, "USD") != "100 USD"

@check("equal objects hash equally for sets and dict keys")
def _():
    eq(len({Money(5, "USD"), Money(5, "USD"), Money(5, "EUR")}), 2)
    prices = {Money(5, "USD"): "five dollars"}
    eq(prices.get(Money(5, "USD")), "five dollars")

@check("supports all four ordering operators")
def _():
    small, big = Money(100, "USD"), Money(250, "USD")
    assert small < big and small <= big and big > small and big >= small
    assert Money(100, "USD") <= Money(100, "USD") and Money(100, "USD") >= Money(100, "USD")
    assert not (big < small)
    eq(sorted([big, small, Money(50, "USD")]), [Money(50, "USD"), small, big])

@check("ordering across currencies raises ValueError")
def _():
    usd, eur = Money(100, "USD"), Money(100, "EUR")
    for compare in (lambda: usd < eur, lambda: usd <= eur, lambda: usd > eur, lambda: usd >= eur):
        raises(ValueError, compare)

@check("repr shows the amount and currency")
def _():
    eq(repr(Money(250, "EUR")), "Money(250, 'EUR')")
`,
  },
  "attribute-lookup": {
    prompt: "Write a descriptor class Bounded(low, high) for numeric attributes. Assigning a value outside low..high (inclusive) raises ValueError, reading returns the value stored for that instance, reading it from the class (Model.attr) returns the descriptor itself, and reading an attribute that was never assigned raises AttributeError. Use __set_name__ to learn the attribute's name and store each value on the instance, so two instances, or two Bounded attributes on one class, never share state.",
    hint: "Bounded defines __set__, so it is a data descriptor and takes priority over the instance __dict__. That means you can store the value in obj.__dict__ under the same name. Return self from __get__ when obj is None.",
    starter: py`
class Bounded:
    def __init__(self, low, high):
        self.low = low
        self.high = high
        self.value = None

    def __get__(self, obj, objtype=None):
        return self.value

    def __set__(self, obj, value):
        self.value = value  # stored on the descriptor, so every instance shares it
`,
    solution: py`
class Bounded:
    def __init__(self, low, high):
        self.low = low
        self.high = high

    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        try:
            return obj.__dict__[self.name]
        except KeyError:
            raise AttributeError(self.name) from None

    def __set__(self, obj, value):
        if not self.low <= value <= self.high:
            raise ValueError(f"{self.name} must be between {self.low} and {self.high}, got {value!r}")
        obj.__dict__[self.name] = value
`,
    tests: py`
def _reading_class():
    class Reading:
        celsius = Bounded(-50, 60)
        humidity = Bounded(0, 100)

        def __init__(self, celsius, humidity):
            self.celsius = celsius
            self.humidity = humidity
    return Reading

@check("each instance keeps its own value")
def _():
    Reading = _reading_class()
    a, b = Reading(20, 50), Reading(-5, 80)
    eq((a.celsius, a.humidity), (20, 50))
    eq((b.celsius, b.humidity), (-5, 80))

@check("two Bounded attributes on one class stay independent")
def _():
    Reading = _reading_class()
    reading = Reading(20, 50)
    reading.celsius = 30
    eq(reading.humidity, 50)
    reading.humidity = 10
    eq(reading.celsius, 30)

@check("rejects values outside the inclusive bounds")
def _():
    Reading = _reading_class()
    raises(ValueError, Reading, 61, 50)
    reading = Reading(-50, 100)
    raises(ValueError, setattr, reading, "humidity", -1)
    eq(reading.humidity, 100, "a rejected assignment must not change the value")
    reading.celsius = 60
    eq(reading.celsius, 60)

@check("reading from the class returns the descriptor")
def _():
    Reading = _reading_class()
    assert Reading.celsius is Reading.__dict__["celsius"], "return self from __get__ when obj is None"
    assert isinstance(Reading.humidity, Bounded)

@check("an attribute that was never assigned raises AttributeError")
def _():
    class Gauge:
        level = Bounded(0, 10)
    raises(AttributeError, getattr, Gauge(), "level")
    eq(hasattr(Gauge(), "level"), False)
`,
  },
  "profiling": {
    prompt: "Write three measurement helpers. count_calls(func, *args) runs func(*args) under cProfile and returns (result, calls), where calls maps each function name to its total number of calls, recursive calls included. peak_bytes(func, *args) returns (result, peak), the peak traced memory in bytes during the call, and leaves tracemalloc running only if it already was; best_time(func, number, repeat) uses timeit to return the fastest per-call time in seconds, the minimum of repeat runs, each divided by number.",
    hint: "pstats.Stats(profiler).stats maps (file, line, name) to a tuple whose second item is the total call count. Call tracemalloc.reset_peak() before running func, and compute min(timeit.repeat(func, number=number, repeat=repeat)) / number.",
    starter: py`
import cProfile
import pstats
import timeit
import tracemalloc

def count_calls(func, *args):
    return func(*args), {}

def peak_bytes(func, *args):
    return func(*args), 0

def best_time(func, number=1000, repeat=5):
    return 0.0
`,
    solution: py`
import cProfile
import pstats
import timeit
import tracemalloc

def count_calls(func, *args):
    profiler = cProfile.Profile()
    result = profiler.runcall(func, *args)
    calls = {}
    for (_file, _line, name), (_primitive, total, *_rest) in pstats.Stats(profiler).stats.items():
        calls[name] = calls.get(name, 0) + total
    return result, calls

def peak_bytes(func, *args):
    was_tracing = tracemalloc.is_tracing()
    if not was_tracing:
        tracemalloc.start()
    tracemalloc.reset_peak()
    try:
        result = func(*args)
        _current, peak = tracemalloc.get_traced_memory()
    finally:
        if not was_tracing:
            tracemalloc.stop()
    return result, peak

def best_time(func, number=1000, repeat=5):
    return min(timeit.repeat(func, number=number, repeat=repeat)) / number
`,
    tests: py`
import time
import tracemalloc

def double(n):
    return n * 2

def sum_doubles(n):
    total = 0
    for i in range(n):
        total += double(i)
    return total

def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)

@check("count_calls returns the result and counts calls by name")
def _():
    result, calls = count_calls(sum_doubles, 50)
    eq(result, sum(i * 2 for i in range(50)))
    eq((calls.get("sum_doubles"), calls.get("double")), (1, 50))

@check("count_calls includes recursive calls")
def _():
    result, calls = count_calls(fib, 10)
    eq(result, 55)
    eq(calls.get("fib"), 177, "fib(10) makes 177 calls in total, counting recursion")

@check("peak_bytes sees a temporary allocation")
def _():
    def build():
        data = bytearray(2_000_000)
        return len(data)
    result, peak = peak_bytes(build)
    eq(result, 2_000_000)
    assert peak >= 2_000_000, "peak should cover the 2 MB buffer, got %r" % (peak,)

@check("peak_bytes leaves tracemalloc as it found it")
def _():
    if tracemalloc.is_tracing():
        tracemalloc.stop()
    peak_bytes(lambda: None)
    eq(tracemalloc.is_tracing(), False, "stop tracemalloc afterwards if it wasn't running before")
    tracemalloc.start()
    try:
        result, peak = peak_bytes(lambda: len(bytearray(500_000)))
        eq(tracemalloc.is_tracing(), True, "don't stop tracemalloc if the caller had already started it")
        assert peak >= 500_000, "peak should cover the buffer even when tracing was already on"
    finally:
        tracemalloc.stop()

@check("best_time returns the fastest per-call time")
def _():
    def nap():
        time.sleep(0.02)
    seconds = best_time(nap, number=5, repeat=3)
    assert 0.015 <= seconds < 0.06, "expected about 0.02 s per call, got %r" % (seconds,)
`,
  },
  "bytecode-gil": {
    prompt: "Write global_names(func), which uses dis.get_instructions to return (reads, writes): sorted, duplicate-free lists of the global names that func's own bytecode loads with LOAD_GLOBAL and stores with STORE_GLOBAL. Builtins such as len count as reads, but local variables, attribute names and code inside nested functions don't count. Also write gil_enabled(), which returns sys._is_gil_enabled() on interpreters that have it (3.13+) and True otherwise.",
    hint: "Each Instruction has opname and argval, and for these two opcodes argval is the plain name. func.__code__.co_names won't do, because it mixes globals with attribute names.",
    starter: py`
import dis
import sys

def global_names(func):
    names = sorted(set(func.__code__.co_names))
    return names, []

def gil_enabled():
    return sys._is_gil_enabled()
`,
    solution: py`
import dis
import sys

def global_names(func):
    reads, writes = set(), set()
    for instruction in dis.get_instructions(func):
        if instruction.opname == "LOAD_GLOBAL":
            reads.add(instruction.argval)
        elif instruction.opname == "STORE_GLOBAL":
            writes.add(instruction.argval)
    return sorted(reads), sorted(writes)

def gil_enabled():
    check = getattr(sys, "_is_gil_enabled", None)
    return True if check is None else check()
`,
    tests: py`
import sys

def _reader():
    return len(DATA) + OFFSET + DATA[0]

def _writer():
    global COUNT
    COUNT += 1

def _locals_only(record):
    total = record.total
    def nested():
        return SECRET
    return total.real, nested

@check("reports global reads, including builtins")
def _():
    eq(global_names(_reader), (["DATA", "OFFSET", "len"], []))

@check("reports global writes made through a global statement")
def _():
    eq(global_names(_writer), (["COUNT"], ["COUNT"]))

@check("ignores locals, attributes and nested functions")
def _():
    eq(global_names(_locals_only), ([], []))

@check("gil_enabled matches the running interpreter")
def _():
    expected = sys._is_gil_enabled() if hasattr(sys, "_is_gil_enabled") else True
    eq(gil_enabled(), expected)
`,
  },
};
