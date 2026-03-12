/**
 * Marketplace API Service — Dispatcher Perspective
 *
 * Connects to backend REST API. No mock data.
 */

import type {
  MarketplaceOrder,
  Bid,
  MarketplaceStats,
  MarketplaceSortBy,
} from "@/types/dispatcher/marketplace";
import { get, put } from "@/lib/api";

/* ─── Haversine distance (km) between two lat/lng points ─── */
function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Backend response shapes ──

interface BackendOrder {
  id: number;
  tracking_code: string;
  pickup_address: string | null;
  pickup_lat: string | null;
  pickup_lng: string | null;
  delivery_address: string | null;
  delivery_lat: string | null;
  delivery_lng: string | null;
  listed_price: string | null;
  weight_kg: string | null;
  priority: string;
  status: string;
  created_at: string;
  recipient_name?: string | null;
  bids?: Array<{ id: number }>;
}

interface BackendBid {
  id: number;
  order_id: number;
  driver_id: number;
  offered_price: string;
  status: string;
  message: string | null;
  created_at: string;
  driver?: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    type?: string;
  };
}

// ── Transforms ──

function orderToMarketplaceOrder(o: BackendOrder): MarketplaceOrder {
  let distance = 0;
  if (o.pickup_lat && o.pickup_lng && o.delivery_lat && o.delivery_lng) {
    distance = Math.round(
      haversineKm(
        parseFloat(o.pickup_lat), parseFloat(o.pickup_lng),
        parseFloat(o.delivery_lat), parseFloat(o.delivery_lng),
      ) * 10
    ) / 10;
  }
  return {
    id: `ORD-${o.id}`,
    trackingCode: o.tracking_code,
    pickupAddress: o.pickup_address ?? "—",
    deliveryAddress: o.delivery_address ?? "—",
    listedPrice: o.listed_price ? parseFloat(o.listed_price) : 0,
    weight: o.weight_kg ? parseFloat(o.weight_kg) : 0,
    distance,
    priority: o.priority.toLowerCase() as MarketplaceOrder["priority"],
    status: o.status as MarketplaceOrder["status"],
    postedAt: o.created_at,
    bidsCount: o.bids ? o.bids.length : 0,
    customerName: o.recipient_name ?? "Recipient",
    _backendId: o.id,
  };
}

function bidToFrontend(b: BackendBid, listedPrice: number): Bid {
  const now = Date.now();
  const created = b.created_at ? new Date(b.created_at).getTime() : NaN;
  let timestamp: string;
  if (isNaN(created)) {
    timestamp = "Just now";
  } else {
    const diffMin = Math.round((now - created) / 60000);
    timestamp =
      diffMin < 1 ? "Just now" : diffMin < 60 ? `${diffMin} min ago` : `${Math.round(diffMin / 60)} hr ago`;
  }

  return {
    id: `BID-${b.id}`,
    orderId: `ORD-${b.order_id}`,
    driverName: b.driver?.name ?? `Driver #${b.driver_id}`,
    driverRating: 4.5, // CE-03: Fetch from driver profile
    driverDeliveries: 0,
    offeredPrice: parseFloat(b.offered_price),
    listedPrice,
    status: b.status.toLowerCase() as Bid["status"],
    timestamp,
    createdAt: b.created_at,
    message: b.message ?? undefined,
    _backendId: b.id,
  };
}

// ── API Functions ──

/** Dispatcher: get orders that can be listed on marketplace */
export async function fetchUnassignedOrders(): Promise<MarketplaceOrder[]> {
  try {
    const orders = await get<BackendOrder[]>("/orders?status=UNASSIGNED");
    return orders.map(orderToMarketplaceOrder);
  } catch {
    return [];
  }
}

/** Dispatcher: get already-listed marketplace orders */
export async function fetchListedOrders(
  sortBy?: MarketplaceSortBy,
): Promise<MarketplaceOrder[]> {
  try {
    const orders = await get<BackendOrder[]>("/orders?status=LISTED");
    let results = orders.map(orderToMarketplaceOrder);

    if (sortBy === "price")
      results.sort((a, b) => b.listedPrice - a.listedPrice);
    else if (sortBy === "distance")
      results.sort((a, b) => a.distance - b.distance);
    else if (sortBy === "weight") results.sort((a, b) => b.weight - a.weight);
    else if (sortBy === "bids")
      results.sort((a, b) => b.bidsCount - a.bidsCount);

    return results;
  } catch {
    return [];
  }
}

/** Dispatcher: list an unassigned order on the marketplace */
export async function listOrderOnMarketplace(
  orderId: string,
  price: number,
): Promise<MarketplaceOrder> {
  // Extract backend ID: "ORD-123" → 123
  const backendId = orderId.replace("ORD-", "");
  const order = await put<BackendOrder>(`/orders/${backendId}/list`, {
    listed_price: price,
  });
  return orderToMarketplaceOrder(order);
}

/** Dispatcher: get all bids (optionally for a specific order) */
export async function fetchBids(orderId?: string): Promise<Bid[]> {
  try {
    if (orderId) {
      const backendId = orderId.replace("ORD-", "");
      // Get the order to know its listed price
      const order = await get<BackendOrder>(`/orders/${backendId}`);
      const listedPrice = order.listed_price
        ? parseFloat(order.listed_price)
        : 0;

      const bids = await get<BackendBid[]>(`/orders/${backendId}/bids`);
      return bids.map((b) => bidToFrontend(b, listedPrice));
    }

    // Get all listed orders, then aggregate bids
    const listed = await get<BackendOrder[]>("/orders?status=LISTED");
    const allBids: Bid[] = [];

    for (const order of listed) {
      const listedPrice = order.listed_price
        ? parseFloat(order.listed_price)
        : 0;
      try {
        const bids = await get<BackendBid[]>(`/orders/${order.id}/bids`);
        allBids.push(...bids.map((b) => bidToFrontend(b, listedPrice)));
      } catch {
        // Skip orders with errors
      }
    }

    return allBids.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  } catch {
    return [];
  }
}

/** Dispatcher: accept or reject a bid */
export async function respondToBid(
  bidId: string,
  action: "accepted" | "rejected",
): Promise<void> {
  const backendId = bidId.replace("BID-", "");
  if (action === "accepted") {
    await put(`/bids/${backendId}/accept`);
  } else {
    await put(`/bids/${backendId}/reject`);
  }
}

/** Get marketplace stats */
export async function fetchMarketplaceStats(): Promise<MarketplaceStats> {
  try {
    const [, listed] = await Promise.all([
      get<BackendOrder[]>("/orders?status=UNASSIGNED"),
      get<BackendOrder[]>("/orders?status=LISTED"),
    ]);

    // Count bids across listed orders
    let totalBids = 0;
    for (const order of listed) {
      totalBids += order.bids ? order.bids.length : 0;
    }

    return {
      totalListed: listed.length,
      activeBids: totalBids,
      acceptedToday: 0, // CE-03: Compute from today's accepted bids
      avgBidPrice: 0,
    };
  } catch {
    return { totalListed: 0, activeBids: 0, acceptedToday: 0, avgBidPrice: 0 };
  }
}
