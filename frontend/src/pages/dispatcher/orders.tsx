import { useState, useEffect, useMemo } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { useTheme } from "@/hooks/useTheme";
import {
  Search,
  Plus,
  Package,
  Loader2,
  ArrowRight,
  MapPin,
  Clock,
  CheckCircle2,
  X,
  UserPlus,
  ChevronDown,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import LoadingPackage from "@/components/ui/loading-package";
import { fetchShipments } from "@/services/dispatcher/dashboard";
import type { Shipment } from "@/types/dispatcher/dashboard";
import { AddressInput } from "@/components/AddressInput";

/* ─── Status Config ─── */
type OrderStatus = "Pending" | "Shipping" | "Delivered";

const statusConfig: Record<
  OrderStatus,
  { label: string; color: string; icon: typeof CheckCircle2 }
> = {
  Pending: {
    label: "Pending",
    color: "text-orange-500 bg-orange-50 dark:bg-orange-900/20",
    icon: Clock,
  },
  Shipping: {
    label: "In Transit",
    color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
    icon: Package,
  },
  Delivered: {
    label: "Delivered",
    color: "text-green-500 bg-green-50 dark:bg-green-900/20",
    icon: CheckCircle2,
  },
};

/* ─── Page ─── */
export default function OrdersPage() {
  const { isDark, setIsDark } = useTheme();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Shipment[]>([]);

  /* ─── Create Order state ─── */
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [orderForm, setOrderForm] = useState({
    pickup_address: "",
    pickup_lat: "",
    pickup_lng: "",
    delivery_address: "",
    delivery_lat: "",
    delivery_lng: "",
    priority: "NORMAL",
    weight_kg: "",
    notes: "",
    recipient_name: "",
    recipient_phone: "",
    recipient_email: "",
  });
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [createdTrackingLink, setCreatedTrackingLink] = useState("");

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    const data = await fetchShipments();
    setOrders(data);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    let result = orders;
    if (statusFilter !== "ALL")
      result = result.filter((o) => o.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.origin.toLowerCase().includes(q) ||
          o.destination.toLowerCase().includes(q),
      );
    }
    return result;
  }, [orders, search, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: orders.length };
    orders.forEach((o) => {
      counts[o.status] = (counts[o.status] ?? 0) + 1;
    });
    return counts;
  }, [orders]);

  return (
    <div className="flex min-h-screen w-full">
      <DashboardSidebar isDark={isDark} setIsDark={setIsDark} />
      <div className="flex-1 bg-background overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-card backdrop-blur-xl border-b border-border px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">Orders</h1>
              <p className="text-sm text-muted-foreground">
                {orders.length} total orders
              </p>
            </div>
            <button
              onClick={() => setShowCreateOrder(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Order
            </button>
          </div>

          {/* Status filter tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {(["ALL", "Pending", "Shipping", "Delivered"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  statusFilter === s
                    ? "bg-primary/10 text-primary"
                    : "text-gray-500 hover:bg-secondary"
                }`}
              >
                {s === "ALL" ? "All" : statusConfig[s].label}
                <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded-full">
                  {statusCounts[s] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </header>

        <div className="p-6">
          {/* Search */}
          <div className="mb-4">
            <div className="flex items-center gap-2 bg-card border border-border rounded-full px-3 py-2.5">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by ID, origin, or destination..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm text-secondary-foreground placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-card rounded-3xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">
                    <input type="checkbox" className="rounded border-border accent-primary h-4 w-4 cursor-pointer bg-white dark:bg-card border appearance-none checked:appearance-auto" />
                  </th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">
                    Order ID
                  </th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">
                    Route
                  </th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">
                    Weight
                  </th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">
                    Payment
                  </th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">
                    Date
                  </th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-400">
                      <LoadingPackage />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8">
                      <EmptyState
                        icon={Package}
                        title="No orders found"
                        description="There are currently no orders to display in this list."
                      />
                    </td>
                  </tr>
                ) : (
                  filtered.map((o) => {
                    const sc = statusConfig[o.status as OrderStatus];
                    const StatusIcon = sc?.icon ?? Clock;
                    return (
                      <tr
                        key={o.id}
                        className="border-b border-border hover:bg-muted transition-colors"
                      >
                        <td className="p-4">
                          <input
                            type="checkbox"
                            className="rounded border-border accent-primary h-4 w-4 cursor-pointer bg-white dark:bg-card border appearance-none checked:appearance-auto"
                          />
                        </td>
                        <td className="p-4">
                          <p className="text-sm font-semibold text-foreground">
                            {o.id}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {o.category}
                          </p>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground max-w-[200px]">
                            <MapPin className="h-3 w-3 text-primary shrink-0" />
                            <span className="truncate">
                              {o.origin.split(",")[0]}
                            </span>
                            <ArrowRight className="h-2.5 w-2.5 shrink-0" />
                            <MapPin className="h-3 w-3 text-green-500 shrink-0" />
                            <span className="truncate">
                              {o.destination.split(",")[0]}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {o.weight}
                        </td>
                        <td className="p-4 text-sm font-medium text-foreground">
                          {o.payment}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {o.date}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${sc?.color ?? "text-gray-500 bg-gray-100"}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {sc?.label ?? o.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── Create Order Modal ─── */}
      {showCreateOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card rounded-3xl border border-border shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">
                Create New Order
              </h2>
              <button
                onClick={() => {
                  setShowCreateOrder(false);
                  setOrderError("");
                }}
                className="p-1.5 rounded-lg hover:bg-secondary text-gray-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <div className="p-5 space-y-4">
              {orderError && (
                <div className="p-3 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                  {orderError}
                </div>
              )}

              {/* Pickup */}
              <AddressInput
                label="Pickup Location"
                iconColor="text-blue-500"
                value={orderForm.pickup_address}
                lat={orderForm.pickup_lat}
                lng={orderForm.pickup_lng}
                placeholder="Start typing pickup address..."
                onChange={(addr) =>
                  setOrderForm((p) => ({ ...p, pickup_address: addr }))
                }
                onSelect={(addr, lat, lng) =>
                  setOrderForm((p) => ({
                    ...p,
                    pickup_address: addr,
                    pickup_lat: lat,
                    pickup_lng: lng,
                  }))
                }
              />

              {/* Delivery */}
              <AddressInput
                label="Delivery Location"
                iconColor="text-green-500"
                value={orderForm.delivery_address}
                lat={orderForm.delivery_lat}
                lng={orderForm.delivery_lng}
                placeholder="Start typing delivery address..."
                onChange={(addr) =>
                  setOrderForm((p) => ({ ...p, delivery_address: addr }))
                }
                onSelect={(addr, lat, lng) =>
                  setOrderForm((p) => ({
                    ...p,
                    delivery_address: addr,
                    delivery_lat: lat,
                    delivery_lng: lng,
                  }))
                }
              />

              {/* Priority + Weight */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Priority
                  </label>
                  <div className="relative">
                    <select
                      value={orderForm.priority}
                      onChange={(e) =>
                        setOrderForm((p) => ({ ...p, priority: e.target.value }))
                      }
                      className="w-full appearance-none rounded-full border border-border bg-card px-4 py-2.5 pr-12 text-sm text-foreground outline-none focus:border-primary"
                    >
                      <option value="LOW">Low</option>
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Weight (kg)
                  </label>
                  <input
                    placeholder="0.0"
                    type="number"
                    step="0.1"
                    value={orderForm.weight_kg}
                    onChange={(e) =>
                      setOrderForm((p) => ({ ...p, weight_kg: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 rounded-full border border-border bg-card text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Notes
                </label>
                <textarea
                  placeholder="Any special instructions..."
                  rows={2}
                  value={orderForm.notes}
                  onChange={(e) =>
                    setOrderForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground outline-none focus:border-primary resize-none"
                />
              </div>

              {/* ── Recipient Details ── */}
              <div className="pt-2 border-t border-border">
                <p className="text-xs font-semibold text-secondary-foreground mb-3 flex items-center gap-1.5">
                  <UserPlus className="h-3.5 w-3.5" />
                  Recipient Details
                  <span className="text-gray-400 font-normal">
                    (customer who receives the package)
                  </span>
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Recipient Name
                    </label>
                    <input
                      placeholder="e.g. John Smith"
                      value={orderForm.recipient_name}
                      onChange={(e) =>
                        setOrderForm((p) => ({
                          ...p,
                          recipient_name: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2.5 rounded-full border border-border bg-card text-sm text-foreground outline-none focus:border-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        Phone Number
                      </label>
                      <input
                        placeholder="+1 (555) 000-0000"
                        value={orderForm.recipient_phone}
                        onChange={(e) =>
                          setOrderForm((p) => ({
                            ...p,
                            recipient_phone: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2.5 rounded-full border border-border bg-card text-sm text-foreground outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        Email
                      </label>
                      <input
                        placeholder="john@example.com"
                        type="email"
                        value={orderForm.recipient_email}
                        onChange={(e) =>
                          setOrderForm((p) => ({
                            ...p,
                            recipient_email: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2.5 rounded-full border border-border bg-card text-sm text-foreground outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-border">
              <button
                onClick={() => {
                  setShowCreateOrder(false);
                  setOrderError("");
                }}
                className="px-4 py-2.5 rounded-full text-sm font-medium text-secondary-foreground hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={orderSubmitting}
                onClick={async () => {
                  setOrderError("");
                  if (
                    !orderForm.pickup_lat ||
                    !orderForm.pickup_lng ||
                    !orderForm.delivery_lat ||
                    !orderForm.delivery_lng
                  ) {
                    setOrderError(
                      "Pickup and delivery coordinates are required.",
                    );
                    return;
                  }
                  setOrderSubmitting(true);
                  try {
                    const API_URL =
                      import.meta.env.VITE_API_URL ||
                      "http://localhost:8000/api";
                    const companyId =
                      localStorage.getItem("dc_company_id") || "";
                    const res = await fetch(`${API_URL}/orders`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        "x-company-id": companyId,
                      },
                      body: JSON.stringify({
                        pickup_lat: parseFloat(orderForm.pickup_lat),
                        pickup_lng: parseFloat(orderForm.pickup_lng),
                        pickup_address: orderForm.pickup_address || undefined,
                        delivery_lat: parseFloat(orderForm.delivery_lat),
                        delivery_lng: parseFloat(orderForm.delivery_lng),
                        delivery_address:
                          orderForm.delivery_address || undefined,
                        priority: orderForm.priority,
                        weight_kg: orderForm.weight_kg
                          ? parseFloat(orderForm.weight_kg)
                          : undefined,
                        notes: orderForm.notes || undefined,
                        recipient_name: orderForm.recipient_name || undefined,
                        recipient_phone: orderForm.recipient_phone || undefined,
                        recipient_email: orderForm.recipient_email || undefined,
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      const details = data.error?.details;
                      if (details && details.length > 0) {
                        throw new Error(
                          details
                            .map(
                              (d: { field: string; message: string }) =>
                                `${d.field}: ${d.message}`,
                            )
                            .join(", "),
                        );
                      }
                      throw new Error(
                        data.error?.message || "Failed to create order",
                      );
                    }
                    setShowCreateOrder(false);
                    setOrderForm({
                      pickup_address: "",
                      pickup_lat: "",
                      pickup_lng: "",
                      delivery_address: "",
                      delivery_lat: "",
                      delivery_lng: "",
                      priority: "NORMAL",
                      weight_kg: "",
                      notes: "",
                      recipient_name: "",
                      recipient_phone: "",
                      recipient_email: "",
                    });
                    // Show tracking link
                    const trackingCode = data.data?.tracking_code;
                    if (trackingCode) {
                      const link = `${window.location.origin}/track/${trackingCode}`;
                      setCreatedTrackingLink(link);
                    }
                    loadOrders();
                  } catch (err: unknown) {
                    setOrderError(
                      err instanceof Error
                        ? err.message
                        : "Something went wrong",
                    );
                  } finally {
                    setOrderSubmitting(false);
                  }
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {orderSubmitting && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Create Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Tracking Link Toast ─── */}
      {createdTrackingLink && (
        <div className="fixed bottom-6 right-6 z-50 bg-card rounded-3xl border border-border shadow-2xl p-5 max-w-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Order Created!
            </h3>
            <button
              onClick={() => setCreatedTrackingLink("")}
              className="p-1 rounded-lg hover:bg-secondary text-gray-400"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            Share this tracking link with the recipient:
          </p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={createdTrackingLink}
              className="flex-1 px-3 py-2 rounded-full border border-border bg-muted text-xs text-foreground"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(createdTrackingLink);
              }}
              className="px-3 py-2 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
            >
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
