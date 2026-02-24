# dispatchCore — Complete System Design

> A real-time, multi-tenant last-mile logistics platform with an integrated gig-driver marketplace.

---

## Table of Contents
1. [Requirements & Scope](#1-requirements--scope)
2. [High-Level Design (HLD)](#2-high-level-design-hld)
3. [Database Design](#3-database-design)
4. [Low-Level Design (LLD)](#4-low-level-design-lld)
5. [UML Diagrams](#5-uml-diagrams)
6. [API Design](#6-api-design)
7. [Scalability, Performance & Security](#7-scalability-performance--security)
8. [Deployment & Maintenance](#8-deployment--maintenance)

---

## 1. Requirements & Scope

### 1.1 Problem Statement
Last-mile delivery is the most expensive segment of the logistics chain. Small and mid-sized courier companies lack real-time coordination tools, leading to double-assignments, idle drivers, zero customer visibility, and wasted fuel. dispatchCore solves this by providing a centralized, real-time dispatch control platform.

### 1.2 Functional Requirements

#### SuperAdmin
| ID | Requirement |
|---|---|
| FR-SA-01 | View and manage all companies on the platform |
| FR-SA-02 | View platform-wide KPIs (total deliveries, active drivers, revenue) |
| FR-SA-03 | Approve or suspend companies |
| FR-SA-04 | Resolve cross-company disputes |

#### Admin (Company-Level)
| ID | Requirement |
|---|---|
| FR-AD-01 | Manage company profile and settings |
| FR-AD-02 | Approve or reject independent driver verification requests |
| FR-AD-03 | Add/remove employed drivers and dispatchers |
| FR-AD-04 | View company-level analytics |

#### Dispatcher
| ID | Requirement |
|---|---|
| FR-D-01 | Create new delivery orders with pickup/dropoff coordinates |
| FR-D-02 | Assign orders directly to employed drivers (with concurrency safety) |
| FR-D-03 | List orders on the public marketplace with a listed price |
| FR-D-04 | View and accept/reject bids from independent drivers |
| FR-D-05 | View live map showing all employed drivers and active independent drivers |
| FR-D-06 | View real-time order status updates |
| FR-D-07 | View route-matched independent drivers near an order's path |
| FR-D-08 | View full delivery history (all fields: customer, pricing, events, driver info) |

#### Employed Driver
| ID | Requirement |
|---|---|
| FR-ED-01 | Receive assigned deliveries in real-time |
| FR-ED-02 | Update delivery status (PICKED_UP → EN_ROUTE → DELIVERED) |
| FR-ED-03 | Stream GPS location continuously while online |
| FR-ED-04 | View assigned delivery queue and route map |
| FR-ED-05 | View own delivery history (limited fields: pickup/dropoff, status, timestamps) |

#### Independent Driver
| ID | Requirement |
|---|---|
| FR-ID-01 | Register and submit verification documents |
| FR-ID-02 | Browse marketplace listings from all companies |
| FR-ID-03 | Place counter-offer bids on listed orders |
| FR-ID-04 | Pre-register travel routes (start, destination, departure time) |
| FR-ID-05 | Stream GPS only during active delivery |
| FR-ID-06 | Update delivery status once a bid is accepted |
| FR-ID-07 | View own delivery history (limited fields: pickup/dropoff, earnings, timestamps) |

#### Customer
| ID | Requirement |
|---|---|
| FR-C-01 | Track delivery live via a public link (no login required) |
| FR-C-02 | View order status timeline |
| FR-C-03 | See a live map pin of the driver's current location |

### 1.3 Non-Functional Requirements

| Category | Requirement | Target |
|---|---|---|
| **Latency** | GPS location updates | < 500ms end-to-end |
| **Latency** | Bid notifications to dispatcher | < 300ms |
| **Availability** | System uptime | 99.9% |
| **Concurrency** | Simultaneous order assignments | Zero double-assignments (ACID guarantee) |
| **Scalability** | Concurrent WebSocket connections | 10,000+ per server |
| **Scalability** | GPS pings per second | 1,000+ writes/sec |
| **Security** | Data isolation | Strict tenant boundary (company_id scoping) |
| **Security** | Authentication | JWT tokens with role-based access (CE-02) |
| **Performance** | GraphQL dashboard query | < 200ms with DataLoader |

### 1.4 MoSCoW Prioritization

| Priority | Features |
|---|---|
| **Must Have** | Multi-tenant isolation, Order CRUD, Direct assignment with locking, Live GPS tracking, WebSocket rooms, Marketplace listing, Bidding, Customer tracking page, Delivery history (role-scoped) |
| **Should Have** | Route pre-registration, Route matching, GraphQL analytics, Bid counter-offers, Delivery event audit log |
| **Could Have** | Driver leaderboard, Company-level analytics charts, Dark mode toggle |
| **Won't Have (CE-01)** | JWT auth, Push notifications, AI route optimization, Email notifications, CI/CD |

---

## 2. High-Level Design (HLD)

### 2.1 System Architecture

```mermaid
graph TB
    subgraph Clients["Client Layer (Browser)"]
        SA["SuperAdmin"]
        DD["Dispatcher"]
        ED["Employed Driver"]
        ID["Independent Driver"]
        CT["Customer"]
    end

    subgraph CDN["Static Assets"]
        CF["Cloudflare / Vercel CDN"]
    end

    subgraph Frontend["Frontend (React + Vite)"]
        RC["React Components"]
        AP["Apollo Client"]
        SC["Socket.io Client"]
    end

    subgraph Backend["Backend (Node.js + Express)"]
        LB["Load Balancer (Nginx)"]
        REST["REST API"]
        GQL["GraphQL (Apollo Server)"]
        WS["Socket.io Server"]
        MW["Middleware Layer"]
    end

    subgraph Services["Service Layer"]
        AS["Assignment Service"]
        MS["Marketplace Service"]
        LS["Location Service"]
        RMS["Route Matching Service"]
        HS["History Service"]
    end

    subgraph Data["Data Layer"]
        ORM["Sequelize ORM"]
        DB[(MySQL)]
        CACHE["Redis Cache (CE-02)"]
    end

    Clients --> CDN --> Frontend
    RC --> REST
    AP --> GQL
    SC --> WS
    REST --> MW --> Services
    GQL --> MW --> Services
    WS --> Services
    Services --> ORM --> DB
    Services -.-> CACHE
    Services --> WS
```

### 2.2 Data Flow Diagram (Level 0 - Context)

```mermaid
graph LR
    D["Dispatcher"] -->|"Creates orders, assigns drivers"| DC["dispatchCore"]
    ED["Employed Driver"] -->|"Streams GPS, updates status"| DC
    ID["Independent Driver"] -->|"Bids, registers routes, streams GPS"| DC
    C["Customer"] -->|"Requests tracking"| DC
    DC -->|"Live map, bid updates"| D
    DC -->|"Assignment notifications"| ED
    DC -->|"Bid results, marketplace"| ID
    DC -->|"Live tracking pin"| C
```

### 2.3 Data Flow Diagram (Level 1 - Processes)

```mermaid
graph TB
    subgraph P1["P1: Order Management"]
        P1A["Create Order"]
        P1B["List on Marketplace"]
        P1C["Direct Assign"]
    end

    subgraph P2["P2: Bidding Engine"]
        P2A["Place Bid"]
        P2B["Accept/Reject Bid"]
        P2C["Convert to Assignment"]
    end

    subgraph P3["P3: Location Tracking"]
        P3A["Receive GPS Ping"]
        P3B["Apply Visibility Rules"]
        P3C["Broadcast to Rooms"]
    end

    subgraph P4["P4: Route Matching"]
        P4A["Register Route"]
        P4B["Query Nearby Drivers"]
    end

    subgraph DS["Data Stores"]
        D1[(Orders)]
        D2[(Bids)]
        D3[(Assignments)]
        D4[(Location Logs)]
        D5[(Driver Routes)]
    end

    P1A --> D1
    P1B --> D1
    P1C --> D3
    P2A --> D2
    P2B --> D2
    P2C --> D3
    P3A --> D4
    P4A --> D5
    P4B --> D5
```

### 2.4 Component Diagram

```mermaid
graph TB
    subgraph Presentation["Presentation Layer"]
        UI["React Views (5 dashboards)"]
        MAP["MapLibre GL Map (react-map-gl)"]
        THEME["CSS Theme System"]
    end

    subgraph Communication["Communication Layer"]
        HTTP["HTTP Client (Axios/Fetch)"]
        GQLC["Apollo Client"]
        WSC["Socket.io Client"]
    end

    subgraph API["API Layer"]
        ROUTER["Express Router"]
        GQLS["Apollo Server"]
        WSS["Socket.io Server"]
    end

    subgraph Business["Business Logic Layer"]
        ASSIGN["Assignment Service"]
        MARKET["Marketplace Service"]
        LOCATE["Location Service"]
        ROUTE["Route Matching Service"]
        HIST["History Service"]
    end

    subgraph Middleware["Middleware Layer"]
        TENANT["Tenant Resolver"]
        VALID["Input Validator"]
        ERR["Error Handler"]
    end

    subgraph Persistence["Persistence Layer"]
        SEQ["Sequelize Models"]
        MYSQL[(MySQL)]
    end

    UI --> Communication --> API
    API --> Middleware --> Business --> Persistence
    Business --> WSS
```

---

## 3. Database Design

### 3.1 Entity Relationship Diagram

```mermaid
erDiagram
    COMPANY ||--o{ USER : employs
    COMPANY ||--o{ DRIVER : "has employed"
    COMPANY ||--o{ HUB : owns
    COMPANY ||--o{ ORDER : receives
    COMPANY ||--o{ VEHICLE : owns

    USER ||--o{ ORDER : "places (customer)"

    DRIVER ||--o{ DRIVER_ROUTE : "pre-registers"
    DRIVER ||--o{ BID : submits
    DRIVER ||--o{ ASSIGNMENT : "assigned to"
    DRIVER ||--o{ DRIVER_LOCATION_LOG : "streams GPS"
    DRIVER ||--o| VEHICLE : drives

    ORDER ||--o{ BID : "receives bids"
    ORDER ||--o| ASSIGNMENT : "fulfilled by"

    ASSIGNMENT ||--o{ ROUTE_STOP : contains
    ASSIGNMENT ||--o{ DELIVERY_EVENT : logs

    COMPANY {
        int id PK
        string name
        string address
        string plan_type
        datetime created_at
    }

    USER {
        int id PK
        int company_id FK
        string name
        string email
        string phone
        enum role "superadmin | admin | dispatcher | customer"
        datetime created_at
    }

    DRIVER {
        int id PK
        int user_id FK
        int company_id FK "null for independent"
        enum type "EMPLOYED | INDEPENDENT"
        enum status "AVAILABLE | BUSY | OFFLINE"
        enum verification_status "PENDING | VERIFIED | REJECTED"
        string license_number
        datetime created_at
    }

    DRIVER_ROUTE {
        int id PK
        int driver_id FK
        float start_lat
        float start_lng
        float end_lat
        float end_lng
        datetime departure_time
        boolean is_active
        datetime created_at
    }

    VEHICLE {
        int id PK
        int company_id FK
        int driver_id FK
        string plate_number
        enum type "BIKE | VAN | TRUCK"
        float capacity_kg
        enum status "ACTIVE | MAINTENANCE | RETIRED"
    }

    HUB {
        int id PK
        int company_id FK
        string name
        string address
        float lat
        float lng
    }

    ORDER {
        int id PK
        int company_id FK
        int customer_id FK
        string tracking_code
        enum status "UNASSIGNED | LISTED | ASSIGNED | PICKED_UP | EN_ROUTE | DELIVERED | CANCELLED"
        float listed_price
        float weight_kg
        float pickup_lat
        float pickup_lng
        string pickup_address
        float delivery_lat
        float delivery_lng
        string delivery_address
        enum priority "LOW | NORMAL | HIGH | URGENT"
        string notes
        datetime created_at
    }

    BID {
        int id PK
        int order_id FK
        int driver_id FK
        float offered_price
        enum status "PENDING | ACCEPTED | REJECTED | EXPIRED"
        string message
        datetime created_at
    }

    ASSIGNMENT {
        int id PK
        int order_id FK
        int driver_id FK
        int vehicle_id FK
        int assigned_by FK
        enum source "DIRECT | BID"
        datetime estimated_arrival
        datetime created_at
    }

    ROUTE_STOP {
        int id PK
        int assignment_id FK
        int order_id FK
        int sequence_number
        float lat
        float lng
        enum status "PENDING | ARRIVED | COMPLETED | SKIPPED"
    }

    DRIVER_LOCATION_LOG {
        int id PK
        int driver_id FK
        float lat
        float lng
        float speed
        float heading
        datetime recorded_at
    }

    DELIVERY_EVENT {
        int id PK
        int assignment_id FK
        enum event_type "ASSIGNED | PICKED_UP | EN_ROUTE | DELIVERED | FAILED | RETURNED"
        datetime timestamp
        string notes
        string photo_url
    }
```

### 3.2 Indexing Strategy

| Table | Index | Type | Purpose |
|---|---|---|---|
| `orders` | `company_id, status` | Composite | Fast filtered queries per tenant |
| `orders` | `tracking_code` | Unique | Customer tracking lookup |
| `bids` | `order_id, status` | Composite | Fetch pending bids for an order |
| `driver_location_logs` | `driver_id, recorded_at` | Composite | Time-series GPS queries |
| `driver_routes` | `is_active, departure_time` | Composite | Active route matching |
| `assignments` | `driver_id, created_at` | Composite | Driver assignment history |
| `delivery_events` | `assignment_id` | Foreign Key | Audit trail lookup |

### 3.3 Partitioning Strategy (Future)

| Table | Strategy | Reason |
|---|---|---|
| `driver_location_logs` | Time-based partitioning (monthly) | High write volume, old data rarely queried |
| `delivery_events` | Time-based partitioning (quarterly) | Audit log grows indefinitely |
| `orders` | None (CE-01) | Moderate volume, needs full query flexibility |

---

## 4. Low-Level Design (LLD)

### 4.1 Class Diagram

```mermaid
classDiagram
    class AssignmentService {
        -sequelize: Sequelize
        +assignOrder(orderId, driverId, vehicleId, dispatcherId): Assignment
        +cancelAssignment(assignmentId): void
        -validateOrderAvailability(orderId, transaction): Order
        -validateDriverAvailability(driverId, transaction): Driver
        -createAssignmentRecord(data, transaction): Assignment
        -emitAssignmentEvent(assignment): void
    }

    class MarketplaceService {
        -sequelize: Sequelize
        +listOrder(orderId, price): Order
        +unlistOrder(orderId): Order
        +placeBid(orderId, driverId, offeredPrice): Bid
        +acceptBid(bidId): Assignment
        +rejectBid(bidId): Bid
        -rejectRemainingBids(orderId, acceptedBidId, transaction): void
        -convertBidToAssignment(bid, transaction): Assignment
        -emitBidEvent(bid, eventType): void
    }

    class LocationService {
        -io: SocketServer
        +recordPing(driverId, lat, lng, speed, heading): LocationLog
        +getLatestLocation(driverId): LocationLog
        +broadcastLocation(driverId, location): void
        -shouldBroadcast(driver): boolean
        -getTargetRooms(driver): string[]
    }

    class RouteMatchingService {
        +registerRoute(driverId, startLat, startLng, endLat, endLng, departureTime): DriverRoute
        +deactivateRoute(routeId): void
        +findDriversNearPath(pickupLat, pickupLng, deliveryLat, deliveryLng, radiusKm): Driver[]
        -calculateDistance(lat1, lng1, lat2, lng2): float
        -isAlongRoute(route, targetLat, targetLng, radiusKm): boolean
    }

    class HistoryService {
        +getDispatcherHistory(companyId, filters): HistoryRecord[]
        +getDriverHistory(driverId, filters): HistoryRecord[]
        -projectFields(records, role): HistoryRecord[]
        -applyDateFilters(query, dateRange): query
    }

    class TenantMiddleware {
        +resolve(req, res, next): void
        -extractCompanyId(req): int
        -validateTenantAccess(userId, companyId): boolean
    }

    class DispatchSocket {
        -io: SocketServer
        +initialize(server): void
        +handleConnection(socket): void
        +joinRoom(socket, roomName): void
        +emitToRoom(roomName, event, data): void
        -authenticateSocket(socket): User
        -resolveRooms(user): string[]
    }

    AssignmentService --> DispatchSocket : emits events
    MarketplaceService --> DispatchSocket : emits events
    LocationService --> DispatchSocket : broadcasts GPS
    HistoryService --> TenantMiddleware : scoped queries
    AssignmentService --> TenantMiddleware : scoped queries
    MarketplaceService --> TenantMiddleware : scoped queries
```

### 4.2 Error Handling Strategy

| Error Type | HTTP Code | Handling |
|---|---|---|
| Validation Error | 400 | Return field-specific error messages |
| Tenant Access Denied | 403 | Log attempt, return generic "Forbidden" |
| Resource Not Found | 404 | Return entity type and ID |
| Concurrency Conflict | 409 | Return "Order already assigned" message |
| Lock Timeout | 408 | Retry once, then return "Try again" |
| Internal Server Error | 500 | Log full stack trace, return generic message |

### 4.3 Input Validation Rules

| Entity | Field | Rules |
|---|---|---|
| Order | `pickup_lat/lng` | Required, valid coordinate range (-90 to 90, -180 to 180) |
| Order | `listed_price` | Required if listing, positive number, max 2 decimal places |
| Bid | `offered_price` | Required, positive, must differ from listed_price |
| GPS Ping | `lat/lng` | Required, valid coordinates |
| GPS Ping | `speed` | Optional, non-negative |
| DriverRoute | `departure_time` | Required, must be in the future |

---

## 5. UML Diagrams

### 5.1 Use Case Diagram

```mermaid
graph TB
    subgraph System["dispatchCore System"]
        UC1["Create Order"]
        UC2["Assign to Employed Driver"]
        UC3["List on Marketplace"]
        UC4["Place Bid"]
        UC5["Accept/Reject Bid"]
        UC6["Update Delivery Status"]
        UC7["Stream GPS Location"]
        UC8["Track Delivery Live"]
        UC9["Register Travel Route"]
        UC10["View Live Map"]
        UC11["Manage Companies"]
        UC12["Verify Independent Driver"]
        UC13["View Analytics"]
        UC14["View Delivery History"]
    end

    SuperAdmin(("SuperAdmin"))
    Admin(("Admin"))
    Dispatcher(("Dispatcher"))
    EmployedDriver(("Employed Driver"))
    IndependentDriver(("Independent Driver"))
    Customer(("Customer"))

    SuperAdmin --> UC11
    SuperAdmin --> UC13
    Admin --> UC12
    Admin --> UC13
    Dispatcher --> UC1
    Dispatcher --> UC2
    Dispatcher --> UC3
    Dispatcher --> UC5
    Dispatcher --> UC10
    Dispatcher --> UC13
    Dispatcher --> UC14
    EmployedDriver --> UC6
    EmployedDriver --> UC7
    EmployedDriver --> UC14
    IndependentDriver --> UC4
    IndependentDriver --> UC6
    IndependentDriver --> UC7
    IndependentDriver --> UC9
    IndependentDriver --> UC14
    Customer --> UC8
```

### 5.2 Sequence Diagram — Direct Assignment

```mermaid
sequenceDiagram
    actor D as Dispatcher
    participant API as REST API
    participant MW as Tenant Middleware
    participant AS as Assignment Service
    participant DB as MySQL
    participant WS as Socket.io

    D->>API: POST /api/orders/:id/assign {driverId, vehicleId}
    API->>MW: Validate tenant scope
    MW->>AS: assignOrder(orderId, driverId, vehicleId)
    AS->>DB: BEGIN TRANSACTION (SERIALIZABLE)
    AS->>DB: SELECT * FROM orders WHERE id=:id FOR UPDATE
    DB-->>AS: Order (status: UNASSIGNED)
    AS->>DB: SELECT * FROM drivers WHERE id=:driverId FOR UPDATE
    DB-->>AS: Driver (status: AVAILABLE)
    AS->>DB: UPDATE orders SET status='ASSIGNED'
    AS->>DB: UPDATE drivers SET status='BUSY'
    AS->>DB: INSERT INTO assignments
    AS->>DB: INSERT INTO delivery_events (ASSIGNED)
    AS->>DB: COMMIT
    AS->>WS: Emit "assignment:created" to company room
    AS->>WS: Emit "assignment:new" to driver:{driverId}
    WS-->>D: Assignment confirmed (live update)
    AS-->>API: Assignment object
    API-->>D: 201 Created
```

### 5.3 Sequence Diagram — Marketplace Bidding

```mermaid
sequenceDiagram
    actor Disp as Dispatcher
    actor ID1 as Independent Driver A
    actor ID2 as Independent Driver B
    participant API as REST API
    participant MS as Marketplace Service
    participant DB as MySQL
    participant WS as Socket.io

    Disp->>API: PUT /api/orders/55/list {price: 15}
    API->>MS: listOrder(55, 15)
    MS->>DB: UPDATE orders SET status='LISTED', listed_price=15
    MS->>WS: Emit "order:listed" to marketplace room
    WS-->>ID1: New listing available
    WS-->>ID2: New listing available

    ID1->>API: POST /api/orders/55/bid {price: 12}
    API->>MS: placeBid(55, driverA, 12)
    MS->>DB: INSERT INTO bids
    MS->>WS: Emit "bid:new"
    WS-->>Disp: New bid: $12 from Driver A

    ID2->>API: POST /api/orders/55/bid {price: 14}
    API->>MS: placeBid(55, driverB, 14)
    MS->>DB: INSERT INTO bids
    MS->>WS: Emit "bid:new"
    WS-->>Disp: New bid: $14 from Driver B

    Disp->>API: PUT /api/bids/1/accept
    API->>MS: acceptBid(1)
    MS->>DB: BEGIN TRANSACTION
    MS->>DB: UPDATE bid SET status='ACCEPTED'
    MS->>DB: UPDATE remaining bids SET status='REJECTED'
    MS->>DB: UPDATE order SET status='ASSIGNED'
    MS->>DB: INSERT INTO assignments (source: BID)
    MS->>DB: COMMIT
    MS->>WS: Emit "bid:accepted" + "assignment:created"
    WS-->>ID1: Bid accepted
    WS-->>ID2: Bid rejected
    WS-->>Disp: Assignment confirmed
```

### 5.4 Sequence Diagram — GPS Location Broadcasting

```mermaid
sequenceDiagram
    actor DR as Driver
    participant WSC as Socket.io Client
    participant WSS as Socket.io Server
    participant LS as Location Service
    participant DB as MySQL

    loop Every 3 seconds
        DR->>WSC: Browser Geolocation API
        WSC->>WSS: Emit "location:update" {lat, lng, speed}
        WSS->>LS: recordPing(driverId, lat, lng, speed)
        LS->>DB: INSERT INTO driver_location_logs
        LS->>LS: shouldBroadcast(driver)?

        alt Employed Driver (always broadcast)
            LS->>WSS: Emit to "company:{id}:dispatchers"
        else Independent Driver with active assignment
            LS->>WSS: Emit to "company:{id}:dispatchers"
            LS->>WSS: Emit to "order:{id}:tracking"
        else Independent Driver without assignment
            Note right of LS: Do NOT broadcast
        end
    end
```

### 5.5 Activity Diagram — Order Lifecycle

```mermaid
flowchart TD
    A["Order Created"] --> B{"Dispatcher Decision"}
    B -->|"Assign Directly"| C["Select Employed Driver"]
    B -->|"List on Marketplace"| D["Set Listed Price"]

    C --> E{"Driver Available?"}
    E -->|"Yes"| F["Lock Order (SERIALIZABLE)"]
    E -->|"No"| C

    F --> G{"Lock Acquired?"}
    G -->|"Yes"| H["Create Assignment"]
    G -->|"No (Race Condition)"| I["Return 409 Conflict"]

    D --> J["Order Status: LISTED"]
    J --> K["Independent Drivers Browse"]
    K --> L["Driver Places Bid"]
    L --> M["Dispatcher Reviews Bids"]
    M -->|"Accept"| N["Convert Bid to Assignment"]
    M -->|"Reject"| L

    H --> O["Order Status: ASSIGNED"]
    N --> O

    O --> P["Driver: PICKED_UP"]
    P --> Q["Driver: EN_ROUTE"]
    Q --> R["Driver: DELIVERED"]
    R --> S["Log Delivery Event"]
    S --> T["End"]

    B -->|"Cancel"| U["Order Status: CANCELLED"]
    U --> T
```

### 5.6 State Diagram — Order Status

```mermaid
stateDiagram-v2
    [*] --> UNASSIGNED: Order Created

    UNASSIGNED --> ASSIGNED: Direct assignment (employed driver)
    UNASSIGNED --> LISTED: Listed on marketplace
    UNASSIGNED --> CANCELLED: Dispatcher cancels

    LISTED --> ASSIGNED: Bid accepted
    LISTED --> UNASSIGNED: Unlisted by dispatcher
    LISTED --> CANCELLED: Dispatcher cancels

    ASSIGNED --> PICKED_UP: Driver confirms pickup
    ASSIGNED --> CANCELLED: Assignment cancelled

    PICKED_UP --> EN_ROUTE: Driver begins transit
    EN_ROUTE --> DELIVERED: Driver confirms delivery

    DELIVERED --> [*]
    CANCELLED --> [*]
```

### 5.7 State Diagram — Driver Status

```mermaid
stateDiagram-v2
    [*] --> OFFLINE: Account created

    OFFLINE --> AVAILABLE: Driver goes online
    AVAILABLE --> BUSY: Assignment received
    BUSY --> AVAILABLE: Delivery completed
    AVAILABLE --> OFFLINE: Driver goes offline
    BUSY --> OFFLINE: Driver goes offline (emergency)
```

---

## 6. API Design

### 6.1 REST Endpoints

#### Companies
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/companies` | Register a new company | SuperAdmin |
| GET | `/api/companies` | List all companies | SuperAdmin |
| GET | `/api/companies/:id` | Get company details | Admin |
| PUT | `/api/companies/:id` | Update company settings | Admin |

#### Orders
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/orders` | Create a new order | Dispatcher |
| GET | `/api/orders` | List orders (scoped by company) | Dispatcher |
| GET | `/api/orders/:id` | Get order details | Dispatcher |
| PUT | `/api/orders/:id/list` | List order on marketplace | Dispatcher |
| PUT | `/api/orders/:id/unlist` | Remove from marketplace | Dispatcher |
| POST | `/api/orders/:id/assign` | Direct assign to employed driver | Dispatcher |
| GET | `/api/orders/:id/bids` | Get all bids for an order | Dispatcher |

#### Bids
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/orders/:id/bid` | Place a bid | Independent Driver |
| PUT | `/api/bids/:id/accept` | Accept a bid | Dispatcher |
| PUT | `/api/bids/:id/reject` | Reject a bid | Dispatcher |

#### Drivers
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/drivers` | List drivers (company-scoped) | Dispatcher |
| GET | `/api/drivers/:id` | Driver profile details | Dispatcher / Driver |
| PUT | `/api/drivers/:id/verify` | Approve independent driver | Admin |
| POST | `/api/drivers/routes` | Pre-register a travel route | Independent Driver |
| GET | `/api/drivers/routes/nearby` | Find drivers near a path | Dispatcher |

#### Location & Tracking
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/location/ping` | Submit GPS coordinates | Driver |
| GET | `/api/track/:trackingCode` | Public tracking data | None (public) |

#### Delivery History
| Method | Endpoint | Description | Auth |
|---|---|---|
| GET | `/api/history` | Get delivery history (role-scoped projection) | Dispatcher / Driver |
| GET | `/api/history/:assignmentId` | Get single delivery details (role-scoped) | Dispatcher / Driver |

### 6.2 GraphQL Schema

```graphql
type Query {
  # Dispatcher Dashboard (uses DataLoader)
  dispatcherDashboard(companyId: ID!): DashboardData!
  
  # Marketplace
  marketplaceListings(filters: ListingFilters): [Order!]!
  orderBids(orderId: ID!): [Bid!]!
  
  # Route Matching
  availableRouteDrivers(pickupLat: Float!, pickupLng: Float!, deliveryLat: Float!, deliveryLng: Float!, radiusKm: Float): [Driver!]!
  
  # Analytics
  companyAnalytics(companyId: ID!, dateRange: DateRange): Analytics!
  driverLeaderboard(companyId: ID!, limit: Int): [DriverStats!]!
  
  # Delivery History (role-scoped)
  deliveryHistory(filters: HistoryFilters): [HistoryRecord!]!
}

type DashboardData {
  activeDrivers: [Driver!]!
  pendingOrders: [Order!]!
  activeAssignments: [Assignment!]!
  stats: DashboardStats!
}

type DashboardStats {
  totalDeliveriesToday: Int!
  avgDeliveryTime: Float!
  successRate: Float!
  activeDriverCount: Int!
}
```

### 6.3 Delivery History — Role-Based Field Projection

The same `deliveryHistory` endpoint returns different fields based on the caller's role:

| Field | Dispatcher | Employed Driver | Independent Driver |
|---|---|---|---|
| Order ID | Yes | Yes | Yes |
| Tracking Code | Yes | Yes | Yes |
| Pickup Address | Yes | Yes | Yes |
| Delivery Address | Yes | Yes | Yes |
| Customer Name | Yes | No | No |
| Customer Phone | Yes | No | No |
| Listed Price | Yes | No | Yes (their earnings) |
| Accepted Bid Price | Yes | No | Yes |
| Driver Name | Yes | N/A (own record) | N/A (own record) |
| Vehicle Info | Yes | Yes | No |
| All Delivery Events | Yes | Yes (own) | Yes (own) |
| Timestamps (created, delivered) | Yes | Yes | Yes |
| Priority | Yes | No | No |
| Notes | Yes | No | No |

### 6.4 WebSocket Events

| Event | Direction | Room | Payload |
|---|---|---|---|
| `location:update` | Client → Server | — | `{lat, lng, speed, heading}` |
| `driver:location` | Server → Client | `company:{id}:dispatchers` | `{driverId, lat, lng, speed}` |
| `order:listed` | Server → Client | `company:{id}:marketplace` | `{orderId, price, pickup, delivery}` |
| `bid:new` | Server → Client | `company:{id}:marketplace` | `{bidId, orderId, driverId, price}` |
| `bid:accepted` | Server → Client | `driver:{id}` | `{bidId, orderId, assignment}` |
| `bid:rejected` | Server → Client | `driver:{id}` | `{bidId, orderId}` |
| `assignment:created` | Server → Client | `company:{id}:dispatchers` | `{assignmentId, orderId, driverId}` |
| `assignment:new` | Server → Client | `driver:{id}` | `{assignment, order details}` |
| `order:status` | Server → Client | `order:{id}:tracking` | `{orderId, status, timestamp}` |
| `driver:tracking` | Server → Client | `order:{id}:tracking` | `{lat, lng, estimatedArrival}` |

---

## 7. Scalability, Performance & Security

### 7.1 Caching Strategy (CE-02)

| Data | Cache | TTL | Invalidation |
|---|---|---|---|
| Company settings | Redis | 1 hour | On update |
| Driver latest location | Redis | 10 seconds | On every GPS ping |
| Marketplace listings | Redis | 30 seconds | On list/unlist/accept |
| GraphQL dashboard | Application-level (DataLoader) | Per-request | Automatic |

### 7.2 Security Measures

| Layer | Measure | Implementation |
|---|---|---|
| Transport | HTTPS/TLS | SSL certificates |
| Authentication | JWT tokens (CE-02) | Role-encoded, company-scoped |
| Authorization | Tenant middleware | Every request verified against company_id |
| Input | Validation & sanitization | Express-validator on all endpoints |
| Database | Parameterized queries | Sequelize ORM (prevents SQL injection) |
| Rate Limiting | Per-IP and per-user limits | Express-rate-limit |
| WebSocket | Token-based handshake | Verify identity on connection |

### 7.3 Performance Optimizations

| Optimization | Where | Impact |
|---|---|---|
| DataLoader batching | GraphQL resolvers | Eliminates N+1 queries |
| GPS ping debouncing | Client-side | Reduces write volume by 60% |
| Composite indexes | MySQL | Sub-10ms query times on filtered lookups |
| Connection pooling | Sequelize | Reuse DB connections under load |
| WebSocket rooms | Socket.io | Only send data to relevant clients |

---

## 8. Deployment & Maintenance

### 8.1 Deployment Architecture (CE-02)

```mermaid
graph LR
    subgraph Client
        B["Browser"]
    end

    subgraph Vercel["Vercel (Frontend)"]
        CDN["Edge CDN"]
        REACT["React Build (Static)"]
    end

    subgraph Render["Render (Backend)"]
        APP["Node.js Web Service"]
        WSS["WebSocket (Socket.io)"]
    end

    subgraph Database
        MY["MySQL (Render / PlanetScale)"]
        RD["Redis (CE-02)"]
    end

    B --> CDN --> REACT
    REACT -->|"API calls"| APP
    REACT -->|"WebSocket"| WSS
    APP --> MY
    APP --> RD
```

### 8.2 Monitoring & Logging

| Tool | Purpose | Phase |
|---|---|---|
| Morgan | HTTP request logging | CE-01 |
| Winston | Structured application logging | CE-01 |
| Prometheus + Grafana | Metrics dashboard | CE-02 |
| Sentry | Error tracking | CE-02 |

### 8.3 CI/CD Pipeline (CE-02)

```mermaid
graph LR
    A["Git Push"] --> B["GitHub Actions"]
    B --> C["Lint + Type Check"]
    C --> D["Unit Tests"]
    D --> E["Integration Tests"]
    E --> F["Build"]
    F --> G["Deploy to Staging"]
    G --> H["Smoke Tests"]
    H --> I["Deploy to Production"]
```

---

## Technology Stack Summary

| Component | Technology | Purpose |
|---|---|---|
| Frontend | React + Vite | UI layer |
| Styling | CSS Custom Properties | Theme system (light/dark) |
| Maps | MapLibre GL JS + react-map-gl | WebGL-powered real-time fleet tracking |
| Tiles | MapTiler (free tier) / OpenFreeMap | Vector tile hosting |
| Backend | Node.js + Express | API and business logic |
| GraphQL | Apollo Server | Complex analytics queries |
| WebSockets | Socket.io | Real-time bidirectional events |
| ORM | Sequelize | Database abstraction and migrations |
| Database | MySQL | Relational data with ACID transactions |
| Cache | Redis (CE-02) | Session and location caching |
| Frontend Deploy | Vercel | Edge CDN, instant deploys, free tier |
| Backend Deploy | Render | WebSocket support, managed services, free tier |
