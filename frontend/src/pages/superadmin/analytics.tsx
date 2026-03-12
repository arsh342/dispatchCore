/**
 * SuperAdmin — Analytics Page
 *
 * Platform-wide analytics: order breakdown by status,
 * company leaderboard, driver utilisation, and recent orders list.
 */

import { useState, useEffect } from "react";
import { SuperAdminSidebar } from "@/components/dashboard/superadmin-sidebar";
import { useTheme } from "@/hooks/useTheme";
import {
  BarChart3,
  AlertCircle,
  Package,
  Truck,
  Building2,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  ShoppingBag,
} from "lucide-react";
import LoadingPackage from "@/components/ui/loading-package";
import {
  fetchPlatformStats,
  fetchCompanies,
  fetchAllDrivers,
  fetchAllOrders,
  type PlatformStats,
  type CompanySummary,
  type DriverSummary,
  type OrderSummary,
} from "@/services/superadmin/dashboard";

const orderStatusColors: Record<string, string> = {
  UNASSIGNED: "bg-gray-400",
  LISTED: "bg-pink-500",
  ASSIGNED: "bg-blue-500",
  PICKED_UP: "bg-indigo-500",
  EN_ROUTE: "bg-purple-500",
  DELIVERED: "bg-green-500",
  CANCELLED: "bg-red-500",
};

