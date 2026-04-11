import { useState, useEffect, useMemo } from "react";
import { EmployedDriverSidebar } from "@/components/dashboard/employed-driver-sidebar";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Calendar,
  Package,
  Truck,
  MapPin,
  X,
} from "lucide-react";
import LoadingPackage from "@/components/ui/loading-package";
import { FullScreenCalendar } from "@/components/ui/fullscreen-calendar";
import { isSameDay, format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE } from "@/lib/api";

/* ─── Helpers ─── */

function getStartOfWeek(d: Date, offset = 0): Date {
  const dt = new Date(d);
  dt.setDate(dt.getDate() - dt.getDay() + 1 + offset * 7);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ─── Types ─── */
interface Shift {
  date: string;
  fullDate: Date;
  dayName: string;
  dayNumber: number;
  startTime: string;
  endTime: string;
  hours: number;
  status: "completed" | "today" | "upcoming" | "off";
  deliveriesCompleted: number;
  deliveriesAssigned: number;
}

interface BackendOrder {
  id: number;
  status: string;
  createdAt: string;
  pickup_address?: string;
  delivery_address?: string;
}



const orderStatusColors: Record<string, string> = {
  DELIVERED: "text-green-600 bg-green-100 dark:bg-green-900/30",
  PICKED_UP: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
  EN_ROUTE: "text-purple-600 bg-purple-100 dark:bg-purple-900/30",
  ASSIGNED: "text-orange-600 bg-orange-100 dark:bg-orange-900/30",
  UNASSIGNED: "text-gray-600 bg-gray-100 dark:bg-gray-900/30",
  LISTED: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
  CANCELLED: "text-red-600 bg-red-100 dark:bg-red-900/30",
};

export default function EmployedDriverSchedulePage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [view, setView] = useState<"week" | "month">("month");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [ordersByDay, setOrdersByDay] = useState<
    Record<
      string,
      { assigned: number; completed: number; orders: BackendOrder[] }
    >
  >({});
  const [loading, setLoading] = useState(true);
  const companyName = localStorage.getItem("dc_company_name") || "Your Company";

  // Fetch orders to compute delivery stats per day
  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      try {
        const cid = localStorage.getItem("dc_company_id") || "";
        const did = localStorage.getItem("dc_driver_id") || "";
        const res = await fetch(`${API_BASE}/orders?for_driver=${did}&limit=200`, {
          credentials: "include",
          headers: { "x-company-id": cid, "x-driver-id": did },
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const grouped: Record<
            string,
            { assigned: number; completed: number; orders: BackendOrder[] }
          > = {};
          (data.data as BackendOrder[]).forEach((order) => {
            const dateKey = new Date(order.createdAt).toDateString();
            if (!grouped[dateKey])
              grouped[dateKey] = { assigned: 0, completed: 0, orders: [] };
            grouped[dateKey].assigned++;
            grouped[dateKey].orders.push(order);
            if (order.status === "DELIVERED") grouped[dateKey].completed++;
          });
          setOrdersByDay(grouped);
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

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
    for (const [dateStr, dayData] of Object.entries(ordersByDay)) {
      const day = new Date(dateStr);
      const events = dayData.orders.map((o) => ({
        id: o.id,
        name: `Order #${o.id}`,
        time: new Date(o.createdAt).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
        datetime: o.createdAt,
        status: o.status,
      }));
      result.push({ day, events });
    }
    return result;
  }, [ordersByDay]);

  /* ─── Selected day detail info ─── */
  const selectedDayInfo = useMemo(() => {
    if (!selectedDay) return null;
    const dateStr = selectedDay.toDateString();
    const dayData = ordersByDay[dateStr];
    const isWeekend = selectedDay.getDay() === 0 || selectedDay.getDay() === 6;
    return {
      dateLabel: format(selectedDay, "EEEE, MMMM d, yyyy"),
      shortLabel: format(selectedDay, "MMM d"),
      isWeekend,
      assigned: dayData?.assigned ?? 0,
      completed: dayData?.completed ?? 0,
      orders: dayData?.orders ?? [],
    };
  }, [selectedDay, ordersByDay]);

  /* ─── Week data ─── */
  const weekStart = getStartOfWeek(new Date(), weekOffset);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const weekLabel = `${formatShortDate(weekStart)} – ${formatShortDate(weekEnd)}, ${weekEnd.getFullYear()}`;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const week: Shift[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const isToday =
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate();
    const isPast = d < today;
    const isWeekend = i >= 5;

    let status: Shift["status"];
    if (isWeekend) status = "off";
    else if (isToday) status = "today";
    else if (isPast) status = "completed";
    else status = "upcoming";

    const dayKey = d.toDateString();
    const dayOrders = ordersByDay[dayKey] ?? { assigned: 0, completed: 0 };

    let hoursWorked = 0;
    if (isToday) {
      const now = new Date();
      const currentHour = now.getHours() + now.getMinutes() / 60;
      hoursWorked = Math.max(
        0,
        Math.min(8, Math.round((currentHour - 9) * 10) / 10),
      );
    }

    return {
      date: formatShortDate(d),
      fullDate: d,
      dayName: DAY_NAMES[i],
      dayNumber: d.getDate(),
      startTime: isWeekend ? "—" : "9:00 AM",
      endTime: isWeekend ? "—" : "5:00 PM",
      hours: isWeekend ? 0 : isToday ? hoursWorked : isPast ? 8 : 8,
      status,
      deliveriesAssigned: isWeekend ? 0 : dayOrders.assigned,
      deliveriesCompleted: isWeekend ? 0 : dayOrders.completed,
    };
  });

  const totalHours = week.filter((d) => d.status !== "off").length * 8;
  const workedHours =
    week.filter((d) => d.status === "completed").length * 8 +
    (week.find((d) => d.status === "today")?.hours ?? 0);

  function handleDaySelect(day: Date) {
    if (selectedDay && isSameDay(day, selectedDay)) {
      setSelectedDay(null);
    } else {
      setSelectedDay(day);
    }
  }

  return (
    <div className="flex min-h-screen w-full">
      <EmployedDriverSidebar />
      <div className="flex-1 bg-background overflow-auto">
        <header className="sticky top-0 z-10 bg-card backdrop-blur-xl border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" /> Shift Schedule
              </h1>
              <p className="text-sm text-muted-foreground">
                Your work schedule from {companyName}
              </p>
            </div>
            {/* View toggle */}
            <div className="flex items-center bg-secondary rounded-full p-1">
              <button
                onClick={() => setView("month")}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  view === "month"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setView("week")}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  view === "week"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Week
              </button>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <LoadingPackage />
            </div>
          ) : view === "month" ? (
            /* ═══════════════ MONTH VIEW ═══════════════ */
            <motion.div
              key="month"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Calendar (full width) */}
              <FullScreenCalendar
                data={calendarData}
                onDaySelect={handleDaySelect}
                selectedDay={selectedDay}
                headerActions={
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span>
                      {Object.values(ordersByDay).reduce(
                        (s, d) => s + d.assigned,
                        0,
                      )}{" "}
                      total deliveries
                    </span>
                  </div>
                }
              />

              {/* ─── Deliveries Below Calendar ─── */}
              <AnimatePresence>
                {selectedDay && selectedDayInfo && (() => {
                  const filteredOrders = selectedDayInfo.orders.filter(
                    (o) => o.status !== "UNASSIGNED"
                  );
                  const filteredCompleted = filteredOrders.filter(
                    (o) => o.status === "DELIVERED"
                  ).length;
                  return (
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
                            {/* Quick stats */}
                            <div className="flex items-center gap-3">
                              <div className="px-3 py-1.5 rounded-full bg-muted/50 text-center">
                                <span className="text-sm font-bold text-foreground mr-1">
                                  {filteredOrders.length}
                                </span>
                                <span className="text-[10px] uppercase text-muted-foreground font-medium">
                                  Assigned
                                </span>
                              </div>
                              <div className="px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/20 text-center">
                                <span className="text-sm font-bold text-green-600 mr-1">
                                  {filteredCompleted}
                                </span>
                                <span className="text-[10px] uppercase text-muted-foreground font-medium">
                                  Completed
                                </span>
                              </div>
                              <div className="px-3 py-1.5 rounded-full bg-primary/5 text-center">
                                <span className="text-sm font-bold text-primary mr-1">
                                  {filteredOrders.length > 0
                                    ? Math.round(
                                        (filteredCompleted /
                                          filteredOrders.length) *
                                          100,
                                      )
                                    : 0}
                                  %
                                </span>
                                <span className="text-[10px] uppercase text-muted-foreground font-medium">
                                  Rate
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

                        {/* Orders list */}
                        <div className="p-5">
                          {selectedDayInfo.isWeekend &&
                          filteredOrders.length === 0 ? (
                            <div className="flex items-center justify-center py-8 text-center">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="text-left">
                                  <p className="text-sm font-medium text-muted-foreground">
                                    Day Off
                                  </p>
                                  <p className="text-xs text-muted-foreground/60">
                                    No shifts scheduled for weekends
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : filteredOrders.length === 0 ? (
                            <div className="flex items-center justify-center py-8 text-center">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="text-left">
                                  <p className="text-sm font-medium text-muted-foreground">
                                    No deliveries
                                  </p>
                                  <p className="text-xs text-muted-foreground/60">
                                    No assigned orders for this day
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                              {filteredOrders.map((order, idx) => (
                                <motion.div
                                  key={order.id}
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: idx * 0.04 }}
                                  className="p-4 rounded-xl border border-border bg-background hover:bg-muted/30 transition-colors"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-bold text-foreground">
                                      Order #{order.id}
                                    </span>
                                    <span
                                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                        orderStatusColors[order.status] ??
                                        "text-gray-600 bg-gray-100"
                                      }`}
                                    >
                                      {order.status}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                                    <Clock className="h-3 w-3" />
                                    {new Date(
                                      order.createdAt,
                                    ).toLocaleTimeString("en-US", {
                                      hour: "numeric",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                  {order.pickup_address && (
                                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground mb-1">
                                      <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-blue-500" />
                                      <span className="truncate">
                                        {order.pickup_address}
                                      </span>
                                    </div>
                                  )}
                                  {order.delivery_address && (
                                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                      <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-green-500" />
                                      <span className="truncate">
                                        {order.delivery_address}
                                      </span>
                                    </div>
                                  )}
                                  {order.status === "DELIVERED" && (
                                    <div className="flex items-center gap-1 mt-2 text-green-600 text-xs font-medium">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Delivered
                                    </div>
                                  )}
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
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
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-bold text-foreground">
                        {Math.round(workedHours * 10) / 10}h
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        / {totalHours}h
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Truck className="h-3.5 w-3.5" />
                      {week.reduce((s, d) => s + d.deliveriesCompleted, 0)} / {week.reduce((s, d) => s + d.deliveriesAssigned, 0)} deliveries
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
                  {week.map((shift) => {
                    const isSelected = selectedDay && isSameDay(shift.fullDate, selectedDay);
                    return (
                      <div
                        key={shift.date}
                        onClick={() => handleDaySelect(shift.fullDate)}
                        className={`relative flex flex-col min-h-[120px] border-r last:border-r-0 border-border cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-primary/5"
                            : shift.status === "off"
                              ? "bg-accent/50"
                              : "hover:bg-accent/75"
                        }`}
                      >
                        <header className="flex items-center justify-between p-2.5 pb-0.5">
                          <div className="flex items-center gap-1.5">
                            <div
                              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                                shift.status === "today"
                                  ? "bg-primary text-primary-foreground"
                                  : shift.status === "off"
                                    ? "text-muted-foreground"
                                    : "text-foreground"
                              }`}
                            >
                              {shift.dayNumber}
                            </div>
                            {shift.status === "today" && (
                              <span className="text-[9px] font-medium text-primary">
                                Today
                              </span>
                            )}
                          </div>
                          {shift.deliveriesAssigned > 0 && (
                            <span className="text-[9px] text-muted-foreground font-medium">
                              {shift.deliveriesAssigned}{" "}
                              {shift.deliveriesAssigned === 1 ? "delivery" : "deliveries"}
                            </span>
                          )}
                        </header>

                        <div className="px-2.5 pt-1 pb-2 flex-1">
                          {shift.status === "off" ? (
                            <p className="text-[10px] text-muted-foreground/60 mt-1">Day off</p>
                          ) : (
                            <>
                              <p className="text-[10px] text-muted-foreground">
                                {shift.startTime} – {shift.endTime}
                              </p>
                              {shift.deliveriesCompleted > 0 && (
                                <p className="text-[11px] font-bold text-green-600 mt-1">
                                  {shift.deliveriesCompleted} completed
                                </p>
                              )}
                              {shift.status === "completed" && (
                                <div className="flex items-center gap-1 mt-1">
                                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                                  <span className="text-[10px] text-green-600 font-medium">Done</span>
                                </div>
                              )}
                              {shift.status === "today" && (
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                  <span className="text-[10px] text-primary font-medium">On shift</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ─── Deliveries Below (same as month view) ─── */}
              <AnimatePresence>
                {selectedDay && (() => {
                  const dateStr = selectedDay.toDateString();
                  const dayData = ordersByDay[dateStr];
                  const allOrders = dayData?.orders ?? [];
                  const filteredOrders = allOrders.filter((o) => o.status !== "UNASSIGNED");
                  const filteredCompleted = filteredOrders.filter((o) => o.status === "DELIVERED").length;
                  const isWeekend = selectedDay.getDay() === 0 || selectedDay.getDay() === 6;

                  return (
                    <motion.div
                      key="week-detail-below"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-border flex items-center justify-between">
                          <div>
                            <h3 className="text-base font-bold text-foreground">
                              {format(selectedDay, "MMM d")}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {format(selectedDay, "EEEE, MMMM d, yyyy")}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                              <div className="px-3 py-1.5 rounded-full bg-muted/50">
                                <span className="text-sm font-bold text-foreground mr-1">{filteredOrders.length}</span>
                                <span className="text-[10px] uppercase text-muted-foreground font-medium">Assigned</span>
                              </div>
                              <div className="px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/20">
                                <span className="text-sm font-bold text-green-600 mr-1">{filteredCompleted}</span>
                                <span className="text-[10px] uppercase text-muted-foreground font-medium">Completed</span>
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

                        <div className="p-5">
                          {isWeekend && filteredOrders.length === 0 ? (
                            <div className="flex items-center justify-center py-8">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="text-left">
                                  <p className="text-sm font-medium text-muted-foreground">Day Off</p>
                                  <p className="text-xs text-muted-foreground/60">No shifts scheduled</p>
                                </div>
                              </div>
                            </div>
                          ) : filteredOrders.length === 0 ? (
                            <div className="flex items-center justify-center py-8">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="text-left">
                                  <p className="text-sm font-medium text-muted-foreground">No deliveries</p>
                                  <p className="text-xs text-muted-foreground/60">No assigned orders for this day</p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                              {filteredOrders.map((order, idx) => (
                                <motion.div
                                  key={order.id}
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: idx * 0.04 }}
                                  className="p-4 rounded-xl border border-border bg-background hover:bg-muted/30 transition-colors"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-bold text-foreground">Order #{order.id}</span>
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${orderStatusColors[order.status] ?? "text-gray-600 bg-gray-100"}`}>
                                      {order.status}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                                    <Clock className="h-3 w-3" />
                                    {new Date(order.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                  </div>
                                  {order.pickup_address && (
                                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground mb-1">
                                      <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-blue-500" />
                                      <span className="truncate">{order.pickup_address}</span>
                                    </div>
                                  )}
                                  {order.delivery_address && (
                                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                      <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-green-500" />
                                      <span className="truncate">{order.delivery_address}</span>
                                    </div>
                                  )}
                                  {order.status === "DELIVERED" && (
                                    <div className="flex items-center gap-1 mt-2 text-green-600 text-xs font-medium">
                                      <CheckCircle2 className="h-3 w-3" /> Delivered
                                    </div>
                                  )}
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
