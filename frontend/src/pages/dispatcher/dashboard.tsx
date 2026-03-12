import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { useTheme } from "@/hooks/useTheme";
import {
  useDashboardStats,
  useDashboardUser,
  useShipments,
} from "@/hooks/dispatcher/useDashboard";
import type { Shipment, ShipmentStatus } from "@/types/dispatcher/dashboard";
import MapView from "@/components/map/MapView";
import type { MapMarker, MapRoute } from "@/components/map/MapView";
import { get } from "@/lib/api";
import {
  Search,
  MessageSquare,
  Plus,
  Package,
  Truck,
  Clock,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  Loader2,
  X,
  UserPlus,
  ChevronDown,
} from "lucide-react";
import LoadingPackage from "@/components/ui/loading-package";
import { AddressInput } from "@/components/AddressInput";

/* ─── Status color map ─── */
const statusColors: Record<ShipmentStatus, string> = {
  Pending: "text-orange-500 bg-orange-50 dark:bg-orange-900/20",
  Shipping: "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
  Delivered: "text-green-500 bg-green-50 dark:bg-green-900/20",
  "In Transit": "text-purple-500 bg-purple-50 dark:bg-purple-900/20",
  Cancelled: "text-red-500 bg-red-50 dark:bg-red-900/20",
};

const statsMeta = [
  {
    key: "totalShipments" as const,
    label: "Total shipments",
    icon: Truck,
    color: "text-stone-600",
    bg: "bg-stone-100 dark:bg-stone-800/20",
  },
  {
    key: "pickupPackages" as const,
    label: "Pickup packages",
    icon: Package,
    color: "text-stone-600",
    bg: "bg-stone-100 dark:bg-stone-800/20",
  },
  {
    key: "pendingPackages" as const,
    label: "Pending packages",
    icon: Clock,
    color: "text-stone-600",
    bg: "bg-stone-100 dark:bg-stone-800/20",
  },
  {
    key: "deliveredPackages" as const,
    label: "Packages delivered",
    icon: CheckCircle2,
    color: "text-stone-600",
    bg: "bg-stone-100 dark:bg-stone-800/20",
  },
];

