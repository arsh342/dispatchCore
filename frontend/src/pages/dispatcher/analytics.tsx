import { useState, useEffect, useMemo } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { useTheme } from "@/hooks/useTheme";
import { get } from "@/lib/api";
import {
  BarChart3,
  TrendingUp,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  DollarSign,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import LoadingPackage from "@/components/ui/loading-package";
import { motion } from "framer-motion";
import { format, subDays, startOfDay, isSameDay } from "date-fns";

/* ─── Types ─── */
interface BackendOrder {
  id: number;
  status: string;
  listed_price: string | null;
  createdAt: string;
  updatedAt: string;
  pickup_address: string | null;
  delivery_address: string | null;
  assignment?: {
    driver_id: number;
    driver?: {
      id: number;
      type: string;
      user?: { name: string };
    };
  } | null;
}

interface BackendStats {
  totalOrders: number;
  unassigned: number;
  listed: number;
  assigned: number;
  inProgress: number;
  delivered: number;
  cancelled: number;
  activeBids: number;
}

/* ─── Helper: generate last N days ─── */
function lastNDays(n: number): Date[] {
  const days: Date[] = [];
  for (let i = n - 1; i >= 0; i--) {
    days.push(startOfDay(subDays(new Date(), i)));
  }
  return days;
}

/* ─── Mini Bar Chart (pure SVG) ─── */
function BarChartSVG({
  data,
  labels,
  color = "#f97316",
  height = 200,
}: {
  data: number[];
  labels: string[];
  color?: string;
  height?: number;
}) {
  const max = Math.max(...data, 1);
  const barWidth = 100 / data.length;
  const barPad = barWidth * 0.25;

  return (
    <div className="relative" style={{ height }}>
      {/* Y-axis grid lines */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        {[0.25, 0.5, 0.75, 1].map((pct) => (
          <line
            key={pct}
            x1="0"
            y1={`${(1 - pct) * 100}%`}
            x2="100%"
            y2={`${(1 - pct) * 100}%`}
            stroke="currentColor"
            className="text-border"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}
      </svg>
      <svg className="relative w-full h-full" preserveAspectRatio="none" viewBox={`0 0 ${data.length * 10} 100`}>
        {data.map((val, i) => {
          const barH = (val / max) * 90;
          return (
            <g key={i}>
              <rect
                x={i * 10 + barPad / 2}
                y={95 - barH}
                width={10 - barPad}
                height={barH}
                rx={1.5}
                fill={color}
                opacity={0.85}
                className="transition-all duration-300"
              >
                <title>{`${labels[i]}: ${val}`}</title>
              </rect>
            </g>
          );
        })}
      </svg>
      {/* X-axis labels */}
      <div className="flex w-full mt-1">
        {labels.map((l, i) => (
          <div
            key={i}
            className="text-[9px] text-muted-foreground text-center"
            style={{ width: `${barWidth}%` }}
          >
            {i % Math.ceil(labels.length / 7) === 0 ? l : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Donut Chart (pure SVG) ─── */
function DonutChart({
  segments,
  size = 180,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const r = 40;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const dashLen = pct * circumference;
          const gap = circumference - dashLen;
          const el = (
            <circle
              key={i}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="10"
              strokeDasharray={`${dashLen} ${gap}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          );
          offset += dashLen;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-2xl font-bold text-foreground">{total}</p>
        <p className="text-[10px] text-muted-foreground uppercase font-medium">Total</p>
      </div>
    </div>
  );
}

/* ─── Sparkline (pure SVG) ─── */
function Sparkline({
  data,
  color = "#22c55e",
  width = 120,
  height = 36,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*                     ANALYTICS PAGE                            */
/* ═══════════════════════════════════════════════════════════════ */

export default function DispatcherAnalyticsPage() {
  const { isDark, setIsDark } = useTheme();
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [stats, setStats] = useState<BackendStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"7d" | "14d" | "30d">("14d");

  const rangeDays = range === "7d" ? 7 : range === "14d" ? 14 : 30;

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [ordersData, statsData] = await Promise.all([
          get<BackendOrder[]>("/orders"),
          get<BackendStats>("/dashboard/stats"),
        ]);
        setOrders(ordersData);
        setStats(statsData);
      } catch {
        /* fallback */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* ─── Derived analytics ─── */
  const days = lastNDays(rangeDays);

  const dailyOrders = useMemo(() => {
    return days.map((d) => {
      const count = orders.filter((o) => {
        const od = startOfDay(new Date(o.createdAt));
        return isSameDay(od, d);
      }).length;
      return { date: d, count };
    });
  }, [orders, days]);

  const dailyDeliveries = useMemo(() => {
    return days.map((d) => {
      const count = orders.filter((o) => {
        if (o.status !== "DELIVERED") return false;
        const od = startOfDay(new Date(o.updatedAt));
        return isSameDay(od, d);
      }).length;
      return { date: d, count };
    });
  }, [orders, days]);

  const dailyRevenue = useMemo(() => {
    return days.map((d) => {
      const total = orders
        .filter((o) => {
          if (o.status !== "DELIVERED") return false;
          const od = startOfDay(new Date(o.updatedAt));
          return isSameDay(od, d);
        })
        .reduce((s, o) => s + (o.listed_price ? parseFloat(o.listed_price) : 15), 0);
      return { date: d, total };
    });
  }, [orders, days]);

  // Totals for the period
  const periodOrders = dailyOrders.reduce((s, d) => s + d.count, 0);
  const periodDeliveries = dailyDeliveries.reduce((s, d) => s + d.count, 0);
  const periodRevenue = dailyRevenue.reduce((s, d) => s + d.total, 0);

  // Compare with previous period
  const prevDays = useMemo(() => {
    return Array.from({ length: rangeDays }, (_, i) =>
      startOfDay(subDays(new Date(), rangeDays + i)),
    ).reverse();
  }, [rangeDays]);

  const prevPeriodOrders = useMemo(() => {
    return prevDays.reduce((s, d) => {
      return s + orders.filter((o) => isSameDay(startOfDay(new Date(o.createdAt)), d)).length;
    }, 0);
  }, [orders, prevDays]);

  const prevPeriodDeliveries = useMemo(() => {
    return prevDays.reduce((s, d) => {
      return (
        s +
        orders.filter(
          (o) => o.status === "DELIVERED" && isSameDay(startOfDay(new Date(o.updatedAt)), d),
        ).length
      );
    }, 0);
  }, [orders, prevDays]);

  const prevPeriodRevenue = useMemo(() => {
    return prevDays.reduce((s, d) => {
      return (
        s +
        orders
          .filter(
            (o) => o.status === "DELIVERED" && isSameDay(startOfDay(new Date(o.updatedAt)), d),
          )
          .reduce((ss, o) => ss + (o.listed_price ? parseFloat(o.listed_price) : 15), 0)
      );
    }, 0);
  }, [orders, prevDays]);

  function pctChange(curr: number, prev: number): number {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  }

  // Status breakdown for donut
  const statusBreakdown = useMemo(() => {
    if (!stats) return [];
    return [
      { label: "Delivered", value: stats.delivered, color: "#22c55e" },
      { label: "In Progress", value: stats.inProgress, color: "#a855f7" },
      { label: "Assigned", value: stats.assigned, color: "#3b82f6" },
      { label: "Pending", value: stats.unassigned + stats.listed, color: "#f97316" },
      { label: "Cancelled", value: stats.cancelled, color: "#ef4444" },
    ].filter((s) => s.value > 0);
  }, [stats]);

  // Top drivers
  const topDrivers = useMemo(() => {
    const driverMap: Record<
      string,
      { name: string; deliveries: number; revenue: number; type: string }
    > = {};
    for (const o of orders) {
      if (o.status !== "DELIVERED" || !o.assignment?.driver) continue;
      const dId = String(o.assignment.driver_id);
      const dName = o.assignment.driver.user?.name ?? `Driver #${dId}`;
      const dType = o.assignment.driver.type ?? "INDEPENDENT";
      if (!driverMap[dId]) driverMap[dId] = { name: dName, deliveries: 0, revenue: 0, type: dType };
      driverMap[dId].deliveries += 1;
      driverMap[dId].revenue += o.listed_price ? parseFloat(o.listed_price) : 15;
    }
    return Object.values(driverMap)
      .sort((a, b) => b.deliveries - a.deliveries)
      .slice(0, 5);
  }, [orders]);

  // Delivery rate sparkline (most recent 14 days regardless of range)
  const deliveryRateSpark = useMemo(() => {
    const last14 = lastNDays(14);
    return last14.map((d) => {
      const dayOrders = orders.filter((o) => isSameDay(startOfDay(new Date(o.createdAt)), d));
      const dayDelivered = dayOrders.filter((o) => o.status === "DELIVERED").length;
      return dayOrders.length > 0 ? Math.round((dayDelivered / dayOrders.length) * 100) : 0;
    });
  }, [orders]);

  const avgDeliveryRate =
    orders.length > 0
      ? Math.round(
          (orders.filter((o) => o.status === "DELIVERED").length / orders.length) * 100,
        )
      : 0;

  const ordersChange = pctChange(periodOrders, prevPeriodOrders);
  const deliveriesChange = pctChange(periodDeliveries, prevPeriodDeliveries);
  const revenueChange = pctChange(periodRevenue, prevPeriodRevenue);

  return (
    <div className="flex min-h-screen w-full">
      <DashboardSidebar isDark={isDark} setIsDark={setIsDark} />
      <div className="flex-1 bg-background overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-card backdrop-blur-xl border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Analytics
              </h1>
              <p className="text-sm text-muted-foreground">
                Delivery performance and business metrics
              </p>
            </div>
            {/* Range picker */}
            <div className="flex items-center bg-secondary rounded-full p-1">
              {(["7d", "14d", "30d"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    range === r
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r === "7d" ? "7 Days" : r === "14d" ? "14 Days" : "30 Days"}
                </button>
              ))}
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <LoadingPackage text="Loading analytics..." />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* ─── KPI Cards ─── */}
            <div className="grid grid-cols-4 gap-4">
              {[
                {
                  label: "Total Orders",
                  value: periodOrders,
                  icon: Package,
                  change: ordersChange,
                },
                {
                  label: "Delivered",
                  value: periodDeliveries,
                  icon: CheckCircle2,
                  change: deliveriesChange,
                },
                {
                  label: "Revenue",
                  value: `$${periodRevenue.toFixed(2)}`,
                  icon: DollarSign,
                  change: revenueChange,
                },
                {
                  label: "Delivery Rate",
                  value: `${avgDeliveryRate}%`,
                  icon: TrendingUp,
                  change: null,
                  sparkline: deliveryRateSpark,
                },
              ].map((kpi, i) => (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-5 bg-card rounded-2xl border border-border shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-9 w-9 rounded-xl bg-stone-100 dark:bg-stone-800/30 flex items-center justify-center">
                      <kpi.icon className="h-4 w-4" style={{ color: '#57534e' }} />
                    </div>
                    {kpi.change !== null ? (
                      <span
                        className={`text-xs font-medium flex items-center gap-0.5 px-2 py-0.5 rounded-full ${
                          kpi.change >= 0
                            ? "text-green-600 bg-green-50 dark:bg-green-900/20"
                            : "text-red-600 bg-red-50 dark:bg-red-900/20"
                        }`}
                      >
                        {kpi.change >= 0 ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {Math.abs(kpi.change)}%
                      </span>
                    ) : (
                      (kpi as any).sparkline && (
                        <Sparkline
                          data={(kpi as any).sparkline}
                          color="#57534e"
                          width={80}
                          height={28}
                        />
                      )
                    )}
                  </div>
                  <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
                </motion.div>
              ))}
            </div>

            {/* ─── Charts Row ─── */}
            <div className="grid grid-cols-3 gap-6">
              {/* Orders Per Day */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="col-span-2 p-6 bg-card rounded-2xl border border-border shadow-sm"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Orders Per Day</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      New orders created over the last {rangeDays} days
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">{periodOrders}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Total</p>
                  </div>
                </div>
                <BarChartSVG
                  data={dailyOrders.map((d) => d.count)}
                  labels={dailyOrders.map((d) => format(d.date, "MMM d"))}
                  color={isDark ? "#f97316" : "#ea580c"}
                  height={200}
                />
              </motion.div>

              {/* Status Breakdown */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="p-6 bg-card rounded-2xl border border-border shadow-sm"
              >
                <h3 className="text-sm font-bold text-foreground mb-1">Order Status</h3>
                <p className="text-xs text-muted-foreground mb-4">Current breakdown</p>
                <div className="flex justify-center mb-4">
                  <DonutChart segments={statusBreakdown} size={160} />
                </div>
                <div className="space-y-2">
                  {statusBreakdown.map((seg) => (
                    <div key={seg.label} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: seg.color }}
                        />
                        <span className="text-muted-foreground">{seg.label}</span>
                      </div>
                      <span className="font-bold text-foreground">{seg.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* ─── Revenue + Deliveries Chart ─── */}
            <div className="grid grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-6 bg-card rounded-2xl border border-border shadow-sm"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Daily Revenue</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Earnings from completed deliveries
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      ${periodRevenue.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase">Total</p>
                  </div>
                </div>
                <BarChartSVG
                  data={dailyRevenue.map((d) => d.total)}
                  labels={dailyRevenue.map((d) => format(d.date, "MMM d"))}
                  color="#22c55e"
                  height={180}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="p-6 bg-card rounded-2xl border border-border shadow-sm"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Deliveries Completed</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Successfully delivered orders per day
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">{periodDeliveries}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Total</p>
                  </div>
                </div>
                <BarChartSVG
                  data={dailyDeliveries.map((d) => d.count)}
                  labels={dailyDeliveries.map((d) => format(d.date, "MMM d"))}
                  color="#8b5cf6"
                  height={180}
                />
              </motion.div>
            </div>

            {/* ─── Top Drivers + Quick Stats ─── */}
            <div className="grid grid-cols-3 gap-6">
              {/* Top Drivers */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="col-span-2 p-6 bg-card rounded-2xl border border-border shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Top Drivers</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Highest performing drivers by deliveries
                    </p>
                  </div>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                {topDrivers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No delivery data yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {topDrivers.map((driver, i) => {
                      const maxDel = topDrivers[0]?.deliveries ?? 1;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + i * 0.05 }}
                          className="flex items-center gap-4"
                        >
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground truncate">
                                  {driver.name}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                                  {driver.type === "EMPLOYED" ? "Employed" : "Independent"}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="font-bold text-foreground">
                                  {driver.deliveries} deliveries
                                </span>
                                <span className="text-green-600 font-bold">
                                  ${driver.revenue.toFixed(2)}
                                </span>
                              </div>
                            </div>
                            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary transition-all duration-500"
                                style={{
                                  width: `${(driver.deliveries / maxDel) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="p-6 bg-card rounded-2xl border border-border shadow-sm"
              >
                <h3 className="text-sm font-bold text-foreground mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  {[
                    {
                      label: "Avg. Orders / Day",
                      value: (periodOrders / rangeDays).toFixed(1),
                      icon: Package,
                    },
                    {
                      label: "Avg. Revenue / Day",
                      value: `$${(periodRevenue / rangeDays).toFixed(2)}`,
                      icon: DollarSign,
                    },
                    {
                      label: "Avg. Order Value",
                      value:
                        periodDeliveries > 0
                          ? `$${(periodRevenue / periodDeliveries).toFixed(2)}`
                          : "$0",
                      icon: TrendingUp,
                    },
                    {
                      label: "Active Bids",
                      value: stats?.activeBids ?? 0,
                      icon: Clock,
                    },
                    {
                      label: "Active Drivers",
                      value: new Set(
                        orders
                          .filter((o) => o.assignment?.driver_id)
                          .map((o) => o.assignment!.driver_id),
                      ).size,
                      icon: Truck,
                    },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center gap-3">
                      <div
                        className="h-9 w-9 rounded-xl bg-stone-100 dark:bg-stone-800/30 flex items-center justify-center shrink-0"
                      >
                        <s.icon className="h-4 w-4" style={{ color: '#57534e' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                        <p className="text-sm font-bold text-foreground">{s.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
