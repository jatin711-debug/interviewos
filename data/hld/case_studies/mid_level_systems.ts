import { HLDCaseStudy } from "../types";

export const PASTEBIN_CASE_STUDY: HLDCaseStudy = {
  id: "pastebin",
  level: "core",
  title: "Pastebin: Text Sharing Service",
  category: "Classic",
  summary:
    "Users paste text and get a short link that anyone with the link can read until it expires. A read-heavy service whose main decisions are where the content lives (object storage, not the database), how ids are generated, and how expired pastes are cleaned up.",
  rubric: {
    functionalRequirements: [
      "Create a paste of up to 1 MB of text (typically ~10 KB) and receive a unique URL.",
      "Anyone with the URL can view the paste, including a raw plain-text view for scripts and curl.",
      "Optional expiry (10 minutes, 1 day, 1 week, never) and visibility (public or unlisted).",
      "Signed-in users can list and delete their own pastes. Out of scope: editing, search, comments; syntax highlighting happens in the browser.",
    ],
    nonFunctionalRequirements: [
      "Read-heavy: about 10 reads per write.",
      "Reads under 200 ms at p99 for most users; a created paste must not be lost before it expires.",
      "Unlisted pastes are protected only by their URL, so ids must be random and hard to guess, not sequential.",
      "Highly available reads; a paste appearing in the creator's list a second late is acceptable.",
    ],
    estimations: {
      rps: "Writes: 1M pastes/day ÷ 86,400 s ≈ 12/s average, ~40/s at a 3× peak. Reads: 10 × 1M = 10M/day ≈ 115/s average, ~350/s at peak.",
      storagePerDay: "Content: 1M × 10 KB = 10 GB/day ≈ 3.65 TB/year in object storage (before expiries free any of it). Metadata: 1M × ~300 B = 300 MB/day ≈ 110 GB/year — comfortable for one PostgreSQL instance.",
      bandwidth: "Egress: 115 reads/s × 10 KB ≈ 1.2 MB/s average, ~3.5 MB/s at peak. Ingress: 12/s × 10 KB ≈ 120 KB/s. A CDN is there for latency, not because bandwidth is large.",
      cacheSize: "If ~20% of the last 3 days' pastes get most reads: 3 × 1M × 20% × 10 KB = 6 GB — one Redis node, plus CDN caching for public pastes.",
    },
    apiDesign: [
      {
        endpoint: "/v1/pastes",
        method: "POST",
        description: "Creates a paste. Accepts an Idempotency-Key header so a retried request doesn't create two pastes. Rate limited per user or IP.",
        payload: '{ "content": "def main(): ...", "expires_in": "1d", "visibility": "unlisted", "language": "python" }',
        response: '201 { "id": "aZ3kP9qLx2", "url": "https://paste.example/aZ3kP9qLx2", "expires_at": "2026-11-01T12:00:00Z" }',
      },
      {
        endpoint: "/v1/pastes/{id}",
        method: "GET",
        description: "Returns metadata and content. 404 if the paste doesn't exist or has expired.",
        response: '{ "id": "aZ3kP9qLx2", "content": "...", "language": "python", "created_at": "...", "expires_at": "..." }',
      },
      {
        endpoint: "/raw/{id}",
        method: "GET",
        description: "Plain-text body for scripts. Public pastes are sent with a Cache-Control max-age no longer than their remaining lifetime, so the CDN can serve them.",
        response: "200 text/plain body",
      },
      {
        endpoint: "/v1/users/me/pastes?cursor={cursor}&limit=20",
        method: "GET",
        description: "The caller's pastes, newest first, with cursor pagination on (created_at, id).",
        response: '{ "items": [{ "id": "...", "created_at": "...", "size_bytes": 10240 }], "next_cursor": "eyJjIjoi..." }',
      },
      {
        endpoint: "/v1/pastes/{id}",
        method: "DELETE",
        description: "Owner deletes a paste; the service also removes the cache entry and purges the CDN path.",
        response: "204 No Content",
      },
    ],
    dbSchema: [
      {
        table: "pastes (PostgreSQL — metadata only)",
        primaryKey: "id (10-char random base62)",
        fields: ["id (char 10)", "user_id (bigint, null for anonymous)", "object_key (text)", "size_bytes (int)", "language (text)", "visibility (public | unlisted)", "created_at (timestamptz)", "expires_at (timestamptz, null = never)"],
        notes: "About 300 bytes per row. Index (user_id, created_at DESC) for 'my pastes', and a partial index on expires_at WHERE expires_at IS NOT NULL for the cleanup job.",
      },
      {
        table: "paste content (object storage, e.g. S3)",
        primaryKey: "object key: {expiry_prefix}/{id}",
        fields: ["body (gzip-compressed text)", "Content-Type: text/plain; charset=utf-8"],
        notes: "Cheap per GB and very durable, and keeps the database small enough to back up and replicate quickly. Very small pastes (under ~1 KB) could be stored inline in the row to save a round trip.",
      },
    ],
    architectureDiagram: `flowchart TD
    User["Browser or CLI"] --> CDN["CDN for public pastes"]
    CDN --> LB["Load balancer"]
    LB --> API["Paste API, stateless"]
    API --> Cache[("Redis cache")]
    API --> DB[("PostgreSQL metadata")]
    API --> S3[("Object storage content")]
    Cleaner["Expiry cleanup job"] --> DB
    Cleaner --> S3`,
    deepDiveAndBottlenecks: [
      {
        topic: "Generating paste ids",
        problem: "Ids must be unique, short and unguessable, because an unlisted paste is protected only by its URL. Sequential ids are short but let anyone enumerate pastes; hashing the content makes identical pastes collide and reveals whether some text was ever pasted.",
        solution: "Generate 10 random base62 characters with a cryptographically secure random generator: 62^10 ≈ 8.4 × 10^17 possible ids. Insert with the id as primary key and regenerate on the rare unique-key violation. After a year (~3.65 × 10^8 pastes) a new id collides with probability ≈ 4 × 10^-10, and a scanner would need about 2.3 billion guesses per paste found, which per-IP rate limits make impractical. No central id service is needed. Seven or eight characters look nicer but make enumerating unlisted pastes feasible at this scale.",
      },
      {
        topic: "Storing content: database vs object storage",
        problem: "Storing 10 KB–1 MB bodies in PostgreSQL rows grows the database by ~3.65 TB a year, slows backups and replica rebuilds, and pushes useful index pages out of its memory.",
        solution: "Keep bodies in object storage keyed by paste id and only metadata in PostgreSQL. Upload the object first, then insert the row, so a reader never finds a row pointing at missing content; an object orphaned by a failed insert is removed by a periodic sweep. For large pastes, the API can hand the client a pre-signed upload URL instead of proxying the bytes.",
      },
      {
        topic: "Expiry and cleanup",
        problem: "An expired paste must stop being readable immediately, but deleting millions of rows and objects at once would load the database.",
        solution: "Check expires_at on every read and return 404 once it has passed, so correctness never depends on cleanup timing. A background job deletes expired rows in small batches (e.g. 1,000 at a time via the expires_at index) along with their objects. Writing objects under a prefix per expiry option (1d/, 1w/) also lets an object-storage lifecycle rule delete them; lifecycle rules work in whole days, so the job still handles 10-minute pastes.",
      },
      {
        topic: "Caching popular pastes",
        problem: "A public paste shared on social media can get thousands of reads per second for one id.",
        solution: "Pastes are immutable, which makes caching easy: entries only need removing on delete or expiry. Serve public pastes through the CDN with max-age = min(remaining lifetime, 1 day), and use cache-aside in Redis for API reads with a TTL no longer than the remaining lifetime. A delete removes the Redis key and purges the CDN path.",
      },
    ],
    tradeOffs: [
      "Random 10-character ids vs short sequential ids: slightly longer URLs in exchange for no coordination service and unguessable unlisted links.",
      "Object storage plus a metadata database vs everything in PostgreSQL: two systems to keep consistent (handled by write order and a sweep), but the database stays around 110 GB/year and blobs cost cents per GB-month.",
      "Expiry check on read plus batch cleanup vs deleting at the exact expiry time: reads are correct immediately and storage is reclaimed a little later, without bursts of deletes.",
      "One primary database plus a CDN vs multi-region writes: at ~40 writes/s at peak, one primary with a standby is plenty, and the CDN handles global read latency.",
    ],
    followUpQuestions: [
      {
        question: "How would you add 'burn after reading'?",
        answer: "Mark the paste consumed atomically on the first read — UPDATE pastes SET consumed_at = now() WHERE id = ? AND consumed_at IS NULL RETURNING object_key — so only the request that flips it gets the content. Never cache these pastes in Redis or the CDN.",
      },
      {
        question: "How do you stop it being used to host malware or leaked credentials?",
        answer: "Rate limit creates per IP and user, cap the size, scan new pastes asynchronously (queue → scanner) and take down flagged ones, and offer an abuse-report endpoint.",
      },
      {
        question: "What changes at 100× the traffic?",
        answer: "Peak reads become ~35,000/s: the CDN and Redis absorb most of them, and read replicas serve metadata misses. Peak writes become ~4,000/s, which a well-tuned primary can still handle; past that, partition metadata by id hash. Object storage scales on its own.",
      },
      {
        question: "What if users want to edit a paste?",
        answer: "Editing breaks the 'immutable, cache freely' property. Either store versions (new object key and version number per edit, then purge caches) or keep pastes immutable and offer 'fork into a new paste'.",
      },
    ],
  },
};

