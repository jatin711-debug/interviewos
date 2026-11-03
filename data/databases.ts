export interface DBTopic {
  id: string;
  category: "Relational & ACID" | "NoSQL Archetypes" | "Storage Engines" | "Replication & Sharding" | "Consensus & Distributed Logs";
  title: string;
  summary: string;
  deepDive: string[];
  tradeOffTable?: Array<{
    dimension: string;
    optionA: string;
    optionB: string;
  }>;
  mermaidDiagram?: string;
  interviewQuestions: Array<{
    question: string;
    answer: string;
  }>;
}

export interface DecisionCriterion {
  useCase: string;
  recommendedDB: "PostgreSQL" | "Redis" | "Cassandra / ScyllaDB" | "MongoDB" | "Neo4j" | "Pinecone / Milvus (Vector)" | "TimescaleDB / ClickHouse";
  rationale: string;
  avoidWhen: string;
}

export const DB_TOPICS: DBTopic[] = [
  {
    id: "acid-isolation-levels",
    category: "Relational & ACID",
    title: "ACID Properties, Transaction Isolation Levels & MVCC",
    summary:
      "Guarantees that database transactions are processed reliably despite crashes, concurrent writes, and network anomalies across 4 ANSI SQL levels and Snapshot Isolation.",
    deepDive: [
      "Atomicity: All-or-nothing execution. Backed by the Write-Ahead Log (WAL) or undo logs.",
      "Consistency: State transitions preserve all database invariants (foreign keys, uniqueness, check constraints).",
      "Isolation: Concurrent transactions execute without cross-contamination. ANSI defines 4 levels:",
      "1. Read Uncommitted: Transactions can read dirty (uncommitted) data written by concurrent transactions. Suffers from Dirty Reads.",
      "2. Read Committed (Postgres default): Transactions only see rows committed before the query began. Prevents Dirty Reads; suffers from Non-Repeatable Reads.",
      "3. Repeatable Read (MySQL InnoDB default): Guarantees that any row read during a transaction will return identical data throughout the transaction. Uses MVCC snapshots. Prevents Non-Repeatable Reads; can suffer from Phantom Reads in pure locking engines.",
      "4. Serializable: Strict serial execution order guarantee. Implemented via Two-Phase Locking (2PL) or Serializable Snapshot Isolation (SSI). Zero anomalies, highest lock contention.",
      "Snapshot Isolation & Write Skew: In Snapshot Isolation, transactions read a private snapshot of committed data. However, concurrent transactions can read overlapping data and make conflicting writes that violate invariants (Write Skew). Serializable SSI detects overlapping read-write dependencies (rw-antidependencies) and aborts one transaction.",
      "Durability: Committed transactions persist across power outages via synchronous WAL fsync to non-volatile storage.",
    ],
    tradeOffTable: [
      { dimension: "Dirty Reads", optionA: "Read Committed: Blocked", optionB: "Read Uncommitted: Allowed" },
      { dimension: "Non-Repeatable Reads", optionA: "Repeatable Read: Blocked", optionB: "Read Committed: Possible" },
      { dimension: "Phantom Reads", optionA: "Serializable: Completely Blocked", optionB: "Repeatable Read: Possible in locking engines" },
      { dimension: "Write Skew Anomaly", optionA: "Serializable (SSI): Blocked via aborts", optionB: "Snapshot Isolation: Vulnerable" },
      { dimension: "Throughput / Contention", optionA: "Read Committed: Ultra-high (no read locks)", optionB: "Serializable: Lower (aborts & 2PL lock overhead)" },
    ],
    mermaidDiagram: `flowchart TD
    subgraph IsolationLevels["SQL Isolation Levels & Concurrency Anomalies"]
        L1["Read Uncommitted\\n(Dirty Read: YES | Non-Repeatable: YES | Phantom: YES)"]
        L2["Read Committed (PostgreSQL Default)\\n(Dirty Read: NO | Non-Repeatable: YES | Phantom: YES)"]
        L3["Repeatable Read / Snapshot Isolation\\n(Dirty Read: NO | Non-Repeatable: NO | Phantom: Reduced | Write Skew: YES)"]
        L4["Serializable (Strict SSI / 2PL)\\n(All Anomalies Eliminated | Abort on Conflicting rw-Dependencies)"]
    end
    L1 -->|More Strict| L2 -->|More Strict| L3 -->|More Strict| L4`,
    interviewQuestions: [
      {
        question: "How does PostgreSQL implement Read Committed and Repeatable Read without locking readers?",
        answer:
          "PostgreSQL uses Multi-Version Concurrency Control (MVCC). Every row has hidden system columns `xmin` (creating transaction ID) and `xmax` (deleting/updating transaction ID). In Read Committed, a new snapshot is taken at the start of each SQL statement. In Repeatable Read, a single snapshot is created at the start of the first statement and reused throughout the entire transaction. Readers never block writers, and writers never block readers.",
      },
      {
        question: "What is Write Skew and why does standard Snapshot Isolation fail to prevent it?",
        answer:
          "Write Skew occurs when two concurrent transactions read overlapping data sets, satisfy an invariant independently, and make disjoint updates that together violate the global constraint. Classic example: On-call doctors. Constraint: At least 1 doctor must be on call. Doctors Alice and Bob are both on call. Simultaneously, Alice and Bob each ask to take leave. Alice's transaction checks `SELECT COUNT(*) >= 2` (true) and sets Alice on-call=false. Bob's transaction checks `SELECT COUNT(*) >= 2` (true) and sets Bob on-call=false. Both commit! Now 0 doctors are on call. Only true Serializable (SSI) or explicit row locking (`SELECT ... FOR UPDATE`) detects this.",
      },
    ],
  },
  {
    id: "btree-vs-lsm",
    category: "Storage Engines",
    title: "B-Trees (PostgreSQL/InnoDB) vs LSM-Trees (PebbleDB/RocksDB)",
    summary:
      "The fundamental storage dichotomy: B-Trees optimize for random reads and in-place updates, while LSM-Trees optimize for high-velocity sequential write ingestion.",
    deepDive: [
      "B-Tree / B+ Tree (Postgres, MySQL InnoDB):",
      "- Self-balancing search tree with large branching factor (e.g. 100-500 keys per page).",
      "- Updates modify pages in-place (4KB or 8KB pages). Causes random disk I/O when writing.",
      "- Read latency: O(log_B N) disk seeks (usually 3-4 page reads at scale). Excellent for point reads and range scans.",
      "LSM-Tree (Log-Structured Merge-Tree - PebbleDB, RocksDB, Cassandra):",
      "- Writes are strictly sequential: Write to Write-Ahead Log (WAL) on disk + insert into in-memory MemTable (SkipList or Red-Black Tree).",
      "- When MemTable fills (e.g. 64MB), it is flushed sequentially to Level 0 SSTables (Sorted String Tables) on disk.",
      "- Background compaction merges sorted SSTable files across levels (Leveled or Tiered compaction).",
      "- Reads: Must check MemTable -> Level 0 SSTables -> Deeper levels. Accelerated using Bloom Filters to skip SSTables that do not contain the target key.",
      "The 3 Amplifications:",
      "- Write Amplification (WA): Ratio of bytes written to storage vs bytes written by application. B-Trees suffer high WA due to dirty page writes; LSM-Trees have WA during compaction.",
      "- Read Amplification (RA): Number of disk reads per logical read. Higher in LSM-Trees (mitigated by Bloom filters).",
      "- Space Amplification (SA): Ratio of physical disk used vs logical active data size. LSM tombstones and multi-version keys create temporary space amplification.",
    ],
    tradeOffTable: [
      { dimension: "Write Pattern", optionA: "LSM: Strictly Sequential Appends", optionB: "B-Tree: In-Place Random Page Overwrites" },
      { dimension: "Write Throughput", optionA: "LSM: Ultra-High (10x-50x faster)", optionB: "B-Tree: Limited by Disk IOPS" },
      { dimension: "Point Read Latency", optionA: "B-Tree: Deterministic O(log_B N) 1-3 page seeks", optionB: "LSM: Variable (MemTable + Bloom Filter checks)" },
      { dimension: "Range Scans", optionA: "B-Tree: Sequential leaf node traversal", optionB: "LSM: Priority Queue Merge Iterator across SSTables" },
      { dimension: "Disk Fragmentation", optionA: "LSM: Low (immutable sequential SSTables)", optionB: "B-Tree: Moderate to High (page splits & holes)" },
    ],
    mermaidDiagram: `flowchart LR
    subgraph LSMTree["LSM-Tree Write Path (PebbleDB / RocksDB)"]
        W["Client Write"] --> WAL["1. Append to WAL (Sequential disk fsync)"]
        W --> Mem["2. Insert into MemTable (In-Memory SkipList)"]
        Mem -.->|Flush at 64MB| L0["Level 0 SSTables (Disk)"]
        L0 -.->|Background Compaction| L1["Level 1 SSTables"]
        L1 -.->|Compaction| L2["Level 2 SSTables"]
    end
    subgraph BloomFilter["Read Path"]
        R["Client Read"] --> BF["Bloom Filter Check\\n(Skip SSTables with 99% accuracy)"]
    end`,
    interviewQuestions: [
      {
        question: "Why would an event store use an embedded LSM-tree (like PebbleDB) for its indexes instead of PostgreSQL?",
        answer:
          "Picture an event store that keeps the events themselves in its own segmented write-ahead log, with PebbleDB holding per-partition indexes beside it: the dedup index, the cold store of far-future event offsets, and consumer-group offsets. These are write-heavy key-value workloads. A B-Tree like Postgres updates pages in place, so a stream of arbitrary keys means random disk writes and page splits. An LSM-Tree turns them into sequential appends plus an in-memory SkipList (MemTable), flushed later as sorted SSTables. Pebble is also embedded and pure Go, so there is no extra database on the publish path and no cgo, and the cold store's big-endian [schedule_ts][offset] keys make 'what is due next' a simple range scan.",
      },
      {
        question: "Explain the difference between Leveled Compaction and Size-Tiered Compaction.",
        answer:
          "Size-Tiered Compaction (default in Cassandra) waits until multiple SSTables of similar size accumulate, then merges them into a larger SSTable. It has lower write amplification but higher space amplification (can require 50% free disk headroom). Leveled Compaction (PebbleDB/RocksDB) divides storage into discrete levels (L1, L2, L3) where each level is 10x larger than the previous and keys within each level (except L0) are non-overlapping. It provides predictable point reads and low space amplification (~10%) at the cost of higher write amplification during cascading compactions.",
      },
    ],
  },
  {
    id: "segmented-wal",
    category: "Storage Engines",
    title: "Write-Ahead Log (WAL) Internals: Group Commit & Recovery",
    summary:
      "Deep dive into how durable transactional engines ensure zero data loss using append-only Segmented WAL logs, Group Commit batching, O_DIRECT zero-copy I/O, and checkpoint recovery replay.",
    deepDive: [
      "Core Invariant: Write-Ahead Principle. No dirty data page in RAM (MemTable or database buffer pool) may be flushed to disk until the corresponding log entry is securely committed to durable non-volatile storage.",
      "Segmented Log Files: Instead of one unbounded file, logs are split into fixed segments (e.g. 64MB chunks). Old segments can be archived or safely purged after checkpointing.",
      "The fsync Bottleneck: Modern NVMe SSDs can perform hundreds of thousands of asynchronous writes per second, but synchronous `fsync()` forces disk controller cache flushes, capping single-thread performance at ~2,000 fsyncs/second.",
      "Group Commit Optimization: Multiple concurrent transactions wait in a flush queue. The first transaction becomes the Group Leader, which executes a single `fsync()` for the entire batched buffer of 50-200 transactions simultaneously. Amortizes the cost of disk flush across all callers.",
      "Checkpointing: Periodically writes all dirty in-memory pages to persistent SSTables/B-Tree and records a Checkpoint LSN (Log Sequence Number). During crash recovery, the replay engine only scans the WAL starting from the last checkpoint LSN.",
    ],
    mermaidDiagram: `sequenceDiagram
    autonumber
    actor T1 as Txn 1
    actor T2 as Txn 2
    actor T3 as Txn 3
    participant Buffer as In-Memory WAL Buffer
    participant NVMe as Physical Disk (O_DIRECT)

    T1->>Buffer: Append Record 101
    T2->>Buffer: Append Record 102
    T3->>Buffer: Append Record 103
    Note over Buffer, NVMe: Group Commit Triggered (500us or 64KB full)
    Buffer->>NVMe: Single batched fsync() syscall
    NVMe-->>Buffer: Flush Confirmed
    Buffer-->>T1: Commit ACK
    Buffer-->>T2: Commit ACK
    Buffer-->>T3: Commit ACK`,
    interviewQuestions: [
      {
        question: "How does Group Commit solve the fsync IOPS ceiling in high-throughput engines?",
        answer:
          "Without Group Commit, 10,000 transactions would each issue an `fsync()` syscall, overwhelming disk controllers (which physically max out around 1,500-3,000 flushes/sec due to NAND flash write barriers). With Group Commit, incoming transactions join a thread-safe batch queue. A single worker thread flushes all accumulated transactions in one batched write and single fsync, allowing 100,000+ transactions/sec to achieve durability with minimal latency overhead.",
      },
    ],
  },
  {
    id: "raft-consensus",
    category: "Consensus & Distributed Logs",
    title: "Raft Consensus: Leader Election, Log Replication & Split-Brain",
    summary:
      "How distributed databases (etcd, CockroachDB, Kafka KRaft) achieve linearizable state machine replication across unreliable networks. Some systems use Raft only for cluster metadata (who leads each partition) and replicate the bulk data over a separate, faster protocol.",
    deepDive: [
      "Role Transitions: Nodes start as Follower. If election timeout elapses (150-300ms randomized) without receiving heartbeats from a Leader, the Follower converts to Candidate, increments `currentTerm`, votes for itself, and broadcasts `RequestVote` RPCs.",
      "Leader Election: A Candidate becomes Leader upon receiving votes from a majority of nodes (quorum = N/2 + 1). Only one Leader can be elected per term.",
      "Log Replication: Leader accepts client commands, appends them to its local log, and broadcasts `AppendEntries` RPCs. Once a majority of followers acknowledge, the entry is marked Committed and applied to the state machine.",
      "Log Matching Invariant: If two logs contain an entry with the same index and term, they are identical up to that index. The leader forces followers to overwrite conflicting uncommitted logs with the leader's logs.",
      "Split-Brain Prevention: In an asymmetric network partition (e.g. 5-node cluster split into 2 vs 3), the 2-node partition can never elect a leader because it cannot assemble a quorum of 3 votes. The 3-node partition continues operating normally.",
      "Joint Consensus: Changing cluster membership (adding/removing nodes) requires a two-phase Joint Consensus transition where decisions require majorities of BOTH old and new configurations simultaneously to prevent split-brain during reconfiguration.",
    ],
    mermaidDiagram: `flowchart TD
    subgraph RaftCluster["5-Node Raft Cluster (Quorum = 3)"]
        Leader["Leader (Node 1 - Term 4)"]
        F2["Follower (Node 2)"]
        F3["Follower (Node 3)"]
        F4["Follower (Node 4 - Isolated)"]
        F5["Follower (Node 5 - Isolated)"]

        Leader -->|AppendEntries RPC| F2
        Leader -->|AppendEntries RPC| F3
        Leader -.->|Network Partition Drop| F4
        Leader -.->|Network Partition Drop| F5
    end
    Note["Nodes 1, 2, 3 have 3/5 quorum = Normal Operation!\\nNodes 4, 5 cannot reach quorum = Writes Rejected."]`,
    interviewQuestions: [
      {
        question: "Why are election timeouts randomized in Raft?",
        answer:
          "Randomized election timeouts (e.g., between 150ms and 300ms) prevent Split Votes. If all followers timed out at the exact same millisecond, they would all become candidates at once and vote for themselves, dividing the votes so no candidate achieves a majority. Randomization ensures that one follower times out first, requests votes, and establishes leadership before others time out.",
      },
      {
        question: "What is Raft's Leader Completeness Property and how does it guarantee linearizability?",
        answer:
          "Raft guarantees that if a log entry is committed in a given term, that entry will be present in the logs of the leaders for all higher terms. Followers will reject a candidate's `RequestVote` RPC if the candidate's log is less up-to-date than the follower's own log (checked by comparing the last log entry's term and index). This ensures no committed data is ever lost during failover.",
      },
    ],
  },
  {
    id: "replication-sharding",
    category: "Replication & Sharding",
    title: "Distributed Sharding: Topologies, Consistent Hashing & Hot Keys",
    summary:
      "Horizontal database scaling strategies: Range Partitioning, Hash Sharding, Consistent Hashing, Cross-Shard Two-Phase Commit (2PC), and Hot Key mitigation.",
    deepDive: [
      "Range Partitioning (Google Cloud Spanner, CockroachDB): Splits keys into sorted contiguous ranges (Tablets/Splits). Excellent for range scans (`WHERE date BETWEEN X AND Y`), but suffers from hotspot write bottlenecks on sequential keys (e.g. auto-increment IDs or timestamps).",
      "Hash Sharding (DynamoDB, Cassandra): Keys are hashed (MD5, Murmur3) to uniformly distribute rows across physical shards. Eliminates write hotspots, but completely destroys ordered range queries.",
      "Consistent Hashing with Virtual Nodes: Distributes shards along a 2^32 circular token ring. Nodes own multiple virtual positions. When adding or removing hardware, only K/N keys are moved instead of 100%.",
      "Hot Key Mitigations:",
      "1. Key Salting: Append random suffix `hash_key#suffix` (e.g. `order_42#0` to `order_42#9`) to distribute hot rows across 10 distinct physical shards, aggregating on read.",
      "2. Local Cache Invalidation: Keep ultra-hot read keys in memory at the gateway proxy (Envoy / Redis) with short 1-second TTL.",
      "Cross-Shard Transactions: Requires Two-Phase Commit (2PC) or Sagas. 2PC coordinates a Prepare phase and a Commit phase across shards, guaranteeing atomicity at the cost of high coordinator latency and lock holding.",
    ],
    tradeOffTable: [
      { dimension: "Range Scans", optionA: "Range Partitioning: Natural O(1) partition seek", optionB: "Hash Sharding: Scatter-gather query to ALL shards" },
      { dimension: "Write Hotspots", optionA: "Hash Sharding: Completely scattered & uniform", optionB: "Range Partitioning: Vulnerable on monotonically increasing keys" },
      { dimension: "Rebalancing Cost", optionA: "Consistent Hashing: Minimal (K/N keys moved)", optionB: "Traditional Modulo: Catastrophic (nearly 100% reshuffle)" },
      { dimension: "Cross-Shard Joins", optionA: "Co-located Partition Keys: Local single-node join", optionB: "Unrelated Keys: Expensive distributed network shuffle" },
    ],
    mermaidDiagram: `flowchart TD
    Client["Client / API Gateway"] --> Router["Consistent Hash Ring Router"]

    subgraph Shards["Distributed Shard Cluster"]
        S1["Shard 1 (Tokens 0x00 - 0x3F)"]
        S2["Shard 2 (Tokens 0x40 - 0x7F)"]
        S3["Shard 3 (Tokens 0x80 - 0xBF)"]
        S4["Shard 4 (Tokens 0xC0 - 0xFF)"]
    end

    Router -->|hash(user_id) = 0x22| S1
    Router -->|hash(user_id) = 0x91| S3`,
    interviewQuestions: [
      {
        question: "How do you solve the celebrity hot key problem in Cassandra or DynamoDB?",
        answer:
          "In wide-column or key-value stores where a celebrity like 'Taylor Swift' or a flash sale product has millions of writes/reads, partition keys become hot. Solution: Key Salting. Prepend or append an integer range (e.g. `product_101:(random 1..10)`). Writes are dispersed across 10 distinct physical shards. Reads query all 10 salted keys concurrently via scatter-gather and aggregate the result in the API layer.",
      },
    ],
  },
];

