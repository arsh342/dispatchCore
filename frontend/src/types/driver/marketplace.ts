/* ─── Driver Marketplace Types ─── */

export type OrderPriority = "low" | "medium" | "high" | "urgent";

/** A marketplace listing visible to independent drivers */
export interface DriverMarketplaceListing {
  id: string;
  trackingCode: string;
  pickupAddress: string;
  deliveryAddress: string;
  listedPrice: number;
  weight: number; // kg
  distance: number; // km
  priority: OrderPriority;
  postedAt: string; // ISO
  bidsCount: number;
  companyName: string;
}

/** A bid placed by this driver */
export interface DriverBid {
  id: string;
  orderId: string;
  offeredPrice: number;
  listedPrice: number;
  status: "pending" | "accepted" | "rejected" | "expired";
  message?: string;
  createdAt: string;
  /** Populated after acceptance */
  pickupAddress?: string;
  deliveryAddress?: string;
}

export interface DriverMarketplaceStats {
  availableOrders: number;
  myActiveBids: number;
  acceptedToday: number;
  earnings: number;
}

export type DriverSortBy = "distance" | "price" | "weight" | "priority" | "newest";
