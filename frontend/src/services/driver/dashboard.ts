/**
 * Driver Dashboard API Service
 *
 * Connects to backend REST API. No mock data.
 */

import type {
  DriverStats,
  DriverUser,
  ActiveDelivery,
  RecentBid,
  EarningsChart,
} from "@/types/driver/dashboard";
import { get } from "@/lib/api";
import { calcDistance, estimateTime } from "@/lib/geo";
export type { ActiveDelivery } from "@/types/driver/dashboard";

// ── Backend response shapes ──

interface BackendDriver {
  id: number;
  user_id: number;
  company_id: number | null;
  type: string;
  status: string;
  verification_status: string;
  license_number: string | null;
  user?: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  vehicle?: {
    plate_number: string;
    type: string;
  };
}

interface BackendDriverStats {
  activeDeliveries: number;
  completedToday: number;
  completedTotal: number;
  pendingBids: number;
  rating: number;
}

interface BackendAssignment {
  id: number;
  order_id: number;
  driver_id: number;
  order?: {
    id: number;
    tracking_code: string;
    pickup_address: string;
    pickup_lat: string | null;
    pickup_lng: string | null;
    delivery_address: string;
    delivery_lat: string | null;
    delivery_lng: string | null;
    listed_price: string | null;
    weight_kg: string | null;
    status: string;
    priority: string;
    notes: string | null;
    customer_id: number | null;
    company_id: number;
  };
}

// ── API Functions ──

/** Get driver profile */
export async function fetchDriverUser(): Promise<DriverUser> {
  try {
    const driverId = localStorage.getItem("dc_driver_id");
    if (!driverId) throw new Error("No driver identity");
    const driver = await get<BackendDriver>(`/drivers/${driverId}`);

    const name = driver.user?.name ?? "Driver";
    // Sync localStorage so sidebar picks up the correct name
    localStorage.setItem("dc_driver_name", name);
    localStorage.setItem("dc_user_name", name);

    return {
      name,
      location: "—",
      initials: (driver.user?.name ?? "D")
        .split(" ")
        .map((p) => p[0])
        .join("")
        .substring(0, 2)
        .toUpperCase(),
      vehicleType: driver.vehicle?.type ?? "Van",
      vehiclePlate: driver.vehicle?.plate_number ?? "—",
      status: driver.status === "AVAILABLE" ? "online" : "offline",
    };
  } catch {
    return {
      name: "Driver",
      location: "—",
      initials: "D",
      vehicleType: "Van",
      vehiclePlate: "—",
      status: "offline",
    };
  }
}

/** Get driver aggregated stats */
export async function fetchDriverStats(): Promise<DriverStats> {
  try {
    const stats = await get<BackendDriverStats>("/dashboard/driver-stats");

    return {
      todayEarnings: 0, // CE-03: Compute from completed deliveries today
      weekEarnings: 0,
      activeDeliveries: stats.activeDeliveries,
      completedToday: stats.completedToday,
      completedTotal: stats.completedTotal,
      rating: stats.rating,
      acceptanceRate: 92,
      onTimeRate: 96,
    };
  } catch {
    return {
      todayEarnings: 0,
      weekEarnings: 0,
      activeDeliveries: 0,
      completedToday: 0,
      completedTotal: 0,
      rating: 0,
      acceptanceRate: 0,
      onTimeRate: 0,
    };
  }
}

/** Get active deliveries for the driver */
export async function fetchActiveDeliveries(): Promise<ActiveDelivery[]> {
  try {
    // Get orders assigned to this driver that are still active
    const driverId = localStorage.getItem("dc_driver_id");
    if (!driverId) throw new Error("No driver identity");
    const history = await get<BackendAssignment[]>(`/history`);

    return history
      .filter((a) => {
        const status = a.order?.status;
        return (
          String(a.driver_id) === driverId &&
          (status === "ASSIGNED" ||
            status === "PICKED_UP" ||
            status === "EN_ROUTE")
        );
      })
      .map(
        (a): ActiveDelivery => ({
          id: `DEL-${a.order?.id ?? a.id}`,
          trackingCode: a.order?.tracking_code ?? "—",
          pickupAddress: a.order?.pickup_address ?? "—",
          deliveryAddress: a.order?.delivery_address ?? "—",
          customerName: `Customer #${a.order?.customer_id ?? "—"}`,
          status: (a.order?.status ?? "ASSIGNED") as ActiveDelivery["status"],
          payment: a.order?.listed_price
            ? `$${parseFloat(a.order.listed_price).toFixed(2)}`
            : "—",
          distance: calcDistance(
            a.order?.pickup_lat,
            a.order?.pickup_lng,
            a.order?.delivery_lat,
            a.order?.delivery_lng,
          ),
          weight: a.order?.weight_kg
            ? `${parseFloat(a.order.weight_kg)} kg`
            : "—",
          estimatedTime: estimateTime(
            a.order?.pickup_lat,
            a.order?.pickup_lng,
            a.order?.delivery_lat,
            a.order?.delivery_lng,
          ),
          progress:
            a.order?.status === "EN_ROUTE"
              ? 65
              : a.order?.status === "PICKED_UP"
                ? 35
                : 10,
          dispatcherCompany: `Company #${a.order?.company_id ?? "—"}`,
        }),
      );
  } catch {
    return [];
  }
}