export const DB_DECISION_MATRIX: DecisionCriterion[] = [
  {
    useCase: "Financial Ledgers, Banking, Billing & Core E-Commerce",
    recommendedDB: "PostgreSQL",
    rationale:
      "Strict ACID compliance, rich SQL relational joins, foreign key constraints, mature ecosystem, and JSONB document capabilities.",
    avoidWhen: "Unbounded write ingestion exceeding 200,000 writes/sec on a single node without sharding.",
  },
  {
    useCase: "Distributed Session Store, Leaderboards & Rate Limiting",
    recommendedDB: "Redis",
    rationale:
      "In-memory sub-millisecond latency, atomic primitive operations (INCR, LPUSH, ZADD), built-in TTL key eviction, and pub/sub.",
    avoidWhen: "Massive terabyte datasets where RAM cost is prohibitive and complex relational queries are required.",
  },
  {
    useCase: "Global Multi-Datacenter IoT Telemetry & Messaging Ingestion",
    recommendedDB: "Cassandra / ScyllaDB",
    rationale:
      "Masterless peer-to-peer ring architecture, zero single point of failure, tunable consistency (QUORUM), and high write throughput.",
    avoidWhen: "ACID multi-table transactions, foreign keys, or ad-hoc SQL analytical aggregate queries.",
  },
  {
    useCase: "Industrial Sensor Time-Series & Fleet Monitoring",
    recommendedDB: "TimescaleDB / ClickHouse",
    rationale:
      "Specialized hypertables, automatic column-oriented compression (80-90% disk reduction), and SQL analytical window functions.",
    avoidWhen: "Frequent random point updates and single-row deletions.",
  },
  {
    useCase: "AI Semantic Search & LLM Retrieval-Augmented Generation (RAG)",
    recommendedDB: "Pinecone / Milvus (Vector)",
    rationale:
      "High-dimensional vector indexing (HNSW, IVF-PQ) for sub-10ms Approximate Nearest Neighbor (ANN) cosine/dot-product similarity.",
    avoidWhen: "Standard relational transactional workloads or exact keyword lookups.",
  },
];