export const RATE_LIMITER_CASE_STUDY: HLDCaseStudy = {
  id: "distributed-rate-limiter",
  level: "core",
  title: "Distributed Rate Limiter",
  category: "Classic",
  summary:
    "Enforce per-client limits such as 100 requests per minute per API key across a fleet of API gateways, adding about a millisecond per request and degrading safely when its own store is unavailable.",
  rubric: {
    functionalRequirements: [
      "Limit requests per client key — API key, user id or IP — per rule, e.g. 100/min per API key, 10 login attempts/min per IP.",
      "Rules vary by endpoint and plan (free vs paid) and can change without redeploying the API servers.",
      "Rejected requests get 429 Too Many Requests with Retry-After and headers showing the limit and remaining quota.",
      "A limit applies across all API servers combined, not per server.",
    ],
    nonFunctionalRequirements: [
      "Low overhead: about 1 ms added at p50, under ~5 ms at p99.",
      "A limiter failure must not take the API down: fail open with a local fallback limit.",
      "Small, brief overshoot (a few percent) is acceptable; clients under their limit must not be rejected.",
      "Scale: 50,000 requests/s at peak across 1M active API keys.",
    ],
    estimations: {
      rps: "50,000 requests/s at peak = 50,000 limiter checks/s, one Redis round trip each. A Redis primary handles on the order of 100k simple ops/s, and Lua scripts cost more than plain GET/SET, so shard across 3–4 primaries for headroom.",
      storagePerDay: "Token bucket state is 2 fields per key, ~150 B with Redis overhead. 1M keys × 2 rules × 150 B ≈ 300 MB. It doesn't grow per day: keys expire once a bucket would be full again. Rules: a few KB.",
      bandwidth: "Each check ≈ 200 B request + 50 B response ≈ 250 B; 50,000/s × 250 B ≈ 12.5 MB/s between gateways and Redis — trivial on a 10 Gbps network.",
      cacheSize: "The whole working set (~300 MB) fits in memory many times over. Rules are cached in each gateway's memory and refreshed about every 30 s, so rule lookups cost no network call.",
    },
    apiDesign: [
      {
        endpoint: "ratelimit.v1.RateLimiter/Check",
        method: "gRPC",
        description: "Called by gateway middleware before forwarding a request. The same logic can run in-process as a shared library that talks to Redis directly, which saves a hop.",
        payload: '{ "key": "apikey:ak_81f2", "rule": "orders_free", "cost": 1 }',
        response: '{ "allowed": true, "limit": 100, "remaining": 37, "reset_after_ms": 21000 }',
      },
      {
        endpoint: "/v1/rules/{rule_id}",
        method: "PUT",
        description: "Admin API to create or change a rule. Gateways pick up the new version within ~30 s.",
        payload: '{ "match": { "route": "POST /v1/orders", "plan": "free" }, "key_type": "api_key", "algorithm": "token_bucket", "capacity": 20, "refill_per_sec": 1.67 }',
        response: '{ "rule_id": "orders_free", "version": 7 }',
      },
      {
        endpoint: "Any protected endpoint, e.g. /v1/orders",
        method: "POST",
        description: "What a throttled client sees. Well-behaved clients wait for Retry-After before trying again.",
        response: "429 Too Many Requests · Retry-After: 21 · RateLimit-Limit: 100 · RateLimit-Remaining: 0",
      },
    ],
    dbSchema: [
      {
        table: "token buckets (Redis hash)",
        primaryKey: "rl:{client_key}:{rule_id}",
        fields: ["tokens (float)", "last_refill_ms (int)", "TTL ≈ time to refill a full bucket"],
        notes: "Refill, check and decrement run in one Lua script so two gateways can't both spend the last token. Wrapping the client key in braces is a Redis Cluster hash tag: all of one client's rules land on the same shard.",
      },
      {
        table: "rate_limit_rules (PostgreSQL or a config repo)",
        primaryKey: "rule_id",
        fields: ["match (route, method, plan)", "key_type (api_key | user | ip)", "algorithm (token_bucket | sliding_window)", "capacity (int)", "refill_per_sec (float)", "version (int)"],
        notes: "Small and read-mostly. Each gateway loads every rule into memory and polls for a newer version, so the hot path never reads this table.",
      },
    ],
    architectureDiagram: `flowchart TD
    Client["Clients"] --> LB["Load balancer"]
    LB --> GW1["Gateway 1 with limiter"]
    LB --> GW2["Gateway 2 with limiter"]
    GW1 -->|Lua: refill and take token| Redis[("Redis cluster counters")]
    GW2 -->|Lua: refill and take token| Redis
    GW1 -->|allowed| Svc["Backend services"]
    GW2 -->|allowed| Svc
    Rules[("Rules store")] -.->|poll every 30s| GW1
    Rules -.->|poll every 30s| GW2`,
    deepDiveAndBottlenecks: [
      {
        topic: "Race conditions on shared counters",
        problem: "Two gateways read tokens = 1 at the same moment, both allow the request, and both write tokens = 0: the client got two requests for one token. With read-then-write from many servers, the overshoot grows with concurrency.",
        solution: "Do refill, check and decrement atomically inside Redis with one Lua script (loaded once, called with EVALSHA); it runs as a single operation on the shard that owns the key. For a fixed window, INCR is already atomic: INCR the key, and if the result is 1, set EXPIRE 60 — inside the same script, so a crash can't leave a counter without a TTL.",
      },
      {
        topic: "Choosing the algorithm",
        problem: "A fixed window lets a client send up to twice the limit around the boundary; a sliding log stores every timestamp (100 entries per client at 100/min, so 100M entries for 1M clients).",
        solution: "Token bucket for general API limits: two fields per key, bursts up to the capacity, an exact long-run rate. Sliding window counter where a hard 'N per window' matters, such as login attempts: two counters per key and a small error. Sliding log only for low limits that must be exact.",
      },
      {
        topic: "Redis failure and latency",
        problem: "If every request waits on Redis, a Redis outage or a slow shard becomes an API outage.",
        solution: "Give the limiter call a tight timeout (e.g. 5–10 ms). On timeout or error, fail open but apply a coarse in-memory token bucket in each gateway (global limit ÷ number of gateways), so protection degrades instead of vanishing. Run Redis with replicas and automatic failover; losing counters during failover only gives some clients a fresh bucket.",
      },
      {
        topic: "Hot keys and Redis load",
        problem: "One abusive key sending 20,000 requests/s hammers a single Redis shard, and every check is a network round trip.",
        solution: "After rejecting a key, cache 'blocked until T' locally in the gateway and reject further requests without calling Redis. For very high-volume tenants, let each gateway take tokens in batches (e.g. 10 at a time) and spend them locally — slightly less accurate, ten times fewer Redis calls.",
      },
    ],
    tradeOffs: [
      "Library in the gateway vs a separate rate-limit service: the library saves a network hop; a service centralises the logic for many languages and teams (Envoy's global rate limit service follows this model) at the cost of an extra hop and another service to run.",
      "Central Redis vs local-only counters: global accuracy vs zero added latency. The hybrid — Redis, plus a local deny cache and a local fallback limit — is common.",
      "Fail open vs fail closed: fail open for general API traffic to keep availability; fail closed for security limits such as login attempts or one-time-code sends, where a brief outage is better than unlimited guessing.",
      "Bucket capacity: a larger burst allowance is friendlier to legitimate clients (a page load firing 20 calls at once) but also lets abusers spike. Set capacity per plan.",
    ],
    followUpQuestions: [
      {
        question: "How would you enforce one limit across several regions?",
        answer: "Give each region its own counters and a share of the global limit (e.g. in proportion to recent traffic), or sync counts between regions asynchronously and accept brief overshoot. A strongly consistent global counter would add a cross-region round trip (~70–150 ms) to every request.",
      },
      {
        question: "How do you limit by cost instead of request count?",
        answer: "Assign each route a cost in tokens and pass it to the check: a search might cost 10 tokens and a simple read 1, so expensive endpoints drain the bucket faster.",
      },
      {
        question: "How would you test it?",
        answer: "Unit-test the script with a fake clock; load-test many concurrent clients on one key and assert the allowed count stays within limit × (1 + tolerance); kill Redis during a test to confirm the fail-open path.",
      },
    ],
  },
};

