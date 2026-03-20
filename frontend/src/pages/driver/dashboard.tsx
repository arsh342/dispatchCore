import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DriverSidebar } from "@/components/dashboard/driver-sidebar";
import { useGeolocationPing } from "@/hooks/location/useGeolocationPing";
import {
  useDriverUser,
  useDriverStats,
  useActiveDeliveries,
  useCompletedDeliveries,
  useRecentBids,
  useEarningsChart,
} from "@/hooks/driver/useDashboard";
import { updateDriverStatus } from "@/services/driver/dashboard";
import {
  Search,
  IndianRupee,
  Truck,
  CheckCircle2,
  Star,
  Timer,
  TrendingUp,
  MapPin,
  ArrowRight,
  Package,
  Gavel,
  Clock,
  XCircle,
  Navigation,
  Zap,
  MessageSquare,
} from "lucide-react";
import LoadingPackage from "@/components/ui/loading-package";
import { formatINR } from "@/lib/currency";

/* ─── Status styling ─── */
const deliveryStatusConfig: Record<string, { label: string; color: string }> = {
  ASSIGNED: {
    label: "Assigned",
    color: "text-amber-500 bg-amber-50 dark:bg-amber-900/20",
  },
  PICKED_UP: {
    label: "Picked Up",
    color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
  },
  EN_ROUTE: {
    label: "En Route",
    color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20",
  },
  ARRIVING: {
    label: "Arriving",
    color: "text-green-500 bg-green-50 dark:bg-green-900/20",
  },
  DELIVERED: {
    label: "Delivered",
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
  },
};

const bidStatusConfig = {
  pending: {
    label: "Pending",
    color: "text-amber-500 bg-amber-50 dark:bg-amber-900/20",
    icon: Clock,
  },
  accepted: {
    label: "Won",
    color: "text-green-500 bg-green-50 dark:bg-green-900/20",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Lost",
    color: "text-red-400 bg-red-50 dark:bg-red-900/20",
    icon: XCircle,
  },
};

