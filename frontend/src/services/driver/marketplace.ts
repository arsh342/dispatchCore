/**
 * Marketplace API Service — Driver Perspective
 *
 * Connects to backend REST API. No mock data.
 */

import type {
  DriverMarketplaceListing,
  DriverBid,
  DriverMarketplaceStats,
  DriverSortBy,
} from "@/types/driver/marketplace";
export type { DriverBid } from "@/types/driver/marketplace";
import { get, post } from "@/lib/api";

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

// ── Backend types ──

interface BackendListing {
  id: number;
  trackingCode: string;
  pickupAddress: string;
  pickupLat: number | null;
  pickupLng: number | null;
  deliveryAddress: string;
  deliveryLat: number | null;
  deliveryLng: number | null;
  listedPrice: number;
  weight: number;
  priority: string;
  postedAt: string;
  bidsCount: number;
  companyId: number;
  companyName: string | null;
}

interface BackendBid {
  id: number;
  order_id: number;
  offered_price: string;
  status: string;
  message: string | null;
  created_at: string;
}

// ── Transforms ──

function listingToFrontend(l: BackendListing): DriverMarketplaceListing {
  let distance = 0;
  if (l.pickupLat != null && l.pickupLng != null && l.deliveryLat != null && l.deliveryLng != null) {
    distance = Math.round(haversineKm(l.pickupLat, l.pickupLng, l.deliveryLat, l.deliveryLng) * 10) / 10;
  }
  return {
    id: `ORD-${l.id}`,
    trackingCode: l.trackingCode,
    pickupAddress: l.pickupAddress,
    deliveryAddress: l.deliveryAddress,
    listedPrice: l.listedPrice,
    weight: l.weight,
    distance,
    priority: l.priority.toLowerCase() as DriverMarketplaceListing["priority"],
    postedAt: l.postedAt,
    bidsCount: l.bidsCount,
    companyName: l.companyName ?? `Company #${l.companyId}`,
  };
}

// ── API Functions ──

/** Driver: browse available marketplace listings */
export async function fetchMarketplaceListings(
  sortBy?: DriverSortBy,
): Promise<DriverMarketplaceListing[]> {
  try {
    const sort =
      sortBy === "newest"
        ? "newest"
        : sortBy === "price"
          ? "price"
          : sortBy === "weight"
            ? "weight"
            : sortBy === "priority"
              ? "priority"
              : "newest";

    const listings = await get<BackendListing[]>(
      `/dashboard/marketplace-listings?sort=${sort}`,
    );
    const results = listings.map(listingToFrontend);

    // Client-side distance sort (distance is computed client-side for now)
    if (sortBy === "distance") {
      results.sort((a, b) => a.distance - b.distance);
    }

    return results;
  } catch {
    return [];
  }
}

/** Driver: place a bid on a marketplace order */
export async function placeBid(
  orderId: string,
  price: number,
  message?: string,
): Promise<DriverBid> {
  const backendId = orderId.replace("ORD-", "");

  const bid = await post<BackendBid>(`/bids/orders/${backendId}/bid`, {
    offered_price: price,
    message: message || undefined,
  });

  return {
    id: `BID-${bid.id}`,
    orderId,
    offeredPrice: parseFloat(bid.offered_price),
    listedPrice: price, // Will be filled from the listing context
    status: bid.status.toLowerCase() as DriverBid["status"],
    message: bid.message ?? undefined,
    createdAt: bid.created_at,
  };
}

/** Driver: get all my bids */
export async function fetchMyBids(): Promise<DriverBid[]> {
  try {
    // Use the dedicated driver-bids endpoint (no tenant scoping needed)
    const bids = await get<
      Array<{
        id: number;
        order_id: number;
        driver_id: number;
        offered_price: string;
        status: string;
        message: string | null;
        createdAt: string;
        order?: {
          id: number;
          tracking_code: string;
          pickup_address: string | null;
          delivery_address: string | null;
          listed_price: string | null;
          weight_kg: string | null;
          status: string;
          priority: string;
          company_id: number;
        };
      }>
    >("/dashboard/driver-bids");

    return bids.map(
      (bid): DriverBid => ({
        id: `BID-${bid.id}`,
        orderId: `ORD-${bid.order_id}`,
        offeredPrice: parseFloat(bid.offered_price),
        listedPrice: bid.order?.listed_price
          ? parseFloat(bid.order.listed_price)
          : 0,
        status: bid.status.toLowerCase() as DriverBid["status"],
        message: bid.message ?? undefined,
        createdAt: bid.createdAt,
        pickupAddress: bid.order?.pickup_address ?? undefined,
        deliveryAddress: bid.order?.delivery_address ?? undefined,
      }),
    );
  } catch {
    return [];
  }
}

/** Driver: get marketplace stats */
export async function fetchDriverMarketplaceStats(): Promise<DriverMarketplaceStats> {
  try {
    const [listings, myBids] = await Promise.all([
      fetchMarketplaceListings(),
      fetchMyBids(),
    ]);

    const activeBids = myBids.filter((b) => b.status === "pending").length;
    const acceptedToday = myBids.filter((b) => b.status === "accepted").length;
    const totalEarnings = myBids
      .filter((b) => b.status === "accepted")
      .reduce((s, b) => s + b.offeredPrice, 0);

    return {
      availableOrders: listings.length,
      myActiveBids: activeBids,
      acceptedToday,
      earnings: totalEarnings,
    };
  } catch {
    return {
      availableOrders: 0,
      myActiveBids: 0,
      acceptedToday: 0,
      earnings: 0,
    };
  }
}
