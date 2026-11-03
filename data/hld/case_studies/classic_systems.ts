import { HLDCaseStudy } from "../types";

export const TINYURL_CASE_STUDY: HLDCaseStudy = {
  id: "tinyurl-hld",
  level: "core",
  title: "URL Shortener (TinyURL / Bitly)",
  category: "Classic",
  summary:
    "Design a highly scalable, globally distributed URL shortening service capable of creating short aliases for long URLs, redirecting with sub-10ms latency using Base62 encoding, Key Generation Service (KGS), and distributed caching.",
  rubric: {
    functionalRequirements: [
      "Given a long URL, generate a unique, short 7-character alias (e.g. https://tiny.cc/a8X2kL).",
      "When a user accesses the short URL, redirect them immediately via HTTP 301/302 to the original destination.",
      "Support custom short URLs (e.g. tiny.cc/my-link) and optional expiration dates.",
      "Track analytics: Click count, referring domains, user geolocation, and user-agent devices.",
    ],
    nonFunctionalRequirements: [
      "Ultra-low latency: Redirection must complete in under 15ms (p99).",
      "High Availability: 99.999% uptime; read-heavy system (100:1 read-to-write ratio).",
      "Idempotency & Collision-Free: No two different URLs should ever produce the same short hash.",
    ],
    estimations: {
      rps: "Writes: 500 URLs/sec; Reads: 50,000 redirects/sec (100:1 read ratio)",
      storagePerDay: "500 * 86,400 = 43.2 Million new URLs/day. At 500 bytes per record ≈ 21.6 GB/day (7.8 TB/year)",
      bandwidth: "Reads: 50,000 * 500 bytes = 25 MB/sec egress",
      cacheSize: "80-20 Pareto Rule: 20% of hot URLs generate 80% of clicks. 50,000 * 86,400 * 0.2 * 500 bytes ≈ 432 GB in Redis",
    },
    apiDesign: [
      {
        endpoint: "/api/v1/urls",
        method: "POST",
        description: "Creates a short URL alias",
        payload: '{ "long_url": "https://en.wikipedia.org/...", "custom_alias": "wiki", "ttl_days": 365 }',
        response: '{ "short_url": "https://tiny.cc/a8X2kL", "created_at": "...", "expires_at": "..." }',
      },
      {
        endpoint: "/{short_code}",
        method: "GET",
        description: "Redirects client to original long URL with HTTP 301 or 302",
        response: "HTTP 301 Moved Permanently with Location: https://en.wikipedia.org/...",
      },
    ],
    dbSchema: [
      {
        table: "url_mappings (Distributed NoSQL / DynamoDB / Cassandra)",
        primaryKey: "short_code (Hash key)",
        fields: ["short_code (char 7)", "original_url (varchar 2048)", "user_id (uuid)", "created_at (timestamp)", "expires_at (timestamp)", "clicks_count (bigint)"],
        notes: "Hash key allows O(1) primary key point lookups across distributed storage partitions.",
      },
      {
        table: "pregenerated_keys (Key Generation Service Store)",
        primaryKey: "key_id",
        fields: ["key (char 7)", "is_used (boolean)"],
        notes: "KGS maintains billions of precomputed Base62 tokens in memory and disk.",
      },
    ],
    architectureDiagram: `flowchart TD
    Client["Clients / Web Browsers"] --> CDN["Cloudflare CDN (Edge Caching 301s)"]
    CDN --> LB["L7 Reverse Proxy / Load Balancer (Nginx)"]
    LB --> WebApp["URL Shortener API Cluster (Stateless Go/Python Services)"]

    WebApp -->|1. Check Cache Sub-2ms| Redis["Redis Cluster (LRU Cache of Hot Short Codes)"]
    WebApp -->|2. Cache Miss: Query DB| DB[("Distributed NoSQL DB (DynamoDB / Cassandra)")]

    subgraph KeyGenerationPipeline ["Key Generation Service (KGS)"]
        KGS["Dedicated KGS Service"] --> KeyDB[("Pre-generated Keys Table")]
        KGS -->|Dispense batches of 10K keys| WebApp
    end

    WebApp -->|3. Async Analytics Event| Kafka["Kafka Click Event Stream"]
    Kafka --> Analytics["ClickHouse / Druid Analytics Pipeline"]`,
    deepDiveAndBottlenecks: [
      {
        topic: "Base62 Encoding vs MD5/SHA256 Hashing",
        problem: "MD5 or SHA256 produces 128-bit hashes that require truncation, causing high collision rates under billions of keys.",
        solution: "Use Base62 ([a-z, A-Z, 0-9] = 62 characters). With 7 characters, 62^7 = 3.52 Trillion unique URLs. A dedicated Key Generation Service (KGS) dispenses unique numeric IDs atomically (or from pregenerated sequences) and converts each number directly to Base62 without any collision possibility.",
      },
      {
        topic: "HTTP 301 Permanent vs HTTP 302 Temporary Redirect",
        problem: "Which HTTP status code should you choose in a system design interview?",
        solution: "A 301 can be cached by clients, reducing requests that reach the service. A 302 is often used for changeable redirects and analytics, but actual caching depends on response headers and client behavior; measure analytics accordingly.",
      },
    ],
  },
};

