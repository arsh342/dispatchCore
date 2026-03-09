/**
 * Employed Driver API Service
 *
 * Connects to backend REST API for employed driver data.
 * Covers: dashboard stats, assigned orders, active deliveries, settings.
 */

import { get } from "@/lib/api";
import { calcDistance, estimateTime } from "@/lib/geo";

// ── Backend types ──

interface BackendOrder {
  id: number;
  company_id: number;
  customer_id: number | null;
  tracking_code: string;
  status: string;
  listed_price: string | null;
  weight_kg: string | null;
  pickup_lat: string | null;
  pickup_lng: string | null;
  pickup_address: string | null;
  delivery_lat: string | null;
  delivery_lng: string | null;
  delivery_address: string | null;
  priority: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BackendDriver {
  id: number;
  user_id: number;
  company_id: number | null;
  type: string;
  status: string;
  verification_status: string;
  license_number: string | null;
  user?: { id: number; name: string; email: string; phone: string };
}

interface BackendCompany {
  id: number;
  name: string;
  address: string;
  plan_type: string;
}

interface BackendDriverStats {
  activeDeliveries: number;
  completedToday: number;
  completedTotal: number;
  pendingBids: number;
  rating: number;
}

// ── Exported types ──

export interface EmployedDriverUser {
  name: string;
  initials: string;
  role: string;
  companyName: string;
  status: string;
  rating: number;
}

export interface EmployedDashboardStats {
  assignedToday: number;
  completedToday: number;
  onTimeRate: number;
  driverRating: number;
}

export interface AssignedOrder {
  id: string;
  trackingCode: string;
  pickupAddress: string;
  deliveryAddress: string;
  status: string;
  priority: string;
  weight: string;
  notes: string;
  customerName: string;
  createdAt: string;
  _backendId: number;
}

export interface ActiveDelivery {
  id: string;
  trackingCode: string;
  pickupAddress: string;
  deliveryAddress: string;
  customerName: string;
  customerPhone: string;
  status: string;
  weight: string;
  distance: string;
  estimatedTime: string;
  progress: number;
  notes: string;
  _backendId: number;
}

export interface EmployedDriverProfile {
  name: string;
  email: string;
  phone: string;
  companyName: string;
  companyAddress: string;
  employeeId: string;
  licenseNumber: string;
  driverType: string;
}

// ── API Functions ──

/** Get employed driver user info */
export async function fetchEmployedDriverUser(): Promise<EmployedDriverUser> {
  try {
    const driverId = localStorage.getItem("dc_driver_id");
    if (!driverId) throw new Error("No driver identity");
    const driver = await get<BackendDriver>(`/drivers/${driverId}`);

    const name = driver.user?.name ?? "Driver";
    const initials = name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    let companyName = "—";
    if (driver.company_id) {
      try {
        const company = await get<BackendCompany>(
          `/companies/${driver.company_id}`,
        );
        companyName = company.name;
      } catch {
        // Fall back
      }
    }

    return {
      name,
      initials,
      role: "Employed Driver",
      companyName,
      status: driver.status,
      rating: 4.8, // CE-03: From reviews table
    };
  } catch {
    return {
      name: "Driver",
      initials: "D",
      role: "Employed Driver",
      companyName: "—",
      status: "OFFLINE",
      rating: 0,
    };
  }
}

/** Get dashboard stats for employed driver */
export async function fetchEmployedDashboardStats(): Promise<EmployedDashboardStats> {
  try {
    const stats = await get<BackendDriverStats>("/dashboard/driver-stats");
    return {
      assignedToday: stats.activeDeliveries + stats.completedToday,
      completedToday: stats.completedToday,
      onTimeRate: 96, // CE-03: Compute from delivery events timing
      driverRating: stats.rating,
    };
  } catch {
    return {
      assignedToday: 0,
      completedToday: 0,
      onTimeRate: 0,
      driverRating: 0,
    };
  }
}

/** Get orders assigned to this driver */
export async function fetchAssignedOrders(
  statusFilter?: string,
): Promise<AssignedOrder[]> {
  try {
    const driverId = localStorage.getItem("dc_driver_id");
    if (!driverId) throw new Error("No driver identity");
    let params = `?for_driver=${driverId}`;
    if (statusFilter && statusFilter !== "all") {
      params += `&status=${statusFilter.toUpperCase()}`;
    }
    const orders = await get<BackendOrder[]>(`/orders${params}`);

    return orders.map(
      (o): AssignedOrder => ({
        id: `ORD-${o.id}`,
        trackingCode: o.tracking_code,
        pickupAddress: o.pickup_address ?? "—",
        deliveryAddress: o.delivery_address ?? "—",
        status: o.status,
        priority: o.priority,
        weight: o.weight_kg ? `${parseFloat(o.weight_kg)} kg` : "—",
        notes: o.notes ?? "",
        customerName: `Customer #${o.customer_id ?? "—"}`,
        createdAt: new Date(o.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        _backendId: o.id,
      }),
    );
  } catch {
    return [];
  }
}

/** Get active deliveries for this driver */
export async function fetchActiveDeliveries(): Promise<ActiveDelivery[]> {
  try {
    // Get orders that are actively being delivered by this driver
    const driverId = localStorage.getItem("dc_driver_id");
    if (!driverId) throw new Error("No driver identity");
    const orders = await get<BackendOrder[]>(`/orders?for_driver=${driverId}`);

    return orders
      .filter((o) => ["ASSIGNED", "PICKED_UP", "EN_ROUTE"].includes(o.status))
      .map(
        (o): ActiveDelivery => ({
          id: `DEL-${o.id}`,
          trackingCode: o.tracking_code,
          pickupAddress: o.pickup_address ?? "—",
          deliveryAddress: o.delivery_address ?? "—",
          customerName: `Customer #${o.customer_id ?? "—"}`,
          customerPhone: "—", // CE-03: From customer user record
          status: o.status,
          weight: o.weight_kg ? `${parseFloat(o.weight_kg)} kg` : "—",
          distance: calcDistance(
            o.pickup_lat,
            o.pickup_lng,
            o.delivery_lat,
            o.delivery_lng,
          ),
          estimatedTime: estimateTime(
            o.pickup_lat,
            o.pickup_lng,
            o.delivery_lat,
            o.delivery_lng,
          ),
          progress:
            o.status === "EN_ROUTE" ? 65 : o.status === "PICKED_UP" ? 35 : 10,
          notes: o.notes ?? "",
          _backendId: o.id,
        }),
      );
  } catch {
    return [];
  }
}

/** Get employed driver's full profile for settings */
export async function fetchEmployedDriverProfile(): Promise<EmployedDriverProfile> {
  try {
    const driverId = localStorage.getItem("dc_driver_id");
    if (!driverId) throw new Error("No driver identity");
    const driver = await get<BackendDriver>(`/drivers/${driverId}`);

    let companyName = "—";
    let companyAddress = "—";
    if (driver.company_id) {
      try {
        const company = await get<BackendCompany>(
          `/companies/${driver.company_id}`,
        );
        companyName = company.name;
        companyAddress = company.address;
      } catch {
        // fall through
      }
    }

    return {
      name: driver.user?.name ?? "—",
      email: driver.user?.email ?? "—",
      phone: driver.user?.phone ?? "—",
      companyName,
      companyAddress,
      employeeId: `EMP-${String(driver.id).padStart(4, "0")}`,
      licenseNumber: driver.license_number ?? "—",
      driverType: driver.type,
    };
  } catch {
    return {
      name: "—",
      email: "—",
      phone: "—",
      companyName: "—",
      companyAddress: "—",
      employeeId: "—",
      licenseNumber: "—",
      driverType: "EMPLOYED",
    };
  }
}
