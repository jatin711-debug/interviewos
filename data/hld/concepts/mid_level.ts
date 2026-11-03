import { HLDConcept } from "../types";

export const DESIGN_INTERVIEW_APPROACH: HLDConcept = {
  id: "design-interview-approach",
  level: "core",
  category: "Interview Approach",
  title: "How to Approach a System Design Interview",
  summary:
    "A repeatable 45-minute structure: agree on scope, size the problem, define the API and data, draw one working design end to end, then go deep where the risk is and say what you traded away.",
  keyPrinciples: [
    "Requirements (~5 min): list 3–5 functional requirements and explicitly park the rest. Ask the questions that change the design: how many users, read/write ratio, latency target, can data ever be lost, does everyone need to see a write immediately? Write the agreed list where the interviewer can see it.",
    "Estimates (~5 min): turn users into requests per second and bytes per day, rounding hard. 10M requests/day ÷ ~10^5 seconds/day ≈ 100 QPS on average; assume peak is 2–3× that. Only estimate what drives a decision: does it fit on one machine, does the hot set fit in memory, is it read- or write-heavy?",
    "API (~5 min): name the 2–5 endpoints that cover the functional requirements, with their main request and response fields, how callers authenticate, and how lists are paginated. Writing the API forces you to decide what the client actually needs.",
    "Data model (~5 min): list the entities, their key fields, and the main query for each ('get paste by id', 'list a user's orders newest first'). Choose the store and the keys from those queries, not from habit.",
    "High-level design (~10 min): draw one working path — client, load balancer, stateless services, database, then cache and queue only where needed — and walk one read and one write through it. Get it correct before making it fast.",
    "Deep dive (~10 min): pick the 1–2 riskiest parts (a race condition, a hot key, a slow third party, a failure mode) and solve them concretely. If the interviewer points somewhere, go there.",
    "Wrap-up (~5 min): summarise the main trade-offs, name the bottleneck you would hit next at 10× load, and what you would monitor (error rate, p99 latency, queue depth).",
  ],
  tradeOffs: [
    "Breadth vs depth: a complete, simple design beats a clever cache attached to nothing. Draw the end-to-end path before optimising any part of it.",
    "Precision vs time: estimates exist to make decisions. 115 vs 120 QPS changes nothing; 100 vs 100,000 QPS changes the architecture. Keep one significant figure and show the arithmetic.",
    "Asking vs assuming: ask only the questions whose answers change the design; for everything else, state an assumption out loud and move on.",
    "Simple first vs future-proof: start with one database and add replicas, caching, queues or sharding when a number you computed calls for it. Say what would trigger each addition.",
  ],
  quickReference: [
    { label: "Seconds in a day", value: "86,400 ≈ 10^5 → 1M requests/day ≈ 12 QPS" },
    { label: "Peak vs average", value: "Assume 2–3× average unless told otherwise" },
    { label: "Data sizes", value: "1 KB × 1M = 1 GB · 1 KB × 1B = 1 TB" },
    { label: "Memory reference", value: "~100 ns" },
    { label: "SSD random read", value: "~100 µs" },
    { label: "Round trip in one data centre", value: "~0.5 ms" },
    { label: "Round trip across continents", value: "~100–150 ms" },
    { label: "Redis, one node", value: "~100k simple ops/s" },
    { label: "Relational DB, one primary", value: "Thousands of simple indexed queries/s; depends heavily on the query" },
    { label: "Stateless app server", value: "Hundreds to a few thousand requests/s, depending on work per request" },
  ],
  mermaidDiagram: `flowchart TD
    subgraph Frame["Frame the problem: about 20 min"]
        direction LR
        R["Requirements ~5 min"] --> E["Estimates ~5 min"] --> A["API ~5 min"] --> D["Data model ~5 min"]
    end
    subgraph Solve["Design and defend: about 25 min"]
        direction LR
        H["High-level design ~10 min"] --> X["Deep dive ~10 min"] --> W["Trade-offs and wrap-up ~5 min"]
    end
    Frame --> Solve`,
  interviewTip:
    "Say the plan out loud in the first minute: 'I'll clarify requirements, do quick estimates, sketch the API and data model, draw the architecture, then go deep on the riskiest part.' At mid-level, interviewers mainly check that you can drive the conversation, make sensible assumptions and justify every box you draw — not that you know exotic technology.",
  sources: [{ label: "Latency numbers every programmer should know", url: "https://gist.github.com/jboner/2841832" }],
};

