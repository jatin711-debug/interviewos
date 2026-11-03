import { DesignPattern } from "./types";

export const DESIGN_PATTERNS: DesignPattern[] = [
  {
    id: "pattern-singleton",
    name: "Singleton Pattern",
    type: "Creational",
    summary:
      "Ensures a class has only one instance while providing a global access point to this instance. Solves shared resource contention like connection pools, hardware drivers, and configuration registries.",
    realWorldUseCase:
      "Database connection pooling (e.g. pgxpool in Go or SQLAlchemy Engine in Python), logging daemons, or hardware GPU context handles.",
    mermaidDiagram: `classDiagram
    class DatabaseConnectionPool {
        -DatabaseConnectionPool _instance$
        -Lock _lock$
        -int maxConnections
        -List activeConnections
        -DatabaseConnectionPool()
        +getInstance()$ DatabaseConnectionPool
        +getConnection() Connection
        +releaseConnection(Connection c)
    }
    note for DatabaseConnectionPool "Double-checked locking ensures\\nthread-safe lazy initialization"`,
    pythonCode: `# Thread-Safe Singleton with Double-Checked Locking in Python
import threading
from typing import Optional

class DatabasePool:
    _instance: Optional["DatabasePool"] = None
    _lock: threading.Lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        # 1st check: Avoid acquiring lock once already initialized
        if cls._instance is None:
            with cls._lock:
                # 2nd check: Ensure another thread didn't initialize while waiting for lock
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self, dsn: str = "postgresql://localhost:5432/app", max_conn: int = 20):
        # Construction and initialization must both be protected.
        with self._lock:
            if getattr(self, "_initialized", False):
                return
            self.dsn = dsn
            self.max_conn = max_conn
            self._connections = [f"Conn-{i}" for i in range(max_conn)]
            self._initialized = True
            print(f"[Singleton] Initialized pool with {max_conn} connections.")

    def acquire(self) -> str:
        with self._lock:
            if not self._connections:
                raise RuntimeError("No available connections in pool")
            return self._connections.pop()

    def release(self, conn: str) -> None:
        with self._lock:
            self._connections.append(conn)

# Driver Verification
if __name__ == "__main__":
    def worker(worker_id: int):
        pool = DatabasePool()
        conn = pool.acquire()
        print(f"Worker {worker_id} acquired {conn}")
        pool.release(conn)

    threads = [threading.Thread(target=worker, args=(i,)) for i in range(5)]
    for t in threads: t.start()
    for t in threads: t.join()

    p1 = DatabasePool()
    p2 = DatabasePool()
    assert p1 is p2, "Singleton violation: Instances must be identical"
    print("Verification Passed: Single instance guaranteed!")`,
    goCode: `// Thread-Safe Singleton using sync.Once in Go
package main

import (
	"fmt"
	"sync"
)

type ConfigManager struct {
	settings map[string]string
}

var (
	instance *ConfigManager
	once     sync.Once
)

// GetConfigManager returns the single instance of ConfigManager.
// sync.Once uses atomic load and fast path mutex fallback (double-checked locking under the hood).
func GetConfigManager() *ConfigManager {
	once.Do(func() {
		fmt.Println("[Singleton] Initializing ConfigManager instance...")
		instance = &ConfigManager{
			settings: map[string]string{
				"env":        "production",
				"log_level":  "info",
				"max_idle":   "100",
			},
		}
	})
	return instance
}

func (c *ConfigManager) Get(key string) string {
	return c.settings[key]
}

func main() {
	var wg sync.WaitGroup
	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			cfg := GetConfigManager()
			fmt.Printf("Goroutine %d: env=%s (ptr=%p)\\n", id, cfg.Get("env"), cfg)
		}(i)
	}
	wg.Wait()
}`,
    interviewTips: [
      "Why is double-checked locking required? Without it, every getInstance() call would acquire a mutex, creating a massive serialization bottleneck under multi-threaded read traffic.",
      "How to defeat Singleton in Python? Calling object.__new__(cls) or using pickle/serialization. Always protect deserialization with __reduce__.",
      "Go idiomatic approach: Never write manual double-checked locking in Go; always use sync.Once, which is hardware-memory-model safe and optimized with atomic.LoadUint32.",
    ],
  },
  {
    id: "pattern-factory",
    name: "Factory Method & Abstract Factory",
    type: "Creational",
    summary:
      "Defines an interface for creating objects, but lets subclasses or registered factories decide which class to instantiate. Decouples client code from concrete implementation classes.",
    realWorldUseCase:
      "Multi-cloud storage client (S3, GCS, Azure Blob), database drivers (PostgreSQL, MySQL, SQLite), or notification dispatchers (Email, SMS, Push).",
    mermaidDiagram: `classDiagram
    class Notification {
        <<interface>>
        +send(recipient: string, message: string) bool
    }
    class EmailNotification {
        +send(recipient: string, message: string) bool
    }
    class SMSNotification {
        +send(recipient: string, message: string) bool
    }
    class SlackNotification {
        +send(recipient: string, message: string) bool
    }
    class NotificationFactory {
        +create(channelType: string)$ Notification
    }
    Notification <|.. EmailNotification
    Notification <|.. SMSNotification
    Notification <|.. SlackNotification
    NotificationFactory ..> Notification : instantiates`,
    pythonCode: `# Factory Method Pattern with Extensible Registry in Python
from abc import ABC, abstractmethod
from typing import Dict, Type

class Notification(ABC):
    @abstractmethod
    def send(self, recipient: str, message: str) -> bool:
        pass

class EmailNotification(Notification):
    def send(self, recipient: str, message: str) -> bool:
        print(f"[Email] Sent to {recipient}: {message}")
        return True

class SMSNotification(Notification):
    def send(self, recipient: str, message: str) -> bool:
        print(f"[SMS via Twilio] Sent to {recipient}: {message}")
        return True

class SlackNotification(Notification):
    def send(self, recipient: str, message: str) -> bool:
        print(f"[Slack Webhook] Sent to #{recipient}: {message}")
        return True

class NotificationFactory:
    """Open-Closed compliant Factory: allows runtime registration without modifying code"""
    _registry: Dict[str, Type[Notification]] = {}

    @classmethod
    def register(cls, channel: str, handler: Type[Notification]) -> None:
        cls._registry[channel.lower()] = handler

    @classmethod
    def create(cls, channel: str) -> Notification:
        handler = cls._registry.get(channel.lower())
        if not handler:
            raise ValueError(f"Unsupported notification channel: {channel}")
        return handler()

# Bootstrap registrations
NotificationFactory.register("email", EmailNotification)
NotificationFactory.register("sms", SMSNotification)
NotificationFactory.register("slack", SlackNotification)

# Client Usage
if __name__ == "__main__":
    for channel in ["email", "sms", "slack"]:
        notifier = NotificationFactory.create(channel)
        notifier.send("ada@example.com", "Your interview is scheduled!")`,
    goCode: `// Factory Method Pattern in Go using Interface and Constructor Map
package main

import (
	"errors"
	"fmt"
	"strings"
)

type StorageDriver interface {
	Upload(path string, data []byte) error
	Download(path string) ([]byte, error)
}

type S3Storage struct{ Bucket string }
func (s *S3Storage) Upload(path string, data []byte) error {
	fmt.Printf("[S3] Uploaded %d bytes to s3://%s/%s\\n", len(data), s.Bucket, path)
	return nil
}
func (s *S3Storage) Download(path string) ([]byte, error) {
	return []byte("s3 data"), nil
}

type GCSStorage struct{ ProjectID string }
func (g *GCSStorage) Upload(path string, data []byte) error {
	fmt.Printf("[GCS] Uploaded %d bytes to gs://%s/%s\\n", len(data), g.ProjectID, path)
	return nil
}
func (g *GCSStorage) Download(path string) ([]byte, error) {
	return []byte("gcs data"), nil
}

// StorageFactory creates StorageDriver instances based on provider type
type StorageFactory struct{}

func (f *StorageFactory) Create(provider string) (StorageDriver, error) {
	switch strings.ToLower(provider) {
	case "s3", "aws":
		return &S3Storage{Bucket: "production-assets"}, nil
	case "gcs", "google":
		return &GCSStorage{ProjectID: "demo-project"}, nil
	default:
		return nil, errors.New("unsupported storage provider: " + provider)
	}
}

func main() {
	factory := &StorageFactory{}
	driver, err := factory.Create("s3")
	if err != nil {
		panic(err)
	}
	_ = driver.Upload("reports/q3_summary.pdf", []byte("%PDF-1.4..."))
}`,
    interviewTips: [
      "Factory Method vs Abstract Factory: Factory Method creates ONE product via a method or registry. Abstract Factory creates FAMILIES of related products (e.g., WindowsButton + WindowsCheckbox vs MacButton + MacCheckbox).",
      "Avoid giant switch/case: In production, use a registration map/dictionary (Dependency Injection container style) so new classes register themselves without touching the factory source code (strict OCP).",
    ],
  },
  {
    id: "pattern-builder",
    name: "Builder Pattern",
    type: "Creational",
    summary:
      "Separates the construction of a complex object from its representation, allowing the same construction process to create various representations through a fluent, method-chaining API.",
    realWorldUseCase:
      "Constructing complex HTTP Requests, SQL queries (e.g. Knex/GORM), Kubernetes Pod specs, or LLM Inference request payloads with dozens of optional hyper-parameters.",
    mermaidDiagram: `classDiagram
    class HttpRequest {
        -string method
        -string url
        -Map headers
        -Map queryParams
        -string body
        -int timeoutMs
    }
    class HttpRequestBuilder {
        -HttpRequest req
        +setMethod(method: string) HttpRequestBuilder
        +setUrl(url: string) HttpRequestBuilder
        +addHeader(key: string, val: string) HttpRequestBuilder
        +setBody(body: string) HttpRequestBuilder
        +setTimeout(timeoutMs: int) HttpRequestBuilder
        +build() HttpRequest
    }
    HttpRequestBuilder ..> HttpRequest : constructs`,
    pythonCode: `# Fluent Builder with Validation in Python
from typing import Dict, Optional
import json

class HttpRequest:
    def __init__(self, method: str, url: str, headers: Dict[str, str], body: Optional[str], timeout_ms: int):
        self.method = method
        self.url = url
        self.headers = headers
        self.body = body
        self.timeout_ms = timeout_ms

    def __repr__(self) -> str:
        return f"<HttpRequest {self.method} {self.url} headers={len(self.headers)} timeout={self.timeout_ms}ms>"

class HttpRequestBuilder:
    def __init__(self):
        self._method: str = "GET"
        self._url: Optional[str] = None
        self._headers: Dict[str, str] = {}
        self._body: Optional[str] = None
        self._timeout_ms: int = 5000

    def method(self, method: str) -> "HttpRequestBuilder":
        self._method = method.upper()
        return self

    def url(self, url: str) -> "HttpRequestBuilder":
        self._url = url
        return self

    def header(self, key: str, value: str) -> "HttpRequestBuilder":
        self._headers[key] = value
        return self

    def json_body(self, payload: dict) -> "HttpRequestBuilder":
        self._headers["Content-Type"] = "application/json"
        self._body = json.dumps(payload)
        return self

    def timeout(self, ms: int) -> "HttpRequestBuilder":
        if ms <= 0:
            raise ValueError("Timeout must be positive")
        self._timeout_ms = ms
        return self

    def build(self) -> HttpRequest:
        if not self._url:
            raise ValueError("URL is required before building HttpRequest")
        if self._method in {"POST", "PUT", "PATCH"} and not self._body:
            print("[Warning] Building mutation request without body")
        return HttpRequest(
            method=self._method,
            url=self._url,
            headers=dict(self._headers),
            body=self._body,
            timeout_ms=self._timeout_ms,
        )

# Client Usage
if __name__ == "__main__":
    req = (HttpRequestBuilder()
           .method("POST")
           .url("https://api.example.com/v1/applications")
           .header("Authorization", "Bearer token-xyz")
           .json_body({"applicant": "Ada Lovelace", "start_date": "2026-01-15"})
           .timeout(3000)
           .build())
    print(req)`,
    goCode: `// Functional Options Pattern / Fluent Builder in Go
package main

import (
	"fmt"
	"time"
)

type ServerConfig struct {
	Host         string
	Port         int
	Timeout      time.Duration
	MaxConns     int
	TLSEnabled   bool
}

// Option func type for Go idiomatic builder
type ServerOption func(*ServerConfig)

func WithPort(port int) ServerOption {
	return func(s *ServerConfig) {
		s.Port = port
	}
}

func WithTimeout(d time.Duration) ServerOption {
	return func(s *ServerConfig) {
		s.Timeout = d
	}
}

func WithTLS(enabled bool) ServerOption {
	return func(s *ServerConfig) {
		s.TLSEnabled = enabled
	}
}

func NewServer(host string, opts ...ServerOption) *ServerConfig {
	// Defaults
	cfg := &ServerConfig{
		Host:     host,
		Port:     8080,
		Timeout:  30 * time.Second,
		MaxConns: 1000,
		TLSEnabled: false,
	}
	for _, opt := range opts {
		opt(cfg)
	}
	return cfg
}

func main() {
	server := NewServer(
		"0.0.0.0",
		WithPort(9090),
		WithTimeout(5*time.Second),
		WithTLS(true),
	)
	fmt.Printf("Started Server: %+v\\n", server)
}`,
    interviewTips: [
      "In Go, the 'Functional Options Pattern' (Rob Pike style) is the gold standard equivalent to the Builder pattern because Go lacks method overloading.",
      "Builder vs Telescoping Constructor: Builder prevents having 10 constructor arguments with nulls and booleans where parameter order mistakes go unnoticed at compile time.",
      "Immutability: Ensure the builder creates a defensive copy of arrays/maps so the caller cannot mutate internals after build().",
    ],
  },
  {
    id: "pattern-strategy",
    name: "Strategy Pattern",
    type: "Behavioral",
    summary:
      "Defines a family of interchangeable algorithms, encapsulates each one, and makes them interchangeable at runtime without modifying the context object.",
    realWorldUseCase:
      "Payment processing (Stripe vs PayPal vs Crypto), pricing engines (Surge pricing vs Coupon vs Loyalty), compression codecs (Snappy vs ZSTD vs Gzip).",
    mermaidDiagram: `classDiagram
    class PaymentStrategy {
        <<interface>>
        +pay(amount: float) bool
    }
    class CreditCardStrategy {
        +pay(amount: float) bool
    }
    class PayPalStrategy {
        +pay(amount: float) bool
    }
    class CryptoStrategy {
        +pay(amount: float) bool
    }
    class ShoppingCart {
        -PaymentStrategy strategy
        +setStrategy(s: PaymentStrategy)
        +checkout(amount: float) bool
    }
    PaymentStrategy <|.. CreditCardStrategy
    PaymentStrategy <|.. PayPalStrategy
    PaymentStrategy <|.. CryptoStrategy
    ShoppingCart o-- PaymentStrategy`,
    pythonCode: `# Strategy Pattern with Dynamic Runtime Swapping in Python
from abc import ABC, abstractmethod

class PaymentStrategy(ABC):
    @abstractmethod
    def pay(self, amount: float) -> bool:
        pass

class StripePayment(PaymentStrategy):
    def __init__(self, api_key: str):
        self.api_key = api_key

    def pay(self, amount: float) -> bool:
        print(f"[Stripe] Charged \${amount:.2f} using Stripe API key ending in ...{self.api_key[-4:]}")
        return True

class PayPalPayment(PaymentStrategy):
    def __init__(self, email: str):
        self.email = email

    def pay(self, amount: float) -> bool:
        print(f"[PayPal] Redirected \${amount:.2f} payment token to {self.email}")
        return True

class CryptoPayment(PaymentStrategy):
    def __init__(self, wallet_address: str):
        self.wallet = wallet_address

    def pay(self, amount: float) -> bool:
        print(f"[Crypto] Broadcasted transfer of \${amount:.2f} to {self.wallet[:6]}...{self.wallet[-4:]}")
        return True

class CheckoutContext:
    def __init__(self, strategy: PaymentStrategy):
        self._strategy = strategy

    def set_strategy(self, strategy: PaymentStrategy) -> None:
        print("[Context] Switching payment strategy at runtime...")
        self._strategy = strategy

    def execute_payment(self, amount: float) -> bool:
        if amount <= 0:
            raise ValueError("Amount must be greater than zero")
        return self._strategy.pay(amount)

# Driver Verification
if __name__ == "__main__":
    checkout = CheckoutContext(StripePayment("sk_live_992837419283"))
    checkout.execute_payment(149.99)

    # User chooses PayPal fallback
    checkout.set_strategy(PayPalPayment("ada@example.com"))
    checkout.execute_payment(149.99)`,
    goCode: `// Strategy Pattern in Go using Interfaces
package main

import (
	"fmt"
)

type CompressionStrategy interface {
	Compress(data []byte) []byte
	Name() string
}

type SnappyCompressor struct{}
func (s *SnappyCompressor) Compress(data []byte) []byte {
	return append([]byte("[snappy-header]"), data...)
}
func (s *SnappyCompressor) Name() string { return "Snappy (Fastest)" }

type ZstdCompressor struct{}
func (z *ZstdCompressor) Compress(data []byte) []byte {
	return append([]byte("[zstd-header]"), data...)
}
func (z *ZstdCompressor) Name() string { return "Zstandard (Highest Ratio)" }

type StorageEngine struct {
	compressor CompressionStrategy
}

func (se *StorageEngine) SetCompressor(c CompressionStrategy) {
	se.compressor = c
}

func (se *StorageEngine) WriteRecord(key string, val []byte) {
	compressed := se.compressor.Compress(val)
	fmt.Printf("Wrote key=%s (%d bytes) using strategy=%s\\n", key, len(compressed), se.compressor.Name())
}

func main() {
	engine := &StorageEngine{compressor: &SnappyCompressor{}}
	engine.WriteRecord("metric:cpu_load", []byte("val=94.2"))

	// Switch strategy at runtime for cold storage
	engine.SetCompressor(&ZstdCompressor{})
	engine.WriteRecord("archive:wal_20261101", []byte("large block..."))
}`,
    interviewTips: [
      "Strategy vs State Pattern: They share the same UML diagram! The difference is INTENT: In Strategy, the client chooses the algorithm independently. In State, the context transitions between internal states automatically based on events.",
      "Open-Closed Principle: Strategy completely eliminates ugly `if/elif/else` branches for algorithmic variations.",
    ],
  },
  {
    id: "pattern-observer",
    name: "Observer Pattern (Pub/Sub)",
    type: "Behavioral",
    summary:
      "Defines a one-to-many dependency between objects so that when one object changes state, all its dependents are notified and updated automatically.",
    realWorldUseCase:
      "Kafka consumer groups, WebSocket live stock ticker broadcasts, DOM event listeners, or model training loss metric loggers.",
    mermaidDiagram: `classDiagram
    class Subject {
        <<interface>>
        +attach(o: Observer)
        +detach(o: Observer)
        +notify(event: Event)
    }
    class StockTicker {
        -List observers
        -float price
        +setPrice(price: float)
    }
    class Observer {
        <<interface>>
        +update(event: Event)
    }
    class MobileAppClient {
        +update(event: Event)
    }
    class TradingBot {
        +update(event: Event)
    }
    Subject <|.. StockTicker
    Observer <|.. MobileAppClient
    Observer <|.. TradingBot
    StockTicker o-- Observer`,
    pythonCode: `# Thread-Safe Observer Pattern with Event Filtering in Python
import threading
from abc import ABC, abstractmethod
from typing import Dict, List, Set

class Event:
    def __init__(self, topic: str, data: dict):
        self.topic = topic
        self.data = data

class Observer(ABC):
    @abstractmethod
    def on_event(self, event: Event) -> None:
        pass

class OrderNotificationService(Observer):
    def on_event(self, event: Event) -> None:
        print(f"[Notifier] Order update on {event.topic}: {event.data}")

class InventoryService(Observer):
    def on_event(self, event: Event) -> None:
        if event.data.get("action") == "ORDER_PLACED":
            print(f"[Inventory] Reserved stock for item {event.data.get('item_id')}")

class EventBus:
    """Thread-safe Subject supporting topic subscription"""
    def __init__(self):
        self._subscribers: Dict[str, Set[Observer]] = {}
        self._lock = threading.Lock()

    def subscribe(self, topic: str, observer: Observer) -> None:
        with self._lock:
            if topic not in self._subscribers:
                self._subscribers[topic] = set()
            self._subscribers[topic].add(observer)

    def unsubscribe(self, topic: str, observer: Observer) -> None:
        with self._lock:
            if topic in self._subscribers:
                self._subscribers[topic].discard(observer)

    def publish(self, event: Event) -> None:
        with self._lock:
            # Defensive copy of subscribers to avoid holding lock during notifications
            subscribers = list(self._subscribers.get(event.topic, []))
        
        for sub in subscribers:
            try:
                sub.on_event(event)
            except Exception as e:
                print(f"[EventBus] Error notifying subscriber: {e}")

if __name__ == "__main__":
    bus = EventBus()
    notifier = OrderNotificationService()
    inventory = InventoryService()

    bus.subscribe("orders", notifier)
    bus.subscribe("orders", inventory)

    bus.publish(Event("orders", {"action": "ORDER_PLACED", "item_id": "laptop-pro-16", "user": "ada"}))`,
    goCode: `// Observer Pattern in Go using Goroutines and Channels
package main

import (
	"fmt"
	"sync"
)

type Event struct {
	Topic string
	Data  string
}

type EventBus struct {
	subscribers map[string][]chan Event
	mu          sync.RWMutex
}

func NewEventBus() *EventBus {
	return &EventBus{
		subscribers: make(map[string][]chan Event),
	}
}

func (b *EventBus) Subscribe(topic string) <-chan Event {
	b.mu.Lock()
	defer b.mu.Unlock()

	ch := make(chan Event, 10) // buffered to avoid blocking publisher
	b.subscribers[topic] = append(b.subscribers[topic], ch)
	return ch
}

func (b *EventBus) Publish(topic string, data string) {
	b.mu.RLock()
	defer b.mu.RUnlock()

	event := Event{Topic: topic, Data: data}
	for _, ch := range b.subscribers[topic] {
		select {
		case ch <- event:
		default:
			fmt.Println("[EventBus] Dropping event due to slow subscriber channel buffer")
		}
	}
}

func main() {
	bus := NewEventBus()
	sub1 := bus.Subscribe("telemetry")
	sub2 := bus.Subscribe("telemetry")

	var wg sync.WaitGroup
	wg.Add(2)

	go func() {
		defer wg.Done()
		for i := 0; i < 2; i++ {
			msg := <-sub1
			fmt.Printf("Consumer 1 received: %s\\n", msg.Data)
		}
	}()

	go func() {
		defer wg.Done()
		for i := 0; i < 2; i++ {
			msg := <-sub2
			fmt.Printf("Consumer 2 received: %s\\n", msg.Data)
		}
	}()

	bus.Publish("telemetry", "temp=84.2C")
	bus.Publish("telemetry", "temp=85.1C")
	wg.Wait()
}`,
    interviewTips: [
      "Deadlock danger: Never invoke observer callbacks while holding the Subject's internal lock. If an observer calls back into the Subject to unsubscribe or publish, self-deadlock occurs. Always take a snapshot of subscribers, release the lock, then notify.",
      "Memory Leaks ('Lapsed Listener Problem'): In garbage collected languages, if an observer registers but forgets to unregister, the subject retains a strong reference, preventing garbage collection. Use Weak References where appropriate.",
    ],
  },
  {
    id: "pattern-decorator",
    name: "Decorator Pattern",
    type: "Structural",
    summary:
      "Attaches additional responsibilities to an object dynamically. Decorators provide a flexible alternative to subclassing for extending functionality without modifying the original class.",
    realWorldUseCase:
      "Java/Python I/O streams (BufferedReader wrapping GzipReader wrapping FileReader), HTTP Middleware (Logging -> Auth -> RateLimiting -> Handler), or metric instrumentation.",
    mermaidDiagram: `classDiagram
    class DataSource {
        <<interface>>
        +writeData(data: string)
        +readData() string
    }
    class FileDataSource {
        +writeData(data: string)
        +readData() string
    }
    class DataSourceDecorator {
        -DataSource wrappee
        +writeData(data: string)
        +readData() string
    }
    class EncryptionDecorator {
        +writeData(data: string)
        +readData() string
    }
    class CompressionDecorator {
        +writeData(data: string)
        +readData() string
    }
    DataSource <|.. FileDataSource
    DataSource <|.. DataSourceDecorator
    DataSourceDecorator o-- DataSource
    DataSourceDecorator <|-- EncryptionDecorator
    DataSourceDecorator <|-- CompressionDecorator`,
    pythonCode: `# Classic OOP Decorator Pattern in Python (Composition over Inheritance)
from abc import ABC, abstractmethod
import base64

class DataSource(ABC):
    @abstractmethod
    def write_data(self, data: str) -> None:
        pass

    @abstractmethod
    def read_data(self) -> str:
        pass

class MemoryDataSource(DataSource):
    def __init__(self):
        self._content: str = ""

    def write_data(self, data: str) -> None:
        self._content = data

    def read_data(self) -> str:
        return self._content

class DataSourceDecorator(DataSource):
    """Base decorator wrapping the core component"""
    def __init__(self, source: DataSource):
        self._wrappee = source

    def write_data(self, data: str) -> None:
        self._wrappee.write_data(data)

    def read_data(self) -> str:
        return self._wrappee.read_data()

class EncryptionDecorator(DataSourceDecorator):
    def write_data(self, data: str) -> None:
        encoded = base64.b64encode(data.encode()).decode()
        print(f"[Encryption] Encoded '{data}' -> '{encoded}'")
        super().write_data(encoded)

    def read_data(self) -> str:
        raw = super().read_data()
        decoded = base64.b64decode(raw.encode()).decode()
        print(f"[Encryption] Decoded '{raw}' -> '{decoded}'")
        return decoded

class LoggingDecorator(DataSourceDecorator):
    def write_data(self, data: str) -> None:
        print(f"[Log] Writing payload of length {len(data)}")
        super().write_data(data)

    def read_data(self) -> str:
        val = super().read_data()
        print(f"[Log] Read payload: '{val}'")
        return val

# Client Usage: Layering behaviors dynamically
if __name__ == "__main__":
    # Stack: Logging -> Encryption -> Memory
    pipeline = LoggingDecorator(EncryptionDecorator(MemoryDataSource()))
    pipeline.write_data("Confidential quarterly report")
    print("Pipeline Output:", pipeline.read_data())`,
    goCode: `// Middleware / Decorator Pattern in Go for HTTP Handlers
package main

import (
	"fmt"
	"net/http"
	"time"
)

// Middleware is an HTTP handler decorator
type Middleware func(http.HandlerFunc) http.HandlerFunc

func LoggingMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		fmt.Printf("[Logger] Started %s %s\\n", r.Method, r.URL.Path)
		next(w, r)
		fmt.Printf("[Logger] Completed in %v\\n", time.Since(start))
	}
}

func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token := r.Header.Get("Authorization")
		if token == "" {
			fmt.Println("[Auth] Unauthorized: Missing token")
			return
		}
		fmt.Println("[Auth] Token verified")
		next(w, r)
	}
}

// Chain merges multiple middleware into a single decorator chain
func Chain(h http.HandlerFunc, m ...Middleware) http.HandlerFunc {
	for i := len(m) - 1; i >= 0; i-- {
		h = m[i](h)
	}
	return h
}

func WelcomeHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("[Handler] Executing core business logic: Welcome!")
}

func main() {
	handler := Chain(WelcomeHandler, LoggingMiddleware, AuthMiddleware)
	req, _ := http.NewRequest("GET", "/api/v1/profile", nil)
	req.Header.Set("Authorization", "Bearer valid-jwt")
	handler(nil, req)
}`,
    interviewTips: [
      "Decorator vs Adapter: Adapter changes an existing interface to match an incompatible client expectation. Decorator enhances an existing object WITHOUT changing its interface.",
      "Decorator vs Subclassing: Subclassing adds behavior statically at compile time; with N independent features you get a 2^N combinatorial explosion of subclasses. Decorator lets you combine them dynamically at runtime.",
    ],
  },
  {
    id: "pattern-adapter",
    name: "Adapter Pattern (Wrapper)",
    type: "Structural",
    summary:
      "Allows objects with incompatible interfaces to collaborate by converting the interface of one class into an interface that the client expects.",
    realWorldUseCase:
      "Integrating legacy third-party SOAP/XML APIs into modern JSON REST microservices, or wrapping third-party SDKs so they conform to your internal domain repository interface.",
    mermaidDiagram: `classDiagram
    class TargetPaymentGateway {
        <<interface>>
        +processPayment(amountCents: int, currency: string) bool
    }
    class LegacyXmlPaymentService {
        +submitXmlTransaction(xmlPayload: string) string
    }
    class PaymentAdapter {
        -LegacyXmlPaymentService legacyService
        +processPayment(amountCents: int, currency: string) bool
    }
    TargetPaymentGateway <|.. PaymentAdapter
    PaymentAdapter o-- LegacyXmlPaymentService`,
    pythonCode: `# Adapter Pattern: Translating Legacy XML SDK to Modern Domain Interface
from abc import ABC, abstractmethod

# 1. Target Interface required by Modern App
class UnifiedPaymentGateway(ABC):
    @abstractmethod
    def charge(self, user_id: str, amount_dollars: float) -> bool:
        pass

# 2. Adaptee: Incompatible 3rd Party / Legacy Service
class LegacyBankXmlService:
    def execute_wire_transfer(self, xml_document: str) -> str:
        print(f"[LegacyBank] Parsing raw XML wire transfer:\\n{xml_document}")
        return "<status>SUCCESS</status><ref>WIRE-88912</ref>"

# 3. Adapter: Wraps Adaptee and implements Target Interface
class LegacyBankAdapter(UnifiedPaymentGateway):
    def __init__(self, legacy_service: LegacyBankXmlService):
        self.legacy_service = legacy_service

    def charge(self, user_id: str, amount_dollars: float) -> bool:
        # Translate modern parameters into legacy XML protocol
        xml_request = (
            f"<TransferRequest>\\n"
            f"  <Beneficiary>{user_id}</Beneficiary>\\n"
            f"  <AmountUSD>{amount_dollars:.2f}</AmountUSD>\\n"
            f"</TransferRequest>"
        )
        response = self.legacy_service.execute_wire_transfer(xml_request)
        return "<status>SUCCESS</status>" in response

# Client Code only depends on UnifiedPaymentGateway
if __name__ == "__main__":
    adapter: UnifiedPaymentGateway = LegacyBankAdapter(LegacyBankXmlService())
    success = adapter.charge("customer-42", 3500.00)
    print(f"Charge Result: {'Approved' if success else 'Declined'}")`,
    goCode: `// Adapter Pattern in Go
package main

import (
	"encoding/json"
	"fmt"
)

// Target Interface
type ModernLogger interface {
	LogJSON(level string, message string, fields map[string]interface{})
}

// Adaptee: Legacy text-only syslog system
type LegacySyslog struct{}
func (l *LegacySyslog) SendRaw(line string) {
	fmt.Printf("[Syslog /dev/log] %s\\n", line)
}

// Adapter
type SyslogAdapter struct {
	legacy *LegacySyslog
}

func NewSyslogAdapter(legacy *LegacySyslog) *SyslogAdapter {
	return &SyslogAdapter{legacy: legacy}
}

func (a *SyslogAdapter) LogJSON(level string, message string, fields map[string]interface{}) {
	payload := map[string]interface{}{
		"level": level,
		"msg":   message,
		"meta":  fields,
	}
	bytes, _ := json.Marshal(payload)
	// Adapts structured JSON call into legacy raw line format
	a.legacy.SendRaw(string(bytes))
}

func main() {
	var logger ModernLogger = NewSyslogAdapter(&LegacySyslog{})
	logger.LogJSON("INFO", "Candidate profile loaded", map[string]interface{}{
		"candidate": "Ada Lovelace",
		"location":  "Remote",
	})
}`,
    interviewTips: [
      "Adapter vs Proxy: Adapter provides a DIFFERENT interface to the wrapped object. Proxy provides the SAME interface (used for lazy loading, access control, caching).",
      "Adapter vs Facade: Adapter makes two existing interfaces work together. Facade creates a brand NEW, simplified interface for an entire complex subsystem.",
    ],
  },
];