export const TWITTER_CASE_STUDY: HLDCaseStudy = {
  id: "twitter-newsfeed",
  level: "deep-dive",
  title: "Twitter / Newsfeed: High-Throughput Timeline Architecture",
  category: "Classic",
  summary:
    "Design a high-scale social media timeline feed capable of handling 500 million daily active users, 50,000 tweets/sec peak, and millions of followers using a Hybrid Fan-out architecture (Fan-out on Write for regular users, Fan-out on Read for celebrities).",
  rubric: {
    functionalRequirements: [
      "Post a tweet (text, media URLs, mentions) to followers.",
      "Home Timeline: View reverse-chronological feed of tweets from users you follow.",
      "User Timeline: View all tweets posted by a specific user profile.",
      "Follow/Unfollow users with immediate feed propagation.",
    ],
    nonFunctionalRequirements: [
      "Home Timeline read latency: Sub-100ms globally.",
      "High Availability: Eventual consistency is acceptable; tweets appearing with a 2-second delay is acceptable.",
      "Celebrity handling: Avoid write amplification when Elon Musk or Barack Obama (100M+ followers) tweets.",
    ],
    estimations: {
      rps: "Writes: 10,000 tweets/sec average (50,000 peak); Reads: 300,000 timeline fetches/sec",
      storagePerDay: "10K * 300 bytes * 86,400s ≈ 260 GB/day text metadata; media stored in S3/CDN",
      bandwidth: "Reads: 300,000 * 20 tweets * 300 bytes = ~1.8 GB/sec egress",
      cacheSize: "Active home timelines: 100M daily active users * 800 tweet IDs * 8 bytes ≈ 640 GB in Redis List clusters",
    },
    apiDesign: [
      {
        endpoint: "/v1/tweets",
        method: "POST",
        description: "Publishes a new tweet",
        payload: '{ "text": "Just shipped my first open-source project! 🚀", "media_ids": [] }',
        response: '{ "tweet_id": "1849281729102", "created_at": 1730304000 }',
      },
      {
        endpoint: "/v1/timelines/home",
        method: "GET",
        description: "Fetches user's curated reverse-chronological home feed",
        response: '{ "tweets": [...], "cursor": "next_page_token" }',
      },
    ],
    dbSchema: [
      {
        table: "tweets (Distributed Wide-Column / Cassandra / PostgreSQL)",
        primaryKey: "tweet_id (Snowflake ID 64-bit integer)",
        fields: ["tweet_id (bigint)", "author_id (uuid)", "content (varchar 280)", "media_urls (text[])", "created_at (timestamptz)", "reply_count", "retweet_count"],
        notes: "Snowflake IDs embed millisecond timestamps, ensuring natural chronological sorting without secondary indexes.",
      },
      {
        table: "followers (Graph / Relational)",
        primaryKey: "Composite: (user_id, follower_id)",
        fields: ["user_id", "follower_id", "created_at"],
        notes: "Indexed bidirectionally: find followers of user X and find who user Y is following.",
      },
    ],
    architectureDiagram: `flowchart TD
    Client["Twitter Mobile App / Web"] --> LB["L7 Load Balancer"]
    LB --> TweetService["Tweet Ingestion API"]
    LB --> TimelineService["Timeline Aggregator Service"]

    TweetService --> TweetDB[("Tweet Storage (Cassandra / Aurora)")]
    TweetService --> FanoutCoordinator{"Author Follower Count > 25,000?"}

    subgraph FanoutOnWrite ["Fan-out on Write (Regular Users)"]
        FanoutCoordinator -->|Standard user| FanoutWorkers["Kafka → Async Fan-out Workers"]
        FanoutWorkers --> FollowerGraph[("Social Graph DB")]
        FanoutWorkers -->|Push tweet_id into Redis Lists| RedisCluster["Redis Home Timelines (LPUSH + LTRIM 800)"]
    end

    subgraph FanoutOnRead ["Fan-out on Read (Celebrities / VIPs)"]
        FanoutCoordinator -->|High follower count| SkipWrite["Skip pushing to millions of timelines"]
    end

    TimelineService -->|1. Fetch Cached IDs| RedisCluster
    TimelineService -->|2. Pull Celebrity Tweets at read-time| TweetDB
    TimelineService -->|3. Merge & Sort by Snowflake ID| Client`,
    deepDiveAndBottlenecks: [
      {
        topic: "Fan-out on Write (Push) vs Fan-out on Read (Pull)",
        problem: "Pure Fan-out on Write collapses when a celebrity with 100M followers tweets (1 tweet requires 100M Redis LPUSH updates, locking memory and causing minutes of delay). Pure Fan-out on Read collapses on read traffic because querying 500 followed users' timelines on every refresh requires an expensive distributed join.",
        solution: "Hybrid fan-out: precompute timelines for ordinary accounts and merge in posts from high-follower accounts at read time. Fetch and merge costs depend on feed size and the number of sources.",
      },
      {
        topic: "Snowflake ID Generator",
        problem: "A single auto-increment source can become a bottleneck across shards; random identifiers do not naturally sort by creation time.",
        solution: "A Snowflake-style ID combines a timestamp, worker identifier, and per-worker sequence. It is roughly time-sortable, but clock skew and concurrency mean IDs are not necessarily globally strictly monotonic.",
      },
    ],
  },
};

