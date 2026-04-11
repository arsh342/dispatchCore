/* ─── Driver Dashboard Types ─── */

export interface DriverStats {
  todayEarnings: number;
  weekEarnings: number;
  activeDeliveries: number;
  completedToday: number;
  completedTotal: number;
  pendingBids: number;
  rating: number;
}

export interface DriverUser {
  name: string;
  location: string;
  initials: string;
  vehicleType: string;
  vehiclePlate: string;
  status: "online" | "offline" | "busy";
}

export type ActiveDeliveryStatus =
  | "ASSIGNED"
  | "PICKED_UP"
  | "EN_ROUTE"
  | "ARRIVING"
  | "DELIVERED";

export interface ActiveDelivery {
  id: string;
  trackingCode: string;
  pickupAddress: string;
  deliveryAddress: string;
  customerName: string;
  status: ActiveDeliveryStatus;
  payment: string;
  distance: string;
  weight: string;
  estimatedTime: string;
  progress: number; // 0-100
  dispatcherCompany: string;
}

export interface RecentBid {
  id: string;
  orderId: string;
  offeredPrice: number;
  listedPrice: number;
  status: "pending" | "accepted" | "rejected";
  timeAgo: string;
  pickupShort: string;
  deliveryShort: string;
}

export interface EarningsChart {
  day: string;
  amount: number;
}
