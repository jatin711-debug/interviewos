export * from "./hld/types";
import { HLDConcept, HLDCaseStudy, HLDLevel } from "./hld/types";
import {
  TINYURL_CASE_STUDY,
  TWITTER_CASE_STUDY,
  WHATSAPP_CASE_STUDY,
  UBER_CASE_STUDY,
  NETFLIX_CASE_STUDY,
} from "./hld/case_studies/classic_systems";
import {
  PASTEBIN_CASE_STUDY,
  RATE_LIMITER_CASE_STUDY,
  NOTIFICATION_SYSTEM_CASE_STUDY,
  CHECKOUT_CASE_STUDY,
} from "./hld/case_studies/mid_level_systems";
import {
  DESIGN_INTERVIEW_APPROACH,
  LOAD_BALANCING_SCALING,
  SQL_NOSQL_DATA_MODELING,
  API_DESIGN_FUNDAMENTALS,
  MESSAGE_QUEUES_ASYNC,
  REPLICATION_READ_REPLICAS,
  RATE_LIMITING_FUNDAMENTALS,
} from "./hld/concepts/mid_level";

export const HLD_LEVELS: Array<{ id: HLDLevel; label: string; badge: string; description: string }> = [
  { id: "core", label: "Core for mid-level", badge: "Core for mid-level", description: "Fundamentals and smaller systems a mid-level design round expects." },
  { id: "deep-dive", label: "Deep dives", badge: "Deep dive", description: "Senior-depth internals, large-scale systems and your own projects." },
];

/** Items without an explicit level (e.g. the resume-aligned case studies) count as deep dives. */
export function hldLevel(item: { level?: HLDLevel }): HLDLevel {
  return item.level ?? "deep-dive";
}

const DEEP_DIVE_CONCEPTS: HLDConcept[] = [
  {
    id: "cap-theorem",
    level: "deep-dive",
    category: "Distributed Systems",
    title: "CAP Theorem & PACELC",
    summary:
      "During a network partition, a distributed system must choose between linearizable consistency and availability for operations affected by the partition.",
    keyPrinciples: [
      "A quorum-based system may reject or delay an operation when it cannot reach a quorum, preserving its consistency guarantee.",
      "An availability-oriented design may accept operations on separate sides of a partition and reconcile divergent versions later; its actual guarantees depend on its configuration.",
      "PACELC Extension: If Partition (P) -> choose Availability (A) or Consistency (C); Else (E) -> choose Latency (L) or Consistency (C).",
    ],
    tradeOffs: [
      "Linearizable reads require a way to establish that the serving node is current, such as a quorum check or a correctly implemented lease.",
      "Eventual consistency can lower coordination overhead but permits stale reads and may require conflict resolution.",
    ],
    mermaidDiagram: `flowchart LR
    P{"Network partition?"}
    P -->|Yes| C{"Choose for affected operations"}
    C -->|Consistency| CP["Wait or reject without quorum"]
    C -->|Availability| AP["Accept requests and reconcile"]
    P -->|No| E{"Normal operation"}
    E --> L["Latency and consistency trade-offs"]`,
    interviewTip:
      "Define consistency and availability precisely. Overlapping read/write quorums help with visibility, but do not by themselves prove linearizability; DynamoDB exposes consistency options through its own API rather than configurable R and W values.",
    sources: [{ label: "Cassandra: tunable consistency", url: "https://cassandra.apache.org/doc/latest/cassandra/architecture/dynamo.html" }, { label: "DynamoDB: read consistency", url: "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadConsistency.html" }],
  },
  {
    id: "consistent-hashing",
    level: "deep-dive",
    category: "Distributed Systems",
    title: "Consistent Hashing & Virtual Nodes",
    summary:
      "Maps both nodes and keys to a 360-degree circular hash ring (e.g. 2^32 space) to minimize key movement during scale-out or node crashes.",
    keyPrinciples: [
      "Keys map to the next clockwise server node on the ring.",
      "With balanced tokens, adding or removing a node moves roughly K/N keys on average. Modulo-based partitioning generally remaps a large fraction of keys when N changes.",
      "Virtual Nodes (vnodes): Each physical node is hashed to multiple points (e.g. 100-256 vnodes) around the ring to prevent data skew and hotspots.",
    ],
    tradeOffs: [
      "Without enough virtual nodes, uneven token spacing can cause significant load imbalance.",
      "Ring state lookup requires O(log N) binary search across node tokens.",
    ],
    mermaidDiagram: `flowchart LR
    subgraph Ring["Consistent Hash Ring (0 to 2^32 - 1)"]
        N1["Node A (Token 100)"]
        K1["Key: user_982 -> lands on Node B"]
        N2["Node B (Token 500)"]
        K2["Key: order_14 -> lands on Node C"]
        N3["Node C (Token 900)"]
    end
    N1 --> N2 --> N3 --> N1`,
    interviewTip:
      "Discuss virtual nodes as one approach to distributing keys; actual load balance also depends on key popularity and the reassignment strategy.",
  },
  {
    id: "kafka-internals",
    level: "deep-dive",
    category: "Async Processing",
    title: "Apache Kafka Internals: Log Segments & Consumer Groups",
    summary:
      "High-throughput distributed append-only commit log partitioned for horizontal scalability, zero-copy network transfer (sendfile), and sequential disk I/O.",
    keyPrinciples: [
      "Partitions are the unit of parallelism. A stable key-to-partition mapping preserves append order within a partition; producer settings and partition changes also matter.",
      "Log segments have a configurable size and use indexes to help locate offsets; binary search is logarithmic, not constant time.",
      "Consumer Groups: Scaled consumers where each partition is assigned to exactly one consumer within a group. Adding more consumers than partitions results in idle consumers.",
      "Zero-Copy Architecture: Uses Linux OS `sendfile()` syscall to transfer data from OS page cache directly to network socket buffer, skipping user-space CPU copying.",
    ],
    tradeOffs: [
      "Strict ordering is only guaranteed within a single partition, NOT across partitions.",
      "Too many partitions per broker (>10,000) causes high KRaft metadata overhead and end-to-end latency increases.",
    ],
    mermaidDiagram: `flowchart TD
    Producer["Producer (Hash by Key)"]
    subgraph KafkaBroker["Kafka Topic: 'sensor-telemetry'"]
        P0["Partition 0 (Segment 000.log)"]
        P1["Partition 1 (Segment 000.log)"]
        P2["Partition 2 (Segment 000.log)"]
    end
    subgraph ConsumerGroup["Consumer Group 'ingest-workers'"]
        C1["Consumer 1"]
        C2["Consumer 2"]
        C3["Consumer 3"]
    end
    Producer --> P0
    Producer --> P1
    Producer --> P2
    P0 --> C1
    P1 --> C2
    P2 --> C3`,
    interviewTip:
      "Explain partition ordering, consumer groups, disk I/O, and the operating-system page cache. Quantify performance only with measurements for the workload.",
    sources: [{ label: "Kafka log implementation", url: "https://kafka.apache.org/26/implementation/log/" }, { label: "Kafka topic configuration", url: "https://kafka.apache.org/35/generated/topic_config.html" }],
  },
];

