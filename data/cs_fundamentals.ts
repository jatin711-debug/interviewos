import { PYTHON_FOUNDATIONS_FLASHCARDS } from "./flashcards/python";
import { PYTHON_INTERNALS_FLASHCARDS } from "./flashcards/python-internals";
import { DSA_PATTERN_FLASHCARDS } from "./flashcards/dsa";

export type FlashcardCategory =
  | "Operating Systems"
  | "Computer Networks"
  | "Go Internals"
  | "Rust Internals"
  | "Python Internals"
  | "Python Foundations"
  | "DSA Patterns"
  | "AI & GPU Systems"
  | "Security & K8s";

// Card ids are persisted as keys of saved SM-2 review state: never rename or renumber them.
export interface Flashcard {
  id: string;
  category: FlashcardCategory;
  question: string;
  answer: string;
  explanation: string;
  codeSnippet?: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

export interface CSModule {
  id: string;
  title: string;
  category: string;
  summary: string;
  keyConcepts: Array<{
    term: string;
    definition: string;
    interviewSignificance: string;
  }>;
}

export const CS_MODULES: CSModule[] = [
  {
    id: "go-internals",
    title: "Go Internals: GMP Scheduler, Channels & Garbage Collection",
    category: "Language & Stack Internals",
    summary: "Deep dive into the Go runtime: M:N user-space multiplexing, lock-free work-stealing, channel internals, and tricolor concurrent GC.",
    keyConcepts: [
      {
        term: "GMP Model (G, M, P)",
        definition: "G = Goroutine (stack starts at 2KB, grows dynamically). M = Machine (OS thread). P = Processor (logical context for execution, GOMAXPROCS count).",
        interviewSignificance: "Explains how Go runs 1,000,000 goroutines concurrently with tiny memory footprint. P maintains a local run queue (256 Gs); if empty, it work-steals 50% from another P's queue or global queue.",
      },
      {
        term: "Channel Internals (hchan struct)",
        definition: "A channel in Go is a pointer to an `hchan` struct on the heap, protected by an internal `mutex`. It contains a circular ring buffer, a send wait queue (`sudog`), and a receive wait queue (`sudog`).",
        interviewSignificance: "Proves that channels are NOT magic lock-free structures; sending/receiving on a channel acquires a runtime mutex lock. Unbuffered channel blocks caller G and directly copies memory from sender stack to receiver stack without intermediate buffer.",
      },
      {
        term: "Tricolor Mark-and-Sweep Concurrent GC",
        definition: "Non-moving concurrent collector. Objects colored White (unvisited/garbage), Grey (visited, children uninspected), and Black (reachable, children inspected).",
        interviewSignificance: "Uses a Write Barrier to guarantee no black object points directly to a white object without passing through grey during concurrent marking. Results in sub-millisecond Stop-The-World (STW) pauses.",
      },
    ],
  },
  {
    id: "rust-internals",
    title: "Rust Internals: Ownership, Borrowing, Lifetimes & Zero-Cost Abstractions",
    category: "Language & Stack Internals",
    summary: "Compile-time memory safety without a garbage collector: affine type system, aliasing XOR mutability, and RAII.",
    keyConcepts: [
      {
        term: "Aliasing XOR Mutability",
        definition: "At any given time, you can have either one mutable reference (`&mut T`) OR any number of immutable references (`&T`), but never both.",
        interviewSignificance: "Guarantees zero data races at compile time. Data races require: 2+ pointers accessing the same memory concurrently, at least one is writing, and no synchronization.",
      },
      {
        term: "Lifetimes ('a)",
        definition: "Named parameters used by the borrow checker to ensure every reference points to valid memory that has not been dropped or moved.",
        interviewSignificance: "Lifetimes exist ONLY at compile time; they have zero runtime memory overhead. Used heavily in zero-copy deserialization and string slicing.",
      },
      {
        term: "Zero-Cost Abstractions",
        definition: "What you don't use, you don't pay for. What you do use, you couldn't hand code any better.",
        interviewSignificance: "Iterators, closures, and traits with monomorphization compile down to raw pointers and flat assembly loops with zero indirection.",
      },
    ],
  },
  {
    id: "os-memory-mmap",
    title: "OS Internals: Virtual Memory, Paging, mmap & Page Cache",
    category: "Operating Systems",
    summary: "How the operating system bridges user-space processes with physical hardware RAM and NVMe storage.",
    keyConcepts: [
      {
        term: "mmap (Memory-Mapped Files)",
        definition: "Maps a file on disk directly into a process's virtual address space. Pages are loaded lazily on demand when a Page Fault occurs.",
        interviewSignificance: "Bypasses standard `read()` / `write()` syscall overhead and avoids copying data from kernel page cache into user-space buffers. Used in LMDB and RocksDB/PebbleDB.",
      },
      {
        term: "Page Faults (Minor vs Major)",
        definition: "A Minor Page Fault occurs when virtual memory is not mapped to physical RAM, but the page already exists in the OS Page Cache. A Major Page Fault requires synchronous disk I/O.",
        interviewSignificance: "High major page faults degrade database p99 latency from microseconds to milliseconds.",
      },
      {
        term: "TLB (Translation Lookaside Buffer)",
        definition: "High-speed hardware cache on the CPU MMU that stores recent Virtual -> Physical address translations.",
        interviewSignificance: "Random memory access across large datasets causes TLB misses, significantly lowering memory bandwidth.",
      },
    ],
  },
  {
    id: "cuda-ai-internals",
    title: "AI & GPU Systems: CUDA Memory Hierarchy & Dynamic Batching",
    category: "AI & GPU Systems",
    summary: "Hardware architecture and execution model for high-throughput deep learning inference and training.",
    keyConcepts: [
      {
        term: "CUDA Memory Hierarchy",
        definition: "Registers (per thread, 1 cycle) -> Shared Memory / L1 Cache (per SM, 19-32 cycles) -> L2 Cache (shared across GPU, 200 cycles) -> Global VRAM / HBM (slowest, 400-800 cycles).",
        interviewSignificance: "GPU kernels are memory bandwidth bound. Maximizing coalesced global memory access and tiling matrix multiplications inside Shared Memory is the key to 90%+ tensor core utilization.",
      },
      {
        term: "Dynamic Batching (Triton / TorchServe)",
        definition: "Grouping independent incoming inference requests arriving within a short time window (e.g. 2-5ms) into a single tensor batch for parallel GPU execution.",
        interviewSignificance: "Increases GPU compute utilization from 15% to 85% with minimal impact on individual request latency.",
      },
      {
        term: "Quantization (FP16 vs INT8 vs AWQ)",
        definition: "Representing weights and activations with lower bit-widths to double/quadruple memory bandwidth throughput and halve VRAM requirements.",
        interviewSignificance: "Critical for running models like RF-DETR and SAM 3 in real-time on consumer/workstation GPUs without accuracy degradation.",
      },
    ],
  },
];

export const FLASHCARDS: Flashcard[] = [
  {
    id: "fc-1",
    category: "Go Internals",
    question: "What is the difference between an unbuffered and buffered channel in Go, and what happens under the hood?",
    answer: "An unbuffered channel has 0 capacity (`make(chan T)`); a send blocks until a receiver is ready, and data is copied directly from sender stack to receiver stack. A buffered channel (`make(chan T, n)`) has a circular ring buffer of size n; a send only blocks when the buffer is full.",
    explanation: "Both allocate an `hchan` struct protected by an internal mutex. When a goroutine blocks on a channel, it is packaged into a `sudog` struct and placed on the channel's wait queue, and `gopark()` yields the OS thread.",
    difficulty: "Medium",
  },
  {
    id: "fc-2",
    category: "Go Internals",
    question: "How does the Go runtime handle a Goroutine making a blocking OS syscall (e.g. reading a local file)?",
    answer: "The Go runtime disassociates the logical Processor P from the OS thread M (`entersyscall()`). M continues executing the blocking syscall, while P finds or spawns a new thread M' to execute other runnable Goroutines in its local queue. When the syscall completes, M reacquires an idle P or places the Goroutine on the global run queue.",
    explanation: "This ensures blocking I/O calls do not freeze other Goroutines multiplexed on the same core.",
    difficulty: "Hard",
  },
  {
    id: "fc-3",
    category: "Rust Internals",
    question: "What is the difference between `Rc<T>` and `Arc<T>` in Rust, and why isn't `Arc` used everywhere?",
    answer: "`Rc<T>` is a single-threaded reference-counted pointer. `Arc<T>` is an atomically reference-counted pointer safe across threads (`Send + Sync`). `Arc` requires atomic CPU operations (`fetch_add`, `fetch_sub`) for increment/decrement, which have non-trivial memory-fence overhead compared to plain non-atomic integer instructions in `Rc`.",
    explanation: "In high-frequency loops, atomic instructions serialize memory pipelines; Rust enforces zero-cost by making thread safety explicit.",
    difficulty: "Medium",
  },
  {
    id: "fc-4",
    category: "Operating Systems",
    question: "Explain what happens when an application calls `mmap()` to read a 10GB file on Linux.",
    answer: "`mmap()` creates a new Virtual Memory Area (VMA) in the process's page table mapping the file descriptor, but does NOT immediately load the 10GB into RAM. When memory addresses within that range are accessed, CPU MMU triggers a Page Fault. The OS kernel reads the required 4KB pages on-demand into the OS Page Cache and maps the physical page to the process virtual table.",
    explanation: "This allows applications like PebbleDB, RocksDB and LMDB to achieve fast startup and let the OS manage memory eviction transparently.",
    difficulty: "Hard",
  },
  {
    id: "fc-5",
    category: "Computer Networks",
    question: "Explain the TCP 3-Way Handshake and what the SYN Flood attack is.",
    answer: "1. Client -> Server: SYN (seq = x)\n2. Server -> Client: SYN-ACK (seq = y, ack = x + 1)\n3. Client -> Server: ACK (ack = y + 1)\n\nSYN Flood: Attacker sends massive SYN packets with spoofed IPs. The server allocates TCB state in its SYN backlog queue and waits for ACK (half-open connection), exhausting memory. Mitigated via SYN Cookies (encoding state in initial sequence number without memory allocation).",
    explanation: "SYN Cookies allow stateless connection establishment until the final ACK arrives.",
    difficulty: "Medium",
  },
  {
    id: "fc-6",
    category: "AI & GPU Systems",
    question: "What is Late Interaction in ColBERT retrieval vs traditional Dense Vector (bi-encoder) retrieval?",
    answer: "Traditional Bi-Encoders collapse an entire document into a single vector (e.g. 768-d), losing fine-grained keyword token semantics. ColBERT keeps multi-vector token embeddings for both query and document, and computes Late Interaction using MaxSim: for every query token, find the maximum dot product with any document token, then sum. This achieves cross-encoder level precision with bi-encoder retrieval latency.",
    explanation: "ColBERT embeddings require vector indexing optimizations like centroid pruning (PLAID) to scale to millions of documents.",
    difficulty: "Hard",
  },
  {
    id: "fc-7",
    category: "Python Internals",
    question: "What is the Global Interpreter Lock (GIL) in CPython, and why doesn't multithreading speed up CPU-bound code?",
    answer: "The GIL is a mutex that protects access to Python objects, preventing multiple native threads from executing Python bytecode simultaneously. For CPU-bound tasks, threads fight over the GIL, incurring context-switch overhead without parallel computation. For CPU parallelism, use multiprocessing, C/Rust extensions (which release the GIL), or Python 3.13 free-threaded mode.",
    explanation: "For I/O-bound tasks (network, disk), Python releases the GIL while waiting on syscalls, so threading/asyncio is effective.",
    difficulty: "Medium",
  },
  {
    id: "fc-8",
    category: "Security & K8s",
    question: "How does Kubernetes Horizontal Pod Autoscaler (HPA) scale pods based on custom metrics like Kafka Consumer Lag?",
    answer: "Standard HPA scales on CPU/Memory via metrics-server. For custom metrics like Kafka lag, an adapter (e.g., KEDA - Kubernetes Event-Driven Autoscaling or Prometheus Adapter) exposes the custom metric to the Kubernetes Custom Metrics API. HPA periodically queries this endpoint and computes: `desiredReplicas = ceil[currentReplicas * (currentMetricValue / targetMetricValue)]`.",
    explanation: "Scaling on Kafka lag prevents consumer lag buildup long before CPU spikes trigger.",
    difficulty: "Hard",
  },
  ...PYTHON_FOUNDATIONS_FLASHCARDS,
  ...PYTHON_INTERNALS_FLASHCARDS,
  ...DSA_PATTERN_FLASHCARDS,
];
