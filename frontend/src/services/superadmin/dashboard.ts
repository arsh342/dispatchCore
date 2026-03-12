/**
 * SuperAdmin Dashboard Service
 *
 * Fetches platform-wide KPIs, company list, driver list, and order list
 * for the superadmin views. These endpoints don't need tenant scoping.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

export interface PlatformStats {
  totalCompanies: number;
  totalOrders: number;
  totalDrivers: number;
  totalDelivered: number;
  totalActiveOrders: number;
  totalListedOrders: number;
}

export interface CompanySummary {
  id: number;
  name: string;
  address: string | null;
  location: string | null;
  planType: string;
  createdAt: string;
  orderCount: number;
  driverCount: number;
}

export interface DriverSummary {
  id: number;
  name: string;
  email: string;
  phone: string;
  type: "EMPLOYED" | "INDEPENDENT";
  status: "AVAILABLE" | "BUSY" | "OFFLINE";
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  licenseNumber: string | null;
  companyName: string | null;
  companyId: number | null;
  activeAssignments: number;
  completedDeliveries: number;
  createdAt: string;
}

export interface OrderSummary {
  id: number;
  trackingCode: string;
  status: string;
  priority: string;
  pickupAddress: string | null;
  deliveryAddress: string | null;
  weightKg: number | null;
  listedPrice: number | null;
  companyName: string;
  companyId: number;
  createdAt: string;
}

/** Fetch platform-wide statistics */
export async function fetchPlatformStats(): Promise<PlatformStats> {
  const res = await fetch(`${API_BASE}/superadmin/stats`);
  const body = await res.json();
  if (!res.ok || !body.success)
    throw new Error(body.error?.message ?? "Failed to fetch stats");
  return body.data;
}

/** Fetch all companies with counts */
export async function fetchCompanies(): Promise<CompanySummary[]> {
  const res = await fetch(`${API_BASE}/superadmin/companies`);
  const body = await res.json();
  if (!res.ok || !body.success)
    throw new Error(body.error?.message ?? "Failed to fetch companies");
  return body.data;
}

/** Fetch all drivers across the platform */
export async function fetchAllDrivers(): Promise<DriverSummary[]> {
  const res = await fetch(`${API_BASE}/superadmin/drivers`);
  const body = await res.json();
  if (!res.ok || !body.success)
    throw new Error(body.error?.message ?? "Failed to fetch drivers");
  return body.data;
}

/** Fetch all orders across the platform */
export async function fetchAllOrders(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{
  orders: OrderSummary[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const res = await fetch(`${API_BASE}/superadmin/orders?${query.toString()}`);
  const body = await res.json();
  if (!res.ok || !body.success)
    throw new Error(body.error?.message ?? "Failed to fetch orders");
  return { orders: body.data, meta: body.meta };
}
