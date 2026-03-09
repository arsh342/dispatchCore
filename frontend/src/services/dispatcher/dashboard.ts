/**
 * Dashboard API Service — Dispatcher
 *
 * Connects to backend REST API. No mock data.
 */

import type {
  Shipment,
  DashboardStats,
  ShipmentDetail,
  DashboardUser,
  DashboardFilters,
} from "@/types/dispatcher/dashboard";
import { get, post, put, qs } from "@/lib/api";
import { calcDistance } from "@/lib/geo";

// ── Backend response shapes (before transform) ──

interface BackendOrder {
  id: number;
  company_id: number;
  customer_id: number | null;
  tracking_code: string;
  status: string;
  listed_price: string | null;
  weight_kg: string | null;
  pickup_lat: string;
  pickup_lng: string;
  pickup_address: string | null;
  delivery_lat: string;
  delivery_lng: string;
  delivery_address: string | null;
  priority: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  bids?: Array<{ id: number }>;
  assignment?: {
    id: number;
    driver_id: number;
    vehicle_id: number | null;
    source: string;
    driver?: {
      id: number;
      type: string;
      status: string;
      user?: { id: number; name: string; phone?: string };
    };
  } | null;
}

interface BackendDashboardStats {
  totalOrders: number;
  unassigned: number;
  listed: number;
  assigned: number;
  inProgress: number;
  delivered: number;
  cancelled: number;
  activeBids: number;
}

interface BackendUser {
  name: string;
  email: string;
  phone?: string;
  location: string;
  initials: string;
  newDeliveries: number;
}

// ── Transforms ──

function backendStatusToFrontend(status: string): Shipment["status"] {
  const map: Record<string, Shipment["status"]> = {
    UNASSIGNED: "Pending",
    LISTED: "Pending",
    ASSIGNED: "Shipping",
    PICKED_UP: "Shipping",
    EN_ROUTE: "Shipping",
    DELIVERED: "Delivered",
    CANCELLED: "Pending",
  };
  return map[status] ?? "Pending";
}

function frontendStatusToBackend(status: string): string | undefined {
  const map: Record<string, string> = {
    Shipping: "ASSIGNED",
    Pending: "UNASSIGNED",
    Delivered: "DELIVERED",
  };
  return map[status];
}

function orderToShipment(order: BackendOrder): Shipment {
  return {
    id: `#${order.tracking_code.substring(0, 10).toUpperCase()}`,
    category: "Delivery",
    categoryEmoji: "✈︎",
    courier: "dispatchCore",
    courierIcon: "◉",
    origin: order.pickup_address ?? "—",
    destination: order.delivery_address ?? "—",
    distance: calcDistance(
      order.pickup_lat,
      order.pickup_lng,
      order.delivery_lat,
      order.delivery_lng,
    ),
    weight: order.weight_kg ? `${parseFloat(order.weight_kg)} kg` : "—",
    payment: order.listed_price
      ? `$${parseFloat(order.listed_price).toFixed(2)}`
      : "—",
    date: new Date(order.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    status: backendStatusToFrontend(order.status),
    driver: order.assignment?.driver?.user?.name ?? undefined,
    trackingProgress:
      order.status === "DELIVERED"
        ? 100
        : order.status === "EN_ROUTE"
          ? 75
          : order.status === "PICKED_UP"
            ? 50
            : order.status === "ASSIGNED"
              ? 25
              : 0,
    _backendId: order.id,
    _backendStatus: order.status,
    _assignedDriverId: order.assignment?.driver_id,
    _assignedDriverName: order.assignment?.driver?.user?.name,
    pickupLat: order.pickup_lat
      ? parseFloat(String(order.pickup_lat))
      : undefined,
    pickupLng: order.pickup_lng
      ? parseFloat(String(order.pickup_lng))
      : undefined,
    deliveryLat: order.delivery_lat
      ? parseFloat(String(order.delivery_lat))
      : undefined,
    deliveryLng: order.delivery_lng
      ? parseFloat(String(order.delivery_lng))
      : undefined,
  };
}

// ── API Functions ──

/** Get dashboard stats */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    const data = await get<BackendDashboardStats>("/dashboard/stats");
    return {
      totalShipments: data.totalOrders,
      pickupPackages: data.assigned + data.inProgress,
      pendingPackages: data.unassigned + data.listed,
      deliveredPackages: data.delivered,
    };
  } catch {
    return {
      totalShipments: 0,
      pickupPackages: 0,
      pendingPackages: 0,
      deliveredPackages: 0,
    };
  }
}

