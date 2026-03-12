import { useState, useEffect, useMemo } from "react";
import { DriverSidebar } from "@/components/dashboard/driver-sidebar";
import { useTheme } from "@/hooks/useTheme";
import {
  IndianRupee,
  TrendingUp,
  ArrowRight,
  Download,
  CheckCircle2,
  X,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import LoadingPackage from "@/components/ui/loading-package";
import { get } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { FullScreenCalendar } from "@/components/ui/fullscreen-calendar";
import { isSameDay, format } from "date-fns";
import { formatINR } from "@/lib/currency";

/* ─── Types ─── */
interface BackendAssignment {
  id: number;
  order_id: number;
  driver_id: number;
  source?: string; // 'DIRECT' | 'BID'
  createdAt: string;
  order?: {
    id: number;
    tracking_code: string;
    pickup_address: string | null;
    pickup_lat: string | null;
    pickup_lng: string | null;
    delivery_address: string | null;
    delivery_lat: string | null;
    delivery_lng: string | null;
    listed_price: string | null;
    weight_kg: string | null;
    status: string;
    priority: string;
    notes: string | null;
    created_at: string;
    bids?: Array<{
      id: number;
      offered_price: string;
      status: string;
    }>;
  };
}

interface Transaction {
  id: string;
  orderId: string;
  trackingCode: string;
  pickup: string;
  delivery: string;
  amount: number;
  date: string;
  dateObj: Date;
  type: "delivery" | "bonus" | "tip";
  status: string;
}

const typeConfig = {
  delivery: {
    label: "Delivery",
    color: "text-green-600 bg-green-50 dark:bg-green-900/20",
  },
  bonus: {
    label: "Bonus",
    color: "text-purple-500 bg-purple-50 dark:bg-purple-900/20",
  },
  tip: {
    label: "Tip",
    color: "text-amber-500 bg-amber-50 dark:bg-amber-900/20",
  },
};

/* ─── Week helpers ─── */
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getStartOfWeek(d: Date, offset = 0): Date {
  const dt = new Date(d);
  dt.setDate(dt.getDate() - dt.getDay() + 1 + offset * 7);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function DriverEarningsPage() {
  const { isDark, setIsDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<BackendAssignment[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [view, setView] = useState<"month" | "week">("month");
  const [weekOffset, setWeekOffset] = useState(0);

  const driverId = localStorage.getItem("dc_driver_id") || "";

  // Fetch all history for this driver
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await get<BackendAssignment[]>("/history");
        // Filter to this driver's assignments only
        setAssignments(data.filter((a) => String(a.driver_id) === driverId));
      } catch {
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [driverId]);

  // Build transactions from assignments
  const transactions = useMemo((): Transaction[] => {
    return assignments
      .filter((a) => a.order)
      .map((a): Transaction => {
        const order = a.order!;
        // Prefer the accepted bid's offered_price (actual negotiated amount)
        // over the order's listed_price (original asking price)
        const acceptedBid = order.bids?.find(b => b.status === 'ACCEPTED');
        const amount = acceptedBid
          ? parseFloat(acceptedBid.offered_price)
          : order.listed_price
            ? parseFloat(order.listed_price)
            : order.status === "DELIVERED"
              ? 15
              : 0;
        const dateObj = new Date(a.createdAt);

        return {
          id: `TXN-${a.id}`,
          orderId: `ORD-${order.id}`,
          trackingCode: order.tracking_code || `#${order.id}`,
          pickup: order.pickup_address
            ? order.pickup_address.split(",")[0]
            : "Pickup",
          delivery: order.delivery_address
            ? order.delivery_address.split(",")[0]
            : "Delivery",
          amount,
          date: dateObj.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          dateObj,
          type: "delivery",
          status: order.status,
        };
      })
      .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
  }, [assignments]);

  // Compute totals
  const completedTxns = transactions.filter((t) => t.status === "DELIVERED");

  /* ─── Calendar data for FullScreenCalendar ─── */
  const calendarData = useMemo(() => {
    const result: {
      day: Date;
      events: {
        id: number;
        name: string;
        time: string;
        datetime: string;
        status?: string;
      }[];
    }[] = [];
    const grouped: Record<
      string,
      {
        day: Date;
        events: {
          id: number;
          name: string;
          time: string;
          datetime: string;
          status?: string;
        }[];
      }
    > = {};

    for (const txn of completedTxns) {
      const dateStr = txn.dateObj.toDateString();
      if (!grouped[dateStr]) {
        grouped[dateStr] = { day: new Date(dateStr), events: [] };
      }
      grouped[dateStr].events.push({
        id: parseInt(txn.id.replace("TXN-", "")),
        name: `${txn.trackingCode} — ${formatINR(txn.amount)}`,
        time: txn.dateObj.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
        datetime: txn.dateObj.toISOString(),
        status: txn.status,
      });
    }

    for (const g of Object.values(grouped)) {
      result.push(g);
    }
    return result;
  }, [completedTxns]);

  // Stats for selected calendar day
  const selectedDayInfo = useMemo(() => {
    if (!selectedDay) return null;
    const dateStr = selectedDay.toDateString();
    const dayTxns = completedTxns.filter(
      (t) => t.dateObj.toDateString() === dateStr,
    );
    return {
      dateLabel: format(selectedDay, "EEEE, MMMM d, yyyy"),
      shortLabel: format(selectedDay, "MMM d"),
      count: dayTxns.length,
      total: dayTxns.reduce((s, t) => s + t.amount, 0),
      transactions: dayTxns,
    };
  }, [selectedDay, completedTxns]);

  function handleDaySelect(day: Date) {
    if (selectedDay && isSameDay(day, selectedDay)) {
      setSelectedDay(null);
    } else {
      setSelectedDay(day);
    }
  }

  // Monthly calendar totals
  const calMonthEarnings = completedTxns.reduce((s, t) => s + t.amount, 0);

  /* ─── Day overlay: show earnings on each date ─── */
  const dayOverlay = useMemo(() => {
    const map: Record<string, { label: string; sub?: string; color?: string }> =
      {};
    const dayAmounts: Record<string, { total: number; count: number }> = {};
    for (const txn of completedTxns) {
      const key = format(txn.dateObj, "yyyy-MM-dd");
      if (!dayAmounts[key]) dayAmounts[key] = { total: 0, count: 0 };
      dayAmounts[key].total += txn.amount;
      dayAmounts[key].count += 1;
    }
    for (const [key, val] of Object.entries(dayAmounts)) {
      map[key] = {
        label: formatINR(val.total),
        sub: `${val.count} ${val.count === 1 ? "delivery" : "deliveries"}`,
        color: "text-green-600",
      };
    }
    return map;
  }, [completedTxns]);

  /* ─── Week view data ─── */
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekStart = getStartOfWeek(new Date(), weekOffset);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekLabel = `${formatShortDate(weekStart)} – ${formatShortDate(weekEnd)}, ${weekEnd.getFullYear()}`;

  // Transactions grouped by day for the week
  const txnsByDay = useMemo(() => {
    const map: Record<string, { total: number; count: number; txns: Transaction[] }> = {};
    for (const txn of completedTxns) {
      const key = txn.dateObj.toDateString();
      if (!map[key]) map[key] = { total: 0, count: 0, txns: [] };
      map[key].total += txn.amount;
      map[key].count += 1;
      map[key].txns.push(txn);
    }
    return map;
  }, [completedTxns]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const key = d.toDateString();
      const data = txnsByDay[key];
      const isToday =
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate();
      return {
        date: d,
        dayNumber: d.getDate(),
        dayName: DAY_NAMES[i],
        isToday,
        earnings: data?.total ?? 0,
        deliveryCount: data?.count ?? 0,
        txns: data?.txns ?? [],
      };
    });
  }, [weekStart, txnsByDay, today]);

  const weekTotalEarnings = weekDays.reduce((s, d) => s + d.earnings, 0);
  const weekTotalDeliveries = weekDays.reduce((s, d) => s + d.deliveryCount, 0);

  /* ─── Detail panel for selected day (shared by both views) ─── */
  function renderDayDetail() {
    if (!selectedDay || !selectedDayInfo) return null;
    return (
      <AnimatePresence>
        <motion.div
          key="detail-below"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {selectedDayInfo.shortLabel}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedDayInfo.dateLabel}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 rounded-full bg-muted/50">
                    <span className="text-sm font-bold text-foreground mr-1">
                      {selectedDayInfo.count}
                    </span>
                    <span className="text-[10px] uppercase text-muted-foreground font-medium">
                      Deliveries
                    </span>
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/20">
                    <span className="text-sm font-bold text-green-600 mr-1">
                      {formatINR(selectedDayInfo.total)}
                    </span>
                    <span className="text-[10px] uppercase text-muted-foreground font-medium">
                      Earned
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Transactions list */}
            <div className="p-5">
              {selectedDayInfo.transactions.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-muted-foreground">
                        No earnings
                      </p>
                      <p className="text-xs text-muted-foreground/60">
                        No completed deliveries on this day
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {selectedDayInfo.transactions.map((txn, idx) => (
                    <motion.div
                      key={txn.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border hover:bg-muted/30 transition-colors"
                    >
                      <div className="h-8 w-8 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground">
                          {txn.trackingCode}
                        </p>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                          <span className="truncate">{txn.pickup}</span>
                          <ArrowRight className="h-2.5 w-2.5 shrink-0" />
                          <span className="truncate">{txn.delivery}</span>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-green-600 shrink-0">
                        +{formatINR(txn.amount)}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <DriverSidebar isDark={isDark} setIsDark={setIsDark} />
      <div className="flex-1 bg-background overflow-auto">
        <header className="sticky top-0 z-10 bg-card backdrop-blur-xl border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Earnings</h1>
            <p className="text-sm text-muted-foreground">
              Track your income and transactions
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex items-center bg-secondary rounded-full p-1">
              <button
                onClick={() => { setView("month"); setSelectedDay(null); }}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  view === "month"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Month
              </button>
              <button
                onClick={() => { setView("week"); setSelectedDay(null); }}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  view === "week"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Week
              </button>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-full text-sm text-secondary-foreground hover:bg-secondary transition-colors">
              <Download className="h-4 w-4" /> Export
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingPackage />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {view === "month" ? (
              /* ═══════════════ MONTH VIEW ═══════════════ */
              <motion.div
                key="month"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <FullScreenCalendar
                  data={calendarData}
                  onDaySelect={handleDaySelect}
                  selectedDay={selectedDay}
                  dayOverlay={dayOverlay}
                  headerActions={
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/20">
                        <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                        <span className="text-sm font-bold text-green-600">
                          {formatINR(calMonthEarnings)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          total
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Package className="h-3.5 w-3.5" />
                        {completedTxns.length} deliveries
                      </div>
                    </div>
                  }
                />
                {renderDayDetail()}
              </motion.div>
            ) : (
              /* ═══════════════ WEEK VIEW ═══════════════ */
              <motion.div
                key="week"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                  {/* Week navigation header */}
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center gap-4">
                      <div className="inline-flex -space-x-px rounded-lg shadow-sm shadow-black/5">
                        <button
                          onClick={() => setWeekOffset((o) => o - 1)}
                          className="flex items-center justify-center h-9 w-9 rounded-l-lg border border-border bg-background hover:bg-muted transition-colors"
                        >
                          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => setWeekOffset(0)}
                          className="flex items-center justify-center h-9 px-3 border-y border-border bg-background hover:bg-muted transition-colors text-xs font-medium text-foreground"
                        >
                          This Week
                        </button>
                        <button
                          onClick={() => setWeekOffset((o) => o + 1)}
                          className="flex items-center justify-center h-9 w-9 rounded-r-lg border border-border bg-background hover:bg-muted transition-colors"
                        >
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                      <h2 className="text-sm font-semibold text-foreground">
                        {weekLabel}
                      </h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/20">
                        <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                        <span className="text-xs font-bold text-green-600">
                          {formatINR(weekTotalEarnings)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Package className="h-3.5 w-3.5" />
                        {weekTotalDeliveries} deliveries
                      </div>
                    </div>
                  </div>

                  {/* Day headers */}
                  <div className="grid grid-cols-7 border-b border-border text-center text-xs font-semibold leading-6 text-muted-foreground">
                    {DAY_NAMES.map((name) => (
                      <div key={name} className="border-r last:border-r-0 border-border py-2.5">
                        {name}
                      </div>
                    ))}
                  </div>

                  {/* Day cells – single row of 7 */}
                  <div className="grid grid-cols-7">
                    {weekDays.map((day) => {
                      const isSelected = selectedDay && isSameDay(day.date, selectedDay);
                      return (
                        <div
                          key={day.date.toISOString()}
                          onClick={() => handleDaySelect(day.date)}
                          className={`relative flex flex-col min-h-[120px] border-r last:border-r-0 border-border cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-primary/5"
                              : "hover:bg-accent/75"
                          }`}
                        >
                          <header className="flex items-center justify-between p-2.5 pb-0.5">
                            <div className="flex items-center gap-1.5">
                              <div
                                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                                  day.isToday
                                    ? "bg-primary text-primary-foreground"
                                    : "text-foreground"
                                }`}
                              >
                                {day.dayNumber}
                              </div>
                              {day.isToday && (
                                <span className="text-[9px] font-medium text-primary">
                                  Today
                                </span>
                              )}
                            </div>
                            {day.deliveryCount > 0 && (
                              <span className="text-[9px] text-muted-foreground font-medium">
                                {day.deliveryCount}{" "}
                                {day.deliveryCount === 1 ? "delivery" : "deliveries"}
                              </span>
                            )}
                          </header>

                          <div className="px-2.5 pt-1 pb-2 flex-1">
                            {day.earnings > 0 && (
                              <p className="text-[11px] font-bold text-green-600">
                                {formatINR(day.earnings)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Detail below calendar */}
                {renderDayDetail()}
              </motion.div>
            )}

            {/* ─── Transactions List ─── */}
            <div className="bg-card rounded-3xl border border-border">
              <div className="px-5 py-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-foreground">
                  Recent Transactions
                </h2>
                <span className="text-xs text-muted-foreground">
                  {transactions.length} transactions
                </span>
              </div>
              {transactions.length === 0 ? (
                <div className="px-5 pb-5 text-center text-sm text-muted-foreground">
                  No transactions for this period
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {transactions.map((txn) => {
                    const tc = typeConfig[txn.type];
                    return (
                      <div
                        key={txn.id}
                        className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors"
                      >
                        <div
                          className={`h-9 w-9 rounded-full flex items-center justify-center ${tc.color.split(" ").slice(1).join(" ")}`}
                        >
                          <IndianRupee
                            className={`h-4 w-4 ${tc.color.split(" ")[0]}`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${tc.color}`}
                            >
                              {tc.label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {txn.trackingCode}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                txn.status === "DELIVERED"
                                  ? "bg-green-50 dark:bg-green-900/20 text-green-600"
                                  : "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600"
                              }`}
                            >
                              {txn.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <span className="truncate">{txn.pickup}</span>
                            <ArrowRight className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate">{txn.delivery}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-sm font-bold ${txn.status === "DELIVERED" ? "text-green-600" : "text-muted-foreground"}`}
                          >
                            {txn.status === "DELIVERED"
                              ? `+${formatINR(txn.amount)}`
                              : "Pending"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {txn.date}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