export const WHATSAPP_CASE_STUDY: HLDCaseStudy = {
  id: "whatsapp-chat",
  level: "deep-dive",
  title: "WhatsApp / Messenger: Real-Time Encrypted Chat",
  category: "Classic",
  summary:
    "Design a real-time messaging platform supporting 2 billion active users, sub-50ms peer-to-peer message delivery, End-to-End Encryption (Signal Protocol), presence indicators (online/offline status), and offline message store-and-forward spooling.",
  rubric: {
    functionalRequirements: [
      "1-on-1 and Group messaging with real-time text, media, and voice notes.",
      "Message delivery receipts: Sent (single check), Delivered (double check), Read (blue double check).",
      "User Presence: Real-time 'Online' status and 'Last Seen' timestamps.",
      "Offline Storage: If recipient is offline, spool messages until they reconnect, then push and delete from server.",
    ],
    nonFunctionalRequirements: [
      "Ultra-low delivery latency: Sub-50ms message transit when both users are online.",
      "High Availability: 99.999% uptime with global connection gateways.",
      "End-to-End Security: Zero-knowledge architecture; messages encrypted on device (Signal Protocol).",
    ],
    estimations: {
      rps: "100 Billion messages/day ≈ 1.15 Million messages/second average (3M peak)",
      storagePerDay: "Ephemeral model: Server stores offline messages only until delivered. At 5% offline rate = ~5 Billion messages stored in transient spool (~2.5 TB).",
      bandwidth: "1.15M msgs/sec * 500 bytes = 575 MB/sec ingress and egress",
      cacheSize: "Connection session registry: 500M concurrent WebSocket/TCP connections * 128 bytes ≈ 64 GB in distributed memory",
    },
    apiDesign: [
      {
        endpoint: "ws://chat.gateway.com/v1/connect",
        method: "WS",
        description: "Persistent bidirectional WebSocket / TCP connection with mutual TLS",
        payload: "Client Handshake: { user_id, device_id, auth_token }",
        response: "Server ACK: { session_id, connection_heartbeat_interval: 30 }",
      },
      {
        endpoint: "WS event: send_message",
        method: "WS",
        description: "Encrypted message envelope transmitted over WebSocket",
        payload: "{ message_id, recipient_id, encrypted_payload, iv, mac, timestamp }",
        response: "WS event: ack { message_id, status: SENT }",
      },
    ],
    dbSchema: [
      {
        table: "user_sessions (Redis / distributed in-memory hash)",
        primaryKey: "user:{user_id}:connection",
        fields: ["gateway_server_ip (string)", "socket_fd (int)", "last_heartbeat (epoch_ms)", "status (ONLINE/OFFLINE)"],
        notes: "Enables any API server to locate which Gateway holds the recipient's live socket.",
      },
      {
        table: "offline_message_spool (Cassandra / ScyllaDB)",
        primaryKey: "Composite: (recipient_id, message_id)",
        fields: ["recipient_id (uuid)", "message_id (uuid)", "sender_id (uuid)", "encrypted_body (blob)", "created_at (timestamp)"],
        notes: "Partitioned by recipient_id. Once recipient reconnects and ACKs receipt, rows are purged.",
      },
    ],
    architectureDiagram: `flowchart TD
    Sender["Sender Client (Mobile)"] -->|1. TLS/WebSocket| GatewaySender["Chat Connection Gateway A (Go/Erlang)"]
    GatewaySender --> MsgRouter["Message Router Service"]

    MsgRouter -->|Look up recipient| SessionRegistry[("Session Registry (Redis Cluster)")]
    SessionRegistry --> Status{"Recipient online?"}
    Status -->|Online| GatewayRecipient["Recipient Connection Gateway"]
    GatewayRecipient -->|Push over socket| RecipientClient["Recipient Client (Mobile)"]
    RecipientClient -->|Delivery acknowledgement| GatewayRecipient
    GatewayRecipient -->|Delivery status| GatewaySender
    GatewaySender -->|Notify sender| Sender
    Status -->|Offline| OfflineDB[("Offline Message Spool (Cassandra)")]
    OfflineDB -->|Notify| APNS["Apple APNS / Google FCM Push Service"]
    APNS --> RecipientClient`,
    deepDiveAndBottlenecks: [
      {
        topic: "Managing Millions of Persistent WebSocket Connections",
        problem: "Traditional thread-per-connection architectures (Tomcat/Apache) consume 1-2MB RAM per thread, crashing under 50,000 connections.",
        solution: "Use Go Goroutines or Erlang/Elixir BEAM processes with epoll/kqueue non-blocking I/O. A Go goroutine starts at 2KB memory, allowing a single 64GB RAM server to comfortably maintain 1.5 million simultaneous open WebSocket connections.",
      },
      {
        topic: "End-to-End Encryption (E2EE) with Signal Protocol",
        problem: "How does the server route messages without being able to inspect content or recipient keys?",
        solution: "The Double Ratchet algorithm combines Diffie-Hellman ratchet and symmetric KDF ratchets. Ephemeral session keys change after every message, ensuring Perfect Forward Secrecy (PFS) and Future Secrecy. The server only sees encrypted opaque byte arrays.",
      },
    ],
  },
};