export const NOTIFICATION_SYSTEM_CASE_STUDY: HLDCaseStudy = {
  id: "notification-system",
  level: "core",
  title: "Notification System: Email, SMS & Push",
  category: "Classic",
  summary:
    "A shared service other teams call to notify users by email, SMS and mobile push. It applies user preferences and quiet hours, retries flaky third-party providers without sending duplicates, and records what happened to every message.",
  rubric: {
    functionalRequirements: [
      "Internal services send a notification by type (e.g. order_shipped) and user id; the service renders the template and chooses channels.",
      "Channels: email, SMS and mobile push (APNs for iOS, FCM for Android) through third-party providers.",
      "Users set preferences per category and channel (e.g. marketing by email only), unsubscribe, and quiet hours in their own time zone.",
      "Both immediate transactional sends (password reset, one-time codes) and large scheduled campaigns.",
      "Status per message and channel: queued, sent, delivered, failed — as reported by the provider.",
    ],
    nonFunctionalRequirements: [
      "Transactional notifications reach the provider within a few seconds; campaigns may take minutes to hours.",
      "At-least-once delivery to providers with deduplication, so duplicates are rare.",
      "A slow or failing provider must not block other channels or other notification types.",
      "Respect provider rate limits and per-user frequency caps.",
    ],
    estimations: {
      rps: "10M daily active users × ~5 notifications = 50M/day ÷ 86,400 s ≈ 580/s average. A campaign to 10M users sent over one hour adds 10M ÷ 3,600 ≈ 2,800/s, so plan queues and workers for ~5,000/s at peak.",
      storagePerDay: "Delivery log: 50M × ~500 B = 25 GB/day. Keeping 90 days hot ≈ 2.25 TB, then archiving to object storage. Preferences: 50M registered users × ~200 B ≈ 10 GB in total.",
      bandwidth: "Email is ~35% of volume: ~200/s × ~50 KB of HTML ≈ 10 MB/s to providers. Push payloads are capped at 4 KB and an SMS segment is 140 bytes, so the other channels are negligible.",
      cacheSize: "Preferences and push tokens for active users: 10M × (200 B + 2 devices × 200 B) ≈ 6 GB in Redis. Templates (a few thousand × ~10 KB) are tens of MB, held in each worker's memory.",
    },
    apiDesign: [
      {
        endpoint: "/v1/notifications",
        method: "POST",
        description: "Internal API. Validates the request, records it, enqueues it and returns 202 at once. The caller's idempotency_key makes retries safe.",
        payload: '{ "idempotency_key": "order_123_shipped", "user_id": "u_42", "type": "order_shipped", "data": { "order_id": "123", "eta": "Nov 3" }, "priority": "transactional" }',
        response: '202 { "notification_id": "ntf_9f1c", "status": "queued" }',
      },
      {
        endpoint: "/v1/notifications/{id}",
        method: "GET",
        description: "Per-channel status, used by support tools and for debugging.",
        response: '{ "id": "ntf_9f1c", "deliveries": [{ "channel": "email", "status": "delivered" }, { "channel": "push", "status": "failed", "error": "token_unregistered" }] }',
      },
      {
        endpoint: "/v1/users/{user_id}/preferences",
        method: "PUT",
        description: "Called by the app's backend when a user changes settings. Invalidates the cached preferences so the change applies within seconds.",
        payload: '{ "marketing": { "email": true, "sms": false, "push": false }, "quiet_hours": { "start": "22:00", "end": "07:00", "tz": "America/Toronto" } }',
        response: "200 OK",
      },
      {
        endpoint: "/v1/devices",
        method: "POST",
        description: "Registers or refreshes a push token when the app starts.",
        payload: '{ "user_id": "u_42", "platform": "ios", "token": "<APNs device token>" }',
        response: "201 Created",
      },
      {
        endpoint: "/v1/webhooks/{provider}",
        method: "POST",
        description: "Delivery receipts and bounces from providers. Signature-verified; updates delivery status, and a hard bounce disables that address.",
      },
    ],
    dbSchema: [
      {
        table: "notifications (PostgreSQL, partitioned by day)",
        primaryKey: "(created_at, notification_id)",
        fields: ["notification_id (ULID)", "idempotency_key (text)", "user_id", "type", "priority (transactional | bulk)", "data (jsonb)", "created_at (timestamptz)"],
        notes: "One row per request. Daily partitions make retention cheap: dropping a 90-day-old partition is instant, whereas deleting 50M rows is not. A unique index on a partitioned table must include the partition key, so deduplication on idempotency_key uses a Redis SET NX with a 24 h TTL in front of this table.",
      },
      {
        table: "deliveries (PostgreSQL, partitioned by day)",
        primaryKey: "(created_at, notification_id, channel)",
        fields: ["channel (email | sms | push)", "status (queued | sending | sent | delivered | failed | suppressed)", "attempts (int)", "provider_message_id", "last_error", "updated_at"],
        notes: "Workers change status with conditional updates (WHERE status = 'queued'), so a redelivered queue message can't send twice. 'suppressed' records why nothing was sent (opted out, quiet hours).",
      },
      {
        table: "user_preferences (PostgreSQL, cached in Redis)",
        primaryKey: "(user_id, category)",
        fields: ["email_enabled", "sms_enabled", "push_enabled", "quiet_start", "quiet_end", "timezone", "updated_at"],
        notes: "Read for every send, so served from Redis; updates invalidate the cache entry. Mandatory categories (security alerts, password resets) ignore marketing opt-outs.",
      },
      {
        table: "device_tokens (PostgreSQL)",
        primaryKey: "(user_id, token)",
        fields: ["platform (ios | android | web)", "app_version", "last_seen_at", "active (bool)"],
        notes: "A user can have several devices. Tokens that APNs or FCM report as invalid are deactivated so we stop sending to them.",
      },
    ],
    architectureDiagram: `flowchart TD
    Svc["Calling services"] -->|POST /notifications| API["Notification API"]
    API --> Redis[("Redis: dedup and prefs cache")]
    API --> DB[("PostgreSQL: log and prefs")]
    API --> Intake[["Intake queue"]]
    Intake --> Router["Router: prefs, quiet hours, template"]
    Router --> EQ[["Email queue"]]
    Router --> SQ[["SMS queue"]]
    Router --> PQ[["Push queue"]]
    EQ --> EW["Email workers"]
    SQ --> SW["SMS workers"]
    PQ --> PW["Push workers"]
    EW --> Prov["Providers: email, SMS, APNs, FCM"]
    SW --> Prov
    PW --> Prov
    Prov -.->|delivery webhooks| API`,
    deepDiveAndBottlenecks: [
      {
        topic: "Retries without duplicate sends",
        problem: "A worker sends an email, the provider accepts it, and the worker crashes before acknowledging the queue message. The message is redelivered and the user gets the email twice. Blindly retrying on timeouts has the same effect.",
        solution: "Make each send idempotent per (notification_id, channel). Before calling the provider, conditionally move the delivery row from queued to sending; on success, store provider_message_id and mark it sent. A redelivered message that finds 'sent' just acknowledges. If it finds 'sending' older than the visibility timeout, the previous worker probably crashed mid-send: check the provider by our reference id where its API allows, otherwise resend and accept a rare duplicate. Pass notification_id as the provider's idempotency key when supported.",
      },
      {
        topic: "Retry policy and dead letters",
        problem: "Providers fail in different ways: timeouts and 5xx responses are transient, 429 means slow down, and an invalid number, a hard-bounced address or an unregistered push token is permanent.",
        solution: "Classify errors. Transient: retry with exponential backoff and jitter (e.g. 30 s, 1, 2, 4, 8 min), then move to a dead-letter queue after 5 attempts. 429: back off and lower that worker pool's send rate. Permanent: mark failed immediately and disable the address or token. For one-time codes, switch to a secondary SMS provider after repeated provider-level failures.",
      },
      {
        topic: "Preferences, quiet hours and frequency caps",
        problem: "Checking preferences in the wrong place either sends unwanted messages or blocks critical ones, and quiet hours depend on the user's local time.",
        solution: "The router applies rules per channel after deduplication: category opt-outs (except mandatory security categories), quiet hours in the user's time zone (non-urgent messages are delayed until the window ends, via a delay queue or a scheduled row), and frequency caps such as at most 3 marketing pushes a day (a Redis counter per user per day). Unsubscribe must take effect promptly — anti-spam laws such as CAN-SPAM and CASL require a working unsubscribe for marketing email.",
      },
      {
        topic: "Isolating priorities and channels",
        problem: "A 10M-user campaign enqueued at 9:00 sits ahead of a password-reset email, and a slow SMS provider backs up the shared workers so email stalls too.",
        solution: "Use separate queues and worker pools per channel and per priority (transactional vs bulk), each with its own rate limit. Transactional queues are short and drained first; campaigns are throttled to each provider's allowed send rate. One channel's backlog can't block another.",
      },
    ],
    tradeOffs: [
      "Async 202 vs synchronous send: callers get a fast, reliable API that a slow provider can't drag down, but they don't learn the delivery result inline; they query the status or subscribe to delivery events.",
      "Queues per channel and priority vs one queue: more queues to operate, but a campaign or an SMS outage can't delay a one-time code.",
      "At-least-once plus deduplication vs exactly-once: exactly-once delivery through an external provider isn't achievable. Deduplicating on notification_id, plus provider idempotency keys, makes duplicates rare rather than impossible.",
      "Redis deduplication vs a database unique constraint: SET NX is fast and expires on its own, but a Redis failover can lose recent keys and let a rare duplicate through — acceptable for notifications, not for payments.",
    ],
    followUpQuestions: [
      {
        question: "How do you send a campaign to 10M users without overloading anything?",
        answer: "A campaign job pages through the audience in batches (e.g. 1,000 users per message), enqueues at a controlled rate, and checkpoints its progress so a crash resumes rather than restarts. Workers stay within each provider's quota.",
      },
      {
        question: "How would you add an in-app notification inbox?",
        answer: "Treat it as another channel: write to an inbox table keyed by (user_id, created_at) with a read flag, push over WebSocket or SSE if the user is online, and page the inbox API with a cursor.",
      },
      {
        question: "How do you make sure one-time codes arrive quickly?",
        answer: "A dedicated high-priority queue and worker pool, short retry intervals, a secondary SMS provider for failover, and an alert on enqueue-to-send latency.",
      },
      {
        question: "How do you measure delivery quality?",
        answer: "From provider webhooks, track success rate, latency and bounce rate per provider and channel; alert on dead-letter queue depth and on the age of the oldest message in each queue.",
      },
    ],
  },
};

