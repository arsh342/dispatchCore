/**
 * Application Constants
 *
 * Single source of truth for all enums and magic values used across
 * the application. Avoids string literals scattered through the codebase.
 */

const ROLES = Object.freeze({
  SUPERADMIN: 'superadmin',
  DISPATCHER: 'dispatcher',
  CUSTOMER: 'customer',
});

const DRIVER_TYPE = Object.freeze({
  EMPLOYED: 'EMPLOYED',
  INDEPENDENT: 'INDEPENDENT',
});

const DRIVER_STATUS = Object.freeze({
  AVAILABLE: 'AVAILABLE',
  BUSY: 'BUSY',
  OFFLINE: 'OFFLINE',
});

const VERIFICATION_STATUS = Object.freeze({
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
});

const ORDER_STATUS = Object.freeze({
  UNASSIGNED: 'UNASSIGNED',
  LISTED: 'LISTED',
  ASSIGNED: 'ASSIGNED',
  PICKED_UP: 'PICKED_UP',
  EN_ROUTE: 'EN_ROUTE',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
});

const BID_STATUS = Object.freeze({
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
});

const PRIORITY = Object.freeze({
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
});

const VEHICLE_TYPE = Object.freeze({
  BIKE: 'BIKE',
  VAN: 'VAN',
  TRUCK: 'TRUCK',
});

const VEHICLE_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  MAINTENANCE: 'MAINTENANCE',
  RETIRED: 'RETIRED',
});

const ASSIGNMENT_SOURCE = Object.freeze({
  DIRECT: 'DIRECT',
  BID: 'BID',
});

const EVENT_TYPE = Object.freeze({
  ASSIGNED: 'ASSIGNED',
  PICKED_UP: 'PICKED_UP',
  EN_ROUTE: 'EN_ROUTE',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  RETURNED: 'RETURNED',
});

const ROUTE_STOP_STATUS = Object.freeze({
  PENDING: 'PENDING',
  ARRIVED: 'ARRIVED',
  COMPLETED: 'COMPLETED',
  SKIPPED: 'SKIPPED',
});

const PLAN_TYPE = Object.freeze({
  STARTER: 'STARTER',
  GROWTH: 'GROWTH',
  ENTERPRISE: 'ENTERPRISE',
});

module.exports = {
  ROLES,
  DRIVER_TYPE,
  DRIVER_STATUS,
  VERIFICATION_STATUS,
  ORDER_STATUS,
  BID_STATUS,
  PRIORITY,
  VEHICLE_TYPE,
  VEHICLE_STATUS,
  ASSIGNMENT_SOURCE,
  EVENT_TYPE,
  ROUTE_STOP_STATUS,
  PLAN_TYPE,
};