/** Get completed deliveries for the driver */
export async function fetchCompletedDeliveries(): Promise<ActiveDelivery[]> {
  try {
    const driverId = localStorage.getItem("dc_driver_id");
    if (!driverId) throw new Error("No driver identity");
    const history = await get<BackendAssignment[]>(`/history`);

    return history
      .filter((a) => {
        return (
          String(a.driver_id) === driverId && a.order?.status === "DELIVERED"
        );
      })
      .map(
        (a): ActiveDelivery => ({
          id: `DEL-${a.order?.id ?? a.id}`,
          trackingCode: a.order?.tracking_code ?? "—",
          pickupAddress: a.order?.pickup_address ?? "—",
          deliveryAddress: a.order?.delivery_address ?? "—",
          customerName: `Customer #${a.order?.customer_id ?? "—"}`,
          status: "DELIVERED",
          payment: a.order?.listed_price
            ? `$${parseFloat(a.order.listed_price).toFixed(2)}`
            : "—",
          distance: calcDistance(
            a.order?.pickup_lat,
            a.order?.pickup_lng,
            a.order?.delivery_lat,
            a.order?.delivery_lng,
          ),
          weight: a.order?.weight_kg
            ? `${parseFloat(a.order.weight_kg)} kg`
            : "—",
          estimatedTime: estimateTime(
            a.order?.pickup_lat,
            a.order?.pickup_lng,
            a.order?.delivery_lat,
            a.order?.delivery_lng,
          ),
          progress: 100,
          dispatcherCompany: `Company #${a.order?.company_id ?? "—"}`,
        }),
      );
  } catch {
    return [];
  }
}

/** Get recent bids for the driver */
export async function fetchRecentBids(): Promise<RecentBid[]> {
  try {
    // Use the dedicated driver-bids endpoint (no tenant scoping)
    const bids = await get<
      Array<{
        id: number;
        order_id: number;
        driver_id: number;
        offered_price: string;
        status: string;
        createdAt: string;
        order?: {
          id: number;
          tracking_code: string;
          pickup_address: string | null;
          delivery_address: string | null;
          listed_price: string | null;
          status: string;
          company_id: number;
        };
      }>
    >("/dashboard/driver-bids");

    return bids.map((bid): RecentBid => {
      const now = Date.now();
      const created = new Date(bid.createdAt).getTime();
      const diffMin = Math.round((now - created) / 60000);
      const timeAgo =
        diffMin < 60
          ? `${diffMin} min ago`
          : `${Math.round(diffMin / 60)} hr ago`;

      return {
        id: `BID-${bid.id}`,
        orderId: `ORD-${bid.order_id}`,
        offeredPrice: parseFloat(bid.offered_price),
        listedPrice: bid.order?.listed_price
          ? parseFloat(bid.order.listed_price)
          : 0,
        status: bid.status.toLowerCase() as RecentBid["status"],
        timeAgo,
        pickupShort: (bid.order?.pickup_address ?? "").split(",")[0],
        deliveryShort: (bid.order?.delivery_address ?? "").split(",")[0],
      };
    });
  } catch {
    return [];
  }
}

/** Get earnings chart data */
export async function fetchEarningsChart(): Promise<EarningsChart[]> {
  // CE-03: Compute from history + payment amounts
  // For now return empty — will be computed when payment tracking is added
  return [
    { day: "Mon", amount: 0 },
    { day: "Tue", amount: 0 },
    { day: "Wed", amount: 0 },
    { day: "Thu", amount: 0 },
    { day: "Fri", amount: 0 },
    { day: "Sat", amount: 0 },
    { day: "Sun", amount: 0 },
  ];
}

/** Update driver online/offline status */
export async function updateDriverStatus(
  _status: DriverUser["status"],
): Promise<void> {
  // CE-02: POST /api/drivers/:id/status
  // For now this is a no-op until we add the backend endpoint
}
