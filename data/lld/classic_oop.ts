import { LLDProblem } from "./types";

export const CLASSIC_OOP_PROBLEMS: LLDProblem[] = [
  {
    id: "lld-parking-lot",
    title: "Multi-Floor Smart Parking Lot System",
    category: "Classic OOP",
    difficulty: "Medium",
    summary:
      "Design a multi-floor parking lot supporting different vehicle types (Motorcycle, Car, Electric, Truck/Bus), automated entry/exit ticketing, dynamic spot allocation strategies (Nearest-to-Entrance, Best-Fit), and pricing tiers with thread-safe spot reservations.",
    requirements: {
      functional: [
        "Multiple floors, each containing different parking spot types (Compact, Regular, Large, Electric with EV charging).",
        "Vehicle enters at entry gate: system generates an immutable ticket with timestamp, vehicle license, assigned spot ID, and gate ID.",
        "Vehicle exits at exit gate: system computes total duration, calculates fee via pluggable pricing strategy, frees the spot, and marks ticket paid.",
        "Real-time display boards at each floor showing available capacity per spot type.",
      ],
      nonFunctional: [
        "Thread-safe spot allocation: Concurrent vehicles at multiple gates cannot be assigned the same parking spot (Race condition prevention).",
        "Extensibility: Adding new vehicle types or pricing schemes should follow the Open/Closed Principle.",
      ],
    },
    designPatternsUsed: [
      "Factory Pattern (Vehicle creation)",
      "Strategy Pattern (Parking Spot Assignment & Pricing Rules)",
      "Observer Pattern (Real-time Floor Display Board updates)",
      "Singleton Pattern (ParkingLot Central Coordinator)",
    ],
    mermaidDiagram: `classDiagram
    class Vehicle {
        <<abstract>>
        +licenseNumber: string
        +type: VehicleType
    }
    class Car { +type: VehicleType = CAR }
    class Motorcycle { +type: VehicleType = MOTORCYCLE }
    class Truck { +type: VehicleType = TRUCK }
    class EVCar { +type: VehicleType = EV }

    class ParkingSpot {
        <<abstract>>
        +spotId: string
        +floorNumber: int
        +isOccupied: bool
        +vehicle: Vehicle
        +assignVehicle(v: Vehicle)
        +removeVehicle()
    }
    class CompactSpot
    class RegularSpot
    class LargeSpot
    class EVChargingSpot

    class Ticket {
        +ticketId: string
        +entryTime: float
        +vehicle: Vehicle
        +spot: ParkingSpot
        +paid: bool
    }

    class PricingStrategy {
        <<interface>>
        +calculateFee(ticket: Ticket, exitTime: float) float
    }

    class ParkingLot {
        -ParkingLot _instance$
        -floors: List~ParkingFloor~
        -activeTickets: Map~string, Ticket~
        -lock: Mutex
        +parkVehicle(v: Vehicle) Ticket
        +unparkVehicle(ticketId: string) float
    }

    Vehicle <|-- Car
    Vehicle <|-- Motorcycle
    Vehicle <|-- Truck
    Vehicle <|-- EVCar

    ParkingSpot <|-- CompactSpot
    ParkingSpot <|-- RegularSpot
    ParkingSpot <|-- LargeSpot
    ParkingSpot <|-- EVChargingSpot

    ParkingLot *-- ParkingSpot
    ParkingLot o-- PricingStrategy
    ParkingLot ..> Ticket`,
    pythonCode: `# Multi-Floor Smart Parking Lot in Python
import time
import uuid
import threading
from abc import ABC, abstractmethod
from enum import Enum
from typing import Dict, List, Optional

class VehicleType(Enum):
    MOTORCYCLE = 1
    CAR = 2
    TRUCK = 3
    EV = 4

class SpotType(Enum):
    COMPACT = 1
    REGULAR = 2
    LARGE = 3
    EV_SPOT = 4

class Vehicle(ABC):
    def __init__(self, license_plate: str, vehicle_type: VehicleType):
        self.license_plate = license_plate
        self.vehicle_type = vehicle_type

class Car(Vehicle):
    def __init__(self, license_plate: str):
        super().__init__(license_plate, VehicleType.CAR)

class Motorcycle(Vehicle):
    def __init__(self, license_plate: str):
        super().__init__(license_plate, VehicleType.MOTORCYCLE)

class ParkingSpot:
    def __init__(self, spot_id: str, floor: int, spot_type: SpotType):
        self.spot_id = spot_id
        self.floor = floor
        self.spot_type = spot_type
        self.is_occupied: bool = False
        self.parked_vehicle: Optional[Vehicle] = None
        self._lock = threading.Lock()

    def can_fit(self, vehicle: Vehicle) -> bool:
        if self.spot_type == SpotType.COMPACT and vehicle.vehicle_type in {VehicleType.MOTORCYCLE, VehicleType.CAR}:
            return True
        if self.spot_type == SpotType.REGULAR and vehicle.vehicle_type in {VehicleType.MOTORCYCLE, VehicleType.CAR}:
            return True
        if self.spot_type == SpotType.LARGE and vehicle.vehicle_type == VehicleType.TRUCK:
            return True
        if self.spot_type == SpotType.EV_SPOT and vehicle.vehicle_type == VehicleType.EV:
            return True
        return False

    def assign(self, vehicle: Vehicle) -> bool:
        with self._lock:
            if self.is_occupied or not self.can_fit(vehicle):
                return False
            self.is_occupied = True
            self.parked_vehicle = vehicle
            return True

    def vacate(self) -> None:
        with self._lock:
            self.is_occupied = False
            self.parked_vehicle = None

class Ticket:
    def __init__(self, vehicle: Vehicle, spot: ParkingSpot):
        self.ticket_id: str = f"TCK-{uuid.uuid4().hex[:8].upper()}"
        self.vehicle = vehicle
        self.spot = spot
        self.entry_time: float = time.time()
        self.paid: bool = False

class PricingStrategy(ABC):
    @abstractmethod
    def compute_fee(self, ticket: Ticket, exit_time: float) -> float:
        pass

class HourlyPricingStrategy(PricingStrategy):
    RATES = {
        VehicleType.MOTORCYCLE: 2.0,
        VehicleType.CAR: 5.0,
        VehicleType.TRUCK: 12.0,
        VehicleType.EV: 6.5,
    }

    def compute_fee(self, ticket: Ticket, exit_time: float) -> float:
        duration_hours = max(1.0, (exit_time - ticket.entry_time) / 3600.0)
        base_rate = self.RATES.get(ticket.vehicle.vehicle_type, 5.0)
        return round(duration_hours * base_rate, 2)

class ParkingLot:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            with cls._lock:
                if not cls._instance:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self, name: str = "Pearson Express Parking", pricing_strategy: Optional[PricingStrategy] = None):
        if getattr(self, "_initialized", False):
            return
        self.name = name
        self.spots: Dict[str, ParkingSpot] = {}
        self.active_tickets: Dict[str, Ticket] = {}
        self.pricing_strategy = pricing_strategy or HourlyPricingStrategy()
        self._global_lock = threading.Lock()
        self._initialized = True

    def add_spot(self, spot: ParkingSpot) -> None:
        with self._global_lock:
            self.spots[spot.spot_id] = spot

    def park(self, vehicle: Vehicle) -> Optional[Ticket]:
        with self._global_lock:
            # Find first available compatible spot
            for spot in self.spots.values():
                if not spot.is_occupied and spot.can_fit(vehicle):
                    if spot.assign(vehicle):
                        ticket = Ticket(vehicle, spot)
                        self.active_tickets[ticket.ticket_id] = ticket
                        return ticket
        return None  # Parking Lot Full

    def unpark(self, ticket_id: str) -> float:
        with self._global_lock:
            ticket = self.active_tickets.pop(ticket_id, None)
            if not ticket:
                raise ValueError("Invalid or expired ticket ID")
            
            fee = self.pricing_strategy.compute_fee(ticket, time.time() + 7200) # Simulating 2 hours
            ticket.spot.vacate()
            ticket.paid = True
            return fee

# Driver test
if __name__ == "__main__":
    lot = ParkingLot("Toronto Pearson Terminal 1")
    lot.add_spot(ParkingSpot("F1-A1", 1, SpotType.REGULAR))
    lot.add_spot(ParkingSpot("F1-A2", 1, SpotType.COMPACT))

    car = Car("ON-ABCD-123")
    ticket = lot.park(car)
    print(f"Parked car at {ticket.spot.spot_id}, Ticket: {ticket.ticket_id}")

    fee = lot.unpark(ticket.ticket_id)
    print(f"Unparked car. Total parking fee: \${fee}")`,
    goCode: `// Multi-Floor Parking Lot in Go with Concurrency Protection
package main

import (
	"errors"
	"fmt"
	"sync"
	"time"
)

type VehicleType int
const (
	Motorcycle VehicleType = iota
	Car
	Truck
)

type SpotType int
const (
	Compact SpotType = iota
	Regular
	Large
)

type Vehicle struct {
	License string
	Type    VehicleType
}

type ParkingSpot struct {
	ID       string
	Floor    int
	Type     SpotType
	Occupied bool
	Vehicle  *Vehicle
	mu       sync.Mutex
}

func (s *ParkingSpot) CanFit(v *Vehicle) bool {
	if s.Type == Compact && (v.Type == Motorcycle || v.Type == Car) { return true }
	if s.Type == Regular && (v.Type == Motorcycle || v.Type == Car) { return true }
	if s.Type == Large && v.Type == Truck { return true }
	return false
}

type Ticket struct {
	ID        string
	EntryTime time.Time
	SpotID    string
	License   string
}

type ParkingLot struct {
	spots   map[string]*ParkingSpot
	tickets map[string]*Ticket
	mu      sync.RWMutex
}

func NewParkingLot() *ParkingLot {
	return &ParkingLot{
		spots:   make(map[string]*ParkingSpot),
		tickets: make(map[string]*Ticket),
	}
}

func (pl *ParkingLot) AddSpot(spot *ParkingSpot) {
	pl.mu.Lock()
	defer pl.mu.Unlock()
	pl.spots[spot.ID] = spot
}

func (pl *ParkingLot) Park(v *Vehicle) (*Ticket, error) {
	pl.mu.Lock()
	defer pl.mu.Unlock()

	for _, spot := range pl.spots {
		if !spot.Occupied && spot.CanFit(v) {
			spot.mu.Lock()
			spot.Occupied = true
			spot.Vehicle = v
			spot.mu.Unlock()

			ticket := &Ticket{
				ID:        fmt.Sprintf("TCK-%d", time.Now().UnixNano()),
				EntryTime: time.Now(),
				SpotID:    spot.ID,
				License:   v.License,
			}
			pl.tickets[ticket.ID] = ticket
			return ticket, nil
		}
	}
	return nil, errors.New("parking lot full for this vehicle type")
}

func (pl *ParkingLot) Unpark(ticketID string) (float64, error) {
	pl.mu.Lock()
	defer pl.mu.Unlock()

	ticket, exists := pl.tickets[ticketID]
	if !exists {
		return 0, errors.New("invalid ticket")
	}

	spot := pl.spots[ticket.SpotID]
	spot.mu.Lock()
	spot.Occupied = false
	spot.Vehicle = nil
	spot.mu.Unlock()

	delete(pl.tickets, ticketID)
	// Compute flat rate for demonstration
	return 10.0, nil
}

func main() {
	lot := NewParkingLot()
	lot.AddSpot(&ParkingSpot{ID: "F1-01", Floor: 1, Type: Regular})

	ticket, err := lot.Park(&Vehicle{License: "CAD-2027", Type: Car})
	if err != nil { panic(err) }
	fmt.Printf("Vehicle parked: Ticket %s on Spot %s\\n", ticket.ID, ticket.SpotID)

	fee, _ := lot.Unpark(ticket.ID)
	fmt.Printf("Vehicle unparked: Total fee \$%.2f\\n", fee)
}`,
    keyInterviewTakeaways: [
      "Spot Allocation Strategy: Do not search through all spots sequentially in O(N); in high-scale lots, maintain separate min-heaps (priority queues) for each SpotType keyed by distance to entrance.",
      "Granular Locking: Locking the whole parking lot during a vehicle's park duration creates a choke point. Use fine-grained locking per spot or per floor.",
      "Extensibility: Use Strategy Pattern for dynamic surge pricing (weekday vs weekend, EV charging energy kWh metering).",
    ],
  },
  {
    id: "lld-elevator",
    title: "Multi-Elevator Bank System with SCAN / LOOK Dispatching",
    category: "Classic OOP",
    difficulty: "Hard",
    summary:
      "Design an intelligent elevator bank controller coordinating multiple elevators across 50 floors. Incorporates the SCAN (Elevator Algorithm) scheduling, State Pattern for elevator movement, internal/external hall requests, and emergency stop protocols.",
    requirements: {
      functional: [
        "Elevator Bank coordinates N elevators serving M floors.",
        "External Hall Call: User presses UP or DOWN button at floor K.",
        "Internal Car Call: Passenger steps in and presses destination floor D.",
        "Elevator cycles through states: IDLE, MOVING_UP, MOVING_DOWN, DOOR_OPEN, MAINTENANCE.",
        "Elevator opens doors for 5 seconds when arriving at destination floor, then resumes optimal trajectory.",
      ],
      nonFunctional: [
        "Optimal dispatching: Minimize passenger wait time and energy consumption using the LOOK/SCAN algorithm.",
        "Safety & starvation prevention: Prevent requests from waiting indefinitely when an elevator keeps picking up floors along its direction.",
      ],
    },
    designPatternsUsed: [
      "State Pattern (Elevator movement and door transitions)",
      "Strategy Pattern (Dispatching algorithms: Round Robin vs Proximity vs LOOK)",
      "Observer Pattern (Door sensors and floor passing triggers)",
    ],
    mermaidDiagram: `classDiagram
    class Direction {
        <<enumeration>>
        UP
        DOWN
        IDLE
    }
    class ElevatorState {
        <<enumeration>>
        MOVING_UP
        MOVING_DOWN
        DOORS_OPEN
        IDLE
        OUT_OF_SERVICE
    }
    class Request {
        +int sourceFloor
        +int destinationFloor
        +Direction direction
    }
    class Elevator {
        +int id
        +int currentFloor
        +ElevatorState state
        +Direction direction
        -List~int~ upStops
        -List~int~ downStops
        +addDestination(floor: int)
        +step()
    }
    class ElevatorController {
        -List~Elevator~ elevators
        +requestElevator(floor: int, dir: Direction) Elevator
        +stepSystem()
    }
    ElevatorController *-- Elevator
    Elevator ..> Request
    Elevator ..> ElevatorState
    Elevator ..> Direction`,
    pythonCode: `# Elevator System with SCAN/LOOK Algorithm in Python
from enum import Enum
import heapq
from typing import List, Optional

class Direction(Enum):
    UP = 1
    DOWN = -1
    IDLE = 0

class ElevatorState(Enum):
    IDLE = "IDLE"
    MOVING = "MOVING"
    DOOR_OPEN = "DOOR_OPEN"

class Elevator:
    def __init__(self, elevator_id: int, min_floor: int = 1, max_floor: int = 40):
        self.id = elevator_id
        self.min_floor = min_floor
        self.max_floor = max_floor
        self.current_floor = 1
        self.direction = Direction.IDLE
        self.state = ElevatorState.IDLE
        # Min-heap for UP requests above current floor
        self.up_stops: List[int] = []
        # Max-heap (simulated with negative numbers) for DOWN requests below current floor
        self.down_stops: List[int] = []

    def add_destination(self, floor: int) -> None:
        if floor < self.min_floor or floor > self.max_floor:
            raise ValueError(f"Floor {floor} out of bounds")

        if floor > self.current_floor:
            if floor not in self.up_stops:
                heapq.heappush(self.up_stops, floor)
        elif floor < self.current_floor:
            neg_floor = -floor
            if neg_floor not in self.down_stops:
                heapq.heappush(self.down_stops, neg_floor)
        else:
            self.state = ElevatorState.DOOR_OPEN
            print(f"[Elevator {self.id}] Already at floor {floor}. Doors opened.")

        if self.direction == Direction.IDLE:
            if self.up_stops:
                self.direction = Direction.UP
                self.state = ElevatorState.MOVING
            elif self.down_stops:
                self.direction = Direction.DOWN
                self.state = ElevatorState.MOVING

    def step(self) -> None:
        """Simulation tick for elevator movement (SCAN/LOOK algorithm)"""
        if self.state == ElevatorState.DOOR_OPEN:
            print(f"[Elevator {self.id}] Doors closing at floor {self.current_floor}...")
            self.state = ElevatorState.MOVING

        if self.direction == Direction.UP:
            if self.up_stops:
                next_stop = self.up_stops[0]
                if self.current_floor < next_stop:
                    self.current_floor += 1
                    print(f"[Elevator {self.id}] Ascending -> Floor {self.current_floor}")
                if self.current_floor == next_stop:
                    heapq.heappop(self.up_stops)
                    self.state = ElevatorState.DOOR_OPEN
                    print(f"[Elevator {self.id}] Reached destination floor {self.current_floor}! Doors OPEN.")
            else:
                # Reverse direction if requests exist below
                if self.down_stops:
                    self.direction = Direction.DOWN
                    print(f"[Elevator {self.id}] Finished UP run. Reversing to DOWN.")
                else:
                    self.direction = Direction.IDLE
                    self.state = ElevatorState.IDLE
                    print(f"[Elevator {self.id}] No pending stops. Now IDLE at floor {self.current_floor}.")

        elif self.direction == Direction.DOWN:
            if self.down_stops:
                next_stop = -self.down_stops[0]
                if self.current_floor > next_stop:
                    self.current_floor -= 1
                    print(f"[Elevator {self.id}] Descending -> Floor {self.current_floor}")
                if self.current_floor == next_stop:
                    heapq.heappop(self.down_stops)
                    self.state = ElevatorState.DOOR_OPEN
                    print(f"[Elevator {self.id}] Reached destination floor {self.current_floor}! Doors OPEN.")
            else:
                if self.up_stops:
                    self.direction = Direction.UP
                    print(f"[Elevator {self.id}] Finished DOWN run. Reversing to UP.")
                else:
                    self.direction = Direction.IDLE
                    self.state = ElevatorState.IDLE
                    print(f"[Elevator {self.id}] No pending stops. Now IDLE at floor {self.current_floor}.")

class ElevatorController:
    def __init__(self, num_elevators: int = 3):
        self.elevators = [Elevator(i + 1) for i in range(num_elevators)]

    def handle_external_request(self, floor: int, requested_dir: Direction) -> Elevator:
        # Best elevator selection: Find elevator already moving towards this floor in same direction
        best_elevator: Optional[Elevator] = None
        min_distance = float("inf")

        for el in self.elevators:
            distance = abs(el.current_floor - floor)
            if el.direction == requested_dir:
                if (requested_dir == Direction.UP and el.current_floor <= floor) or \
                   (requested_dir == Direction.DOWN and el.current_floor >= floor):
                    if distance < min_distance:
                        min_distance = distance
                        best_elevator = el
            elif el.direction == Direction.IDLE:
                if distance < min_distance:
                    min_distance = distance
                    best_elevator = el

        if not best_elevator:
            best_elevator = self.elevators[0]

        print(f"[Controller] Assigned Floor {floor} request to Elevator {best_elevator.id}")
        best_elevator.add_destination(floor)
        return best_elevator

# Simulation Test
if __name__ == "__main__":
    controller = ElevatorController(num_elevators=2)
    controller.handle_external_request(floor=5, requested_dir=Direction.UP)
    el = controller.elevators[0]
    for _ in range(7):
        el.step()`,
    goCode: `// Multi-Elevator System in Go
package main

import (
	"fmt"
	"math"
	"sync"
)

type Direction int
const (
	Idle Direction = 0
	Up   Direction = 1
	Down Direction = -1
)

type Elevator struct {
	ID           int
	CurrentFloor int
	Direction    Direction
	Destinations []int
	mu           sync.Mutex
}

func (e *Elevator) AddDestination(floor int) {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.Destinations = append(e.Destinations, floor)
	if e.Direction == Idle {
		if floor > e.CurrentFloor {
			e.Direction = Up
		} else {
			e.Direction = Down
		}
	}
}

type ElevatorSystem struct {
	elevators []*Elevator
	mu        sync.RWMutex
}

func NewElevatorSystem(count int) *ElevatorSystem {
	elevators := make([]*Elevator, count)
	for i := 0; i < count; i++ {
		elevators[i] = &Elevator{
			ID:           i + 1,
			CurrentFloor: 1,
			Direction:    Idle,
		}
	}
	return &ElevatorSystem{elevators: elevators}
}

func (s *ElevatorSystem) RequestElevator(floor int, dir Direction) *Elevator {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var best *Elevator
	minDist := math.MaxInt32

	for _, e := range s.elevators {
		dist := int(math.Abs(float64(e.CurrentFloor - floor)))
		if dist < minDist {
			minDist = dist
			best = e
		}
	}
	best.AddDestination(floor)
	fmt.Printf("[System] Assigned elevator %d to floor %d\\n", best.ID, floor)
	return best
}

func main() {
	sys := NewElevatorSystem(3)
	sys.RequestElevator(12, Up)
	sys.RequestElevator(4, Down)
}`,
    keyInterviewTakeaways: [
      "SCAN / LOOK Algorithm: The elevator continues in its current direction until all pending calls in that direction are fulfilled before reversing. Avoids thrashing between top and bottom floors.",
      "Starvation Handling: If someone requests floor 1 while the elevator is serving an endless stream of floor 20-30 requests, an aging counter or maximum pending delay flag forces a reverse sweep.",
      "Real-world Lift Banks: Group dispatchers partition high-rises into low-rise zones (floors 1-20) and high-rise zones (floors 21-50) with express elevators.",
    ],
  },
  {
    id: "lld-splitwise",
    title: "Splitwise: Expense Sharing & Debt Minimization Engine",
    category: "Classic OOP",
    difficulty: "Hard",
    summary:
      "Design an expense-sharing application like Splitwise supporting multiple split types (Equal, Exact Amount, Percentage), group management, activity audit feeds, and the optimal Debt Simplification graph algorithm to minimize total cash settlement transactions.",
    requirements: {
      functional: [
        "Create Users and Groups with multiple members.",
        "Add Expenses paid by one or more users and split across participants.",
        "Support Split Strategies: EQUAL (split evenly, handle 1-cent rounding remainders), EXACT (specific dollar amounts summing to total), and PERCENTAGE (proportions summing to 100%).",
        "Debt Simplification: Given a network of debts between N people, compute the minimum number of transactions required to settle all debts (Greedy Min-Heap / Max-Heap net balance clearing).",
      ],
      nonFunctional: [
        "Financial Precision: Use fixed-point or integer cents to avoid floating-point rounding errors ($0.1 + $0.2 != $0.3).",
        "Thread Safety: Concurrent expense additions to the same group must maintain atomic balance ledgers.",
      ],
    },
    designPatternsUsed: [
      "Strategy Pattern (Expense split calculations: EqualSplit, ExactSplit, PercentSplit)",
      "Factory Pattern (Expense creation via registered split type)",
      "Observer Pattern (Notifying users when an expense is added or modified)",
    ],
    mermaidDiagram: `classDiagram
    class User {
        +string userId
        +string name
        +string email
    }
    class SplitType {
        <<enumeration>>
        EQUAL
        EXACT
        PERCENT
    }
    class Split {
        <<abstract>>
        +User user
        +int amountCents
    }
    class EqualSplit
    class ExactSplit
    class PercentSplit { +float percent }

    class Expense {
        +string expenseId
        +string description
        +int totalAmountCents
        +User paidBy
        +List~Split~ splits
        +validate() bool
    }

    class DebtSimplifier {
        +simplify(netBalances: Map~User, int~) List~Transaction~
    }

    Split <|-- EqualSplit
    Split <|-- ExactSplit
    Split <|-- PercentSplit
    Expense o-- Split
    Expense ..> User
    DebtSimplifier ..> User`,
    pythonCode: `# Splitwise with Debt Simplification in Python
from abc import ABC, abstractmethod
from enum import Enum
import heapq
from typing import Dict, List, Tuple

class SplitType(Enum):
    EQUAL = "EQUAL"
    EXACT = "EXACT"
    PERCENT = "PERCENT"

class User:
    def __init__(self, user_id: str, name: str):
        self.user_id = user_id
        self.name = name

    def __repr__(self):
        return f"{self.name}"

class Split(ABC):
    def __init__(self, user: User, amount_cents: int = 0):
        self.user = user
        self.amount_cents = amount_cents

class EqualSplit(Split):
    pass

class ExactSplit(Split):
    pass

class PercentSplit(Split):
    def __init__(self, user: User, percent: float):
        super().__init__(user)
        self.percent = percent

class Expense:
    def __init__(self, expense_id: str, description: str, total_cents: int, paid_by: User, splits: List[Split]):
        self.expense_id = expense_id
        self.description = description
        self.total_cents = total_cents
        self.paid_by = paid_by
        self.splits = splits
        self.validate()

    def validate(self) -> bool:
        sum_splits = sum(s.amount_cents for s in self.splits)
        if sum_splits != self.total_cents:
            raise ValueError(f"Sum of splits ({sum_splits}c) != Total amount ({self.total_cents}c)")
        return True

class DebtSimplifier:
    """Greedy Debt Simplification using Min-Heap and Max-Heap (Net Balance Offset)"""
    @staticmethod
    def simplify_debts(net_balances: Dict[str, int]) -> List[Tuple[str, str, int]]:
        # Positive balance -> Creditor (should receive money)
        # Negative balance -> Debtor (owes money)
        creditors = []  # (-amount, user) max-heap
        debtors = []    # (amount, user) min-heap

        for user_id, balance in net_balances.items():
            if balance > 0:
                heapq.heappush(creditors, (-balance, user_id))
            elif balance < 0:
                heapq.heappush(debtors, (balance, user_id))

        settlements: List[Tuple[str, str, int]] = []

        while creditors and debtors:
            neg_credit, creditor = heapq.heappop(creditors)
            credit = -neg_credit
            neg_debt, debtor = heapq.heappop(debtors)
            debt = -neg_debt

            settled_amount = min(credit, debt)
            settlements.append((debtor, creditor, settled_amount))

            remaining_credit = credit - settled_amount
            remaining_debt = debt - settled_amount

            if remaining_credit > 0:
                heapq.heappush(creditors, (-remaining_credit, creditor))
            if remaining_debt > 0:
                heapq.heappush(debtors, (-remaining_debt, debtor))

        return settlements

# Driver Verification
if __name__ == "__main__":
    u1, u2, u3 = User("u1", "Ada"), User("u2", "Alex"), User("u3", "Sarah")

    # Ada pays \$300 for a shared rental car (\$100 each)
    # Alex pays \$0, Sarah pays \$0
    # Net balances: Ada: +200, Alex: -100, Sarah: -100
    balances = {
        "Ada": 20000,
        "Alex": -10000,
        "Sarah": -10000,
    }

    transactions = DebtSimplifier.simplify_debts(balances)
    print("Simplified Debt Settlements:")
    for debtor, creditor, amount in transactions:
        print(f"  {debtor} pays {creditor} \${amount / 100:.2f}")`,
    goCode: `// Splitwise Net Settlement in Go using Container/Heap
package main

import (
	"container/heap"
	"fmt"
)

type Account struct {
	UserID  string
	Balance int // in cents
}

type PriorityQueue []*Account
func (pq PriorityQueue) Len() int           { return len(pq) }
func (pq PriorityQueue) Less(i, j int) bool { return pq[i].Balance > pq[j].Balance } // max-heap
func (pq PriorityQueue) Swap(i, j int)      { pq[i], pq[j] = pq[j], pq[i] }
func (pq *PriorityQueue) Push(x interface{}) { *pq = append(*pq, x.(*Account)) }
func (pq *PriorityQueue) Pop() interface{} {
	old := *pq
	n := len(old)
	item := old[n-1]
	*pq = old[0 : n-1]
	return item
}

func SimplifyDebts(balances map[string]int) {
	creditors := &PriorityQueue{}
	debtors := &PriorityQueue{}
	heap.Init(creditors)
	heap.Init(debtors)

	for id, bal := range balances {
		if bal > 0 {
			heap.Push(creditors, &Account{UserID: id, Balance: bal})
		} else if bal < 0 {
			heap.Push(debtors, &Account{UserID: id, Balance: -bal})
		}
	}

	for creditors.Len() > 0 && debtors.Len() > 0 {
		c := heap.Pop(creditors).(*Account)
		d := heap.Pop(debtors).(*Account)

		settle := c.Balance
		if d.Balance < settle {
			settle = d.Balance
		}

		fmt.Printf("%s pays %s: \$%.2f\\n", d.UserID, c.UserID, float64(settle)/100.0)

		if c.Balance > settle {
			c.Balance -= settle
			heap.Push(creditors, c)
		}
		if d.Balance > settle {
			d.Balance -= settle
			heap.Push(debtors, d)
		}
	}
}

func main() {
	balances := map[string]int{
		"Ada": 15000, // +$150
		"David": -7000,  // -$70
		"Elena": -8000,  // -$80
	}
	SimplifyDebts(balances)
}`,
    keyInterviewTakeaways: [
      "Integer Cents: Always store currency as 64-bit integer cents (e.g. 1000 for $10.00). Floating point types (float32/float64) cause truncation bugs in banking systems.",
      "Remainder Division Bug: When splitting $100 among 3 people ($33.33 each), $33.33 * 3 = $99.99. Always distribute the remaining 1 cent to the first payer to satisfy exact sum invariants.",
      "NP-Hard Optimization: Minimizing transactions globally is a variation of the Subset-Sum / Minimum Partition Problem (NP-Hard). The greedy net balance heap algorithm is the standard production heuristic (O(N log N)).",
    ],
  },
  {
    id: "lld-bookmyshow",
    title: "BookMyShow: Cinema Reservation & Seat Locking System",
    category: "Classic OOP",
    difficulty: "Hard",
    summary:
      "Design a cinema ticket booking platform supporting hierarchical venue navigation (City -> Cinema -> Screen -> Show -> Seats), concurrent seat selection with a 5-minute temporary reservation lock (Lease/Mutex), and payment webhooks.",
    requirements: {
      functional: [
        "Browse Movies, Cinemas, and Shows by City and Date.",
        "Display real-time seat matrix for a Show (Available, Temporarily Locked, Booked).",
        "Select and Lock Seats: When a user selects 2 seats, lock them for 5 minutes (TTL). Other users cannot book these seats during this window.",
        "Confirm Booking: If payment succeeds within 5 minutes, transition seat status to PERMANENTLY_BOOKED. If payment fails or timer expires, release seats back to AVAILABLE.",
      ],
      nonFunctional: [
        "High Concurrency: Two users clicking 'Book' on the same seat at the exact same millisecond must not double-book.",
        "Fault-Tolerant Expiry: If a user closes the browser during payment, the seat lock must automatically release via a background TTL reaper or Redis key expiration.",
      ],
    },
    designPatternsUsed: [
      "State Pattern (Seat status transitions: Available -> Locked -> Booked)",
      "Observer Pattern (Seat status broadcast via WebSockets to connected browsers)",
      "Strategy Pattern (Dynamic ticket pricing based on seat tier & show timing)",
    ],
    mermaidDiagram: `stateDiagram-v2
    [*] --> AVAILABLE
    AVAILABLE --> TEMPORARILY_LOCKED : User selects seat (5m TTL)
    TEMPORARILY_LOCKED --> AVAILABLE : Timer expired / User cancelled
    TEMPORARILY_LOCKED --> PERMANENTLY_BOOKED : Payment confirmed
    PERMANENTLY_BOOKED --> [*]`,
    pythonCode: `# BookMyShow Concurrent Seat Locking Engine in Python
import time
import uuid
import threading
from enum import Enum
from typing import Dict, List, Optional, Set

class SeatStatus(Enum):
    AVAILABLE = "AVAILABLE"
    LOCKED = "LOCKED"
    BOOKED = "BOOKED"

class SeatTier(Enum):
    SILVER = 1000   # $10.00
    GOLD = 1500     # $15.00
    RECLINER = 2500 # $25.00

class Seat:
    def __init__(self, seat_id: str, row: str, number: int, tier: SeatTier):
        self.seat_id = seat_id
        self.row = row
        self.number = number
        self.tier = tier
        self.status = SeatStatus.AVAILABLE
        self.locked_by: Optional[str] = None
        self.lock_expiry: float = 0.0
        self._lock = threading.Lock()

    def try_lock(self, user_id: str, timeout_seconds: int = 300) -> bool:
        with self._lock:
            now = time.time()
            # If expired, auto-revert to AVAILABLE
            if self.status == SeatStatus.LOCKED and now > self.lock_expiry:
                self.status = SeatStatus.AVAILABLE
                self.locked_by = None

            if self.status == SeatStatus.AVAILABLE:
                self.status = SeatStatus.LOCKED
                self.locked_by = user_id
                self.lock_expiry = now + timeout_seconds
                return True
            return False

    def confirm_booking(self, user_id: str) -> bool:
        with self._lock:
            now = time.time()
            if self.status == SeatStatus.LOCKED and self.locked_by == user_id and now <= self.lock_expiry:
                self.status = SeatStatus.BOOKED
                self.locked_by = None
                self.lock_expiry = 0.0
                return True
            return False

    def release_lock(self, user_id: str) -> bool:
        with self._lock:
            if self.status == SeatStatus.LOCKED and self.locked_by == user_id:
                self.status = SeatStatus.AVAILABLE
                self.locked_by = None
                self.lock_expiry = 0.0
                return True
            return False

class Show:
    def __init__(self, show_id: str, movie_title: str, start_time: str):
        self.show_id = show_id
        self.movie_title = movie_title
        self.start_time = start_time
        self.seats: Dict[str, Seat] = {}

    def add_seat(self, seat: Seat) -> None:
        self.seats[seat.seat_id] = seat

    def reserve_seats(self, user_id: str, seat_ids: List[str]) -> bool:
        # Atomic multi-seat acquisition: If any seat fails to lock, rollback all locked so far
        acquired: List[Seat] = []
        # Sort seat_ids to prevent deadlocks across concurrent multiple bookings!
        sorted_ids = sorted(seat_ids)

        for s_id in sorted_ids:
            seat = self.seats.get(s_id)
            if not seat or not seat.try_lock(user_id, timeout_seconds=300):
                # Rollback
                for rollback_seat in acquired:
                    rollback_seat.release_lock(user_id)
                return False
            acquired.append(seat)
        return True

    def confirm_seats(self, user_id: str, seat_ids: List[str]) -> bool:
        for s_id in seat_ids:
            seat = self.seats.get(s_id)
            if not seat or not seat.confirm_booking(user_id):
                return False
        return True

# Driver Verification
if __name__ == "__main__":
    show = Show("SHOW-101", "Dune: Part Three", "19:30 EST")
    show.add_seat(Seat("A1", "A", 1, SeatTier.RECLINER))
    show.add_seat(Seat("A2", "A", 2, SeatTier.RECLINER))

    # User 1 reserves seats A1 & A2
    success1 = show.reserve_seats("ada", ["A1", "A2"])
    print(f"Ada seat reservation success: {success1}")

    # User 2 tries to reserve same seat A1 concurrently -> must fail!
    success2 = show.reserve_seats("alex", ["A1"])
    print(f"Alex concurrent seat reservation: {success2} (Expected: False)")

    # Ada confirms payment
    confirmed = show.confirm_seats("ada", ["A1", "A2"])
    print(f"Ada booking confirmed: {confirmed}")`,
    goCode: `// BookMyShow Seat Reservation Engine in Go
package main

import (
	"fmt"
	"sort"
	"sync"
	"time"
)

type SeatStatus int
const (
	Available SeatStatus = iota
	Locked
	Booked
)

type Seat struct {
	ID         string
	Status     SeatStatus
	LockedBy   string
	LockExpiry time.Time
	mu         sync.Mutex
}

func (s *Seat) TryLock(user string, d time.Duration) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()
	if s.Status == Locked && now.After(s.LockExpiry) {
		s.Status = Available
		s.LockedBy = ""
	}

	if s.Status == Available {
		s.Status = Locked
		s.LockedBy = user
		s.LockExpiry = now.Add(d)
		return true
	}
	return false
}

type CinemaShow struct {
	seats map[string]*Seat
	mu    sync.RWMutex
}

func (cs *CinemaShow) Reserve(user string, seatIDs []string) bool {
	// Sort IDs to guarantee global lock ordering and avoid distributed deadlocks
	sort.Strings(seatIDs)
	var acquired []*Seat

	for _, id := range seatIDs {
		seat, exists := cs.seats[id]
		if !exists || !seat.TryLock(user, 5*time.Minute) {
			// Rollback all
			for _, roll := range acquired {
				roll.mu.Lock()
				roll.Status = Available
				roll.LockedBy = ""
				roll.mu.Unlock()
			}
			return false
		}
		acquired = append(acquired, seat)
	}
	return true
}

func main() {
	show := &CinemaShow{
		seats: map[string]*Seat{
			"B1": {ID: "B1", Status: Available},
			"B2": {ID: "B2", Status: Available},
		},
	}

	ok := show.Reserve("ada", []string{"B1", "B2"})
	fmt.Printf("Reservation status: %v\\n", ok)
}`,
    keyInterviewTakeaways: [
      "Distributed Deadlock Avoidance: When locking multiple seats concurrently (e.g. user selects A1, A2, A3), always SORT the seat IDs before acquiring individual locks. Otherwise, if User 1 locks [A1, A2] and User 2 locks [A2, A1] simultaneously, Coffman circular wait deadlock occurs.",
      "Distributed Lock Implementation: In production distributed environments (multi-server), seat locks are maintained in Redis via `SET seat:show_id:A1 user_id NX EX 300` (Redlock algorithm) rather than in-memory mutexes.",
      "Optimistic vs Pessimistic: Pessimistic locking is preferred during the checkout window to guarantee zero double-booking while giving the buyer a 5-minute payment countdown.",
    ],
  },
];
