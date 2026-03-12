import { useState, useEffect, useMemo } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { useTheme } from "@/hooks/useTheme";
import MapView from "@/components/map/MapView";
import type { MapMarker, MapRoute } from "@/components/map/MapView";
import { get } from "@/lib/api";
import { formatINR } from "@/lib/currency";
import { Truck, Navigation, Layers, MapPin, Package } from "lucide-react";

/* ─── Types ─── */
interface Driver {
  id: number;
  company_id: number | null;
  type: string;
  status: string;
  license_number: string | null;
  name?: string | null;
  email?: string | null;
  user?: { name: string; email: string };
}

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

interface Order {
  id: number;
  tracking_code: string;
  status: string;
  priority: string;
  pickup_address: string | null;
  pickup_lat: string | null;
  pickup_lng: string | null;
  delivery_address: string | null;
  delivery_lat: string | null;
  delivery_lng: string | null;
  listed_price: string | null;
}

/* ─── Map Overview Page ─── */
export default function MapOverviewPage() {
  const { isDark, setIsDark } = useTheme();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [driverLocations, setDriverLocations] = useState<DriverLocation[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [layer, setLayer] = useState<"drivers" | "orders" | "all">("all");

  // Fetch drivers + orders + live driver locations from API
  useEffect(() => {
    async function load() {
      try {
        const [driverData, orderData, locData] = await Promise.all([
          get<Driver[]>("/drivers"),
          get<Order[]>("/orders"),
          get<DriverLocation[]>("/location/drivers"),
        ]);
        setDrivers(driverData);
        setOrders(orderData);
        setDriverLocations(locData);
      } catch {
        setDrivers([]);
        setOrders([]);
        setDriverLocations([]);
      }
    }
    load();
    // Refresh driver locations every 15 seconds
    const interval = setInterval(async () => {
      try {
        const locData = await get<DriverLocation[]>("/location/drivers");
        setDriverLocations(locData);
      } catch {
        /* ignore */
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const activeDrivers = drivers.filter(
    (d) => d.status === "AVAILABLE" || d.status === "BUSY",
  );

  // Active orders (not delivered/cancelled)
  const activeOrders = useMemo(
    () => orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status)),
    [orders],
  );

  // Build order markers from real coordinates
  // When an order is selected, show pickup/delivery pins; otherwise show dots
  const orderMarkers: MapMarker[] = useMemo(() => {
    const markers: MapMarker[] = [];
    for (const o of activeOrders) {
      const isSelected = selectedOrder?.id === o.id;
      // Pickup marker
      if (o.pickup_lat && o.pickup_lng) {
        markers.push({
          id: `order-pickup-${o.id}`,
          lat: parseFloat(o.pickup_lat),
          lng: parseFloat(o.pickup_lng),
          label: `Pickup: ${o.tracking_code}`,
          color: "#2563eb", // blue
          markerType: isSelected ? "pickup" : "dot",
        });
      }
      // Delivery marker
      if (o.delivery_lat && o.delivery_lng) {
        markers.push({
          id: `order-delivery-${o.id}`,
          lat: parseFloat(o.delivery_lat),
          lng: parseFloat(o.delivery_lng),
          label: `Delivery: ${o.tracking_code}`,
          color: "#dc2626", // red
          markerType: isSelected ? "delivery" : "dot",
        });
      }
    }
    return markers;
  }, [activeOrders, selectedOrder]);

  // Build driver markers from live GPS locations
  const driverMarkers: MapMarker[] = useMemo(() => {
    return driverLocations.map((loc) => {
      const isSelected = selectedDriver?.id === loc.driverId;
      return {
        id: `driver-${loc.driverId}`,
        lat: loc.lat,
        lng: loc.lng,
        label: loc.name,
        status:
          loc.status === "AVAILABLE"
            ? ("available" as const)
            : loc.status === "BUSY"
              ? ("busy" as const)
              : ("offline" as const),
        markerType: isSelected ? ("driver" as const) : ("dot" as const),
      };
    });
  }, [driverLocations, selectedDriver]);

  // Generate a curved arc between two points (bezier-style)
  function curvedLine(
    start: [number, number],
    end: [number, number],
    segments = 40,
  ): [number, number][] {
    const midLng = (start[0] + end[0]) / 2;
    const midLat = (start[1] + end[1]) / 2;

    // Perpendicular offset for the control point
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const dist = Math.sqrt(dx * dx + dy * dy);
    const offset = dist * 0.2; // 20% of distance as curvature

    // Control point offset perpendicular to the line
    const ctrlLng = midLng + (-dy / dist) * offset;
    const ctrlLat = midLat + (dx / dist) * offset;

    const points: [number, number][] = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const invT = 1 - t;
      // Quadratic bezier: B(t) = (1-t)²·P0 + 2(1-t)t·C + t²·P1
      const lng =
        invT * invT * start[0] + 2 * invT * t * ctrlLng + t * t * end[0];
      const lat =
        invT * invT * start[1] + 2 * invT * t * ctrlLat + t * t * end[1];
      points.push([lng, lat]);
    }
    return points;
  }

  // Build curved route lines from pickup → delivery for each order
  const orderRoutes: MapRoute[] = useMemo(() => {
    const routes: MapRoute[] = [];
    for (const o of activeOrders) {
      if (o.pickup_lat && o.pickup_lng && o.delivery_lat && o.delivery_lng) {
        const start: [number, number] = [
          parseFloat(o.pickup_lng),
          parseFloat(o.pickup_lat),
        ];
        const end: [number, number] = [
          parseFloat(o.delivery_lng),
          parseFloat(o.delivery_lat),
        ];
        const isSelected = selectedOrder?.id === o.id;
        const statusColor =
          o.status === "ASSIGNED"
            ? "#f59e0b"
            : o.status === "PICKED_UP" || o.status === "EN_ROUTE"
              ? "#2563eb"
              : o.status === "LISTED"
                ? "#a855f7"
                : "#6b7280";
        routes.push({
          id: `route-${o.id}`,
          coordinates: curvedLine(start, end),
          color: statusColor,
          highlighted: isSelected,
        });
      }
    }
    return routes;
  }, [activeOrders, selectedOrder]);

  // Combine markers based on layer filter
  const mapMarkers = useMemo(() => {
    if (layer === "drivers") return driverMarkers;
    if (layer === "orders") return orderMarkers;
    return [...driverMarkers, ...orderMarkers];
  }, [layer, driverMarkers, orderMarkers]);

  // Filter routes by layer
  const mapRoutes = useMemo(() => {
    if (layer === "drivers") return [];
    return orderRoutes;
  }, [layer, orderRoutes]);

  // Compute bounds from all order + driver coordinates to auto-fit the map
  const mapBounds = useMemo(():
    | [[number, number], [number, number]]
    | undefined => {
    const coords: [number, number][] = [];
    for (const o of orders) {
      if (o.pickup_lat && o.pickup_lng)
        coords.push([parseFloat(o.pickup_lng), parseFloat(o.pickup_lat)]);
      if (o.delivery_lat && o.delivery_lng)
        coords.push([parseFloat(o.delivery_lng), parseFloat(o.delivery_lat)]);
    }
    for (const loc of driverLocations) {
      coords.push([loc.lng, loc.lat]);
    }
    if (coords.length === 0) return undefined;
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
  }, [orders, driverLocations]);

  // Center fallback: centroid of all coordinates, or default
  const mapCenter = useMemo((): [number, number] => {
    const coords: [number, number][] = [];
    for (const o of orders) {
      if (o.pickup_lat && o.pickup_lng)
        coords.push([parseFloat(o.pickup_lng), parseFloat(o.pickup_lat)]);
      if (o.delivery_lat && o.delivery_lng)
        coords.push([parseFloat(o.delivery_lng), parseFloat(o.delivery_lat)]);
    }
    for (const loc of driverLocations) {
      coords.push([loc.lng, loc.lat]);
    }
    if (coords.length === 0) return [76.78, 30.73]; // Default fallback
    const avgLng = coords.reduce((s, c) => s + c[0], 0) / coords.length;
    const avgLat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
    return [avgLng, avgLat];
  }, [orders, driverLocations]);

  function handleMarkerClick(marker: MapMarker) {
    if (marker.id.startsWith("driver-")) {
      const driver = drivers.find((d) => `driver-${d.id}` === marker.id);
      setSelectedDriver(driver ?? null);
      setSelectedOrder(null);
    } else if (marker.id.startsWith("order-")) {
      const orderId = parseInt(
        marker.id.replace(/^order-(pickup|delivery)-/, ""),
      );
      const order = orders.find((o) => o.id === orderId);
      setSelectedOrder(order ?? null);
      setSelectedDriver(null);
    }
  }

  return (
    <div className="flex min-h-screen w-full">
      <DashboardSidebar isDark={isDark} setIsDark={setIsDark} />
      <div className="flex-1 bg-background relative overflow-hidden">
        {/* MapLibre GL Map */}
        <div className="absolute inset-0">
          <MapView
            center={mapCenter}
            zoom={11}
            bounds={mapBounds}
            markers={mapMarkers}
            routes={mapRoutes}
            onMarkerClick={handleMarkerClick}
          />
        </div>

        {/* Top-left Stats overlay */}
        <div className="absolute top-4 left-4 z-10 space-y-2">
          <div className="bg-secondary rounded-3xl shadow-lg p-4 w-64">
            <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Navigation className="h-4 w-4 text-primary" />
              Fleet Overview
            </h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Active Drivers
                </span>
                <span className="text-sm font-bold text-green-600">
                  {activeDrivers.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Live Tracking
                </span>
                <span className="text-sm font-bold text-primary">
                  {driverLocations.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Active Orders
                </span>
                <span className="text-sm font-bold text-primary">
                  {activeOrders.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Total Orders
                </span>
                <span className="text-sm font-bold text-foreground">
                  {orders.length}
                </span>
              </div>
            </div>
          </div>

          {/* Layer controls */}
          <div className="bg-secondary rounded-full shadow-lg p-3">
            <div className="flex items-center gap-1">
              {(["all", "drivers", "orders"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLayer(l)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    layer === l
                      ? "bg-primary/10 text-primary"
                      : "text-gray-500 hover:bg-secondary"
                  }`}
                >
                  <Layers className="h-3 w-3" />
                  {l === "all" ? "All" : l === "drivers" ? "Drivers" : "Orders"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Driver detail card */}
        {selectedDriver && (
          <div className="absolute bottom-4 left-4 z-10 bg-secondary rounded-3xl shadow-2xl p-5 w-80">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    selectedDriver.status === "BUSY"
                      ? "bg-primary"
                      : selectedDriver.status === "AVAILABLE"
                        ? "bg-green-500"
                        : "bg-gray-400"
                  }`}
                >
                  <Truck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {selectedDriver.name ??
                      selectedDriver.user?.name ??
                      `Driver #${selectedDriver.id}`}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {selectedDriver.type.toLowerCase()} driver
                  </p>
                </div>
              </div>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  selectedDriver.status === "BUSY"
                    ? "bg-amber-50 text-amber-600 dark:bg-amber-900/30"
                    : selectedDriver.status === "AVAILABLE"
                      ? "bg-green-50 text-green-600 dark:bg-green-900/30"
                      : "bg-gray-100 text-gray-500 dark:bg-gray-800"
                }`}
              >
                {selectedDriver.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-lg bg-muted/50">
                <p className="text-[10px] uppercase text-muted-foreground">
                  Type
                </p>
                <p className="text-sm font-bold text-foreground capitalize">
                  {selectedDriver.type.toLowerCase()}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/50">
                <p className="text-[10px] uppercase text-muted-foreground">
                  License
                </p>
                <p className="text-sm font-bold text-foreground">
                  {selectedDriver.license_number ?? "—"}
                </p>
              </div>
            </div>

            {(() => {
              const loc = driverLocations.find(
                (l) => l.driverId === selectedDriver.id,
              );
              if (!loc)
                return (
                  <p className="mt-3 text-xs text-muted-foreground text-center">
                    No live location available
                  </p>
                );
              return (
                <div className="mt-3 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Navigation className="h-3 w-3 text-primary" />
                    <p className="text-[10px] uppercase text-primary font-semibold">
                      Live Location
                    </p>
                  </div>
                  <p className="text-xs text-foreground">
                    {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
                  </p>
                  {loc.speed !== null && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {loc.speed.toFixed(1)} km/h
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Updated {new Date(loc.recordedAt).toLocaleTimeString()}
                  </p>
                </div>
              );
            })()}

            <button
              onClick={() => setSelectedDriver(null)}
              className="mt-3 w-full text-xs text-center text-muted-foreground hover:text-foreground transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {/* Order detail card */}
        {selectedOrder && (
          <div className="absolute bottom-4 left-4 z-10 bg-secondary rounded-3xl shadow-2xl p-5 w-80">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full flex items-center justify-center bg-primary/10 text-primary text-sm font-bold">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {selectedOrder.tracking_code}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {selectedOrder.priority.toLowerCase()} priority
                  </p>
                </div>
              </div>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  selectedOrder.status === "ASSIGNED"
                    ? "bg-amber-50 text-amber-600 dark:bg-amber-900/30"
                    : selectedOrder.status === "PICKED_UP" ||
                        selectedOrder.status === "EN_ROUTE"
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30"
                      : selectedOrder.status === "LISTED"
                        ? "bg-purple-50 text-purple-600 dark:bg-purple-900/30"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800"
                }`}
              >
                {selectedOrder.status}
              </span>
            </div>

            <div className="space-y-2">
              {selectedOrder.pickup_address && (
                <div className="p-2.5 rounded-lg bg-muted/50">
                  <p className="text-[10px] uppercase text-muted-foreground">
                    Pickup
                  </p>
                  <p className="text-xs font-medium text-foreground truncate">
                    {selectedOrder.pickup_address}
                  </p>
                </div>
              )}
              {selectedOrder.delivery_address && (
                <div className="p-2.5 rounded-lg bg-muted/50">
                  <p className="text-[10px] uppercase text-muted-foreground">
                    Delivery
                  </p>
                  <p className="text-xs font-medium text-foreground truncate">
                    {selectedOrder.delivery_address}
                  </p>
                </div>
              )}
              {selectedOrder.listed_price && (
                <div className="p-2.5 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <p className="text-[10px] uppercase text-muted-foreground">
                    Price
                  </p>
                  <p className="text-sm font-bold text-green-600">
                    {formatINR(parseFloat(selectedOrder.listed_price))}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="mt-3 w-full text-xs text-center text-muted-foreground hover:text-foreground transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {/* Right side panel — Drivers & Orders */}
        <div className="absolute top-4 right-4 z-10 bg-secondary rounded-3xl shadow-lg w-60 max-h-[70vh] overflow-y-auto">
          {/* Orders section */}
          {(layer === "all" || layer === "orders") && (
            <>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide p-3 border-b border-border flex items-center gap-1.5">
                <MapPin className="h-3 w-3" />
                Orders {activeOrders.length > 0 && `(${activeOrders.length})`}
              </p>
              {activeOrders.length === 0 ? (
                <p className="text-xs text-muted-foreground p-4 text-center">
                  No active orders
                </p>
              ) : (
                activeOrders.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => {
                      setSelectedOrder(o);
                      setSelectedDriver(null);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted transition-colors text-left ${
                      selectedOrder?.id === o.id ? "bg-primary/5" : ""
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        o.status === "UNASSIGNED"
                          ? "bg-red-500"
                          : o.status === "LISTED"
                            ? "bg-purple-500"
                            : o.status === "ASSIGNED"
                              ? "bg-amber-500"
                              : "bg-blue-500"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {o.tracking_code}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {o.delivery_address?.split(",")[0] ?? "No address"} ·{" "}
                        {o.status.toLowerCase().replace("_", " ")}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </>
          )}

          {/* Drivers section */}
          {(layer === "all" || layer === "drivers") && (
            <>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide p-3 border-b border-border flex items-center gap-1.5">
                <Truck className="h-3 w-3" />
                Drivers {drivers.length > 0 && `(${drivers.length})`}
              </p>
              {drivers.length === 0 ? (
                <p className="text-xs text-muted-foreground p-4 text-center">
                  No drivers found
                </p>
              ) : (
                drivers.map((d) => {
                  const hasLocation = driverLocations.some(
                    (l) => l.driverId === d.id,
                  );
                  return (
                    <button
                      key={d.id}
                      onClick={() => {
                        setSelectedDriver(d);
                        setSelectedOrder(null);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted transition-colors text-left ${
                        selectedDriver?.id === d.id ? "bg-primary/5" : ""
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          d.status === "AVAILABLE"
                            ? "bg-green-500"
                            : d.status === "BUSY"
                              ? "bg-amber-500"
                              : "bg-gray-300"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground truncate">
                          {d.name ?? d.user?.name ?? `Driver #${d.id}`}
                        </p>
                        <p className="text-[10px] text-muted-foreground capitalize">
                          {d.type.toLowerCase()} · {d.status.toLowerCase()}
                        </p>
                      </div>
                      {hasLocation && (
                        <Navigation className="h-3 w-3 text-primary shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