export const CHECKOUT_CASE_STUDY: HLDCaseStudy = {
  id: "ecommerce-checkout",
  level: "core",
  title: "E-commerce Checkout & Order Service",
  category: "Classic",
  summary:
    "Turn a cart into a paid order without overselling stock or charging twice. The design centres on short-lived inventory reservations, idempotent payment calls, and an explicit order state machine.",
  rubric: {
    functionalRequirements: [
      "Check out a cart: re-validate prices, reserve stock, take payment and create the order.",
      "Stock is held for a short time (e.g. 10 minutes) while the customer pays, and released if payment fails or they abandon checkout.",
      "Order states visible to the customer: pending payment → paid → shipped → delivered, plus cancelled and refunded.",
      "Order history per customer; cancelling before shipment releases stock and refunds the payment.",
      "Out of scope: product search, the cart itself, shipping logistics.",
    ],
    nonFunctionalRequirements: [
      "Correctness first for money and stock: never oversell, never charge twice.",
      "Checkout p99 under ~2 s, most of which is the payment provider's call.",
      "Flash sales bring ~10× normal traffic.",
      "Every state change is recorded for audit and support.",
    ],
    estimations: {
      rps: "1M orders/day ÷ 86,400 s ≈ 12 checkouts/s average, ~120/s in a 10× flash sale. Each checkout makes ~8 writes (order, items, reservations, payment attempt, outbox event) → ~1,000 writes/s at peak. Status and history reads ≈ 20 per order → ~240/s average.",
      storagePerDay: "Order ~1 KB + 3 items × 200 B + payment and event rows ~1 KB ≈ 2.5 KB/order → 1M × 2.5 KB = 2.5 GB/day ≈ 0.9 TB/year. One PostgreSQL primary holds years of this; archive orders older than ~2 years.",
      bandwidth: "120 checkouts/s × ~5 KB of JSON in and out ≈ 0.6 MB/s at peak. Product images come from the CDN, not this service.",
      cacheSize: "Catalog prices and product details for validation: 1M SKUs × 1 KB = 1 GB in Redis. Stock levels may be cached for display, but the reservation decision always goes to the database.",
    },
    apiDesign: [
      {
        endpoint: "/v1/checkout",
        method: "POST",
        description: "Re-reads prices, creates the order in PENDING_PAYMENT and reserves stock in one transaction. Requires an Idempotency-Key header, so a double-clicked 'Place order' creates a single order.",
        payload: '{ "cart_id": "c_771", "shipping_address_id": "a_12" }',
        response: '201 { "order_id": "o_5521", "status": "PENDING_PAYMENT", "total_cents": 8497, "hold_expires_at": "2026-10-31T12:10:00Z" }',
      },
      {
        endpoint: "/v1/orders/{order_id}/payments",
        method: "POST",
        description: "Creates a payment attempt and authorises it with the provider, using the attempt id as the provider's idempotency key. Moves the order to PAID on success.",
        payload: '{ "payment_method_id": "pm_card_visa" }',
        response: '200 { "order_id": "o_5521", "status": "PAID" } or 402 { "error": "card_declined" }',
      },
      {
        endpoint: "/v1/webhooks/payments",
        method: "POST",
        description: "Asynchronous results from the provider (e.g. after 3-D Secure). Signature-verified, deduplicated by event id, and applied through the same state transition as the synchronous path.",
      },
      {
        endpoint: "/v1/orders/{order_id}",
        method: "GET",
        description: "Order with its items and current status.",
        response: '{ "order_id": "o_5521", "status": "SHIPPED", "items": [{ "sku": "SKU-1", "qty": 2, "unit_price_cents": 2999 }] }',
      },
      {
        endpoint: "/v1/users/me/orders?cursor={cursor}&limit=20",
        method: "GET",
        description: "Order history, newest first, with cursor pagination on (created_at, order_id). Can be served from a read replica.",
      },
      {
        endpoint: "/v1/orders/{order_id}/cancel",
        method: "POST",
        description: "Allowed only before SHIPPED. Releases stock and refunds any payment; returns 409 Conflict if the order has already shipped.",
        response: '200 { "status": "CANCELLED" } or 409 { "error": "already_shipped" }',
      },
    ],
    dbSchema: [
      {
        table: "orders (PostgreSQL)",
        primaryKey: "order_id",
        fields: ["user_id", "status (PENDING_PAYMENT | PAID | SHIPPED | DELIVERED | CANCELLED | REFUNDED)", "total_cents (bigint)", "currency", "idempotency_key", "version (int)", "created_at", "updated_at"],
        notes: "UNIQUE (user_id, idempotency_key) makes checkout retries return the same order. Index (user_id, created_at DESC) serves order history.",
      },
      {
        table: "order_items (PostgreSQL)",
        primaryKey: "(order_id, line_no)",
        fields: ["sku", "quantity", "unit_price_cents (price at purchase time)"],
        notes: "Prices are copied at checkout — deliberate denormalisation, so later catalog price changes never alter past orders.",
      },
      {
        table: "inventory (PostgreSQL)",
        primaryKey: "sku",
        fields: ["on_hand (int)", "reserved (int)", "CHECK (reserved <= on_hand)"],
        notes: "Available = on_hand − reserved. Reserve with one conditional UPDATE: SET reserved = reserved + :q WHERE sku = :sku AND on_hand − reserved >= :q. Zero rows updated means out of stock.",
      },
      {
        table: "inventory_reservations (PostgreSQL)",
        primaryKey: "(order_id, sku)",
        fields: ["quantity", "status (HELD | COMMITTED | RELEASED)", "expires_at"],
        notes: "Partial index on expires_at WHERE status = 'HELD' for the sweeper. On payment: COMMITTED, and inventory on_hand and reserved both drop by the quantity, in the same transaction that marks the order PAID.",
      },
      {
        table: "payment_attempts (PostgreSQL)",
        primaryKey: "attempt_id (also the provider idempotency key)",
        fields: ["order_id", "amount_cents", "provider_ref", "status (PENDING | AUTHORIZED | CAPTURED | FAILED | REFUNDED)", "created_at"],
        notes: "A retried network call reuses the attempt id; a new card is a new attempt. A partial unique index on (order_id) WHERE status IN ('AUTHORIZED', 'CAPTURED') allows at most one successful payment per order.",
      },
      {
        table: "outbox (PostgreSQL)",
        primaryKey: "event_id",
        fields: ["order_id", "type (OrderPaid, OrderCancelled, ...)", "payload (jsonb)", "created_at", "published_at"],
        notes: "Written in the same transaction as each state change; a relay publishes rows to the event bus for email, fulfilment and analytics.",
      },
    ],
    architectureDiagram: `flowchart TD
    Client["Web and mobile"] --> LB["Load balancer"]
    LB --> Order["Order service"]
    Order -->|read prices| Catalog["Catalog with Redis cache"]
    Order -->|reserve stock and create order| DB[("PostgreSQL: orders, inventory, outbox")]
    Order -->|then authorise with idempotency key| PSP["Payment provider"]
    PSP -.->|webhook: payment result| Order
    Sweeper["Reservation sweeper"] -->|release expired holds| DB
    DB -->|outbox relay| Bus[["Event bus"]]
    Bus --> Notify["Notifications"]
    Bus --> Fulfil["Fulfilment"]`,
    deepDiveAndBottlenecks: [
      {
        topic: "Preventing overselling",
        problem: "Two shoppers buy the last unit at the same time. If each reads 'available = 1' and then writes, both succeed and stock goes negative. Holding a lock across the payment call would block other buyers for seconds.",
        solution: "Reserve with one atomic conditional update: UPDATE inventory SET reserved = reserved + 1 WHERE sku = ? AND on_hand − reserved >= 1. The row lock lasts only for that statement; exactly one buyer gets '1 row updated' and the other gets 0 and sees 'out of stock'. Reserve every cart line in the same transaction that inserts the order, in sku order to avoid deadlocks, so the cart is reserved entirely or not at all.",
      },
      {
        topic: "Reservation expiry",
        problem: "Shoppers abandon checkout or their payment fails. Stock held forever shows as sold out while nobody is buying it.",
        solution: "Each reservation has expires_at (e.g. now + 10 minutes). A sweeper runs every minute and, in one transaction per order, marks expired HELD reservations RELEASED, subtracts them from inventory.reserved, and moves the order from PENDING_PAYMENT to CANCELLED with a conditional update. If a payment success arrives after the hold expired, that conditional transition fails; the service tries to reserve again and, if the stock is gone, voids the authorisation automatically.",
      },
      {
        topic: "Idempotent payments",
        problem: "The payment call times out. Was the card charged? Retrying might charge twice; not retrying might leave a paying customer with a cancelled order.",
        solution: "Insert a payment attempt row first, then call the provider with the attempt id as its idempotency key, so a retry of the same attempt returns the original result instead of a second charge. Authorise at checkout and capture at shipment (or immediately for digital goods). Treat provider webhooks as the source of truth for asynchronous outcomes, deduplicated by event id, and run a daily reconciliation that compares provider records with local orders.",
      },
      {
        topic: "Order state machine",
        problem: "Status changes come from several places — the API, payment webhooks, the sweeper, fulfilment — sometimes duplicated or out of order. A blind 'SET status = X' lets a late 'payment failed' overwrite PAID.",
        solution: "Allow only the transitions in the diagram and enforce them in the write itself: UPDATE orders SET status = 'PAID', version = version + 1 WHERE order_id = ? AND status = 'PENDING_PAYMENT'. Zero rows updated means the transition is invalid or already applied, so log it and do nothing. Insert the matching outbox event in the same transaction, which also gives an audit trail.",
        diagram: `stateDiagram-v2
    [*] --> PENDING_PAYMENT: stock reserved
    PENDING_PAYMENT --> PAID: payment authorised
    PENDING_PAYMENT --> CANCELLED: payment failed or hold expired
    PAID --> SHIPPED: shipment created
    PAID --> CANCELLED: cancelled and refunded
    SHIPPED --> DELIVERED: carrier confirms
    DELIVERED --> REFUNDED: return accepted`,
      },
      {
        topic: "Publishing events reliably",
        problem: "After an order is paid, fulfilment and email must hear about it. If the service commits and then crashes before publishing, the order never ships; if it publishes first and the commit fails, a phantom order ships.",
        solution: "Transactional outbox: insert the event into the outbox table in the same transaction as the state change. A relay reads unpublished rows (by polling, or change data capture), publishes them to the bus and marks them published. Delivery is at-least-once, so consumers deduplicate on event_id.",
      },
    ],
    tradeOffs: [
      "One database for orders and inventory vs separate services: a single PostgreSQL transaction makes 'reserve stock and create order' atomic. Splitting inventory into its own service needs a saga (reserve, pay, confirm, with compensating release and refund steps) — more moving parts, worth it only when team boundaries or scale demand it.",
      "Reserve at checkout vs at add-to-cart: reserving at add-to-cart locks stock for browsers who never buy; a 10-minute hold at checkout still guarantees the item while the customer pays.",
      "Authorise-then-capture vs immediate charge: authorising first means no refund is needed when an item can't ship, but card authorisations expire after several days, so long backorders need re-authorisation.",
      "Conditional UPDATE vs SELECT … FOR UPDATE: both are correct; the single conditional update holds the row lock for one statement instead of across round trips. In a flash sale on one SKU, both still serialise on that row (see follow-ups).",
    ],
    followUpQuestions: [
      {
        question: "A flash sale sends 50,000 buyers at one SKU with 1,000 units. What breaks, and how do you fix it?",
        answer: "Every checkout serialises on one inventory row. Put a fast pre-filter in front — a Redis counter decremented with DECR that rejects below zero — so only about 1,000 requests reach the database, or split the stock into N bucket rows and reserve from a random bucket. Add a queue-based waiting room and rate limits at the edge.",
      },
      {
        question: "How would you move inventory into its own service?",
        answer: "Use a saga orchestrated by the order service: ReserveStock → AuthorisePayment → ConfirmOrder, with compensations (ReleaseStock, VoidPayment) on failure. Every step is idempotent and keyed by order_id, and the saga's state is persisted so it resumes after a crash.",
      },
      {
        question: "What if a price changes between viewing the cart and placing the order?",
        answer: "Checkout re-reads prices from the catalog and stores them on order_items. If the total changed, return 409 with the new total and ask the customer to confirm.",
      },
      {
        question: "How does order history stay fast as the table grows?",
        answer: "The (user_id, created_at DESC) index with cursor pagination keeps each page cheap; partition or archive old orders; serve history from a read replica, but read the just-placed order from the primary so the customer sees it immediately (read-your-writes).",
      },
    ],
  },
};

/** Mid-level case studies, in suggested practice order. */
export const MID_LEVEL_CASE_STUDIES: HLDCaseStudy[] = [
  PASTEBIN_CASE_STUDY,
  RATE_LIMITER_CASE_STUDY,
  NOTIFICATION_SYSTEM_CASE_STUDY,
  CHECKOUT_CASE_STUDY,
];
