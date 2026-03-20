import { useState, useEffect, useMemo } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { get } from "@/lib/api";
import { calcDistance, estimateTime } from "@/lib/geo";
import {
  Search,
  MapPin,
  ArrowRight,
  Truck,
  ChevronDown,
} from "lucide-react";
import LoadingPackage from "@/components/ui/loading-package";
import { EmptyState } from "@/components/ui/empty-state";

/* ─── Types ─── */
type ShipmentStatus =
  | "Pending"
  | "Picked Up"
  | "In Transit"
  | "Out for Delivery"
  | "Delivered"
  | "Failed";

interface ShipmentItem {
  id: string;
  trackingCode: string;
  origin: string;
  destination: string;
  status: ShipmentStatus;
  driver: string;
  vehicle: string;
  weight: string;
  distance: string;
  estimatedDelivery: string;
  lastUpdate: string;
  progress: number; // 0-100
}

interface BackendShipmentOrder {
  id: number;
  tracking_code: string;
  pickup_address: string | null;
  delivery_address: string | null;
  status: string;
  weight_kg: string | null;
  pickup_lat: string | null;
  pickup_lng: string | null;
  delivery_lat: string | null;
  delivery_lng: string | null;
  updatedAt?: string | null;
  assignment?: {
    driver?: {
      name?: string | null;
      user?: { name?: string | null } | null;
    } | null;
    vehicle?: {
      type?: string | null;
      plate_number?: string | null;
    } | null;
  } | null;
}

