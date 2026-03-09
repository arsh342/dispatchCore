/* ─── Marketplace & Bidding Types ─── */

export type OrderPriority = "low" | "medium" | "high" | "urgent";
export type OrderStatus =
  | "UNASSIGNED"
  | "LISTED"
  | "ASSIGNED"
  | "PICKED_UP"
  | "EN_ROUTE"
  | "DELIVERED"
  | "CANCELLED";
export type BidStatus = "pending" | "accepted" | "rejected" | "expired";

/** An order that a dispatcher can list on the marketplace */
export interface MarketplaceOrder {
  id: string;
  trackingCode: string;
  pickupAddress: string;
  deliveryAddress: string;
  listedPrice: number;
  weight: number; // kg
  distance: number; // km
  priority: OrderPriority;
  status: OrderStatus;
  postedAt: string; // ISO
  bidsCount: number;
  customerName?: string;
  notes?: string;
  _backendId: number;
}

/** A bid from an independent driver */
export interface Bid {
  id: string;
  orderId: string;
  driverName: string;
  driverAvatar?: string;
  driverRating: number; // 0-5
  driverDeliveries: number; // total completed
  offeredPrice: number;
  listedPrice: number;
  message?: string;
  status: BidStatus;
  timestamp: string; // relative e.g. "2 min ago"
  createdAt: string; // ISO
  _backendId: number;
}

export interface MarketplaceStats {
  totalListed: number;
  activeBids: number;
  acceptedToday: number;
  avgBidPrice: number;
}

export type MarketplaceSortBy =
  | "distance"
  | "price"
  | "weight"
  | "bids"
  | "priority"
  | "newest";