const orderStatusLabels: Record<string, string> = {
  UNASSIGNED: "Unassigned",
  LISTED: "Listed",
  ASSIGNED: "Assigned",
  PICKED_UP: "Picked Up",
  EN_ROUTE: "En Route",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default function SuperAdminAnalyticsPage() {
  const { isDark, setIsDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [drivers, setDrivers] = useState<DriverSummary[]>([]);
  const [orders, setOrders] = useState<OrderSummary[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [s, c, d, o] = await Promise.all([
          fetchPlatformStats(),
          fetchCompanies(),
          fetchAllDrivers(),
          fetchAllOrders({ limit: 20 }),
        ]);
        setStats(s);
        setCompanies(c);
        setDrivers(d);
        setOrders(o.orders);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Order breakdown by status
  const statusCounts: Record<string, number> = {};
  orders.forEach((o) => {
    statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1;
  });

  // Company leaderboard by orders
  const sortedCompanies = [...companies].sort(
    (a, b) => b.orderCount - a.orderCount,
  );

  // Driver utilisation
  const totalDrivers = drivers.length;
  const busyDrivers = drivers.filter((d) => d.status === "BUSY").length;
  const availableDrivers = drivers.filter(
    (d) => d.status === "AVAILABLE",
  ).length;
  const offlineDrivers = drivers.filter((d) => d.status === "OFFLINE").length;
  const utilisation =
    totalDrivers > 0 ? Math.round((busyDrivers / totalDrivers) * 100) : 0;

  const successRate =
    stats && stats.totalOrders > 0
      ? Math.round((stats.totalDelivered / stats.totalOrders) * 100)
      : 0;

  return (
    <div className="flex min-h-screen w-full">
      <SuperAdminSidebar isDark={isDark} setIsDark={setIsDark} />

      <div className="flex-1 bg-background overflow-auto">
        {/* Top Bar */}
        <header className="sticky top-0 z-10 bg-card backdrop-blur-xl border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-stone-600" />
                Analytics
              </h1>
              <p className="text-sm text-muted-foreground">
                Platform-wide performance metrics and insights.
              </p>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <LoadingPackage />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24">
            <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Top-level KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="Delivery Success Rate"
                value={`${successRate}%`}
                icon={CheckCircle2}
                color="text-stone-600"
                bg="bg-stone-100 dark:bg-stone-800/20"
                trend={successRate >= 50 ? "up" : "down"}
                subtitle={`${stats?.totalDelivered ?? 0} of ${stats?.totalOrders ?? 0}`}
              />
              <MetricCard
                label="Driver Utilisation"
                value={`${utilisation}%`}
                icon={Truck}
                color="text-stone-600"
                bg="bg-stone-100 dark:bg-stone-800/20"
                trend={utilisation >= 30 ? "up" : "down"}
                subtitle={`${busyDrivers} busy / ${totalDrivers} total`}
              />
              <MetricCard
                label="Active Orders"
                value={String(stats?.totalActiveOrders ?? 0)}
                icon={TrendingUp}
                color="text-stone-600"
                bg="bg-stone-100 dark:bg-stone-800/20"
                subtitle="Currently in progress"
              />
              <MetricCard
                label="Marketplace Listings"
                value={String(stats?.totalListedOrders ?? 0)}
                icon={ShoppingBag}
                color="text-stone-600"
                bg="bg-stone-100 dark:bg-stone-800/20"
                subtitle="Awaiting bids"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Order Status Breakdown */}
              <div className="bg-card rounded-3xl border border-border shadow-sm p-6">
                <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                  <Package className="h-4 w-4 text-stone-600" />
                  Order Breakdown by Status
                </h3>
                <div className="space-y-3">
                  {Object.entries(orderStatusLabels).map(([key, label]) => {
                    const count = statusCounts[key] ?? 0;
                    const pct =
                      orders.length > 0
                        ? Math.round((count / orders.length) * 100)
                        : 0;
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-secondary-foreground">
                            {label}
                          </span>
                          <span className="text-xs text-gray-400">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${orderStatusColors[key] ?? "bg-gray-400"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Driver Status Distribution */}
              <div className="bg-card rounded-3xl border border-border shadow-sm p-6">
                <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                  <Truck className="h-4 w-4 text-stone-600" />
                  Driver Status Distribution
                </h3>
                <div className="flex items-center gap-6 mb-6">
                  <div className="relative h-28 w-28">
                    <svg viewBox="0 0 36 36" className="h-28 w-28 -rotate-90">
                      <circle
                        cx="18"
                        cy="18"
                        r="15.9"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="text-gray-100 dark:text-gray-800"
                      />
                      {totalDrivers > 0 && (
                        <>
                          <circle
                            cx="18"
                            cy="18"
                            r="15.9"
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth="3"
                            strokeDasharray={`${(availableDrivers / totalDrivers) * 100} ${100 - (availableDrivers / totalDrivers) * 100}`}
                            strokeDashoffset="0"
                          />
                          <circle
                            cx="18"
                            cy="18"
                            r="15.9"
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="3"
                            strokeDasharray={`${(busyDrivers / totalDrivers) * 100} ${100 - (busyDrivers / totalDrivers) * 100}`}
                            strokeDashoffset={`${-(availableDrivers / totalDrivers) * 100}`}
                          />
                        </>
                      )}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-foreground">
                        {totalDrivers}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <LegendItem
                      color="bg-green-500"
                      label="Available"
                      count={availableDrivers}
                    />
                    <LegendItem
                      color="bg-amber-500"
                      label="Busy"
                      count={busyDrivers}
                    />
                    <LegendItem
                      color="bg-gray-400"
                      label="Offline"
                      count={offlineDrivers}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted rounded-full p-3 text-center">
                    <p className="text-lg font-bold text-foreground">
                      {drivers.filter((d) => d.type === "EMPLOYED").length}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium uppercase">
                      Employed
                    </p>
                  </div>
                  <div className="bg-muted rounded-full p-3 text-center">
                    <p className="text-lg font-bold text-foreground">
                      {drivers.filter((d) => d.type === "INDEPENDENT").length}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium uppercase">
                      Independent
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Company Leaderboard */}
              <div className="bg-card rounded-3xl border border-border shadow-sm">
                <div className="px-6 py-4 border-b border-border">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-stone-600" />
                    Company Leaderboard
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Ranked by total orders
                  </p>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {sortedCompanies.slice(0, 8).map((c, i) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between px-6 py-3 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                            i === 0
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              : i === 1
                                ? "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                                : i === 2
                                  ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                  : "bg-gray-100 text-gray-400 dark:bg-gray-800"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {c.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {c.driverCount} drivers
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">
                          {c.orderCount}
                        </p>
                        <p className="text-[10px] text-gray-400">orders</p>
                      </div>
                    </div>
                  ))}
                  {sortedCompanies.length === 0 && (
                    <div className="p-8 text-center text-gray-400 text-sm">
                      No companies yet
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-card rounded-3xl border border-border shadow-sm">
                <div className="px-6 py-4 border-b border-border">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4 text-stone-600" />
                    Recent Orders
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Latest orders across all companies
                  </p>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[420px] overflow-y-auto">
                  {orders.slice(0, 10).map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between px-6 py-3 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`h-2.5 w-2.5 rounded-full shrink-0 ${orderStatusColors[o.status] ?? "bg-gray-400"}`}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {o.trackingCode}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {o.companyName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            o.status === "DELIVERED"
                              ? "bg-green-50 text-green-600 dark:bg-green-900/20"
                              : o.status === "CANCELLED"
                                ? "bg-red-50 text-red-600 dark:bg-red-900/20"
                                : "bg-blue-50 text-blue-600 dark:bg-blue-900/20"
                          }`}
                        >
                          {o.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && (
                    <div className="p-8 text-center text-gray-400 text-sm">
                      No orders yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Helper Components ── */

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  trend,
  subtitle,
}: {
  label: string;
  value: string;
  icon: typeof TrendingUp;
  color: string;
  bg: string;
  trend?: "up" | "down";
  subtitle?: string;
}) {
  return (
    <div className="p-5 bg-card rounded-3xl border border-border shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <div
          className={`h-8 w-8 rounded-full ${bg} flex items-center justify-center`}
        >
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {trend && (
          <span
            className={`flex items-center gap-0.5 text-xs font-medium mb-0.5 ${trend === "up" ? "text-green-500" : "text-red-500"}`}
          >
            {trend === "up" ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}

function LegendItem({
  color,
  label,
  count,
}: {
  color: string;
  label: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-3 w-3 rounded-full ${color}`} />
      <span className="text-sm text-secondary-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground ml-auto">
        {count}
      </span>
    </div>
  );
}
