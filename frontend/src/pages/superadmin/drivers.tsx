/**
 * SuperAdmin — All Drivers Page
 *
 * Platform-wide driver list with type/status filters,
 * verification badges, and per-driver stats.
 */

import { useState, useEffect } from "react";
import { SuperAdminSidebar } from "@/components/dashboard/superadmin-sidebar";
import { useTheme } from "@/hooks/useTheme";
import {
  Truck,
  Search,
  AlertCircle,
  Bell,
  UserCheck,
  Clock,
  XCircle,
  Wifi,
  WifiOff,
  Building2,
  Package,
} from "lucide-react";
import LoadingPackage from "@/components/ui/loading-package";
import {
  fetchAllDrivers,
  type DriverSummary,
} from "@/services/superadmin/dashboard";

const statusColors: Record<string, { dot: string; text: string }> = {
  AVAILABLE: { dot: "bg-green-500", text: "text-green-600" },
  BUSY: { dot: "bg-amber-500", text: "text-amber-600" },
  OFFLINE: { dot: "bg-gray-400", text: "text-gray-500" },
};

const verificationColors: Record<
  string,
  { bg: string; text: string; icon: typeof UserCheck }
> = {
  VERIFIED: {
    bg: "bg-green-50 dark:bg-green-900/20",
    text: "text-green-600",
    icon: UserCheck,
  },
  PENDING: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-600",
    icon: Clock,
  },
  REJECTED: {
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-600",
    icon: XCircle,
  },
};

export default function SuperAdminDriversPage() {
  const { isDark, setIsDark } = useTheme();
  const [drivers, setDrivers] = useState<DriverSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    (async () => {
      try {
        const d = await fetchAllDrivers();
        setDrivers(d);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = drivers.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.companyName ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "ALL" || d.type === typeFilter;
    const matchesStatus = statusFilter === "ALL" || d.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const available = drivers.filter((d) => d.status === "AVAILABLE").length;
  const busy = drivers.filter((d) => d.status === "BUSY").length;
  const offline = drivers.filter((d) => d.status === "OFFLINE").length;
  const verified = drivers.filter(
    (d) => d.verificationStatus === "VERIFIED",
  ).length;

  return (
    <div className="flex min-h-screen w-full">
      <SuperAdminSidebar isDark={isDark} setIsDark={setIsDark} />

      <div className="flex-1 bg-background overflow-auto">
        {/* Top Bar */}
        <header className="sticky top-0 z-10 bg-card backdrop-blur-xl border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Truck className="h-5 w-5 text-stone-600" />
                All Drivers
              </h1>
              <p className="text-sm text-muted-foreground">
                Platform-wide driver management across all companies.
              </p>
            </div>
            <button className="relative p-2.5 rounded-full hover:bg-secondary transition-colors">
              <Bell className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                label: "Total Drivers",
                value: drivers.length,
                icon: Truck,
                color: "text-stone-600",
                bg: "bg-stone-100 dark:bg-stone-800/20",
              },
              {
                label: "Available",
                value: available,
                icon: Wifi,
                color: "text-stone-600",
                bg: "bg-stone-100 dark:bg-stone-800/20",
              },
              {
                label: "Busy",
                value: busy,
                icon: Package,
                color: "text-stone-600",
                bg: "bg-stone-100 dark:bg-stone-800/20",
              },
              {
                label: "Offline",
                value: offline,
                icon: WifiOff,
                color: "text-stone-600",
                bg: "bg-stone-100 dark:bg-stone-800/20",
              },
              {
                label: "Verified",
                value: verified,
                icon: UserCheck,
                color: "text-stone-600",
                bg: "bg-stone-100 dark:bg-stone-800/20",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="p-5 bg-card rounded-3xl border border-border shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-muted-foreground font-medium">
                    {s.label}
                  </p>
                  <div
                    className={`h-8 w-8 rounded-full ${s.bg} flex items-center justify-center`}
                  >
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-card border border-border rounded-full px-3 py-2 flex-1 max-w-md">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent outline-none text-sm w-full text-secondary-foreground placeholder:text-gray-400"
              />
            </div>
            <div className="flex gap-1.5">
              {["ALL", "EMPLOYED", "INDEPENDENT"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    typeFilter === t
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-gray-500 border-border hover:border-gray-400"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              {["ALL", "AVAILABLE", "BUSY", "OFFLINE"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    statusFilter === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-gray-500 border-border hover:border-gray-400"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Drivers list */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <LoadingPackage />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24">
              <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
              <p className="text-sm text-gray-500">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center bg-card rounded-3xl border border-border">
              <Truck className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm font-medium text-gray-400">
                No drivers found
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((d) => {
                const sc = statusColors[d.status] ?? statusColors.OFFLINE;
                const vc =
                  verificationColors[d.verificationStatus] ??
                  verificationColors.PENDING;
                const VIcon = vc.icon;
                return (
                  <div
                    key={d.id}
                    className="p-5 bg-card rounded-3xl border border-border shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {d.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .substring(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {d.name}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {d.email}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`flex items-center gap-1.5 text-xs font-medium ${sc.text}`}
                      >
                        <span className={`h-2 w-2 rounded-full ${sc.dot}`} />
                        {d.status}
                      </span>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2 mb-4">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          d.type === "EMPLOYED"
                            ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20"
                            : "bg-purple-50 text-purple-600 dark:bg-purple-900/20"
                        }`}
                      >
                        {d.type}
                      </span>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${vc.bg} ${vc.text}`}
                      >
                        <VIcon className="h-3 w-3" />
                        {d.verificationStatus}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-muted rounded-full p-3 text-center">
                        <p className="text-lg font-bold text-foreground">
                          {d.activeAssignments}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          Active
                        </p>
                      </div>
                      <div className="bg-muted rounded-full p-3 text-center">
                        <p className="text-lg font-bold text-foreground">
                          {d.completedDeliveries}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          Delivered
                        </p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-border">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" />
                        {d.companyName ?? "Independent"}
                      </span>
                      <span>
                        Joined{" "}
                        {new Date(d.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
