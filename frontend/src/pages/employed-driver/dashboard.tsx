import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { EmployedDriverSidebar } from "@/components/dashboard/employed-driver-sidebar";
import { useGeolocationPing } from "@/hooks/useGeolocationPing";
import { useTheme } from "@/hooks/useTheme";
import {
  Bell,
  CheckCircle2,
  Star,
  Timer,
  MapPin,
  ArrowRight,
  Calendar,
  Clock,
  Zap,
  ClipboardList,
  MessageSquare,
} from "lucide-react";
import LoadingPackage from "@/components/ui/loading-package";
import {
  fetchEmployedDriverUser,
  fetchEmployedDashboardStats,
  fetchAssignedOrders,
  type AssignedOrder,
  type EmployedDriverUser,
  type EmployedDashboardStats,
} from "@/services/employed-driver/dashboard";

/* ─── Shift Info — computed from current time ─── */
interface ShiftInfo {
  shiftStart: string;
  shiftEnd: string;
  hoursWorked: number;
  hoursRemaining: number;
  totalHoursToday: number;
}

function computeShift(): ShiftInfo {
  const now = new Date();
  const shiftStartHour = 9; // 9 AM
  const shiftEndHour = 17; // 5 PM
  const totalHours = shiftEndHour - shiftStartHour;
  const currentHour = now.getHours() + now.getMinutes() / 60;

  let hoursWorked = 0;
  if (currentHour >= shiftEndHour) {
    hoursWorked = totalHours;
  } else if (currentHour > shiftStartHour) {
    hoursWorked = Math.round((currentHour - shiftStartHour) * 10) / 10;
  }

  return {
    shiftStart: "9:00 AM",
    shiftEnd: "5:00 PM",
    hoursWorked: Math.min(hoursWorked, totalHours),
    hoursRemaining: Math.max(0, totalHours - hoursWorked),
    totalHoursToday: totalHours,
  };
}

const statusColor: Record<string, string> = {
  QUEUED: "text-gray-500 bg-secondary",
  UNASSIGNED: "text-gray-500 bg-secondary",
  ASSIGNED: "text-amber-500 bg-amber-50 dark:bg-amber-900/20",
  PICKED_UP: "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
  EN_ROUTE: "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
  DELIVERED: "text-green-500 bg-green-50 dark:bg-green-900/20",
};

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    UNASSIGNED: "Queued",
    ASSIGNED: "Next Up",
    PICKED_UP: "In Progress",
    EN_ROUTE: "In Progress",
    DELIVERED: "Delivered",
  };
  return map[s] ?? s;
}

