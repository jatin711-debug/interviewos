import { LLDPrinciple } from "./types";

export const SOLID_PRINCIPLES: LLDPrinciple[] = [
  {
    id: "srp",
    name: "Single Responsibility Principle",
    acronym: "SRP",
    summary: "A class or module should have one, and only one, reason to change.",
    whyItMatters:
      "Prevents monolithic 'God classes' that couple business rules with presentation, persistence, or network transport.",
    badCode: `# BAD: User handles authentication, database persistence, AND email notifications
class User:
    def __init__(self, username, email):
        self.username = username
        self.email = email

    def save_to_db(self):
        db.execute("INSERT INTO users VALUES (?, ?)", (self.username, self.email))

    def send_welcome_email(self):
        smtp.send_mail(self.email, "Welcome aboard!")
`,
    goodCode: `# GOOD: Separated into Domain Entity, Repository, and Notification Service
class User:
    def __init__(self, username: str, email: str):
        self.username = username
        self.email = email

class UserRepository:
    def save(self, user: User) -> None:
        db.execute("INSERT INTO users VALUES (?, ?)", (user.username, user.email))

class NotificationService:
    def send_welcome_email(self, user: User) -> None:
        smtp.send_mail(user.email, "Welcome aboard!")
`,
    explanation:
      "If email transport switches to SendGrid/Postmark or the database migrates from SQLite to PostgreSQL, the core User domain entity remains untouched.",
  },
  {
    id: "ocp",
    name: "Open/Closed Principle",
    acronym: "OCP",
    summary: "Software entities should be open for extension, but closed for modification.",
    whyItMatters:
      "Adding a new feature (e.g. new payment gateway or discount strategy) shouldn't require modifying existing, tested code.",
    badCode: `# BAD: Modifying calculate_discount with if/elif every time a new tier is added
class DiscountCalculator:
    def calculate(self, customer_type: str, amount: float) -> float:
        if customer_type == "regular":
            return amount * 0.05
        elif customer_type == "vip":
            return amount * 0.20
        elif customer_type == "employee":
            return amount * 0.50
        return 0.0
`,
    goodCode: `# GOOD: Strategy Pattern via abstract interface
from abc import ABC, abstractmethod

class DiscountStrategy(ABC):
    @abstractmethod
    def apply(self, amount: float) -> float:
        pass

class VIPDiscount(DiscountStrategy):
    def apply(self, amount: float) -> float:
        return amount * 0.20

class EmployeeDiscount(DiscountStrategy):
    def apply(self, amount: float) -> float:
        return amount * 0.50

class Order:
    def __init__(self, amount: float, discount: DiscountStrategy):
        self.amount = amount
        self.discount = discount
`,
    explanation:
      "New discount types are added simply by implementing DiscountStrategy. Zero existing classes are touched or re-tested.",
  },
  {
    id: "lsp",
    name: "Liskov Substitution Principle",
    acronym: "LSP",
    summary:
      "Objects of a superclass should be replaceable with objects of its subclasses without breaking application correctness.",
    whyItMatters:
      "Prevents unexpected runtime exceptions when subclasses violate invariants, weaken preconditions, or strengthen postconditions.",
    badCode: `# BAD: Square overrides Rectangle setters and violates geometry expectations
class Rectangle:
    def __init__(self, width: float, height: float):
        self.width = width
        self.height = height

    def set_width(self, w: float): self.width = w
    def set_height(self, h: float): self.height = h
    def area(self) -> float: return self.width * self.height

class Square(Rectangle):
    def set_width(self, w: float):
        self.width = w
        self.height = w # Mutates height unexpectedly!
`,
    goodCode: `# GOOD: Shared Shape interface; make specific shapes immutable or distinct
from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> float:
        pass

class Rectangle(Shape):
    def __init__(self, width: float, height: float):
        self.width = width
        self.height = height
    def area(self) -> float: return self.width * self.height

class Square(Shape):
    def __init__(self, side: float):
        self.side = side
    def area(self) -> float: return self.side ** 2
`,
    explanation:
      "A client expecting a Rectangle that resizes width independently cannot safely operate on a Square without breaking invariants.",
  },
  {
    id: "isp",
    name: "Interface Segregation Principle",
    acronym: "ISP",
    summary: "Clients should not be forced to depend on methods they do not use.",
    whyItMatters:
      "Fat interfaces force implementers to write dummy methods or throw NotImplementedErrors, polluting the code with dead stubs.",
    badCode: `# BAD: Monolithic worker interface forcing human constraints on robots
class Worker:
    def work(self): pass
    def eat_lunch(self): pass
    def sleep(self): pass

class RobotWorker(Worker):
    def work(self): print("Working 24/7")
    def eat_lunch(self): raise NotImplementedError("Robots do not eat!")
    def sleep(self): raise NotImplementedError("Robots do not sleep!")
`,
    goodCode: `# GOOD: Segregated, fine-grained interfaces
from abc import ABC, abstractmethod

class Workable(ABC):
    @abstractmethod
    def work(self) -> None: pass

class Feedable(ABC):
    @abstractmethod
    def eat(self) -> None: pass

class HumanWorker(Workable, Feedable):
    def work(self): print("Human working")
    def eat(self): print("Human eating lunch")

class RobotWorker(Workable):
    def work(self): print("Robot assembling units 24/7")
`,
    explanation:
      "In Go, this principle is deeply codified: 'The bigger the interface, the weaker the abstraction' (Rob Pike). Go favors 1-method interfaces like io.Reader and io.Writer.",
  },
  {
    id: "dip",
    name: "Dependency Inversion Principle",
    acronym: "DIP",
    summary:
      "High-level modules should not depend on low-level modules; both should depend on abstractions.",
    whyItMatters:
      "Tightly coupled code cannot be unit-tested without real network, database, or external hardware connections.",
    badCode: `# BAD: OrderService directly instantiates MySQLDatabase concrete class
class MySQLDatabase:
    def insert(self, record): print(f"Writing to MySQL: {record}")

class OrderService:
    def __init__(self):
        self.db = MySQLDatabase() # Hardcoded concrete dependency!

    def create_order(self, order):
        self.db.insert(order)
`,
    goodCode: `# GOOD: OrderService depends on Database abstract interface (Injected)
from abc import ABC, abstractmethod

class Database(ABC):
    @abstractmethod
    def insert(self, record: dict) -> None: pass

class PostgreSQLDatabase(Database):
    def insert(self, record: dict) -> None: print(f"Postgres write: {record}")

class MockDatabase(Database):
    def __init__(self): self.records = []
    def insert(self, record: dict) -> None: self.records.append(record)

class OrderService:
    def __init__(self, db: Database): # Dependency Injection
        self.db = db

    def create_order(self, order: dict):
        self.db.insert(order)
`,
    explanation:
      "Unit testing OrderService is now instantaneous with MockDatabase, and switching to Spanner or RocksDB requires zero changes to the service.",
  },
  {
    id: "dry-kiss-yagni",
    name: "DRY, KISS, and YAGNI",
    acronym: "CORE",
    summary: "Don't Repeat Yourself, Keep It Simple Stupid, and You Aren't Gonna Need It.",
    whyItMatters:
      "Over-engineering and speculative architecture kill startups. Premature generalization creates unnecessary abstractions that slow down iteration.",
    badCode: `# BAD: Speculative Generality (YAGNI violation)
class StringManipulatorAbstractFactoryMetaProvider:
    """Over-engineered 6-layer abstraction for simple string lowercase"""
    def create_provider_factory(self): ...
`,
    goodCode: `# GOOD: Clean, Direct, and Pragmatic (KISS)
def normalize_email(email: str) -> str:
    return email.strip().lower()
`,
    explanation:
      "Design for today's requirements with clean boundaries, allowing refactoring tomorrow when real requirements demand it.",
  },
];
