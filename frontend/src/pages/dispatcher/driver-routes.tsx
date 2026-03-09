/**
 * Dispatcher Driver Routes Page — /dispatcher/driver-routes
 *
 * Dispatchers see independent drivers' pre-registered travel routes
 * and can match them with pending orders along the way.
 */

import { useState, useEffect, useCallback } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { useTheme } from "@/hooks/useTheme";
import { get, post } from "@/lib/api";
import {
  Route,
  MapPin,
  ArrowRight,
  Loader2,
  Search,
  Users,
  CalendarClock,
  Phone,
  Mail,
  Navigation,
  Package,
  Truck,
  RefreshCw,
  X,
  CheckCircle2,
  Circle,
  UserPlus,
} from "lucide-react";
import LoadingPackage from "@/components/ui/loading-package";

/* ─── Types ─── */
interface RouteUser {
  id: number;
  name: string;
  phone: string;
  email: string;
}

interface RouteDriver {
  id: number;
  type: string;
  user?: RouteUser;
}

interface ActiveRoute {
  id: number;
  driver_id: number;
  start_address: string | null;
  start_lat: string;
  start_lng: string;
  end_address: string | null;
  end_lat: string;
  end_lng: string;
  departure_time: string;
  is_active: boolean;
  driver?: RouteDriver;
}

interface MatchedDriver {
  driver: RouteDriver;
  route: {
    id: number;
    startAddress: string | null;
    endAddress: string | null;
    departureTime: string;
    startLat: string;
    startLng: string;
    endLat: string;
    endLng: string;
  };
  matchType: "full" | "pickup" | "delivery" | "enroute";
  pickupDistance: number;
  deliveryDistance: number;
  matches: {
    pickupNearStart: boolean;
    pickupNearEnd: boolean;
    pickupOnRoute: boolean;
    deliveryNearStart: boolean;
    deliveryNearEnd: boolean;
    deliveryOnRoute: boolean;
  };
  distances: {
    pickupToStart: number;
    pickupToEnd: number;
    pickupToRoute: number;
    deliveryToStart: number;
    deliveryToEnd: number;
    deliveryToRoute: number;
  };
}

interface UnassignedOrder {
  id: number;
  pickup_address: string;
  delivery_address: string;
  pickup_lat: string;
  pickup_lng: string;
  delivery_lat: string;
  delivery_lng: string;
  weight_kg: number;
  priority: string;
  status: string;
}

