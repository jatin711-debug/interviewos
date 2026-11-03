import { LLDProblem } from "./types";

export const CONCURRENCY_PROBLEMS: LLDProblem[] = [
  {
    id: "lld-rate-limiter",
    title: "Thread-Safe Token Bucket Rate Limiter",
    category: "Concurrency & Systems",
    difficulty: "Medium",
    summary:
      "Design a production-grade Token Bucket Rate Limiter that allows a maximum burst of N tokens and refills at a steady rate of R tokens per second. Implemented without background polling threads by computing fractional token replenishment on the fly using delta timestamps.",
    requirements: {
      functional: [
        "allowRequest(tokens: int = 1) -> bool returns true if sufficient tokens exist, atomically deducting them.",
        "Refills tokens at continuous rate R tokens/sec up to bucket capacity C.",
        "Allows bursts up to capacity C after idle periods.",
        "Per-client (IP/API key) rate limiting with automatic idle state eviction.",
      ],
      nonFunctional: [
        "Thread Safety: Thousands of concurrent requests must not cause race conditions or over-allocate tokens.",
        "Zero-Sleep Efficiency: Do not use background sleep threads to tick every millisecond; calculate refill dynamically via delta time (now - last_refill).",
      ],
    },
    designPatternsUsed: [
      "Strategy Pattern (Rate Limiting algorithms: Token Bucket vs Leaky Bucket vs Sliding Window Log)",
      "Mutex / Lock Striping (Fine-grained per-client locking)",
    ],
    mermaidDiagram: `sequenceDiagram
    autonumber
    actor Client
    participant RateLimiter
    participant BucketState

    Client->>RateLimiter: allowRequest(tokens=1)
    RateLimiter->>BucketState: Lock Mutex
    RateLimiter->>BucketState: delta = now - lastRefill
    RateLimiter->>BucketState: tokens = min(capacity, tokens + delta * refillRate)
    alt tokens >= requested
        RateLimiter->>BucketState: tokens -= requested, update lastRefill
        RateLimiter->>BucketState: Unlock Mutex
        RateLimiter-->>Client: Return TRUE (Allow 200 OK)
    else tokens < requested
        RateLimiter->>BucketState: Unlock Mutex
        RateLimiter-->>Client: Return FALSE (HTTP 429 Too Many Requests)
    end`,
    pythonCode: `# Thread-Safe Token Bucket Rate Limiter in Python
import time
import threading
from typing import Dict

class TokenBucket:
    def __init__(self, capacity: float, refill_rate_per_sec: float):
        self.capacity = float(capacity)
        self.refill_rate = float(refill_rate_per_sec)
        self.tokens = float(capacity)
        self.last_refill_timestamp = time.monotonic()
        self._lock = threading.Lock()

    def allow(self, requested: float = 1.0) -> bool:
        with self._lock:
            now = time.monotonic()
            elapsed = now - self.last_refill_timestamp

            # On-the-fly fractional refill
            if elapsed > 0:
                self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
                self.last_refill_timestamp = now

            if self.tokens >= requested:
                self.tokens -= requested
                return True
            return False

class PerClientRateLimiter:
    """Manages rate limit buckets per client IP/API key with lock striping"""
    def __init__(self, capacity: float, refill_rate: float):
        self.capacity = capacity
        self.refill_rate = refill_rate
        self.buckets: Dict[str, TokenBucket] = {}
        self._registry_lock = threading.Lock()

    def allow(self, client_id: str, requested: float = 1.0) -> bool:
        bucket = None
        with self._registry_lock:
            if client_id not in self.buckets:
                self.buckets[client_id] = TokenBucket(self.capacity, self.refill_rate)
            bucket = self.buckets[client_id]
        return bucket.allow(requested)

# Multi-threaded Verification
if __name__ == "__main__":
    limiter = TokenBucket(capacity=5, refill_rate_per_sec=2.0)
    passed = 0
    rejected = 0

    def worker():
        nonlocal passed, rejected
        for _ in range(5):
            if limiter.allow(1.0):
                passed += 1
            else:
                rejected += 1
            time.sleep(0.05)

    threads = [threading.Thread(target=worker) for _ in range(4)]
    for t in threads: t.start()
    for t in threads: t.join()
    print(f"Token Bucket Run Completed: Passed={passed}, Rejected={rejected}")`,
    goCode: `// Production-Grade Lock-Free & Mutex Token Bucket in Go
package main

import (
	"fmt"
	"math"
	"sync"
	"time"
)

type TokenBucket struct {
	capacity   float64
	refillRate float64 // tokens per second
	tokens     float64
	lastRefill time.Time
	mu         sync.Mutex
}

func NewTokenBucket(capacity float64, refillRate float64) *TokenBucket {
	return &TokenBucket{
		capacity:   capacity,
		refillRate: refillRate,
		tokens:     capacity,
		lastRefill: time.Now(),
	}
}

func (tb *TokenBucket) Allow(requested float64) bool {
	tb.mu.Lock()
	defer tb.mu.Unlock()

	now := time.Now()
	elapsed := now.Sub(tb.lastRefill).Seconds()

	// Replenish tokens dynamically
	tb.tokens = math.Min(tb.capacity, tb.tokens+elapsed*tb.refillRate)
	tb.lastRefill = now

	if tb.tokens >= requested {
		tb.tokens -= requested
		return true
	}
	return false
}

func main() {
	bucket := NewTokenBucket(10, 5) // capacity 10, 5 tokens/sec
	var wg sync.WaitGroup
	var allowed, throttled int64
	var countMu sync.Mutex

	for i := 0; i < 20; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			if bucket.Allow(1) {
				countMu.Lock()
				allowed++
				countMu.Unlock()
			} else {
				countMu.Lock()
				throttled++
				countMu.Unlock()
			}
		}()
	}
	wg.Wait()
	fmt.Printf("Results: Allowed=%d, Throttled=%d\\n", allowed, throttled)
}`,
    keyInterviewTakeaways: [
      "Lazy Evaluation over Timers: Never run a dedicated background timer for every bucket. If you have 100,000 active users, 100,000 timers would destroy CPU cache and context switching. Lazy delta calculation uses O(1) CPU only on incoming requests.",
      "Lock Contention: In massive multi-core environments, use Lock Striping (hash ring of 64 or 256 mutexes) so requests for client A do not contend on the same lock as client B.",
      "Redis Distributed Token Bucket: Evaluated atomically via Lua scripts using Redis `EVAL` with keys `token_bucket:{user_id}:tokens` and `token_bucket:{user_id}:last_time`.",
    ],
  },
  {
    id: "lld-worker-pool",
    title: "Bounded Blocking Queue & Worker Pool",
    category: "Concurrency & Systems",
    difficulty: "Hard",
    summary:
      "Design a thread-safe Bounded Blocking Queue and high-throughput Worker Pool with graceful shutdown, backpressure, condition variables in Python, and buffered channels with Context cancellation in Go.",
    requirements: {
      functional: [
        "Bounded Capacity: Queue holds at most N tasks. If full, `put()` blocks until space becomes available.",
        "Worker Pool: M concurrent worker threads consume tasks from the queue and execute them.",
        "Graceful Shutdown: When `shutdown()` is called, the pool stops accepting new tasks, allows queued tasks to finish, and terminates workers cleanly.",
        "Task Futures / Results: Support returning computation results to callers asynchronously.",
      ],
      nonFunctional: [
        "Backpressure: Prevents memory exhaustion when producers generate work faster than consumers can process.",
        "No Busy Waiting: Threads must sleep on Condition Variables (wait/notify) or channel selectors rather than spin-locking.",
      ],
    },
    designPatternsUsed: [
      "Producer-Consumer Pattern",
      "ThreadPool / Worker Pattern",
      "Condition Variable / Monitor Pattern",
    ],
    mermaidDiagram: `classDiagram
    class BoundedBlockingQueue {
        -int capacity
        -Queue items
        -Condition notEmpty
        -Condition notFull
        +put(task: Task)
        +get() Task
        +size() int
    }
    class Worker {
        -int workerId
        -BoundedBlockingQueue queue
        +run()
    }
    class WorkerPool {
        -List~Worker~ workers
        -BoundedBlockingQueue queue
        +submit(task: Task)
        +shutdown()
    }
    WorkerPool *-- Worker
    WorkerPool *-- BoundedBlockingQueue
    Worker o-- BoundedBlockingQueue`,
    pythonCode: `# Bounded Blocking Queue & Worker Pool in Python using Condition Variables
import threading
import time
from typing import Any, Callable, List, Optional

class BoundedBlockingQueue:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.queue: List[Any] = []
        self._lock = threading.Lock()
        self._not_empty = threading.Condition(self._lock)
        self._not_full = threading.Condition(self._lock)
        self._closed = False

    def put(self, item: Any) -> bool:
        with self._lock:
            while len(self.queue) >= self.capacity and not self._closed:
                # Block producer until space is freed
                self._not_full.wait()

            if self._closed:
                raise RuntimeError("Cannot enqueue to closed queue")

            self.queue.append(item)
            # Wake up one waiting consumer
            self._not_empty.notify()
            return True

    def get(self) -> Optional[Any]:
        with self._lock:
            while len(self.queue) == 0 and not self._closed:
                # Block consumer until item is available
                self._not_empty.wait()

            if len(self.queue) == 0 and self._closed:
                return None  # Signal worker to exit

            item = self.queue.pop(0)
            # Wake up one waiting producer
            self._not_full.notify()
            return item

    def close(self) -> None:
        with self._lock:
            self._closed = True
            # Wake up all threads so they can notice the closed state
            self._not_empty.notify_all()
            self._not_full.notify_all()

class WorkerPool:
    def __init__(self, num_workers: int, queue_capacity: int):
        self.queue = BoundedBlockingQueue(queue_capacity)
        self.workers: List[threading.Thread] = []
        for i in range(num_workers):
            t = threading.Thread(target=self._worker_loop, args=(i,), daemon=True)
            self.workers.append(t)
            t.start()

    def _worker_loop(self, worker_id: int):
        while True:
            task = self.queue.get()
            if task is None:
                # Poison pill / Shutdown signal received
                break
            try:
                task()
            except Exception as e:
                print(f"[Worker {worker_id}] Error: {e}")

    def submit(self, fn: Callable) -> None:
        self.queue.put(fn)

    def shutdown(self) -> None:
        self.queue.close()
        for t in self.workers:
            t.join()

if __name__ == "__main__":
    pool = WorkerPool(num_workers=3, queue_capacity=5)
    def task(i):
        return lambda: print(f"Executed task {i} on thread {threading.current_thread().name}")

    for i in range(6):
        pool.submit(task(i))

    pool.shutdown()
    print("Worker pool cleanly shutdown!")`,
    goCode: `// Worker Pool with Backpressure & Graceful Shutdown in Go
package main

import (
	"context"
	"fmt"
	"sync"
	"time"
)

type Task func(ctx context.Context) error

type WorkerPool struct {
	tasks       chan Task
	numWorkers  int
	wg          sync.WaitGroup
	ctx         context.Context
	cancelFunc  context.CancelFunc
}

func NewWorkerPool(workers int, queueSize int) *WorkerPool {
	ctx, cancel := context.WithCancel(context.Background())
	pool := &WorkerPool{
		tasks:      make(chan Task, queueSize),
		numWorkers: workers,
		ctx:        ctx,
		cancelFunc: cancel,
	}

	for i := 0; i < workers; i++ {
		pool.wg.Add(1)
		go pool.worker(i + 1)
	}
	return pool
}

func (p *WorkerPool) worker(id int) {
	defer p.wg.Done()
	for {
		select {
		case <-p.ctx.Done():
			fmt.Printf("[Worker %d] Cancelled via context\\n", id)
			return
		case task, ok := <-p.tasks:
			if !ok {
				fmt.Printf("[Worker %d] Channel closed, exiting\\n", id)
				return
			}
			_ = task(p.ctx)
		}
	}
}

func (p *WorkerPool) Submit(task Task) bool {
	select {
	case <-p.ctx.Done():
		return false
	case p.tasks <- task:
		return true
	}
}

func (p *WorkerPool) Shutdown() {
	close(p.tasks)
	p.wg.Wait()
	p.cancelFunc()
}

func main() {
	pool := NewWorkerPool(4, 10)
	for i := 1; i <= 8; i++ {
		taskID := i
		pool.Submit(func(ctx context.Context) error {
			time.Sleep(10 * time.Millisecond)
			fmt.Printf("Processed task %d\\n", taskID)
			return nil
		})
	}
	pool.Shutdown()
	fmt.Println("All tasks processed.")
}`,
    keyInterviewTakeaways: [
      "Spurious Wakeups: In condition variable implementations, ALWAYS call `wait()` inside a `while` loop (e.g. `while len(q) == 0: wait()`), never an `if` statement. The POSIX thread standard allows threads to wake up without a signal.",
      "Channel as Queue: In Go, channels are thread-safe FIFO queues with built-in lock-free/low-contention ring buffers and condition notification (runtime hchan struct).",
      "Graceful vs Abrupt Shutdown: First close producer entry, flush queued tasks, then join workers. Use context timeout to forcibly kill rogue hung workers.",
    ],
  },
  {
    id: "lld-kv-store",
    title: "In-Memory Key-Value Store with TTL & LRU Eviction",
    category: "Concurrency & Systems",
    difficulty: "Hard",
    summary:
      "Design a high-throughput, thread-safe In-Memory Key-Value Cache (Redis-lite) with O(1) Get/Put, Least Recently Used (LRU) capacity eviction using a Doubly Linked List, and time-to-live (TTL) expiration using a Min-Heap sweep and lazy evaluation.",
    requirements: {
      functional: [
        "Get(key: string) -> Optional[Value]: Returns value if present and not expired; updates LRU position.",
        "Put(key: string, value: Value, ttl_seconds: Optional[int] = None): Stores key-value; if at max capacity, evicts least recently accessed non-expired item.",
        "Delete(key: string) -> bool: Removes key atomically.",
        "TTL Expiry: Keys automatically become inaccessible once expired, freed either on access (lazy) or via background sweep.",
      ],
      nonFunctional: [
        "High Read-to-Write Concurrency: Support hundreds of concurrent readers without blocking each other (RWMutex / Lock Striping).",
        "O(1) amortized time complexity for Get, Put, and LRU eviction.",
      ],
    },
    designPatternsUsed: [
      "Doubly Linked List + Hash Map (LRU Cache pattern)",
      "Min-Heap (TTL Expiry Scheduler)",
      "Read-Write Lock (RWMutex) Pattern",
    ],
    mermaidDiagram: `classDiagram
    class Node {
        +string key
        +any value
        +float expireAt
        +Node prev
        +Node next
    }
    class LRUCache {
        -int capacity
        -Map~string, Node~ map
        -Node head
        -Node tail
        -Heap ttlHeap
        -RWMutex lock
        +get(key: string) any
        +put(key: string, val: any, ttlSec: int)
        +delete(key: string) bool
        -evictLRU()
        -purgeExpired()
    }
    LRUCache *-- Node`,
    pythonCode: `# Thread-Safe LRU Cache with TTL in Python
import time
import heapq
import threading
from typing import Any, Dict, Optional, Tuple

class Node:
    def __init__(self, key: str, val: Any, expires_at: Optional[float] = None):
        self.key = key
        self.val = val
        self.expires_at = expires_at
        self.prev: Optional["Node"] = None
        self.next: Optional["Node"] = None

class ThreadSafeLRUCacheWithTTL:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.map: Dict[str, Node] = {}
        # Sentinel dummy head and tail
        self.head = Node("__HEAD__", None)
        self.tail = Node("__TAIL__", None)
        self.head.next = self.tail
        self.tail.prev = self.head
        # TTL Min-Heap: entries are (expires_at, key)
        self.ttl_heap: list[Tuple[float, str]] = []
        self._lock = threading.RLock()

    def _remove(self, node: Node):
        p, n = node.prev, node.next
        if p and n:
            p.next = n
            n.prev = p

    def _add_to_front(self, node: Node):
        node.next = self.head.next
        node.prev = self.head
        if self.head.next:
            self.head.next.prev = node
        self.head.next = node

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            if key not in self.map:
                return None
            node = self.map[key]

            # Lazy expiration check
            if node.expires_at and time.time() > node.expires_at:
                self._remove(node)
                del self.map[key]
                return None

            # Move to MRU position (head)
            self._remove(node)
            self._add_to_front(node)
            return node.val

    def put(self, key: str, val: Any, ttl_seconds: Optional[int] = None) -> None:
        with self._lock:
            expires_at = time.time() + ttl_seconds if ttl_seconds else None

            if key in self.map:
                node = self.map[key]
                node.val = val
                node.expires_at = expires_at
                self._remove(node)
                self._add_to_front(node)
            else:
                if len(self.map) >= self.capacity:
                    # Evict LRU (node right before tail)
                    lru = self.tail.prev
                    if lru and lru is not self.head:
                        self._remove(lru)
                        del self.map[lru.key]

                new_node = Node(key, val, expires_at)
                self.map[key] = new_node
                self._add_to_front(new_node)

            if expires_at:
                heapq.heappush(self.ttl_heap, (expires_at, key))

    def purge_expired(self) -> int:
        """Active TTL sweep triggered periodically or on idle"""
        with self._lock:
            now = time.time()
            purged = 0
            while self.ttl_heap and self.ttl_heap[0][0] <= now:
                exp_time, key = heapq.heappop(self.ttl_heap)
                if key in self.map and self.map[key].expires_at == exp_time:
                    node = self.map[key]
                    self._remove(node)
                    del self.map[key]
                    purged += 1
            return purged

if __name__ == "__main__":
    cache = ThreadSafeLRUCacheWithTTL(capacity=2)
    cache.put("a", 100, ttl_seconds=1)
    cache.put("b", 200)

    print("Get 'a':", cache.get("a")) # 100
    cache.put("c", 300) # Evicts 'b' (since 'a' was accessed more recently)
    print("Get 'b':", cache.get("b")) # None (evicted)
    time.sleep(1.1)
    print("Get 'a' after TTL:", cache.get("a")) # None (expired)`,
    goCode: `// Sharded Concurrent In-Memory Cache with TTL & LRU in Go
package main

import (
	"container/list"
	"fmt"
	"hash/fnv"
	"sync"
	"time"
)

type CacheItem struct {
	key       string
	value     interface{}
	expiresAt time.Time
}

type LRUCacheShard struct {
	capacity int
	items    map[string]*list.Element
	evictList *list.List
	mu       sync.RWMutex
}

func (s *LRUCacheShard) Get(key string) (interface{}, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	el, exists := s.items[key]
	if !exists { return nil, false }

	item := el.Value.(*CacheItem)
	if !item.expiresAt.IsZero() && time.Now().After(item.expiresAt) {
		s.evictList.Remove(el)
		delete(s.items, key)
		return nil, false
	}

	s.evictList.MoveToFront(el)
	return item.value, true
}

func (s *LRUCacheShard) Put(key string, val interface{}, ttl time.Duration) {
	s.mu.Lock()
	defer s.mu.Unlock()

	var exp time.Time
	if ttl > 0 { exp = time.Now().Add(ttl) }

	if el, exists := s.items[key]; exists {
		s.evictList.MoveToFront(el)
		item := el.Value.(*CacheItem)
		item.value = val
		item.expiresAt = exp
		return
	}

	if s.evictList.Len() >= s.capacity {
		// Evict LRU
		oldest := s.evictList.Back()
		if oldest != nil {
			s.evictList.Remove(oldest)
			delete(s.items, oldest.Value.(*CacheItem).key)
		}
	}

	item := &CacheItem{key: key, value: val, expiresAt: exp}
	el := s.evictList.PushFront(item)
	s.items[key] = el
}

// ShardedCache partitions keys across N shards to eliminate lock contention
type ShardedCache struct {
	shards []*LRUCacheShard
	mask   uint32
}

func NewShardedCache(numShards int, capPerShard int) *ShardedCache {
	shards := make([]*LRUCacheShard, numShards)
	for i := 0; i < numShards; i++ {
		shards[i] = &LRUCacheShard{
			capacity:  capPerShard,
			items:     make(map[string]*list.Element),
			evictList: list.New(),
		}
	}
	return &ShardedCache{shards: shards, mask: uint32(numShards - 1)}
}

func (sc *ShardedCache) getShard(key string) *LRUCacheShard {
	h := fnv.New32a()
	h.Write([]byte(key))
	return sc.shards[h.Sum32()&sc.mask]
}

func (sc *ShardedCache) Get(k string) (interface{}, bool) {
	return sc.getShard(k).Get(k)
}

func (sc *ShardedCache) Put(k string, v interface{}, d time.Duration) {
	sc.getShard(k).Put(k, v, d)
}

func main() {
	cache := NewShardedCache(16, 100)
	cache.Put("cluster_leader", "node-toronto-01", 5*time.Second)

	val, found := cache.Get("cluster_leader")
	fmt.Printf("Retrieved cache value: %v (found: %v)\\n", val, found)
}`,
    keyInterviewTakeaways: [
      "Lock Striping / Sharding: In high-scale Go or Python services, a single global lock creates catastrophic CPU serialization under 50,000+ RPS. Partitioning the keyspace into 32 or 64 independent shards eliminates 95% of lock contention.",
      "Dual Expiry Strategy: Production systems combine Lazy Evaluation (on Get, drop if expired) with Active Background Sweeps (random sample or min-heap scan every 100ms) to ensure memory isn't leaked for keys that are never read again.",
      "Doubly Linked List vs Array: In arrays, evicting or moving an element to the front requires O(N) shifting. A doubly linked list with hash table pointers guarantees exact O(1) pointer updates.",
    ],
  },
];
