/**
 * GraphQL Type Definitions
 *
 * Schema for the dispatchCore GraphQL API.
 * Covers dashboard, marketplace, history, and analytics queries.
 */

const { gql } = require('apollo-server-express');

const typeDefs = gql`
  # ── Scalars & Enums ──

  enum OrderStatus {
    UNASSIGNED
    LISTED
    ASSIGNED
    PICKED_UP
    EN_ROUTE
    DELIVERED
    CANCELLED
  }

  enum DriverStatus {
    AVAILABLE
    BUSY
    OFFLINE
  }

  enum DriverType {
    EMPLOYED
    INDEPENDENT
  }

  enum BidStatus {
    PENDING
    ACCEPTED
    REJECTED
    EXPIRED
  }

  enum Priority {
    LOW
    NORMAL
    HIGH
    URGENT
  }

  enum VehicleType {
    BIKE
    VAN
    TRUCK
  }

  enum AssignmentSource {
    DIRECT
    BID
  }

  # ── Types ──

  type Company {
    id: ID!
    name: String!
    address: String
    planType: String
    users: [User!]
    drivers: [Driver!]
    orders: [Order!]
  }

  type User {
    id: ID!
    name: String!
    email: String!
    phone: String
    role: String!
    companyId: ID
  }

  type Driver {
    id: ID!
    user: User!
    type: DriverType!
    status: DriverStatus!
    verificationStatus: String!
    licenseNumber: String
    companyId: ID
    vehicle: Vehicle
    activeOrders: [Order!]
  }

  type Vehicle {
    id: ID!
    plateNumber: String!
    type: VehicleType!
    capacityKg: Float!
    status: String!
  }

  type Order {
    id: ID!
    trackingCode: String!
    status: OrderStatus!
    listedPrice: Float
    weightKg: Float
    pickupAddress: String
    deliveryAddress: String
    pickupLat: Float!
    pickupLng: Float!
    deliveryLat: Float!
    deliveryLng: Float!
    priority: Priority!
    notes: String
    customer: User
    assignment: Assignment
    bids: [Bid!]
    createdAt: String!
  }

  type Bid {
    id: ID!
    orderId: ID!
    driverId: ID!
    offeredPrice: Float!
    status: BidStatus!
    message: String
    driver: Driver
    createdAt: String!
  }

  type Assignment {
    id: ID!
    orderId: ID!
    driverId: ID!
    vehicleId: ID
    source: AssignmentSource!
    estimatedArrival: String
    driver: Driver
    vehicle: Vehicle
    events: [DeliveryEvent!]
    createdAt: String!
  }

  type DeliveryEvent {
    id: ID!
    eventType: String!
    timestamp: String!
    notes: String
    photoUrl: String
  }

  type Hub {
    id: ID!
    name: String!
    address: String
    lat: Float!
    lng: Float!
  }

  # ── Dashboard Types ──

  type DashboardData {
    ordersByStatus: OrderStatusCounts!
    activeDrivers: [Driver!]!
    recentAssignments: [Assignment!]!
    pendingBids: [Bid!]!
  }

  type OrderStatusCounts {
    unassigned: Int!
    listed: Int!
    assigned: Int!
    pickedUp: Int!
    enRoute: Int!
    delivered: Int!
    cancelled: Int!
  }

  # ── Pagination ──

  type PaginatedOrders {
    records: [Order!]!
    total: Int!
    page: Int!
    totalPages: Int!
  }

  type PaginatedAssignments {
    records: [Assignment!]!
    total: Int!
    page: Int!
    totalPages: Int!
  }

  # ── Analytics ──

  type AnalyticsSummary {
    totalOrders: Int!
    deliveredOrders: Int!
    cancelledOrders: Int!
    averageDeliveryTime: Float
    activeDrivers: Int!
    totalBids: Int!
  }

  # ── Queries ──

  type Query {
    # Dashboard (uses DataLoader for N+1 prevention)
    dispatcherDashboard(companyId: ID!): DashboardData!

    # Orders
    orders(companyId: ID!, status: OrderStatus, page: Int, limit: Int): PaginatedOrders!
    order(id: ID!): Order

    # Marketplace
    listedOrders(companyId: ID!): [Order!]!

    # Drivers
    drivers(companyId: ID!, status: DriverStatus, type: DriverType): [Driver!]!
    driver(id: ID!): Driver

    # History
    deliveryHistory(companyId: ID!, page: Int, limit: Int): PaginatedAssignments!
    deliveryDetail(assignmentId: ID!): Assignment

    # Hubs
    hubs(companyId: ID!): [Hub!]!

    # Analytics
    analytics(companyId: ID!): AnalyticsSummary!
  }

  # ── Mutations ──

  type Mutation {
    # Orders
    createOrder(
      companyId: ID!
      pickupLat: Float!
      pickupLng: Float!
      pickupAddress: String
      deliveryLat: Float!
      deliveryLng: Float!
      deliveryAddress: String
      priority: Priority
      weightKg: Float
      notes: String
    ): Order!

    # Marketplace
    listOrder(orderId: ID!, price: Float!): Order!
    unlistOrder(orderId: ID!): Order!

    # Assignment
    assignOrder(orderId: ID!, driverId: ID!, vehicleId: ID): Assignment!

    # Bids
    placeBid(orderId: ID!, driverId: ID!, offeredPrice: Float!, message: String): Bid!
    acceptBid(bidId: ID!): Assignment!
    rejectBid(bidId: ID!): Bid!
  }
`;

module.exports = typeDefs;