const statusConfig: Record<ShipmentStatus, { color: string; bgColor: string }> =
  {
    Pending: {
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
    },
    "Picked Up": {
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    "In Transit": {
      color: "text-indigo-500",
      bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
    },
    "Out for Delivery": {
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
    },
    Delivered: {
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    Failed: { color: "text-red-500", bgColor: "bg-red-50 dark:bg-red-900/20" },
  };

/* ─── Backend status → frontend status ─── */
function mapStatus(s: string): ShipmentStatus {
  const m: Record<string, ShipmentStatus> = {
    UNASSIGNED: "Pending",
    LISTED: "Pending",
    ASSIGNED: "Picked Up",
    PICKED_UP: "Picked Up",
    EN_ROUTE: "In Transit",
    DELIVERED: "Delivered",
    CANCELLED: "Failed",
  };
  return m[s] ?? "Pending";
}
function mapProgress(s: string): number {
  const m: Record<string, number> = {
    UNASSIGNED: 0,
    LISTED: 0,
    ASSIGNED: 15,
    PICKED_UP: 30,
    EN_ROUTE: 60,
    DELIVERED: 100,
    CANCELLED: 70,
  };
  return m[s] ?? 0;
}

/* ─── Shipments Page ─── */
export default function ShipmentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | "ALL">(
    "ALL",
  );
  const [loading, setLoading] = useState(true);
  const [shipments, setShipments] = useState<ShipmentItem[]>([]);
  const [selected, setSelected] = useState<ShipmentItem | null>(null);

  // Fetch orders from API
  useEffect(() => {
    async function load() {
      try {
        const orders = await get<BackendShipmentOrder[]>("/orders");
        setShipments(
          orders.map((o) => {
            const assignment = o.assignment;
            const driverName =
              assignment?.driver?.name ?? assignment?.driver?.user?.name ?? "—";
            const vehicleType = assignment?.vehicle?.type ?? "—";
            const vehiclePlate = assignment?.vehicle?.plate_number;
            const vehicleLabel =
              vehicleType !== "—"
                ? `${vehicleType}${vehiclePlate ? ` (${vehiclePlate})` : ""}`
                : "—";

            return {
              id: `SHP-${o.id}`,
              trackingCode: o.tracking_code,
              origin: o.pickup_address ?? "—",
              destination: o.delivery_address ?? "—",
              status: mapStatus(o.status),
              driver: driverName,
              vehicle: vehicleLabel,
              weight: o.weight_kg ? `${parseFloat(o.weight_kg)} kg` : "—",
              estimatedDelivery: estimateTime(
                o.pickup_lat,
                o.pickup_lng,
                o.delivery_lat,
                o.delivery_lng,
              ),
              distance: calcDistance(
                o.pickup_lat,
                o.pickup_lng,
                o.delivery_lat,
                o.delivery_lng,
              ),
              lastUpdate: o.updatedAt
                ? new Date(o.updatedAt).toLocaleString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : "—",
              progress: mapProgress(o.status),
            };
          }),
        );
      } catch {
        setShipments([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    let r = shipments;
    if (statusFilter !== "ALL") r = r.filter((s) => s.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(
        (s) =>
          s.id.toLowerCase().includes(q) ||
          s.trackingCode.toLowerCase().includes(q) ||
          s.driver.toLowerCase().includes(q),
      );
    }
    return r;
  }, [shipments, search, statusFilter]);

  return (
    <div className="flex min-h-screen w-full">
      <DashboardSidebar />
      <div className="flex-1 min-h-screen bg-background overflow-auto lg:h-screen lg:min-h-0 lg:overflow-hidden flex flex-col lg:flex-row">
        {/* ═══ Left — Shipment List ═══ */}
        <div
          className={`${selected ? "lg:w-[55%]" : "w-full"} border-r border-border flex flex-col transition-all lg:min-h-0 lg:h-full`}
        >
          <header className="sticky top-0 z-10 bg-card backdrop-blur-xl border-b border-border px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-xl font-bold text-foreground">Shipments</h1>
                <p className="text-sm text-muted-foreground">
                  {shipments.length} active shipments
                </p>
              </div>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as ShipmentStatus | "ALL")
                  }
                  className="appearance-none bg-card border border-border rounded-full px-4 py-2 pe-12 text-sm text-secondary-foreground cursor-pointer outline-none"
                >
                  <option value="ALL">All Status</option>
                  {Object.keys(statusConfig).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-2 bg-card border border-border rounded-full px-3 py-2">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search shipments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm text-secondary-foreground placeholder:text-gray-400"
              />
            </div>
          </header>

          <div className="dc-scrollbar flex-1 overflow-y-auto p-4 space-y-3 lg:min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-gray-400">
                <LoadingPackage />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20">
                <EmptyState
                  icon={Truck}
                  title="No shipments found"
                  description="We couldn't find any shipments matching your filters."
                />
              </div>
            ) : (
              filtered.map((s) => {
                const sc = statusConfig[s.status];
                return (
                  <div
                    key={s.id}
                    onClick={() =>
                      setSelected(selected?.id === s.id ? null : s)
                    }
                    className={`p-4 rounded-3xl bg-card border-2 transition-all cursor-pointer ${
                      selected?.id === s.id
                        ? "border-primary shadow-md"
                        : "border-border hover:border-gray-300 dark:hover:border-gray-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">
                          {s.id}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">
                          {s.trackingCode}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${sc.bgColor} ${sc.color}`}
                      >
                        • {s.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                      <MapPin className="h-3 w-3 text-primary shrink-0" />
                      <span className="truncate">{s.origin.split(",")[0]}</span>
                      <ArrowRight className="h-2.5 w-2.5 shrink-0" />
                      <MapPin className="h-3 w-3 text-green-500 shrink-0" />
                      <span className="truncate">
                        {s.destination.split(",")[0]}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${s.status === "Failed" ? "bg-red-400" : s.status === "Delivered" ? "bg-green-500" : "bg-primary"}`}
                          style={{ width: `${s.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {s.progress}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                      <span>
                        <Truck className="inline-block h-3 w-3 text-primary" /> {s.driver} · {s.vehicle}
                      </span>
                      <span>{s.lastUpdate}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ═══ Right — Shipment Detail Panel ═══ */}
        {selected && (
          <div className="dc-scrollbar lg:w-[45%] bg-card border-l border-border overflow-y-auto lg:min-h-0 lg:h-full lg:flex lg:flex-col">
            <div className="sticky top-0 z-10 bg-card backdrop-blur-xl border-b border-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                Shipment Details
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                Close
              </button>
            </div>

            <div className="dc-scrollbar p-6 space-y-5 lg:flex-1 lg:overflow-y-auto">
              {/* ID + Status */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-foreground">
                    {selected.id}
                  </p>
                  <p className="text-xs font-mono text-gray-400">
                    {selected.trackingCode}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-3 py-1.5 rounded-full ${statusConfig[selected.status].bgColor} ${statusConfig[selected.status].color}`}
                >
                  {selected.status}
                </span>
              </div>

              {/* Route */}
              <div className="p-4 rounded-3xl bg-muted/50 space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase text-gray-400">
                      Pickup
                    </p>
                    <p className="text-sm text-secondary-foreground">
                      {selected.origin}
                    </p>
                  </div>
                </div>
                <div className="border-l-2 border-dashed border-border ml-2 h-4" />
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase text-gray-400">
                      Delivery
                    </p>
                    <p className="text-sm text-secondary-foreground">
                      {selected.destination}
                    </p>
                  </div>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Driver", value: selected.driver, icon: "" },
                  { label: "Vehicle", value: selected.vehicle, icon: "" },
                  { label: "Weight", value: selected.weight, icon: "" },
                  {
                    label: "ETA",
                    value: selected.estimatedDelivery,
                    icon: "",
                  },
                  {
                    label: "Distance",
                    value: selected.distance,
                    icon: "",
                  },
                  {
                    label: "Last Update",
                    value: selected.lastUpdate,
                    icon: "",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="p-3 rounded-3xl bg-muted/50"
                  >
                    <p className="text-[10px] uppercase text-gray-400 mb-1">
                      {item.icon} {item.label}
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Progress */}
              <div>
                <p className="text-sm font-medium text-secondary-foreground mb-2">
                  Delivery Progress
                </p>
                <div className="h-2 bg-secondary rounded-full overflow-hidden mb-1">
                  <div
                    className={`h-full rounded-full transition-all ${selected.status === "Failed" ? "bg-red-400" : "bg-primary"}`}
                    style={{ width: `${selected.progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 text-right">
                  {selected.progress}% complete
                </p>
              </div>

              {/* Timeline */}
              <div>
                <p className="text-sm font-medium text-secondary-foreground mb-3">
                  Timeline
                </p>
                <div className="space-y-3">
                  {[
                    "Order Created",
                    "Picked Up",
                    "In Transit",
                    "Out for Delivery",
                    "Delivered",
                  ].map((step, i) => {
                    const stepPercent = (i / 4) * 100;
                    const done = selected.progress >= stepPercent;
                    const active =
                      selected.progress >= stepPercent &&
                      selected.progress < ((i + 1) / 4) * 100;
                    return (
                      <div key={step} className="flex items-center gap-3">
                        <div
                          className={`h-3 w-3 rounded-full shrink-0 ${done ? "bg-primary" : "bg-secondary"} ${active ? "ring-4 ring-primary/20" : ""}`}
                        />
                        <span
                          className={`text-sm ${done ? "text-foreground font-medium" : "text-gray-400"}`}
                        >
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