/* ─── Dashboard Page ─── */
export default function DashboardPage() {
  const navigate = useNavigate();
  const { isDark, setIsDark } = useTheme();
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [createdTrackingLink, setCreatedTrackingLink] = useState("");
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
  // Assign driver state
  const [assignShipment, setAssignShipment] = useState<Shipment | null>(null);
  const [companyDrivers, setCompanyDrivers] = useState<
    Array<{ id: number; user?: { name: string } }>
  >([]);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState("");

  // Hooks — data fetching
  const {
    data: stats,
    loading: statsLoading,
    refetch: refetchStats,
  } = useDashboardStats();
  const { data: user } = useDashboardUser();
  const {
    data: shipments,
    loading: shipmentsLoading,
    refetch: refetchShipments,
  } = useShipments();

  // Refetch both stats and shipments
  const refetch = () => {
    refetchStats();
    refetchShipments();
  };

  // Filtered shipments for table (client-side search on already-fetched data)
  const filteredShipments = useMemo(() => {
    if (!shipments) return [];
    if (!searchQuery) return shipments;
    const q = searchQuery.toLowerCase();
    return shipments.filter(
      (s) =>
        s.id.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.courier.toLowerCase().includes(q),
    );
  }, [shipments, searchQuery]);

  // Auto-select first ongoing shipment once loaded
  useEffect(() => {
    if (shipments && shipments.length > 0 && !selectedShipment) {
      const ongoing = shipments.find(
        (s) => s.status !== "Delivered" && s.status !== "Cancelled",
      );
      if (ongoing) setSelectedShipment(ongoing);
    }
  }, [shipments, selectedShipment]);

  /* ─── Live driver locations for map ─── */
  interface DriverLocation {
    driverId: number;
    name: string;
    status: string;
    lat: number;
    lng: number;
    speed: number | null;
    heading: number | null;
    recordedAt: string;
  }
  const [driverLocations, setDriverLocations] = useState<DriverLocation[]>([]);

  useEffect(() => {
    async function fetchLocs() {
      try {
        const locs = await get<DriverLocation[]>("/location/drivers");
        setDriverLocations(locs);
      } catch {
        /* ignore */
      }
    }
    fetchLocs();
    const interval = setInterval(fetchLocs, 15000);
    return () => clearInterval(interval);
  }, []);

  /* ─── Curved line helper ─── */
  function curvedLine(
    start: [number, number],
    end: [number, number],
    segments = 40,
  ): [number, number][] {
    const midLng = (start[0] + end[0]) / 2;
    const midLat = (start[1] + end[1]) / 2;
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return [start, end];
    const offset = dist * 0.2;
    const ctrlLng = midLng + (-dy / dist) * offset;
    const ctrlLat = midLat + (dx / dist) * offset;
    const pts: [number, number][] = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const inv = 1 - t;
      pts.push([
        inv * inv * start[0] + 2 * inv * t * ctrlLng + t * t * end[0],
        inv * inv * start[1] + 2 * inv * t * ctrlLat + t * t * end[1],
      ]);
    }
    return pts;
  }

  /* ─── Map markers / route / bounds for selected shipment ─── */
  const selectedMapMarkers = useMemo((): MapMarker[] => {
    if (!selectedShipment) return [];
    const markers: MapMarker[] = [];

    // Pickup pin
    if (selectedShipment.pickupLat && selectedShipment.pickupLng) {
      markers.push({
        id: "pickup",
        lat: selectedShipment.pickupLat,
        lng: selectedShipment.pickupLng,
        label: "Pickup",
        color: "#2563eb",
        markerType: "pickup",
      });
    }
    // Delivery pin
    if (selectedShipment.deliveryLat && selectedShipment.deliveryLng) {
      markers.push({
        id: "delivery",
        lat: selectedShipment.deliveryLat,
        lng: selectedShipment.deliveryLng,
        label: "Delivery",
        color: "#dc2626",
        markerType: "delivery",
      });
    }
    // Assigned driver pin (from live locations)
    if (selectedShipment._assignedDriverId) {
      const loc = driverLocations.find(
        (l) => l.driverId === selectedShipment._assignedDriverId,
      );
      if (loc) {
        markers.push({
          id: `driver-${loc.driverId}`,
          lat: loc.lat,
          lng: loc.lng,
          label: loc.name,
          color: "#22c55e",
          markerType: "driver",
        });
      }
    }
    return markers;
  }, [selectedShipment, driverLocations]);

  const selectedMapRoute = useMemo((): MapRoute[] => {
    if (
      !selectedShipment?.pickupLat ||
      !selectedShipment?.pickupLng ||
      !selectedShipment?.deliveryLat ||
      !selectedShipment?.deliveryLng
    )
      return [];

    const start: [number, number] = [
      selectedShipment.pickupLng,
      selectedShipment.pickupLat,
    ];
    const end: [number, number] = [
      selectedShipment.deliveryLng,
      selectedShipment.deliveryLat,
    ];

    const statusColor =
      selectedShipment._backendStatus === "EN_ROUTE" ||
      selectedShipment._backendStatus === "PICKED_UP"
        ? "#2563eb"
        : selectedShipment._backendStatus === "ASSIGNED"
          ? "#f59e0b"
          : "#6b7280";

    return [
      {
        id: "selected-route",
        coordinates: curvedLine(start, end),
        color: statusColor,
        highlighted: true,
      },
    ];
  }, [selectedShipment]);

  const selectedMapBounds = useMemo(():
    | [[number, number], [number, number]]
    | undefined => {
    const coords: [number, number][] = [];
    for (const m of selectedMapMarkers) {
      coords.push([m.lng, m.lat]);
    }
    if (coords.length < 2) return undefined;
    let minLng = coords[0][0],
      maxLng = coords[0][0];
    let minLat = coords[0][1],
      maxLat = coords[0][1];
    for (const [lng, lat] of coords) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
    return [
      [minLng, minLat],
      [maxLng, maxLat],
    ];
  }, [selectedMapMarkers]);

  const selectedMapCenter = useMemo((): [number, number] => {
    if (selectedShipment?.pickupLng && selectedShipment?.pickupLat) {
      if (selectedShipment?.deliveryLng && selectedShipment?.deliveryLat) {
        return [
          (selectedShipment.pickupLng + selectedShipment.deliveryLng) / 2,
          (selectedShipment.pickupLat + selectedShipment.deliveryLat) / 2,
        ];
      }
      return [selectedShipment.pickupLng, selectedShipment.pickupLat];
    }
    return [76.78, 30.73];
  }, [selectedShipment]);

  return (
    <div className="flex min-h-screen w-full">
      <DashboardSidebar isDark={isDark} setIsDark={setIsDark} />

      <div className="flex-1 bg-background overflow-auto">
        {/* Top Bar */}
        <header className="sticky top-0 z-10 bg-card backdrop-blur-xl border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Welcome back, {user?.name?.split(" ")[0] ?? "there"}!
              </h1>
              <p className="text-sm text-muted-foreground">
                You have {user?.newDeliveries ?? 0} new delivered{" "}
                {user?.newDeliveries === 1 ? "parcel" : "parcels"}.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateOrder(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create new order
              </button>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsMeta.map((meta) => (
              <div
                key={meta.key}
                className="flex items-center justify-between p-5 rounded-3xl bg-card border border-border shadow-sm"
              >
                <div>
                  <p className="text-sm text-muted-foreground">{meta.label}:</p>
                  {statsLoading ? (
                    <div className="h-9 w-16 bg-secondary rounded animate-pulse mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground mt-1">
                      {stats?.[meta.key] ?? "—"}
                    </p>
                  )}
                </div>
                <div className={`p-3 rounded-full ${meta.bg}`}>
                  <meta.icon className={`h-6 w-6 ${meta.color}`} />
                </div>
              </div>
            ))}
          </div>

          {/* Ongoing Delivery + Map */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ongoing Deliveries */}
            <div>
              <h2 className="text-lg font-bold text-foreground mb-4">
                Ongoing Delivery
              </h2>
              {shipmentsLoading ? (
                <div className="flex items-center justify-center py-16 text-gray-400">
                  <LoadingPackage />
                </div>
              ) : (
                <div className="space-y-3">
                  {shipments
                    ?.filter(
                      (s) =>
                        s.status !== "Delivered" && s.status !== "Cancelled",
                    )
                    .slice(0, 3)
                    .map((s) => (
                      <div
                        key={s.id}
                        onClick={() => setSelectedShipment(s)}
                        className={`p-4 rounded-3xl bg-card border-2 transition-all cursor-pointer ${
                          selectedShipment?.id === s.id
                            ? "border-primary shadow-md"
                            : "border-border hover:border-gray-300 dark:hover:border-gray-700"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              Shipment ID:
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-sm font-bold text-foreground">
                                {s.id}
                              </p>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                                {s.categoryEmoji} {s.category}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {s.courierIcon} {s.courier}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                              <span className="truncate max-w-[140px]">
                                {s.origin}
                              </span>
                              <ArrowRight className="h-3 w-3 shrink-0 text-gray-300" />
                              <span className="truncate max-w-[140px]">
                                {s.destination}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                              Distance to destination: {s.distance}
                            </p>
                          </div>
                          {s.image && (
                            <img
                              src={s.image}
                              alt="Package"
                              className="w-28 h-16 rounded-lg object-cover ml-3 shrink-0"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Map Overview */}
            <div className="relative rounded-3xl overflow-hidden border border-border min-h-[420px]">
              <MapView
                center={selectedMapCenter}
                zoom={11}
                bounds={selectedMapBounds}
                markers={selectedMapMarkers}
                routes={selectedMapRoute}
              />

              {/* Shipment detail popup */}
              {selectedShipment && (
                <div className="absolute bottom-4 left-4 right-4 bg-popover rounded-3xl p-4 shadow-xl z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-sm font-semibold text-foreground">
                        Shipment details
                      </span>
                      <span
                        className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[selectedShipment.status]}`}
                      >
                        • {selectedShipment.status}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedShipment(null)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-6 gap-4 text-center">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase">
                        Driver
                      </p>
                      <p className="text-xs font-medium text-foreground mt-0.5">
                        {selectedShipment.driver ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase">
                        Tracking #
                      </p>
                      <p className="text-xs font-medium text-foreground mt-0.5">
                        {selectedShipment.id}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase">
                        Category
                      </p>
                      <p className="text-xs font-medium text-foreground mt-0.5">
                        {selectedShipment.categoryEmoji}{" "}
                        {selectedShipment.category}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase">
                        Weight
                      </p>
                      <p className="text-xs font-medium text-foreground mt-0.5">
                        {selectedShipment.weight}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase">
                        Payment
                      </p>
                      <p className="text-xs font-medium text-foreground mt-0.5">
                        {selectedShipment.payment}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase">
                        Status
                      </p>
                      <p
                        className={`text-xs font-medium mt-0.5 ${selectedShipment.status === "Shipping" ? "text-blue-500" : "text-orange-500"}`}
                      >
                        {selectedShipment.status}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-[10px] text-gray-400">
                      {selectedShipment.date}
                    </span>
                    <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{
                          width: `${selectedShipment.trackingProgress ?? 25}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {selectedShipment.estimatedDelivery ?? "—"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Track Order Table */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Track Order</h2>
              <div className="flex items-center gap-2 bg-card border border-border rounded-full px-3 py-2">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent outline-none text-sm text-secondary-foreground placeholder:text-gray-400 w-32"
                />
                <span className="text-[10px] text-gray-400 bg-secondary px-1.5 py-0.5 rounded">
                  ⌘F
                </span>
              </div>
            </div>

            <div className="bg-card rounded-3xl border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">
                      <input
                        type="checkbox"
                        className="rounded border-border accent-primary h-4 w-4 cursor-pointer bg-white dark:bg-card border appearance-none checked:appearance-auto"
                      />
                    </th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">
                      Tracking number
                    </th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">
                      Courier service
                    </th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">
                      Category
                    </th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">
                      Shipper date
                    </th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">
                      Destination
                    </th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">
                      Weight
                    </th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">
                      Payment
                    </th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">
                      Status
                    </th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {shipmentsLoading ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="p-8 text-center text-gray-400"
                      >
                        <LoadingPackage />
                      </td>
                    </tr>
                  ) : filteredShipments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="p-8 text-center text-gray-400 text-sm"
                      >
                        No shipments found.
                      </td>
                    </tr>
                  ) : (
                    filteredShipments.map((s) => (
                      <tr
                        key={s.id}
                        className="border-b border-border hover:bg-muted transition-colors"
                      >
                        <td className="p-4">
                          <input
                            type="checkbox"
                            className="rounded border-border accent-primary h-4 w-4 cursor-pointer bg-white dark:bg-card border appearance-none checked:appearance-auto"
                          />
                        </td>
                        <td className="p-4">
                          <span className="text-sm font-semibold text-foreground">
                            {s.id}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-secondary-foreground">
                            {s.courierIcon} {s.courier}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
                            {s.categoryEmoji} {s.category}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {s.date}
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <span className="truncate max-w-[180px]">
                              {s.destination}
                            </span>
                          </span>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {s.weight}
                        </td>
                        <td className="p-4 text-sm font-medium text-foreground">
                          {s.payment}
                        </td>
                        <td className="p-4">
                          <span
                            className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[s.status]}`}
                          >
                            • {s.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            {s.status === "Pending" && (
                              <button
                                onClick={() => {
                                  setAssignShipment(s);
                                  setAssignError("");
                                  setSelectedDriverId("");
                                  // Fetch company drivers
                                  const API_URL =
                                    import.meta.env.VITE_API_URL ||
                                    "http://localhost:8000/api";
                                  const cid =
                                    localStorage.getItem("dc_company_id") || "";
                                  fetch(`${API_URL}/drivers?type=EMPLOYED`, {
                                    headers: { "x-company-id": cid },
                                  })
                                    .then((r) => r.json())
                                    .then((d) => {
                                      if (d.success)
                                        setCompanyDrivers(d.data || []);
                                    })
                                    .catch(() => {});
                                }}
                                title="Assign to driver"
                                className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 hover:text-blue-600 transition-colors"
                              >
                                <UserPlus className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {/* Chat with driver (when assigned) */}
                            {s.status !== "Pending" && s._backendId && (
                              <button
                                onClick={() =>
                                  navigate(
                                    `/dashboard/messages?orderId=${s._backendId}&channel=dispatcher-driver`,
                                  )
                                }
                                title="Chat with driver"
                                className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-500 hover:text-emerald-600 transition-colors"
                              >
                                <Truck className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {/* Chat with recipient */}
                            {s._backendId && (
                              <button
                                onClick={() =>
                                  navigate(
                                    `/dashboard/messages?orderId=${s._backendId}&channel=dispatcher-recipient`,
                                  )
                                }
                                title="Chat with recipient"
                                className="p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-500 hover:text-purple-600 transition-colors"
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Create Order Modal ─── */}
      {showCreateOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-secondary rounded-3xl border border-border shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
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
                  className="w-full px-4 py-2.5 rounded-3xl border border-border bg-card text-sm text-foreground outline-none focus:border-primary resize-none"
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
                    refetch();
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

      {/* ─── Assign Driver Modal ─── */}
      {assignShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-secondary rounded-3xl border border-border shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">
                Assign Driver
              </h2>
              <button
                onClick={() => {
                  setAssignShipment(null);
                  setAssignError("");
                }}
                className="p-1.5 rounded-lg hover:bg-secondary text-gray-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {assignError && (
                <div className="p-3 rounded-3xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                  {assignError}
                </div>
              )}

              <div className="p-3 rounded-3xl bg-muted text-sm">
                <p className="font-semibold text-foreground">
                  {assignShipment.id}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {assignShipment.origin} → {assignShipment.destination}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Select Driver *
                </label>
                <div className="relative">
                  <select
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    className="w-full appearance-none px-4 pe-12 py-2.5 rounded-full border border-border bg-card text-sm text-foreground outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="">Choose a driver...</option>
                    {companyDrivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.user?.name || `Driver #${d.id}`}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                {companyDrivers.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    No drivers found. Add drivers from the Drivers page first.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-border">
              <button
                onClick={() => {
                  setAssignShipment(null);
                  setAssignError("");
                }}
                className="px-4 py-2.5 rounded-full text-sm font-medium text-secondary-foreground hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={assignSubmitting || !selectedDriverId}
                onClick={async () => {
                  setAssignError("");
                  setAssignSubmitting(true);
                  try {
                    const API_URL =
                      import.meta.env.VITE_API_URL ||
                      "http://localhost:8000/api";
                    const backendId = assignShipment._backendId;
                    if (!backendId) throw new Error("Cannot identify order");
                    const res = await fetch(
                      `${API_URL}/orders/${backendId}/assign`,
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "x-company-id":
                            localStorage.getItem("dc_company_id") || "",
                        },
                        body: JSON.stringify({
                          driver_id: parseInt(selectedDriverId, 10),
                        }),
                      },
                    );
                    const data = await res.json();
                    if (!res.ok)
                      throw new Error(
                        data.error?.message || "Failed to assign driver",
                      );
                    setAssignShipment(null);
                    refetch();
                  } catch (err: unknown) {
                    setAssignError(
                      err instanceof Error
                        ? err.message
                        : "Something went wrong",
                    );
                  } finally {
                    setAssignSubmitting(false);
                  }
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {assignSubmitting && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Assign Driver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Tracking Link Success Modal ─── */}
      {createdTrackingLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-secondary rounded-3xl border border-border shadow-2xl w-full max-w-md mx-4 p-6 text-center">
            <div className="h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1">
              Order Created Successfully!
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Share this tracking link with the customer to track their delivery
              in real-time.
            </p>
            <div className="flex items-center gap-2 bg-muted border border-border rounded-full px-4 py-3 mb-4">
              <input
                readOnly
                value={createdTrackingLink}
                className="flex-1 bg-transparent text-sm text-foreground outline-none font-mono"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(createdTrackingLink);
                }}
                className="shrink-0 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                Copy
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCreatedTrackingLink("")}
                className="flex-1 px-4 py-2.5 rounded-full text-sm font-medium text-secondary-foreground hover:bg-secondary transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.open(createdTrackingLink, "_blank");
                  setCreatedTrackingLink("");
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open Tracking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
