import { useState, useEffect, useMemo } from "react";
import { EmployedDriverSidebar } from "@/components/dashboard/employed-driver-sidebar";
import { useTheme } from "@/hooks/useTheme";
import {
  Search,
  MapPin,
  ArrowRight,
  Clock,
  ClipboardList,
} from "lucide-react";
import LoadingPackage from "@/components/ui/loading-package";
import {
  fetchAssignedOrders,
  type AssignedOrder,
} from "@/services/employed-driver/dashboard";

/* ─── Types ─── */
type StatusFilter =
  | "ALL"
  | "UNASSIGNED"
  | "ASSIGNED"
  | "PICKED_UP"
  | "EN_ROUTE"
  | "DELIVERED"
  | "CANCELLED";

const statusConfig: Record<string, { label: string; color: string }> = {
  UNASSIGNED: {
    label: "Queued",
    color: "text-gray-500 bg-secondary",
  },
  ASSIGNED: {
    label: "Assigned",
    color: "text-amber-500 bg-amber-50 dark:bg-amber-900/20",
  },
  PICKED_UP: {
    label: "In Progress",
    color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
  },
  EN_ROUTE: {
    label: "En Route",
    color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20",
  },
  DELIVERED: {
    label: "Completed",
    color: "text-green-500 bg-green-50 dark:bg-green-900/20",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "text-red-400 bg-red-50 dark:bg-red-900/20",
  },
};

export default function EmployedDriverOrdersPage() {
  const { isDark, setIsDark } = useTheme();
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<AssignedOrder[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchAssignedOrders();
      setOrders(data);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    let r = orders;
    if (filter !== "ALL") r = r.filter((o) => o.status === filter);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q),
      );
    }
    return r;
  }, [orders, filter, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: orders.length };
    orders.forEach((o) => {
      c[o.status] = (c[o.status] ?? 0) + 1;
    });
    return c;
  }, [orders]);

  return (
    <div className="flex min-h-screen w-full">
      <EmployedDriverSidebar isDark={isDark} setIsDark={setIsDark} />
      <div className="flex-1 bg-background overflow-auto">
        <header className="sticky top-0 z-10 bg-card backdrop-blur-xl border-b border-border px-6 py-4">
          <h1 className="text-xl font-bold text-foreground">
            Assigned Orders
          </h1>
          <p className="text-sm text-muted-foreground">
            Orders assigned to you by Manhattan Logistics
          </p>
          <div className="flex items-center gap-1 mt-3 overflow-x-auto">
            {(
              [
                "ALL",
                "UNASSIGNED",
                "ASSIGNED",
                "PICKED_UP",
                "EN_ROUTE",
                "DELIVERED",
                "CANCELLED",
              ] as const
            ).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-3xl text-xs font-medium whitespace-nowrap transition-colors ${filter === s ? "bg-primary/10 text-primary" : "text-gray-500 hover:bg-secondary"}`}
              >
                {s === "ALL" ? "All" : (statusConfig[s]?.label ?? s)}
                <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded-full">
                  {counts[s] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </header>

        <div className="p-6">
          <div className="flex items-center gap-2 bg-card border border-border rounded-full px-3 py-2.5 mb-4">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm text-secondary-foreground placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-gray-400">
                <LoadingPackage />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <ClipboardList className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">No orders found</p>
              </div>
            ) : (
              filtered.map((o) => {
                const sc = statusConfig[o.status];
                return (
                  <div
                    key={o.id}
                    className={`p-5 rounded-3xl bg-card border border-border shadow-sm ${o.status === "CANCELLED" ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">
                          {o.id}
                        </span>
                        {(o.priority === "URGENT" || o.priority === "HIGH") && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500 dark:bg-red-900/20">
                            Rush
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full ${sc?.color ?? "text-gray-500 bg-gray-100"}`}
                        >
                          {sc?.label ?? o.status}
                        </span>
                        <span className="text-sm font-bold text-secondary-foreground">
                          {o.weight}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                      <MapPin className="h-3 w-3 text-primary shrink-0" />
                      <span className="truncate">
                        {o.pickupAddress.split(",")[0]}
                      </span>
                      <ArrowRight className="h-2.5 w-2.5 shrink-0" />
                      <MapPin className="h-3 w-3 text-green-500 shrink-0" />
                      <span className="truncate">
                        {o.deliveryAddress.split(",")[0]}
                      </span>
                    </div>

                    {o.notes && (
                      <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 rounded-lg px-3 py-1.5 mb-2">
                        {o.notes}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-3">
                        <span>{o.customerName}</span>
                        <span>{o.weight}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(o.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