export const UBER_CASE_STUDY: HLDCaseStudy = {
  id: "uber-ride-hailing",
  level: "deep-dive",
  title: "Uber / Ride Hailing: Geospatial Matching & Real-Time Tracking",
  category: "Classic",
  summary:
    "Design a global ride-hailing dispatch engine coordinating millions of moving drivers and riders, processing high-frequency GPS location pings every 4 seconds, spatial radius queries using Google S2 / Quadtrees, and dynamic surge pricing.",
  rubric: {
    functionalRequirements: [
      "Drivers broadcast their GPS location (latitude, longitude) every 4 seconds.",
      "Riders request rides: system locates available drivers within a 3km radius.",
      "Dispatch matching engine: Assigns the optimal driver based on ETA, driving route distance, and acceptance history.",
      "Live trip tracking: Riders see driver's moving car icon updated in real time on a map.",
    ],
    nonFunctionalRequirements: [
      "Low Latency: Location updates processed within 500ms; matching completed in under 2 seconds.",
      "High Availability: 99.99% uptime; geospatial partitioning must survive localized traffic spikes.",
      "Fault Tolerance: Lost GPS pings are dropped gracefully without corrupting trip state machines.",
    ],
    estimations: {
      rps: "5 Million active drivers pinging every 4 seconds = 1.25 Million location updates/second",
      storagePerDay: "GPS ping: 5M * (86,400 / 4) * 64 bytes ≈ 6.9 TB of telemetry data/day",
      bandwidth: "1.25M updates/sec * 64 bytes = 80 MB/sec ingress",
      cacheSize: "Current driver locations (5M * 64 bytes) + S2 Spatial Index = ~4 GB in-memory RAM",
    },
    apiDesign: [
      {
        endpoint: "/v1/driver/location",
        method: "POST",
        description: "High-frequency GPS ping from driver app",
        payload: '{ "driver_id": "drv-1902", "lat": 43.6532, "lon": -79.3832, "bearing": 182, "status": "AVAILABLE" }',
        response: '{ "status": "ACK" }',
      },
      {
        endpoint: "/v1/trips/request",
        method: "POST",
        description: "Rider requests a new ride",
        payload: '{ "rider_id": "usr-8891", "pickup_lat": 43.6532, "pickup_lon": -79.3832, "dropoff_lat": 43.7001, "dropoff_lon": -79.4163, "tier": "UBER_X" }',
        response: '{ "trip_id": "trp-1122", "estimated_fare": "$24.50", "eta_minutes": 4 }',
      },
    ],
    dbSchema: [
      {
        table: "trips (PostgreSQL / CockroachDB)",
        primaryKey: "trip_id (uuid)",
        fields: ["rider_id (uuid)", "driver_id (uuid)", "pickup_location (geography)", "dropoff_location (geography)", "fare (int cents)", "status (REQUESTED/MATCHED/IN_PROGRESS/COMPLETED)"],
        notes: "ACID transactions for trip state transitions and payment authorization.",
      },
      {
        table: "driver_spatial_index (In-Memory Google S2 / Redis GEO)",
        primaryKey: "s2_cell_id_level_12",
        fields: ["cell_id (uint64)", "driver_set (Set of driver_id, lat, lon, updated_at)"],
        notes: "Hierarchical spherical coordinates; Level 12 corresponds to ~3.3 km2 cells.",
      },
    ],
    architectureDiagram: `flowchart TD
    Drivers["Drivers (5M pinging every 4s)"] -->|GPS Updates| LB["L4 Load Balancer"]
    LB --> LocationIngestion["Location Ingestion Gateway (Go / gRPC)"]

    LocationIngestion --> LocationBuffer["Kafka GPS Stream (Partitioned by S2 Cell ID)"]
    LocationBuffer --> SpatialIndexer["Location Worker Cluster"]
    SpatialIndexer --> SpatialIndex[("In-Memory Geospatial Index (Google S2 / Redis GEO)")]

    Riders["Riders Requesting Rides"] --> DispatchService["Dispatch & Matching Engine"]
    DispatchService -->|Query Nearest Drivers within 3km| SpatialIndex
    DispatchService --> RoutingEngine["ETA / Map Routing Engine (OSRM / GraphHopper)"]
    DispatchService --> TripDB[("Trip State DB (CockroachDB)")]

    DispatchService -->|Dispatch Offer via WebSocket| SelectedDriver["Target Driver App"]`,
    deepDiveAndBottlenecks: [
      {
        topic: "Geospatial Indexing: Quadtree vs Geohash vs Google S2",
        problem: "Standard R-Trees in relational databases (PostGIS) lock indexes on every write. At 1.25 million writes/sec, database disk locks immediately choke.",
        solution: "Use Google S2 Geometry in-memory. S2 maps Earth's 3D sphere onto a Hilbert Space-Filling Curve (64-bit integer cell IDs). Nearby points in 2D space remain close together in the 1D Hilbert number space. Finding nearby drivers becomes a fast range query across a binary search tree or hash set in RAM.",
      },
      {
        topic: "Trip State Machine & Race Conditions",
        problem: "Two nearby riders requesting rides at the exact same moment could both be matched to the same single available driver.",
        solution: "Strict Trip State Machine managed with Distributed Locks in Redis (Redlock) or Optimistic Locking in CockroachDB (`UPDATE drivers SET status='OFFERED' WHERE driver_id=X AND status='AVAILABLE'`). If another rider matched first, the version check fails and the dispatcher instantly queries the next best driver.",
      },
    ],
  },
};