export const LOAD_BALANCING_SCALING: HLDConcept = {
  id: "load-balancing-scaling",
  level: "core",
  category: "Scalability",
  title: "Load Balancing & Horizontal Scaling",
  summary:
    "Run several identical copies of a service behind a load balancer, so you add capacity by adding machines and survive losing one. That only works if the copies are stateless.",
  keyPrinciples: [
    "Vertical scaling (a bigger machine) is the simplest first step, but it has a ceiling and leaves a single point of failure. Horizontal scaling (more machines) needs a load balancer and stateless servers, but capacity grows with the number of machines and one failure only removes a fraction of it.",
    "An L4 load balancer routes each TCP connection (or UDP flow) by IP and port without reading the request. It is fast and works for any protocol, but cannot route by URL, header or cookie.",
    "An L7 load balancer terminates HTTP (usually TLS too) and reads each request, so it can send /api and /static to different pools, add headers, retry failed idempotent requests and apply rate limits. It costs more CPU per request than L4.",
    "Algorithms: round robin suits requests of similar cost; least connections (or least outstanding requests) adapts when some requests are slow; hashing a key such as user id keeps a client on the same server, which helps local caches but moves many clients when servers are added or removed.",
    "Health checks: the balancer probes each server (for example GET /healthz every 5–10 s), removes it after a few consecutive failures and re-adds it after a few successes. Keep the check cheap. A check that queries the database can mark every server unhealthy at once when only the database is slow.",
    "Stateless services keep session data in a shared store (Redis, the database) or in a signed token or cookie instead of server memory. Any instance can then serve any request, and instances can be added, removed or replaced freely during deploys and autoscaling.",
    "Sticky sessions pin a client to one server with a cookie or an IP hash. They help legacy apps that keep sessions in memory, and long-lived WebSocket connections are naturally pinned. The costs are uneven load and lost sessions when that server dies, so treat stickiness as a workaround, not the design.",
    "The load balancer must not become the single point of failure. Run it as a redundant pair (for example active-passive with a floating IP) or use a managed load balancer, and point DNS at it.",
  ],
  tradeOffs: [
    "L4 vs L7: L4 adds less latency and handles any TCP protocol; L7 gives path-based routing, TLS termination, header inspection and per-request retries. Large systems often put an L4 tier in front of a fleet of L7 proxies.",
    "Sticky sessions vs a shared session store: stickiness avoids a network hop per request but makes load uneven and loses sessions on failure; a shared store adds roughly a millisecond per request but lets any instance serve any user.",
    "Aggressive vs lenient health checks: short intervals and low failure thresholds remove a bad server quickly but can flap during a garbage-collection pause or a brief spike; slower checks keep sending traffic to a dying server for longer.",
    "Autoscaling on CPU is simple but lags sudden spikes, because new instances need time to boot and warm up. Keep headroom (for example target 60–70% CPU) instead of running hot.",
  ],
  mermaidDiagram: `flowchart TD
    Client["Clients"] --> LB["Load balancer pair"]
    LB --> A1["App server 1"]
    LB --> A2["App server 2"]
    LB --> A3["App server 3"]
    LB -.->|health check every 5s| A3
    A1 --> State[("Shared state: Redis sessions and database")]
    A2 --> State
    A3 --> State`,
  interviewTip:
    "When you add a load balancer, say what it enables and what it requires: 'The API servers are stateless — sessions live in Redis — so the balancer can use least-connections and we can autoscale on CPU. The balancer itself runs as a redundant pair and removes servers that fail health checks.'",
  sources: [{ label: "NGINX: HTTP load balancing", url: "https://nginx.org/en/docs/http/load_balancing.html" }],
};