/* ─── Driver Dashboard ─── */
export default function DriverDashboardPage() {
  const navigate = useNavigate();
  const [deliveryTab, setDeliveryTab] = useState<"active" | "completed">(
    "active",
  );
  const { data: user, loading: userLoading } = useDriverUser();
  const { data: stats, loading: statsLoading } = useDriverStats();
  const { data: deliveries, loading: deliveriesLoading } =
    useActiveDeliveries();
  const { data: completedDeliveries, loading: completedLoading } =
    useCompletedDeliveries();
  const { data: bids, loading: bidsLoading } = useRecentBids();
  const { data: earnings, loading: chartLoading } = useEarningsChart();

  // Track driver location
  useGeolocationPing();

  const maxEarning = earnings
    ? Math.max(...earnings.map((e) => e.amount))
    : 100;

  // Status Toggle
  const [statusOverride, setStatusOverride] = useState<string | null>(null);
  const localStatus = statusOverride ?? user?.status ?? "offline";

  const toggleStatus = async () => {
    const newStatus = localStatus === "online" ? "offline" : "online";
    setStatusOverride(newStatus); // Optimistic UI update
    try {
      await updateDriverStatus(newStatus);
    } catch (error) {
      console.error("Failed to update status:", error);
      // Revert on failure
      setStatusOverride(null);
    }
  };

  if (statsLoading || userLoading || deliveriesLoading || bidsLoading || chartLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <LoadingPackage text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen w-full`}>
      <DriverSidebar
        userName={user?.name}
      />

      <div className="flex-1 bg-background overflow-auto">
        {/* ═══ Top Bar ═══ */}
        <header className="sticky top-0 z-10 bg-card backdrop-blur-xl border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Welcome back, {user?.name?.split(" ")[0] ?? "Driver"}!
              </h1>
              <p className="text-sm text-muted-foreground">
                You have {stats?.activeDeliveries ?? 0} active deliver
                {stats?.activeDeliveries === 1 ? "y" : "ies"} today.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Status toggle */}
              <button
                onClick={toggleStatus}
                className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 transition-colors rounded-full px-3 py-2 cursor-pointer"
              >
                <span
                  className={`h-2 w-2 rounded-full ${localStatus === "online" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-gray-400"}`}
                />
                <span className="text-xs font-medium text-secondary-foreground capitalize">
                  {localStatus}
                </span>
              </button>
              <div className="flex items-center gap-2 bg-card border border-border rounded-full px-3 py-2">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent outline-none text-sm w-32 text-secondary-foreground placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* ═══ Stats Row ═══ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statsLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[100px] bg-card rounded-3xl border border-border animate-pulse"
                  />
                ))
              : [
                  {
                    label: "Today's Earnings",
                    value: formatINR(stats?.todayEarnings ?? 0),
                    sub: `${formatINR(stats?.weekEarnings ?? 0, { maximumFractionDigits: 0, minimumFractionDigits: 0 })} this week`,
                    icon: IndianRupee,
                    color: "text-stone-600",
                    bg: "bg-stone-100 dark:bg-stone-800/20",
                  },
                  {
                    label: "Active Deliveries",
                    value: stats?.activeDeliveries ?? 0,
                    sub: `${stats?.completedToday ?? 0} completed today`,
                    icon: Truck,
                    color: "text-stone-600",
                    bg: "bg-stone-100 dark:bg-stone-800/20",
                  },
                  {
                    label: "Driver Rating",
                    value: `${stats?.rating ?? 0} ★`,
                    sub: `${stats?.completedTotal ?? 0} total deliveries`,
                    icon: Star,
                    color: "text-stone-600",
                    bg: "bg-stone-100 dark:bg-stone-800/20",
                  },
                  {
                    label: "Performance",
                    value: `${stats?.onTimeRate ?? 0}%`,
                    sub: `${stats?.acceptanceRate ?? 0}% acceptance`,
                    icon: Zap,
                    color: "text-stone-600",
                    bg: "bg-stone-100 dark:bg-stone-800/20",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="p-5 bg-card rounded-3xl border border-border shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-muted-foreground font-medium">
                        {stat.label}
                      </p>
                      <div
                        className={`h-8 w-8 rounded-full ${stat.bg} flex items-center justify-center`}
                      >
                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
                  </div>
                ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ═══ Active Deliveries ═══ */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-primary" />
                  Deliveries
                </h2>
                <div className="flex items-center gap-1 bg-secondary rounded-full p-1">
                  <button
                    onClick={() => setDeliveryTab("active")}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${deliveryTab === "active" ? "bg-white dark:bg-ring text-foreground shadow-sm" : "text-muted-foreground hover:text-gray-700 dark:hover:text-gray-300"}`}
                  >
                    Active ({deliveries?.length ?? 0})
                  </button>
                  <button
                    onClick={() => setDeliveryTab("completed")}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${deliveryTab === "completed" ? "bg-white dark:bg-ring text-foreground shadow-sm" : "text-muted-foreground hover:text-gray-700 dark:hover:text-gray-300"}`}
                  >
                    Completed ({completedDeliveries?.length ?? 0})
                  </button>
                </div>
              </div>

              {deliveryTab === "active" ? (
                /* ─── Active Deliveries ─── */
                <>
                  {deliveriesLoading ? (
                    <div className="flex items-center justify-center py-12 text-gray-400">
                      <LoadingPackage />
                    </div>
                  ) : !deliveries || deliveries.length === 0 ? (
                    <div className="p-8 rounded-3xl bg-card border border-border text-center text-gray-400">
                      <Truck className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm font-medium">
                        No active deliveries
                      </p>
                      <p className="text-xs mt-1">
                        Browse available jobs to start earning
                      </p>
                    </div>
                  ) : (
                    deliveries.map((del) => {
                      const sc = deliveryStatusConfig[del.status] ?? {
                        label: del.status,
                        color: "text-gray-500 bg-gray-50 dark:bg-gray-900/20",
                      };
                      return (
                        <div
                          key={del.id}
                          className="p-5 rounded-3xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-foreground">
                                {del.id}
                              </span>
                              <span className="text-[10px] font-mono text-gray-400">
                                {del.trackingCode}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-medium px-2.5 py-1 rounded-full ${sc.color}`}
                              >
                                • {sc.label}
                              </span>
                              <span className="text-sm font-bold text-green-600">
                                {del.payment}
                              </span>
                            </div>
                          </div>

                          {/* Route */}
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span className="text-sm text-secondary-foreground truncate">
                                  {del.pickupAddress}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                <span className="text-sm text-secondary-foreground truncate">
                                  {del.deliveryAddress}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Progress */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${del.progress}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-500">
                              {del.progress}%
                            </span>
                          </div>

                          {/* Meta row */}
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <div className="flex items-center gap-3">
                              <span>{del.weight}</span>
                              <span>{del.distance}</span>
                              <span>{del.dispatcherCompany}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Timer className="h-3 w-3" />
                              <span>ETA {del.estimatedTime}</span>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={() => {
                                window.open(
                                  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(del.deliveryAddress)}`,
                                  "_blank",
                                );
                              }}
                              className="flex-1 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
                            >
                              <Navigation className="h-3.5 w-3.5" />
                              Navigate
                            </button>
                            <button
                              onClick={async () => {
                                const backendId = del.id.replace(/\D/g, "");
                                const nextStatus =
                                  del.status === "PICKED_UP"
                                    ? "EN_ROUTE"
                                    : del.status === "EN_ROUTE"
                                      ? "DELIVERED"
                                      : "PICKED_UP";
                                const API_URL =
                                  import.meta.env.VITE_API_URL ||
                                  "http://localhost:8000/api";
                                const cid =
                                  localStorage.getItem("dc_company_id") || "";
                                const did =
                                  localStorage.getItem("dc_driver_id") || "";
                                try {
                                  const res = await fetch(
                                    `${API_URL}/orders/${backendId}/status`,
                                    {
                                      method: "PATCH",
                                      headers: {
                                        "Content-Type": "application/json",
                                        "x-company-id": cid,
                                        "x-driver-id": did,
                                      },
                                      body: JSON.stringify({
                                        status: nextStatus,
                                      }),
                                    },
                                  );
                                  const data = await res.json();
                                  if (!res.ok) {
                                    alert(
                                      data.error?.message || "Failed to update",
                                    );
                                    return;
                                  }
                                  window.location.reload();
                                } catch {
                                  alert("Network error");
                                }
                              }}
                              className="flex-1 py-2 rounded-full border border-border text-sm font-medium text-secondary-foreground hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {del.status === "PICKED_UP"
                                ? "Start Route"
                                : del.status === "EN_ROUTE"
                                  ? "Mark Delivered"
                                  : "Start Pickup"}
                            </button>
                          </div>

                          {/* Chat buttons */}
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => {
                                const backendId = del.id.replace(/\D/g, "");
                                navigate(
                                  `/driver/messages?orderId=${backendId}&channel=dispatcher-driver`,
                                );
                              }}
                              className="flex-1 py-1.5 rounded-full border border-border text-xs font-medium text-secondary-foreground hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5"
                            >
                              <MessageSquare className="h-3 w-3" />
                              Chat Dispatcher
                            </button>
                            <button
                              onClick={() => {
                                const backendId = del.id.replace(/\D/g, "");
                                navigate(
                                  `/driver/messages?orderId=${backendId}&channel=driver-recipient`,
                                );
                              }}
                              className="flex-1 py-1.5 rounded-full border border-border text-xs font-medium text-secondary-foreground hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5"
                            >
                              <MessageSquare className="h-3 w-3" />
                              Chat Recipient
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              ) : (
                /* ─── Completed Deliveries ─── */
                <>
                  {completedLoading ? (
                    <div className="flex items-center justify-center py-12 text-gray-400">
                      <LoadingPackage />
                    </div>
                  ) : !completedDeliveries ||
                    completedDeliveries.length === 0 ? (
                    <div className="p-8 rounded-3xl bg-card border border-border text-center text-gray-400">
                      <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm font-medium">
                        No completed deliveries yet
                      </p>
                      <p className="text-xs mt-1">
                        Deliveries you complete will appear here
                      </p>
                    </div>
                  ) : (
                    completedDeliveries.map((del) => {
                      const sc = deliveryStatusConfig[del.status] ?? {
                        label: del.status,
                        color: "text-gray-500 bg-gray-50 dark:bg-gray-900/20",
                      };
                      return (
                        <div
                          key={del.id}
                          className="p-5 rounded-3xl bg-card border border-border shadow-sm opacity-80"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-foreground">
                                {del.id}
                              </span>
                              <span className="text-[10px] font-mono text-gray-400">
                                {del.trackingCode}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-medium px-2.5 py-1 rounded-full ${sc.color}`}
                              >
                                ✓ {sc.label}
                              </span>
                              <span className="text-sm font-bold text-green-600">
                                {del.payment}
                              </span>
                            </div>
                          </div>

                          {/* Route */}
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span className="text-sm text-secondary-foreground truncate">
                                  {del.pickupAddress}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                <span className="text-sm text-secondary-foreground truncate">
                                  {del.deliveryAddress}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Completed progress bar (full) */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: "100%" }}
                              />
                            </div>
                            <span className="text-xs font-medium text-emerald-600">
                              100%
                            </span>
                          </div>

                          {/* Meta row */}
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <div className="flex items-center gap-3">
                              <span>{del.weight}</span>
                              <span>{del.distance}</span>
                              <span>{del.dispatcherCompany}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-emerald-600">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Completed</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}
            </div>

            {/* ═══ Right Column ═══ */}
            <div className="space-y-6">
              {/* Weekly Earnings Chart */}
              <div className="p-5 bg-card rounded-3xl border border-border shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-foreground">
                    Weekly Earnings
                  </h3>
                  <span className="text-xs text-green-500 font-medium flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +12%
                  </span>
                </div>
                {earnings && (
                  <div className="flex items-end gap-1.5 h-32">
                    {earnings.map((e) => (
                      <div
                        key={e.day}
                        className="flex-1 flex flex-col items-center gap-1"
                      >
                        <span className="text-[10px] font-medium text-foreground">
                          {formatINR(e.amount, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                        </span>
                        <div
                          className="w-full rounded-t-lg bg-primary/20 relative"
                          style={{
                            height: `${(e.amount / maxEarning) * 100}%`,
                          }}
                        >
                          <div className="absolute inset-0 rounded-t-lg bg-gradient-to-t from-primary/60 to-primary/20" />
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {e.day}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-gray-500">This week total</span>
                  <span className="text-sm font-bold text-foreground">
                    {stats ? formatINR(stats.weekEarnings) : "—"}
                  </span>
                </div>
              </div>

              {/* Recent Bids */}
              <div className="p-5 bg-card rounded-3xl border border-border shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Gavel className="h-4 w-4 text-primary" />
                    Recent Bids
                  </h3>
                  <span className="text-xs text-gray-400">
                    {bids?.filter((b) => b.status === "pending").length ?? 0}{" "}
                    pending
                  </span>
                </div>

                {bidsLoading ? (
                  <div className="flex items-center justify-center py-8 text-gray-400">
                    <LoadingPackage />
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {bids?.map((bid) => {
                      const bs = bidStatusConfig[bid.status];
                      const BidIcon = bs.icon;
                      return (
                        <div
                          key={bid.id}
                          className="flex items-center gap-3 p-3 rounded-full bg-muted/50 hover:bg-secondary transition-colors"
                        >
                          <div
                            className={`h-8 w-8 rounded-lg ${bs.color.split(" ").slice(1).join(" ")} flex items-center justify-center`}
                          >
                            <BidIcon
                              className={`h-4 w-4 ${bs.color.split(" ")[0]}`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <span className="truncate">
                                {bid.pickupShort}
                              </span>
                              <ArrowRight className="h-2.5 w-2.5 shrink-0" />
                              <span className="truncate">
                                {bid.deliveryShort}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-sm font-bold text-foreground">
                                {formatINR(bid.offeredPrice)}
                              </span>
                              <span className="text-[10px] text-gray-400 line-through">
                                {formatINR(bid.listedPrice)}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${bs.color}`}
                            >
                              {bs.label}
                            </span>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {bid.timeAgo}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="p-5 bg-card rounded-3xl border border-border shadow-sm">
                <h3 className="text-sm font-bold text-foreground mb-3">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href="/driver/marketplace"
                    className="flex flex-col items-center gap-1.5 p-3 rounded-full bg-primary/5 hover:bg-primary/10 transition-colors text-center"
                  >
                    <Package className="h-5 w-5 text-primary" />
                    <span className="text-xs font-medium text-secondary-foreground">
                      Browse Jobs
                    </span>
                  </a>
                  <a
                    href="/driver/bids"
                    className="flex flex-col items-center gap-1.5 p-3 rounded-full bg-stone-100 dark:bg-stone-800/10 hover:bg-stone-200 dark:hover:bg-stone-800/20 transition-colors text-center"
                  >
                    <Gavel className="h-5 w-5 text-stone-600" />
                    <span className="text-xs font-medium text-secondary-foreground">
                      My Bids
                    </span>
                  </a>
                  <a
                    href="/driver/earnings"
                    className="flex flex-col items-center gap-1.5 p-3 rounded-full bg-stone-100 dark:bg-stone-800/10 hover:bg-stone-200 dark:hover:bg-stone-800/20 transition-colors text-center"
                  >
                    <IndianRupee className="h-5 w-5 text-stone-600" />
                    <span className="text-xs font-medium text-secondary-foreground">
                      Earnings
                    </span>
                  </a>
                  <a
                    href="/driver/deliveries"
                    className="flex flex-col items-center gap-1.5 p-3 rounded-full bg-stone-100 dark:bg-stone-800/10 hover:bg-stone-200 dark:hover:bg-stone-800/20 transition-colors text-center"
                  >
                    <Truck className="h-5 w-5 text-stone-600" />
                    <span className="text-xs font-medium text-secondary-foreground">
                      Deliveries
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