export default function EmployedDriverDashboard() {
  const navigate = useNavigate();
  const { isDark, setIsDark } = useTheme();
  const [user, setUser] = useState<EmployedDriverUser | null>(null);
  const [stats, setStats] = useState<EmployedDashboardStats | null>(null);
  const [orders, setOrders] = useState<AssignedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [shift, setShift] = useState<ShiftInfo>(computeShift);

  // Track driver location
  useGeolocationPing();

  // Refresh shift progress every 60s
  useEffect(() => {
    const timer = setInterval(() => setShift(computeShift()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [u, s, o] = await Promise.all([
        fetchEmployedDriverUser(),
        fetchEmployedDashboardStats(),
        fetchAssignedOrders(),
      ]);
      setUser(u);
      setStats(s);
      setOrders(o);
      setLoading(false);
    }
    load();
  }, []);

  const activeOrders = orders.filter(
    (o) => !["DELIVERED", "CANCELLED"].includes(o.status),
  );
  const rushCount = activeOrders.filter(
    (o) => o.priority === "URGENT" || o.priority === "HIGH",
  ).length;
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function updateOrderStatus(order: AssignedOrder, newStatus: string) {
    setActionLoading(`${order._backendId}-${newStatus}`);
    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:8000/api";
      const cid = localStorage.getItem("dc_company_id") || "";
      const did = localStorage.getItem("dc_driver_id") || "";
      const res = await fetch(`${API_URL}/orders/${order._backendId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-company-id": cid,
          "x-driver-id": did,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error?.message || "Failed to update");
        return;
      }
      // Refresh orders
      const refreshed = await fetchAssignedOrders();
      setOrders(refreshed);
      const newStats = await fetchEmployedDashboardStats();
      setStats(newStats);
    } catch {
      alert("Network error");
    } finally {
      setActionLoading(null);
    }
  }

  function openNavigation(address: string) {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`,
      "_blank",
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen w-full">
        <EmployedDriverSidebar isDark={isDark} setIsDark={setIsDark} />
        <div className="flex-1 flex items-center justify-center">
          <LoadingPackage text="Loading dashboard..." />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <EmployedDriverSidebar isDark={isDark} setIsDark={setIsDark} />

      <div className="flex-1 bg-background overflow-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-card backdrop-blur-xl border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Welcome back, {user?.name?.split(" ")[0] ?? "Driver"}!
              </h1>
              <p className="text-sm text-muted-foreground">
                You have {activeOrders.length} assigned deliveries remaining
                today.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 rounded-full px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  {user?.status === "AVAILABLE" ? "On Shift" : "Off Shift"}
                </span>
              </div>
              <button className="relative p-2.5 rounded-full hover:bg-secondary transition-colors">
                <Bell className="h-5 w-5 text-gray-500" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
              </button>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Assigned Today",
                value: stats?.assignedToday ?? 0,
                sub: `${activeOrders.length} remaining`,
                icon: ClipboardList,
                color: "text-stone-600",
                bg: "bg-stone-100 dark:bg-stone-800/20",
              },
              {
                label: "Completed Today",
                value: stats?.completedToday ?? 0,
                sub: `${rushCount} rush orders`,
                icon: CheckCircle2,
                color: "text-stone-600",
                bg: "bg-stone-100 dark:bg-stone-800/20",
              },
              {
                label: "On-Time Rate",
                value: `${stats?.onTimeRate ?? 0}%`,
                sub: "Last 30 days",
                icon: Timer,
                color: "text-stone-600",
                bg: "bg-stone-100 dark:bg-stone-800/20",
              },
              {
                label: "Driver Rating",
                value: `${stats?.driverRating?.toFixed(1) ?? "—"} ★`,
                sub: "Company rating",
                icon: Star,
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
            {/* Delivery Queue */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-stone-600" />
                  Delivery Queue
                </h2>
                <span className="text-xs text-gray-400">
                  {activeOrders.length} assigned
                </span>
              </div>

              {activeOrders.length === 0 && (
                <div className="p-8 text-center text-gray-400 bg-card rounded-3xl border border-border">
                  <p className="text-sm">No active deliveries assigned.</p>
                </div>
              )}

              {activeOrders.map((order, i) => (
                <div
                  key={order.id}
                  className={`p-5 rounded-3xl bg-card border-1 shadow-sm ${
                    ["PICKED_UP", "EN_ROUTE"].includes(order.status)
                      ? "border-blue-400 dark:border-blue-500"
                      : order.status === "ASSIGNED"
                        ? "border-amber-200 dark:border-amber-800"
                        : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 bg-secondary px-2 py-0.5 rounded">
                        #{i + 1}
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {order.id}
                      </span>
                      {(order.priority === "URGENT" ||
                        order.priority === "HIGH") && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-50 text-red-500 dark:bg-red-900/20">
                          Rush
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[order.status] ?? "text-gray-500 bg-gray-100"}`}
                      >
                        {statusLabel(order.status)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                    <MapPin className="h-3 w-3 text-primary shrink-0" />
                    <span className="truncate">
                      {order.pickupAddress.split(",")[0]}
                    </span>
                    <ArrowRight className="h-2.5 w-2.5 shrink-0" />
                    <MapPin className="h-3 w-3 text-green-500 shrink-0" />
                    <span className="truncate">
                      {order.deliveryAddress.split(",")[0]}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-3">
                      <span>{order.customerName}</span>
                      <span>{order.weight}</span>
                    </div>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />{" "}
                      {new Date(order.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {["PICKED_UP", "EN_ROUTE"].includes(order.status) && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => openNavigation(order.deliveryAddress)}
                        className="flex-1 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                      >
                        Navigate
                      </button>
                      {order.status === "PICKED_UP" ? (
                        <button
                          disabled={
                            actionLoading === `${order._backendId}-EN_ROUTE`
                          }
                          onClick={() => updateOrderStatus(order, "EN_ROUTE")}
                          className="flex-1 py-2 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === `${order._backendId}-EN_ROUTE`
                            ? "Updating..."
                            : "Start Route"}
                        </button>
                      ) : (
                        <button
                          disabled={
                            actionLoading === `${order._backendId}-DELIVERED`
                          }
                          onClick={() => updateOrderStatus(order, "DELIVERED")}
                          className="flex-1 py-2 rounded-full bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === `${order._backendId}-DELIVERED`
                            ? "Updating..."
                            : "Mark Delivered"}
                        </button>
                      )}
                    </div>
                  )}
                  {order.status === "ASSIGNED" && (
                    <button
                      disabled={
                        actionLoading === `${order._backendId}-PICKED_UP`
                      }
                      onClick={() => updateOrderStatus(order, "PICKED_UP")}
                      className="w-full mt-3 py-2 rounded-full border-2 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === `${order._backendId}-PICKED_UP`
                        ? "Updating..."
                        : "Start Pickup"}
                    </button>
                  )}

                  {/* Chat buttons */}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() =>
                        navigate(
                          `/employed-driver/messages?orderId=${order._backendId}&channel=dispatcher-driver`,
                        )
                      }
                      className="flex-1 py-1.5 rounded-full border border-border text-xs font-medium text-secondary-foreground hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="h-3 w-3" />
                      Chat Dispatcher
                    </button>
                    <button
                      onClick={() =>
                        navigate(
                          `/employed-driver/messages?orderId=${order._backendId}&channel=driver-recipient`,
                        )
                      }
                      className="flex-1 py-1.5 rounded-full border border-border text-xs font-medium text-secondary-foreground hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="h-3 w-3" />
                      Chat Recipient
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Shift Progress */}
              <div className="p-5 bg-card rounded-3xl border border-border shadow-sm">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5 mb-4">
                  <Calendar className="h-4 w-4 text-stone-600" />
                  Shift Progress
                </h3>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>{shift.shiftStart}</span>
                  <span>{shift.shiftEnd}</span>
                </div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                    style={{
                      width: `${(shift.hoursWorked / shift.totalHoursToday) * 100}%`,
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 rounded-3xl bg-muted/50 text-center">
                    <p className="text-[10px] uppercase text-gray-400">
                      Worked
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {shift.hoursWorked}h
                    </p>
                  </div>
                  <div className="p-2.5 rounded-3xl bg-muted/50 text-center">
                    <p className="text-[10px] uppercase text-gray-400">
                      Remaining
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {shift.hoursRemaining}h
                    </p>
                  </div>
                </div>
              </div>

              {/* Company Info */}
              <div className="p-5 bg-card rounded-3xl border border-border shadow-sm">
                <h3 className="text-sm font-bold text-foreground mb-3">
                  Company Info
                </h3>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-stone-100 dark:bg-stone-800/20 flex items-center justify-center text-stone-600 font-bold text-sm">
                    {user?.companyName?.substring(0, 2).toUpperCase() ?? "—"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {user?.companyName ?? "—"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {user?.role ?? "Employed Driver"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Today's Performance */}
              <div className="p-5 bg-card rounded-3xl border border-border shadow-sm">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5 mb-3">
                  <Zap className="h-4 w-4 text-stone-600" />
                  Today's Performance
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      label: "Completed",
                      value: `${stats?.completedToday ?? 0} orders`,
                      target: `of ${stats?.assignedToday ?? 0}`,
                      good: true,
                    },
                    {
                      label: "On-Time Rate",
                      value: `${stats?.onTimeRate ?? 0}%`,
                      target: "≥ 95%",
                      good: (stats?.onTimeRate ?? 0) >= 95,
                    },
                    {
                      label: "Driver Rating",
                      value: `${stats?.driverRating?.toFixed(1) ?? "—"} ★`,
                      target: "≥ 4.5",
                      good: (stats?.driverRating ?? 0) >= 4.5,
                    },
                  ].map((metric) => (
                    <div
                      key={metric.label}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs text-gray-500">{metric.label}</p>
                        <p className="text-sm font-bold text-foreground">
                          {metric.value}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${metric.good ? "bg-green-50 text-green-600 dark:bg-green-900/20" : "bg-red-50 text-red-500"}`}
                      >
                        {metric.target}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