export const SQL_NOSQL_DATA_MODELING: HLDConcept = {
  id: "sql-nosql-data-modeling",
  level: "core",
  category: "Data Storage",
  title: "SQL vs NoSQL & Data Modelling",
  summary:
    "Choose storage from your access patterns and consistency needs. Model the entities, index the queries you actually run, and denormalise only when a hot read path needs it.",
  keyPrinciples: [
    "Relational databases (PostgreSQL, MySQL) provide joins, multi-row ACID transactions, foreign keys, constraints and ad-hoc queries. They are the right default for business data with relationships and invariants: users, orders, payments, inventory.",
    "NoSQL is a family, not one product. Key-value stores (Redis, DynamoDB) serve lookups by key; document stores (MongoDB) keep a self-contained nested record together; wide-column stores (Cassandra) absorb very high write volumes queried by partition key. Most give up joins and cross-partition transactions in exchange for easier horizontal scaling.",
    "Model from access patterns: write each query down ('get order by id', 'list a user's orders newest first', 'products in a category under $50') and make sure a primary key or index serves it. In DynamoDB or Cassandra the key must be designed around the query up front; in SQL you can add an index later.",
    "Indexes: a B-tree index turns a full table scan into a logarithmic lookup and also serves range filters and ORDER BY on its leading columns. A composite index on (user_id, created_at) serves 'WHERE user_id = ? ORDER BY created_at DESC', but not a filter on created_at alone.",
    "Every index is another structure to update on each INSERT, UPDATE and DELETE, and it takes storage. Index the queries you run, and check with EXPLAIN that the index is used.",
    "Normalise first, so each fact lives in one place and updates are simple. Denormalise — copy a field, store a pre-computed count, embed related rows — when a hot read path needs fewer joins, and accept that every copy must now be kept in sync.",
    "Scale a relational database in steps: fix queries and indexes, add a cache, add read replicas, move to a bigger machine, and only then partition (shard) by a key such as user_id. Each step adds operational cost, so take it when a measured number calls for it.",
  ],
  tradeOffs: [
    "Schema-on-write vs schema-on-read: a SQL schema rejects bad data at write time and makes migrations explicit; schemaless documents make adding fields easy but move validation into application code, and old documents can have any shape.",
    "Normalised vs denormalised: normalised data is easy to update but can need joins on every read; denormalised data reads in one lookup, but each update must touch every copy, often asynchronously, so copies can briefly disagree.",
    "More indexes vs faster writes: each extra index speeds up some reads and slows every write to the table. Write-heavy tables should carry only the indexes their real queries need.",
    "Single-node SQL vs a distributed store: one PostgreSQL primary with replicas handles thousands of simple writes per second and keeps transactions simple. Move to a partitioned store when write volume or data size actually exceeds one node, not because 'NoSQL scales'.",
  ],
  quickReference: [
    { label: "Orders, payments, inventory", value: "Relational: transactions and constraints" },
    { label: "Sessions, counters, rate limits", value: "Key-value store such as Redis, with TTLs" },
    { label: "Profile with nested settings", value: "Document store, or a relational JSONB column" },
    { label: "High-volume events and time series", value: "Wide-column or time-series store, keyed by entity and time" },
    { label: "Images, files, large text", value: "Object storage (S3), with metadata in a database" },
    { label: "Full-text search", value: "Search index (Elasticsearch/OpenSearch) fed from the main database" },
  ],
  mermaidDiagram: `flowchart TD
    Q{"Need joins or multi-row transactions?"}
    Q -->|Yes| SQL["Relational database"]
    Q -->|No| K{"Main access pattern?"}
    K -->|Lookup by key| KV["Key-value store"]
    K -->|Nested record by id| DOC["Document store"]
    K -->|Huge write volume by partition| WC["Wide-column store"]
    K -->|Large files| OBJ["Object storage plus metadata DB"]`,
  interviewTip:
    "Don't open with 'I'll use NoSQL because it scales.' Describe the data and its queries instead: 'Orders need a transaction across order rows and inventory, so PostgreSQL; a composite index on (user_id, created_at) serves the order-history page.' Naming the index behind each hot query is a strong mid-level signal.",
  sources: [
    { label: "PostgreSQL: indexes", url: "https://www.postgresql.org/docs/current/indexes.html" },
    { label: "PostgreSQL: multicolumn indexes", url: "https://www.postgresql.org/docs/current/indexes-multicolumn.html" },
  ],
};