/** Get current user info */
export async function fetchDashboardUser(): Promise<DashboardUser> {
  try {
    const data = await get<BackendUser>("/dashboard/user");
    return {
      name: data.name,
      location: data.location || "—",
      initials: data.initials,
      newDeliveries: data.newDeliveries,
    };
  } catch {
    return { name: "Guest", location: "—", initials: "G", newDeliveries: 0 };
  }
}

/** Get all shipments, optionally filtered */
export async function fetchShipments(
  filters?: DashboardFilters,
): Promise<Shipment[]> {
  try {
    const params: Record<string, string | undefined> = {};
    if (filters?.status) {
      params.status = frontendStatusToBackend(filters.status);
    }

    const orders = await get<BackendOrder[]>(`/orders${qs(params)}`);
    let results = orders.map(orderToShipment);

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (s) =>
          s.id.toLowerCase().includes(q) ||
          s.origin.toLowerCase().includes(q) ||
          s.destination.toLowerCase().includes(q),
      );
    }

    return results;
  } catch {
    return [];
  }
}

/** Get a single shipment's full details */
export async function fetchShipmentDetail(
  id: string,
): Promise<ShipmentDetail | null> {
  try {
    // The `id` from the frontend is a tracking-code-based string; find the matching order
    const orders = await get<BackendOrder[]>("/orders");
    const match = orders.find(
      (o) => `#${o.tracking_code.substring(0, 10).toUpperCase()}` === id,
    );

    if (!match) return null;

    const order = await get<BackendOrder>(`/orders/${match.id}`);
    const shipment = orderToShipment(order);

    return {
      shipment,
      driver: {
        name: "Assigned Driver",
        phone: "—",
      },
      timeline: [
        {
          label: "Created",
          time: new Date(order.createdAt).toLocaleTimeString(),
          completed: true,
          active: false,
        },
        {
          label: "Assigned",
          time: "—",
          completed: [
            "ASSIGNED",
            "PICKED_UP",
            "EN_ROUTE",
            "DELIVERED",
          ].includes(order.status),
          active: order.status === "ASSIGNED",
        },
        {
          label: "In Transit",
          time: "—",
          completed: ["PICKED_UP", "EN_ROUTE", "DELIVERED"].includes(
            order.status,
          ),
          active: order.status === "EN_ROUTE",
        },
        {
          label: "Delivered",
          time: "—",
          completed: order.status === "DELIVERED",
          active: false,
        },
      ],
    };
  } catch {
    return null;
  }
}

/** Create a new order */
export async function createOrder(data: Partial<Shipment>): Promise<Shipment> {
  const order = await post<BackendOrder>("/orders", {
    pickup_address: data.origin ?? "",
    delivery_address: data.destination ?? "",
    pickup_lat: 0,
    pickup_lng: 0,
    delivery_lat: 0,
    delivery_lng: 0,
    weight_kg: data.weight ? parseFloat(data.weight) : null,
    priority: "NORMAL",
    notes: "",
  });

  return orderToShipment(order);
}

/** Update a shipment's status */
export async function updateShipmentStatus(
  id: string,
  status: Shipment["status"],
): Promise<void> {
  // Find the order by tracking code prefix
  const orders = await get<BackendOrder[]>("/orders");
  const match = orders.find(
    (o) => `#${o.tracking_code.substring(0, 10).toUpperCase()}` === id,
  );
  if (!match) return;

  const backendStatus = frontendStatusToBackend(status);
  if (!backendStatus) return;

  // CE-02: Add proper status update endpoint
  await put(`/orders/${match.id}`, { status: backendStatus });
}