const CACHING_PATTERNS_CONCEPT: HLDConcept = {
  id: "caching-patterns",
  level: "core",
  category: "Caching",
  title: "Caching Strategies: Cache-Aside vs Write-Through vs Write-Back",
  summary:
    "Architecture patterns for coordinating state between in-memory caches (Redis) and durable persistent databases (PostgreSQL).",
  keyPrinciples: [
    "Cache-Aside (Lazy Loading): Application queries cache; on miss, loads from DB and writes to cache. DB writes directly update DB and invalidate cache.",
    "Write-Through: Application writes to cache, and cache synchronously writes to DB before acknowledging. Strong consistency but high write latency.",
    "Write-Back (Write-Behind): Application writes to cache, which acknowledges immediately and asynchronously flushes batches to DB. Ultra-high write throughput, but risks data loss on cache node crash.",
  ],
  tradeOffs: [
    "Cache-Aside suffers from Cache Stampede (Thundering Herd) when a key expires under high concurrent traffic. Fix: Mutex lock on cache miss or probabilistic early expiration (XFetch).",
    "Write-Back requires durable replication or WAL in the cache layer to prevent uncommitted writes from vanishing.",
  ],
  mermaidDiagram: `sequenceDiagram
    autonumber
    actor App as Application
    participant Cache as Redis Cache
    participant DB as Postgres DB

    Note over App, DB: Cache-Aside Pattern
    App->>Cache: GET user:1001
    alt Cache Hit
        Cache-->>App: {name: "Ada"}
    else Cache Miss
        Cache-->>App: nil
        App->>DB: SELECT * FROM users WHERE id=1001
        DB-->>App: Row data
        App->>Cache: SET user:1001 Row data EX 3600
    end`,
  interviewTip:
    "Address cache invalidation, TTL, and concurrent read/write races. Invalidating after a database write is common, but by itself does not guarantee strong consistency.",
  sources: [{ label: "AWS: caching strategies", url: "https://docs.aws.amazon.com/whitepapers/latest/database-caching-strategies-using-redis/caching-patterns.html" }],
};

// Mid-level essentials come first; within each level, list order is the suggested study order.
export const HLD_CONCEPTS: HLDConcept[] = [
  DESIGN_INTERVIEW_APPROACH,
  LOAD_BALANCING_SCALING,
  SQL_NOSQL_DATA_MODELING,
  CACHING_PATTERNS_CONCEPT,
  API_DESIGN_FUNDAMENTALS,
  MESSAGE_QUEUES_ASYNC,
  REPLICATION_READ_REPLICAS,
  RATE_LIMITING_FUNDAMENTALS,
  ...DEEP_DIVE_CONCEPTS,
];

export const HLD_CASE_STUDIES: HLDCaseStudy[] = [
  PASTEBIN_CASE_STUDY,
  TINYURL_CASE_STUDY,
  RATE_LIMITER_CASE_STUDY,
  NOTIFICATION_SYSTEM_CASE_STUDY,
  CHECKOUT_CASE_STUDY,
  TWITTER_CASE_STUDY,
  WHATSAPP_CASE_STUDY,
  UBER_CASE_STUDY,
  NETFLIX_CASE_STUDY,
];