export const NETFLIX_CASE_STUDY: HLDCaseStudy = {
  id: "netflix-video-streaming",
  level: "deep-dive",
  title: "Netflix: Global Video Streaming & Content Delivery",
  category: "Classic",
  summary:
    "Design a global video streaming platform serving 250 million subscribers, handling multi-terabit video delivery, Adaptive Bitrate Streaming (HLS/DASH), video transcoding DAG workflows, and Open Connect CDN edge appliances.",
  rubric: {
    functionalRequirements: [
      "Upload master raw video files and transcode them into hundreds of resolution/bitrate chunk formats.",
      "Seamless video streaming across various devices (4K TVs, mobile 4G/5G, web browsers) with sub-1 second startup.",
      "Adaptive Bitrate Streaming (ABR): Automatically adjust video quality up or down based on client's real-time network bandwidth.",
      "User resume playback: Save and restore exact watch progress across devices.",
    ],
    nonFunctionalRequirements: [
      "Zero Buffering: Maintain <0.5% playback rebuffering rate globally.",
      "Scalability: Support 200+ Terabits/sec peak internet traffic during premiere releases.",
      "Global Edge Distribution: 95% of video chunks served from local ISP Open Connect CDN boxes.",
    ],
    estimations: {
      rps: "Playback starts: 50,000 plays/sec; Chunk requests: 2,000,000 chunk GETs/sec",
      storagePerDay: "Master movie: ~2 TB uncompressed raw master. Transcoded into ~1,200 profiles = ~5 TB per movie title.",
      bandwidth: "250M users * 10% concurrent stream * 5 Mbps average = 125 Terabits/second egress peak!",
      cacheSize: "Open Connect CDN Edge caches hold top 20% most popular movies locally at regional ISP data centers.",
    },
    apiDesign: [
      {
        endpoint: "/v1/video/{title_id}/manifest.mpd",
        method: "GET",
        description: "Returns MPEG-DASH or HLS master playlist with chunk URLs and bitrate tiers",
        response: "XML/M3U8 Manifest with audio/video bitrates (400kbps up to 15Mbps) and 4-second chunk URLs",
      },
      {
        endpoint: "/v1/playback/progress",
        method: "POST",
        description: "Sync playback watch time every 10 seconds",
        payload: '{ "title_id": "stranger-things-s5", "timestamp_sec": 1420, "device_id": "tv-samsung" }',
        response: '{ "status": "SYNCED" }',
      },
    ],
    dbSchema: [
      {
        table: "video_metadata (Cassandra / DynamoDB)",
        primaryKey: "title_id",
        fields: ["title_id (uuid)", "title (string)", "duration_sec (int)", "genres (text[])", "manifest_url (string)", "thumbnail_url (string)"],
        notes: "Replicated across AWS global regions for high availability reads.",
      },
      {
        table: "user_playback_state (Cassandra / Redis)",
        primaryKey: "Composite: (user_id, profile_id)",
        fields: ["user_id", "title_id", "last_watched_timestamp_sec", "completed (bool)", "updated_at"],
        notes: "Fast write-heavy updates fired every 10 seconds per watching client.",
      },
    ],
    architectureDiagram: `flowchart TD
    Client["User Device (Smart TV / Mobile)"] --> ControlPlane["AWS Cloud Control Plane (Auth, Billing, Search)"]
    ControlPlane --> ManifestService["Manifest & Playback License Service (DRM)"]

    subgraph TranscodingPipeline ["AWS Media Cloud Ingestion (DAG Pipeline)"]
        RawVideo["Raw Master Video (ProRes / 4K)"] --> Splitter["Chunk Splitter (10-second segments)"]
        Splitter --> TranscoderPool["Massive Transcoding Cluster (FFmpeg / Hardware Accelerators)"]
        TranscoderPool --> PackageMPEG["Packager (HLS .m3u8 / DASH .mpd)"]
        PackageMPEG --> MasterS3[("Amazon S3 Video Bucket")]
    end

    subgraph CDNStorage ["Netflix Open Connect CDN (OCA Network)"]
        MasterS3 -->|Proactive Midnight Pre-fetching| ISP_OCABox["Open Connect Appliance (Embedded inside local ISP)"]
    end

    Client -->|1. Fetch Manifest| ManifestService
    ManifestService -->|Playback manifest and CDN URL| Client
    Client -->|2. Stream 4-second chunks via HTTP GET| ISP_OCABox`,
    deepDiveAndBottlenecks: [
      {
        topic: "Adaptive Bitrate Streaming (ABR): HLS vs MPEG-DASH",
        problem: "Network bandwidth fluctuations on cellular networks cause video to freeze and stutter if fixed bitrates are streamed.",
        solution: "Video is sliced into small 2 to 6-second independent chunks, each encoded at 8-12 different quality profiles (from 240p up to 4K HDR). The client's video player runs an ABR algorithm (e.g. BOLA or MPC): monitoring TCP download speeds and buffer occupancy. If the buffer dips below 5 seconds, it seamlessly requests the next 4-second chunk at 720p; if the buffer is healthy (>20 seconds), it steps up to 4K.",
      },
      {
        topic: "Netflix Open Connect (Custom Embedded CDNs)",
        problem: "Delivering 125 Terabits/sec through AWS cloud egress would cost billions in bandwidth fees and overload internet transit backbones.",
        solution: "Netflix built its own custom CDN appliances (Open Connect Appliances - OCA) and gives them to ISPs free of charge to install directly inside local exchange points. Over 95% of video data never travels over the public internet—it streams directly from the user's local internet provider racks.",
      },
    ],
  },
};