export const API_DESIGN_FUNDAMENTALS: HLDConcept = {
  id: "api-design-fundamentals",
  level: "core",
  category: "Network & Web",
  title: "API Design: REST, Idempotency, Pagination & Versioning",
  summary:
    "A good API makes the common case obvious and the failure cases safe: resource-oriented URLs, accurate status codes, retry-safe writes, stable pagination and a plan for change.",
  keyPrinciples: [
    "Resources are nouns and HTTP methods are the verbs: POST /orders creates an order, GET /orders/{id} reads one, PATCH /orders/{id} updates part of it, DELETE removes it, and GET /users/{id}/orders lists a user's orders. Nest only for clear ownership and keep paths shallow.",
    "Method semantics matter for retries: GET is safe (no side effects) and cacheable; PUT and DELETE are idempotent, so repeating them leaves the same state; POST is not idempotent by default, so a retried POST can create a duplicate.",
    "Status codes tell the client what to do next: a 4xx means 'fix the request, retrying won't help' (except 429 and 408); a 5xx or a timeout means 'this may work later', which is safe to retry only for idempotent operations.",
    "Idempotency keys make POST retry-safe. The client generates a unique key per logical operation and sends it in an Idempotency-Key header. The server stores the key with the result; a retry with the same key returns the stored result instead of acting twice. Expire keys after a period such as 24 hours, and reject a reused key whose request body differs.",
    "Offset pagination (?offset=1000&limit=20) is simple and allows jumping to page N, but the database still reads and discards the skipped rows, and rows inserted meanwhile shift items between pages, causing duplicates or gaps.",
    "Cursor (keyset) pagination returns an opaque cursor that encodes the last item's sort key. The next page is 'WHERE (created_at, id) < (cursor values) ORDER BY created_at DESC, id DESC LIMIT 20', which costs the same for every page and stays stable under inserts, but cannot jump to an arbitrary page.",
    "Versioning: put the major version in the path (/v1/) or a header, and within a version make only backwards-compatible changes — add optional fields, never rename or remove fields or change their meaning. Run old and new versions side by side and publish deprecation dates.",
  ],
  tradeOffs: [
    "Offset vs cursor pagination: offset is fine for small admin tables and 'go to page 7' interfaces; cursor pagination is the right default for feeds and for large or frequently changing lists.",
    "Idempotency keys cost a stored record per request and a cleanup job, but without them a client whose 'create payment' call timed out cannot know whether a retry will charge twice.",
    "Path versioning (/v1) is explicit and easy to route, log and test in a browser; header versioning keeps URLs clean but is easier to forget. In both cases the real cost is maintaining two versions, so prefer additive changes.",
    "Fine-grained vs coarse endpoints: many small endpoints are flexible but chatty on mobile networks; one endpoint per screen is fast but couples the API to a single client. Backend-for-frontend layers and GraphQL exist to manage this tension.",
  ],
  quickReference: [
    { label: "200 / 201 / 202 / 204", value: "OK · Created (return id or Location) · Accepted for async work · No content" },
    { label: "400 Bad Request", value: "Malformed request; don't retry unchanged" },
    { label: "401 vs 403", value: "Not authenticated vs authenticated but not allowed" },
    { label: "404 Not Found", value: "Resource doesn't exist, or is hidden from this caller" },
    { label: "409 Conflict", value: "State conflict: stale version, duplicate, or same idempotency key still in progress" },
    { label: "422 Unprocessable Content", value: "Well-formed but fails validation" },
    { label: "429 Too Many Requests", value: "Rate limited; send Retry-After" },
    { label: "500 / 503", value: "Server error / temporarily unavailable; retry idempotent calls with backoff" },
  ],
  mermaidDiagram: `sequenceDiagram
    participant C as Client
    participant API as Payments API
    participant S as Idempotency store
    C->>API: POST /v1/payments with key k1
    API->>S: Save k1 if absent
    S-->>API: New key
    API->>API: Charge card and store result
    API--xC: 201 Created, but the response is lost
    C->>API: Retry POST /v1/payments with key k1
    API->>S: Look up k1
    S-->>API: Stored result
    API-->>C: Same 201 response, no second charge`,
  interviewTip:
    "For any endpoint that creates something or moves money, say how a client retries safely: 'POST /orders takes an Idempotency-Key, and a retry returns the original order.' That answers the duplicate-request follow-up before it is asked. Use cursor pagination for any list that grows.",
  sources: [
    { label: "MDN: HTTP response status codes", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Status" },
    { label: "Stripe: idempotent requests", url: "https://docs.stripe.com/api/idempotent_requests" },
  ],
};

export const MESSAGE_QUEUES_ASYNC: HLDConcept = {
  id: "message-queues-async",
  level: "core",
  category: "Async Processing",
  title: "Message Queues & Async Processing",
  summary:
    "Move slow or failure-prone work off the request path: the API records the intent and returns quickly, and workers process messages at their own pace with retries — which means designing for duplicates.",
  keyPrinciples: [
    "Why queue: a queue decouples producers from consumers, absorbs traffic spikes by buffering instead of failing, and lets a slow dependency (email provider, image processing) fail and retry without failing the user's request.",
    "Queue (point-to-point): each message is handled by one consumer in a worker pool, e.g. 'send this email' jobs in SQS or RabbitMQ. Pub/sub: every subscriber gets its own copy, e.g. 'order placed' consumed independently by billing, email and analytics. In Kafka, each consumer group receives every message, and within a group each partition goes to one consumer.",
    "Delivery guarantees: at-most-once (acknowledge before processing, so a crash loses the message), at-least-once (acknowledge after processing, so a crash before the ack causes redelivery), and effectively-once (at-least-once delivery plus idempotent processing). At-least-once is the practical default, so assume duplicates.",
    "Idempotent consumers: give every message a unique id and make processing safe to repeat. Record processed ids in a table with a unique constraint, inside the same transaction as the side effect, or use naturally idempotent writes such as an UPSERT or 'SET status = SHIPPED WHERE status = PAID'.",
    "Retries with exponential backoff and jitter: retry transient failures after about 1 s, 2 s, 4 s, 8 s…, capped at a maximum delay, with random jitter so thousands of failed messages don't retry in lockstep. Don't retry permanent errors such as an invalid address or a 400 response.",
    "Dead-letter queue (DLQ): after N attempts (e.g. 5), move the message to a DLQ instead of retrying forever or blocking the messages behind it. Alert on DLQ depth, find and fix the cause, then replay the messages.",
    "Visibility timeout (ack deadline): a delivered message is hidden from other consumers for a period; if the worker doesn't acknowledge it in time, it becomes visible again. Set the timeout longer than normal processing time, or extend it for long jobs, to avoid two workers doing the same job.",
  ],
  tradeOffs: [
    "Async vs sync: async keeps the API fast and resilient, but the caller no longer gets the final result in the response. You need a status endpoint, a notification, or 202 Accepted plus polling.",
    "Ordering vs throughput: strict order needs one consumer at a time per ordered stream (a Kafka partition per key, an SQS FIFO message group). Different keys can be processed in parallel; messages for the same key cannot.",
    "Retries vs load: retries recover transient failures but multiply the load on a dependency that is already struggling. Combine backoff, a retry cap and a circuit breaker.",
    "Managed queue vs Kafka: SQS-style queues give per-message acks, visibility timeouts and DLQs out of the box; Kafka adds replay, very high throughput and ordered partitions, but per-message retries and DLQs must be built (e.g. retry topics) because progress is tracked as an offset per partition.",
  ],
  mermaidDiagram: `flowchart LR
    API["API service"] -->|enqueue job| Q[["Job queue"]]
    Q --> W1["Worker 1"]
    Q --> W2["Worker 2"]
    W1 --> Ext["Email provider"]
    W2 --> Ext
    W1 -.->|retry with backoff| Q
    W2 -.->|after 5 attempts| DLQ[["Dead-letter queue"]]
    DLQ --> Ops["Alert, fix, replay"]`,
  interviewTip:
    "Whenever you draw a queue, finish the sentence: 'Delivery is at-least-once, so the consumer deduplicates on message_id; transient failures retry with exponential backoff and go to a DLQ after 5 attempts.' That one sentence covers the three follow-ups interviewers usually ask.",
  sources: [
    { label: "AWS: exponential backoff and jitter", url: "https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/" },
    { label: "Amazon SQS: dead-letter queues", url: "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html" },
  ],
};

export const REPLICATION_READ_REPLICAS: HLDConcept = {
  id: "replication-read-replicas",
  level: "core",
  category: "Data Storage",
  title: "Replication & Read Replicas",
  summary:
    "Copy the database to other machines so reads scale out and a single failure doesn't lose the data — then design around the fact that replicas can lag behind the primary.",
  keyPrinciples: [
    "Primary–replica (leader–follower): all writes go to the primary, which streams its change log (the WAL in PostgreSQL, the binlog in MySQL) to replicas that apply it in order. Reads can be spread over the replicas; write capacity does not grow.",
    "Asynchronous replication: the primary confirms a commit without waiting for replicas. Writes stay fast, but replicas lag — usually milliseconds, sometimes seconds under heavy load or long-running queries — and if the primary dies, its last unreplicated commits can be lost.",
    "Synchronous (or semi-synchronous) replication: the primary waits for at least one replica to confirm before acknowledging. Failing over to that replica loses no confirmed commit, but every write pays a network round trip, and a slow replica slows all writes.",
    "Read-your-writes: after a user edits their profile, a read from a lagging replica can show the old value. Fixes: route that user's reads to the primary for a short window after they write (e.g. 10 s, tracked in the session), always read a user's own data from the primary, or wait until the replica has replayed past the write's log position.",
    "Monotonic reads: if consecutive requests hit replicas with different lag, a user can see a new comment and then see it disappear on refresh. Pinning each user's reads to one replica (e.g. by hashing user_id) prevents going back in time.",
    "Failover: detect that the primary is down (missed heartbeats), promote the most up-to-date replica, repoint writers via DNS, a proxy or a virtual IP, and fence the old primary so it cannot accept writes if it comes back. Managed services automate this; Amazon RDS Multi-AZ failover typically takes one to two minutes.",
  ],
  tradeOffs: [
    "Sync vs async: async gives the lowest write latency but can lose the last few transactions on failover; sync to at least one replica protects confirmed data but ties write latency to the slowest required replica.",
    "More replicas mean more read capacity and more failover candidates, but also more lag variation to reason about. Replicas do nothing for a write-bound database — that needs batching, a bigger primary or sharding.",
    "Replica reads vs freshness: send reads that tolerate a few seconds of staleness (product pages, feeds, search) to replicas, and reads that drive a decision (balance before a withdrawal, stock at checkout) to the primary.",
    "Automatic vs manual failover: automatic failover shortens downtime, but if the old primary was only cut off rather than dead, two primaries can accept writes (split-brain). It needs reliable fencing.",
  ],
  mermaidDiagram: `flowchart TD
    App["App servers"] -->|writes| P[("Primary")]
    App -->|reads needing fresh data| P
    App -->|other reads| R1[("Replica 1")]
    App -->|other reads| R2[("Replica 2")]
    P -.->|async WAL stream| R1
    P -.->|async WAL stream| R2`,
  interviewTip:
    "When you add read replicas, raise replication lag yourself and say how you handle read-your-writes — it is the expected follow-up. Then say what happens when the primary fails and how much data asynchronous replication could lose.",
  sources: [
    { label: "PostgreSQL: high availability and replication", url: "https://www.postgresql.org/docs/current/high-availability.html" },
    { label: "Amazon RDS: Multi-AZ deployments", url: "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZSingleStandby.html" },
  ],
};

export const RATE_LIMITING_FUNDAMENTALS: HLDConcept = {
  id: "rate-limiting-fundamentals",
  level: "core",
  category: "Network & Web",
  title: "Rate Limiting: Algorithms & Placement",
  summary:
    "Cap how many requests a client can make in a period to protect shared capacity, keep costs predictable and slow down abuse. The key choices are the algorithm, what you count by, and where the counter lives.",
  keyPrinciples: [
    "Token bucket: each client has a bucket holding up to B tokens that refills at r tokens per second; a request spends a token or is rejected. It allows bursts of up to B while enforcing an average of r. Only two values are stored per client — tokens and last refill time — and the refill is computed when a request arrives.",
    "Fixed window counter: increment a counter keyed by client and current minute, and reject once it passes the limit. It is the cheapest option, but a client can send double the limit across a window boundary (100 requests at 12:00:59 and 100 more at 12:01:00).",
    "Sliding window log: store a timestamp per request (e.g. in a Redis sorted set), drop timestamps older than the window, and count the rest. It is exact, but memory grows with the limit — 1,000 requests/hour means up to 1,000 timestamps per client.",
    "Sliding window counter: keep counts for the current and previous fixed windows and weight the previous count by how much of it still overlaps the sliding window: estimate = current + previous × (1 − fraction of the current window elapsed). Two counters per client, with the boundary burst mostly smoothed out.",
    "Where it lives: at the edge or API gateway (stops abuse before it costs anything; coarse limits per IP or API key), as middleware in the service (knows the user, plan and endpoint cost), or in front of a fragile dependency to protect it. Real systems usually layer an edge limit and per-user limits.",
    "Distributed counting: with many API servers, local in-memory counters each allow the full limit — 10 servers × 100/min lets a client make 1,000/min. Keep counters in a shared Redis and update them atomically (a Lua script, or INCR with EXPIRE), or accept approximate limits.",
    "Tell the client: reject with 429 Too Many Requests and a Retry-After header, and ideally headers showing the limit and remaining quota, so well-behaved clients slow down.",
  ],
  tradeOffs: [
    "Accuracy vs cost: a sliding log is exact but stores every timestamp; a fixed window is one counter but allows boundary bursts; token bucket and sliding window counter are the usual middle ground.",
    "Shared Redis vs local counters: Redis gives a correct global count but adds a network round trip and a dependency to every request; local counters are free but only approximate a global limit.",
    "Fail open vs fail closed when the counter store is down: failing open keeps the product working but removes protection; failing closed protects the backend but turns a Redis outage into a full outage. Most user-facing APIs fail open with a conservative local fallback.",
    "What to count by: per IP is easy but punishes users behind a shared NAT and is weak against botnets; per API key or user is fairer but only works after authentication.",
  ],
  mermaidDiagram: `flowchart TD
    Req["Request arrives"] --> Refill["Refill: tokens = min(B, tokens + r x elapsed)"]
    Refill --> Check{"At least 1 token?"}
    Check -->|Yes| Take["Spend 1 token and forward"]
    Check -->|No| Reject["Return 429 with Retry-After"]`,
  interviewTip:
    "State the limit concretely ('100 requests per minute per API key, bursts up to 20'), pick token bucket or sliding window counter and say why, keep the counters in Redis behind one atomic script, and say whether you fail open or closed. The Distributed Rate Limiter case study walks through the full design.",
  sources: [
    { label: "Stripe: scaling your API with rate limiters", url: "https://stripe.com/blog/rate-limiters" },
    { label: "Redis: INCR rate limiter pattern", url: "https://redis.io/docs/latest/commands/incr/" },
  ],
};

/** Mid-level essentials, in suggested study order. */
export const MID_LEVEL_CONCEPTS: HLDConcept[] = [
  DESIGN_INTERVIEW_APPROACH,
  LOAD_BALANCING_SCALING,
  SQL_NOSQL_DATA_MODELING,
  API_DESIGN_FUNDAMENTALS,
  MESSAGE_QUEUES_ASYNC,
  REPLICATION_READ_REPLICAS,
  RATE_LIMITING_FUNDAMENTALS,
];