/* ─── Component ─── */
export default function DispatcherDriverRoutesPage() {
  const { isDark, setIsDark } = useTheme();
  const [activeRoutes, setActiveRoutes] = useState<ActiveRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Match modal
  const [matchOrder, setMatchOrder] = useState<UnassignedOrder | null>(null);
  const [matchResults, setMatchResults] = useState<MatchedDriver[]>([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [unassignedOrders, setUnassignedOrders] = useState<UnassignedOrder[]>(
    [],
  );
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [showMatchPanel, setShowMatchPanel] = useState(false);

  // Assign state
  const [assigningDriverId, setAssigningDriverId] = useState<number | null>(
    null,
  );
  const [assignedDriverIds, setAssignedDriverIds] = useState<Set<number>>(
    new Set(),
  );
  const [assignError, setAssignError] = useState("");

  const loadRoutes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await get<ActiveRoute[]>("/drivers/routes/active");
      setActiveRoutes(data);
    } catch {
      // no-op
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUnassignedOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const data = await get<UnassignedOrder[]>(
        "/orders?status=UNASSIGNED,LISTED",
      );
      setUnassignedOrders(data);
    } catch {
      // no-op
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  const handleFindMatches = async (order: UnassignedOrder) => {
    setMatchOrder(order);
    setMatchLoading(true);
    setShowMatchPanel(true);
    try {
      const qs = new URLSearchParams({
        pickup_lat: order.pickup_lat,
        pickup_lng: order.pickup_lng,
        delivery_lat: order.delivery_lat,
        delivery_lng: order.delivery_lng,
        radius: "15",
      }).toString();
      const data = await get<MatchedDriver[]>(`/drivers/routes/nearby?${qs}`);
      setMatchResults(data);
    } catch {
      setMatchResults([]);
    } finally {
      setMatchLoading(false);
    }
  };

  const handleAssign = async (driverId: number) => {
    if (!matchOrder) return;
    setAssigningDriverId(driverId);
    setAssignError("");
    try {
      await post(`/orders/${matchOrder.id}/assign`, {
        driver_id: driverId,
        route_match: true,
      });
      setAssignedDriverIds((prev) => new Set(prev).add(driverId));
    } catch (err: unknown) {
      setAssignError(
        err instanceof Error ? err.message : "Failed to assign driver",
      );
    } finally {
      setAssigningDriverId(null);
    }
  };

  const filteredRoutes = activeRoutes.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const driverName = r.driver?.user?.name?.toLowerCase() ?? "";
    const startAddr = (r.start_address ?? "").toLowerCase();
    const endAddr = (r.end_address ?? "").toLowerCase();
    return (
      driverName.includes(q) || startAddr.includes(q) || endAddr.includes(q)
    );
  });

  const formatDeparture = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDistanceKm = (km: number) => {
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)} km`;
  };

  const priorityColors: Record<string, string> = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    high: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    urgent: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div className="flex min-h-screen w-full">
      <DashboardSidebar isDark={isDark} setIsDark={setIsDark} />

      <div className="flex-1 bg-background overflow-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card backdrop-blur-xl border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Route className="h-5 w-5 text-primary" />
              Driver Routes
            </h1>
            <p className="text-sm text-muted-foreground">
              Independent drivers' upcoming travel routes — match orders along
              the way
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                loadUnassignedOrders();
                setShowMatchPanel(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Package className="h-4 w-4" />
              Match Orders
            </button>
            <button
              onClick={loadRoutes}
              className="p-2.5 rounded-full border border-border text-muted-foreground hover:bg-muted transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-6 flex gap-6">
          {/* ── Main list ── */}
          <div className="flex-1 max-w-3xl">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by driver name or address..."
                className="w-full pl-10 pr-4 py-2.5 rounded-full border border-border bg-muted text-foreground outline-none focus:border-primary text-sm"
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="p-4 rounded-3xl bg-card border border-border">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Navigation className="h-3.5 w-3.5" />
                  Active Routes
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {activeRoutes.length}
                </p>
              </div>
              <div className="p-4 rounded-3xl bg-card border border-border">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Users className="h-3.5 w-3.5" />
                  Unique Drivers
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {new Set(activeRoutes.map((r) => r.driver_id)).size}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <LoadingPackage />
              </div>
            ) : filteredRoutes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Navigation className="h-7 w-7 text-muted-foreground" />
                </div>
                <h2 className="text-base font-bold text-foreground mb-1">
                  {searchQuery ? "No matching routes" : "No active routes"}
                </h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {searchQuery
                    ? "Try a different search query."
                    : "Independent drivers haven't registered upcoming travel routes yet."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRoutes.map((route) => (
                  <div
                    key={route.id}
                    className="p-5 rounded-3xl bg-card border border-border shadow-sm hover:border-primary/30 transition-all"
                  >
                    {/* Driver info */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                          {route.driver?.user?.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .substring(0, 2)
                            .toUpperCase() ?? "D"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {route.driver?.user?.name ?? "Driver"}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            {route.driver?.user?.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {route.driver.user.phone}
                              </span>
                            )}
                            {route.driver?.user?.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {route.driver.user.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                        Independent
                      </span>
                    </div>

                    {/* Route path */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="h-7 w-7 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                          <MapPin className="h-3.5 w-3.5 text-blue-500" />
                        </div>
                        <p className="text-sm text-foreground truncate">
                          {route.start_address ||
                            `${parseFloat(route.start_lat).toFixed(3)}, ${parseFloat(route.start_lng).toFixed(3)}`}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="h-7 w-7 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                          <MapPin className="h-3.5 w-3.5 text-green-500" />
                        </div>
                        <p className="text-sm text-foreground truncate">
                          {route.end_address ||
                            `${parseFloat(route.end_lat).toFixed(3)}, ${parseFloat(route.end_lng).toFixed(3)}`}
                        </p>
                      </div>
                    </div>

                    {/* Departure */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {formatDeparture(route.departure_time)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Match Panel (side panel) ── */}
          {showMatchPanel && (
            <div className="w-96 shrink-0 sticky top-20 h-[calc(100vh-6rem)] overflow-auto rounded-3xl bg-card border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary" />
                  Order → Route Match
                </h3>
                <button
                  onClick={() => {
                    setShowMatchPanel(false);
                    setMatchOrder(null);
                    setMatchResults([]);
                    setAssignedDriverIds(new Set());
                    setAssignError("");
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {!matchOrder ? (
                /* ── Step 1: pick an order ── */
                <div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Select a pending order to find drivers with matching routes:
                  </p>
                  {ordersLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <LoadingPackage />
                    </div>
                  ) : unassignedOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">
                        No unassigned orders to match.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[calc(100vh-14rem)] overflow-auto">
                      {unassignedOrders.map((order) => (
                        <button
                          key={order.id}
                          onClick={() => handleFindMatches(order)}
                          className="w-full text-left p-3.5 rounded-2xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-mono text-muted-foreground">
                              #{order.id}
                            </span>
                            <span
                              className={`text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full ${priorityColors[order.priority] ?? priorityColors.low}`}
                            >
                              {order.priority}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-xs text-foreground">
                              <MapPin className="h-3 w-3 text-blue-500 shrink-0" />
                              <span className="truncate">
                                {order.pickup_address}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-foreground">
                              <MapPin className="h-3 w-3 text-green-500 shrink-0" />
                              <span className="truncate">
                                {order.delivery_address}
                              </span>
                            </div>
                          </div>
                          {order.weight_kg && (
                            <p className="text-[10px] text-muted-foreground mt-1.5">
                              {order.weight_kg} kg
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* ── Step 2: show matches ── */
                <div>
                  <button
                    onClick={() => {
                      setMatchOrder(null);
                      setMatchResults([]);
                      setAssignedDriverIds(new Set());
                      setAssignError("");
                    }}
                    className="text-xs text-primary hover:underline mb-3 block"
                  >
                    ← Pick a different order
                  </button>

                  {/* Selected order summary */}
                  <div className="p-3 rounded-2xl bg-primary/5 border border-primary/10 mb-4">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                      Matching for Order #{matchOrder.id}
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-foreground">
                        <MapPin className="h-3 w-3 text-blue-500 shrink-0" />
                        <span className="truncate">
                          {matchOrder.pickup_address}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-foreground">
                        <MapPin className="h-3 w-3 text-green-500 shrink-0" />
                        <span className="truncate">
                          {matchOrder.delivery_address}
                        </span>
                      </div>
                    </div>
                  </div>

                  {matchLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <LoadingPackage />
                    </div>
                  ) : matchResults.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                        <Navigation className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1">
                        No matching routes
                      </p>
                      <p className="text-xs text-muted-foreground">
                        No drivers have routes near this order's pickup and
                        delivery locations. Try increasing the radius.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        {matchResults.length} driver
                        {matchResults.length !== 1 ? "s" : ""} with matching
                        routes:
                      </p>
                      {matchResults.map((match) => {
                        const pickupMatched =
                          match.matches.pickupNearStart ||
                          match.matches.pickupNearEnd ||
                          match.matches.pickupOnRoute;
                        const deliveryMatched =
                          match.matches.deliveryNearStart ||
                          match.matches.deliveryNearEnd ||
                          match.matches.deliveryOnRoute;

                        const matchBadge: Record<
                          string,
                          { label: string; color: string }
                        > = {
                          full: {
                            label: "Full Match",
                            color:
                              "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400",
                          },
                          pickup: {
                            label: "Pickup Match",
                            color:
                              "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
                          },
                          delivery: {
                            label: "Delivery Match",
                            color:
                              "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
                          },
                          enroute: {
                            label: "En Route",
                            color:
                              "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
                          },
                        };

                        const badge =
                          matchBadge[match.matchType] ?? matchBadge.enroute;

                        return (
                          <div
                            key={`${match.driver.id}-${match.route.id}`}
                            className={`p-4 rounded-2xl border transition-all ${
                              match.matchType === "full"
                                ? "border-green-300 dark:border-green-700 bg-green-50/30 dark:bg-green-900/10"
                                : "border-border hover:border-primary/30"
                            }`}
                          >
                            {/* Driver + badge */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                  {match.driver.user?.name
                                    ?.split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .substring(0, 2)
                                    .toUpperCase() ?? "D"}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-foreground">
                                    {match.driver.user?.name ?? "Driver"}
                                  </p>
                                  {match.driver.user?.phone && (
                                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                      <Phone className="h-2.5 w-2.5" />
                                      {match.driver.user.phone}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <span
                                className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${badge.color}`}
                              >
                                {badge.label}
                              </span>
                            </div>

                            {/* Route */}
                            <div className="text-xs space-y-1 mb-3">
                              <div className="flex items-center gap-1.5 text-foreground">
                                <MapPin className="h-3 w-3 text-blue-500 shrink-0" />
                                <span className="truncate">
                                  {match.route.startAddress ?? "Start"}
                                </span>
                                <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="truncate">
                                  {match.route.endAddress ?? "End"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <CalendarClock className="h-3 w-3" />
                                {formatDeparture(match.route.departureTime)}
                              </div>
                            </div>

                            {/* Match details — Pickup */}
                            <div className="space-y-2">
                              <div
                                className={`p-2.5 rounded-xl border ${
                                  pickupMatched
                                    ? "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/15"
                                    : "border-border bg-muted/30"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                    {pickupMatched ? (
                                      <CheckCircle2 className="h-3 w-3" />
                                    ) : (
                                      <Circle className="h-3 w-3 text-muted-foreground" />
                                    )}
                                    Pickup
                                  </p>
                                  <span
                                    className={`text-[10px] font-bold ${pickupMatched ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`}
                                  >
                                    {formatDistanceKm(match.pickupDistance)}{" "}
                                    away
                                  </span>
                                </div>
                                {pickupMatched && (
                                  <div className="flex flex-wrap gap-1">
                                    {match.matches.pickupNearStart && (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-800/40 dark:text-blue-300">
                                        Near route start •{" "}
                                        {match.distances.pickupToStart} km
                                      </span>
                                    )}
                                    {match.matches.pickupNearEnd && (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-800/40 dark:text-blue-300">
                                        Near route end •{" "}
                                        {match.distances.pickupToEnd} km
                                      </span>
                                    )}
                                    {match.matches.pickupOnRoute && (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-800/40 dark:text-blue-300">
                                        Along the route •{" "}
                                        {match.distances.pickupToRoute} km
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Match details — Delivery */}
                              <div
                                className={`p-2.5 rounded-xl border ${
                                  deliveryMatched
                                    ? "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/15"
                                    : "border-border bg-muted/30"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-green-600 dark:text-green-400 flex items-center gap-1">
                                    {deliveryMatched ? (
                                      <CheckCircle2 className="h-3 w-3" />
                                    ) : (
                                      <Circle className="h-3 w-3 text-muted-foreground" />
                                    )}
                                    Delivery
                                  </p>
                                  <span
                                    className={`text-[10px] font-bold ${deliveryMatched ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}
                                  >
                                    {formatDistanceKm(match.deliveryDistance)}{" "}
                                    away
                                  </span>
                                </div>
                                {deliveryMatched && (
                                  <div className="flex flex-wrap gap-1">
                                    {match.matches.deliveryNearStart && (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-800/40 dark:text-green-300">
                                        Near route start •{" "}
                                        {match.distances.deliveryToStart} km
                                      </span>
                                    )}
                                    {match.matches.deliveryNearEnd && (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-800/40 dark:text-green-300">
                                        Near route end •{" "}
                                        {match.distances.deliveryToEnd} km
                                      </span>
                                    )}
                                    {match.matches.deliveryOnRoute && (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-800/40 dark:text-green-300">
                                        Along the route •{" "}
                                        {match.distances.deliveryToRoute} km
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Assign action */}
                            <div className="mt-3 pt-3 border-t border-border">
                              {assignedDriverIds.has(match.driver.id) ? (
                                <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span className="font-medium">
                                    Assigned to{" "}
                                    {match.driver.user?.name ?? "driver"}!
                                  </span>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {assignError &&
                                    assigningDriverId === null && (
                                      <p className="text-[10px] text-red-500">
                                        {assignError}
                                      </p>
                                    )}
                                  <button
                                    onClick={() =>
                                      handleAssign(match.driver.id)
                                    }
                                    disabled={assigningDriverId !== null}
                                    className="w-full flex items-center justify-center gap-2 py-2 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                                  >
                                    {assigningDriverId === match.driver.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <UserPlus className="h-3.5 w-3.5" />
                                    )}
                                    Assign this driver
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
