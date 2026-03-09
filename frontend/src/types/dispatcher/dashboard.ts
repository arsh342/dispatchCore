/* ─── Dashboard Data Types ─── */

export type ShipmentStatus =
  | "Pending"
  | "Shipping"
  | "Delivered"
  | "In Transit"
  | "Cancelled";

export interface Shipment {
  id: string;
  category: string;
  categoryEmoji: string;
  courier: string;
  courierIcon: string;
  origin: string;
  destination: string;
  distance: string;
  weight: string;
  payment: string;
  date: string;
  status: ShipmentStatus;
  image?: string;
  driver?: string;
  trackingProgress?: number; // 0-100
  estimatedDelivery?: string;
  // Coordinates for map
  pickupLat?: number;
  pickupLng?: number;
  deliveryLat?: number;
  deliveryLng?: number;
  // Internal fields from transform
  _backendId?: number;
  _backendStatus?: string;
  _assignedDriverId?: number;
  _assignedDriverName?: string;
}

export interface DashboardStats {
  totalShipments: number;
  pickupPackages: number;
  pendingPackages: number;
  deliveredPackages: number;
}

export interface ShipmentDetail {
  shipment: Shipment;
  driver: {
    name: string;
    avatar?: string;
    phone?: string;
  };
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  label: string;
  time: string;
  completed: boolean;
  active: boolean;
}

export interface DashboardUser {
  name: string;
  location: string;
  avatar?: string;
  initials: string;
  newDeliveries: number;
}

export interface DashboardFilters {
  search: string;
  status?: ShipmentStatus;
  courier?: string;
  dateRange?: { from: string; to: string };
}
