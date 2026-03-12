/**
 * SuperAdmin Dashboard Page
 *
 * Platform-wide overview with:
 *  - Global KPIs (companies, orders, drivers, deliveries)
 *  - Company list with order/driver counts
 *  - Quick management actions
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SuperAdminSidebar } from "@/components/dashboard/superadmin-sidebar";
import { useTheme } from "@/hooks/useTheme";
import {
  Building2,
  Package,
  Truck,
  CheckCircle2,
  TrendingUp,
  ShoppingBag,
  AlertCircle,
  ExternalLink,
  Search,
  Shield,
} from "lucide-react";
import LoadingPackage from "@/components/ui/loading-package";
import {
  fetchPlatformStats,
  fetchCompanies,
  type PlatformStats,
  type CompanySummary,
} from "@/services/superadmin/dashboard";

const planColors: Record<string, string> = {
  STARTER: "text-gray-500 bg-secondary",
  GROWTH: "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
  ENTERPRISE: "text-amber-500 bg-amber-50 dark:bg-amber-900/20",
};

export default function SuperAdminDashboardPage() {
  const navigate = useNavigate();
  const { isDark, setIsDark } = useTheme();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [s, c] = await Promise.all([
          fetchPlatformStats(),
          fetchCompanies(),
        ]);
        setStats(s);
        setCompanies(c);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredCompanies = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.planType.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const formatDate = (value: string | null | undefined) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="flex min-h-screen w-full">
      <SuperAdminSidebar isDark={isDark} setIsDark={setIsDark} />

      <div className="flex-1 bg-background overflow-auto">
        {/* ── Top Bar ── */}
        <header className="sticky top-0 z-10 bg-card backdrop-blur-xl border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Shield className="h-5 w-5 text-stone-600" />
                Platform Overview
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage all companies and monitor platform health.
              </p>
            </div>
            <div />
          </div>
        </header>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <LoadingPackage />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-24">
              <div className="text-center">
                <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500">{error}</p>
              </div>
            </div>
          ) : (
            <>
              {/* ── Platform KPIs ── */}
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {[
                  {
                    label: "Companies",
                    value: stats?.totalCompanies ?? 0,
                    icon: Building2,
                    color: "text-stone-600",
                    bg: "bg-stone-100 dark:bg-stone-800/20",
                  },
                  {
                    label: "Total Orders",
                    value: stats?.totalOrders ?? 0,
                    icon: Package,
                    color: "text-stone-600",
                    bg: "bg-stone-100 dark:bg-stone-800/20",
                  },
                  {
                    label: "Total Drivers",
                    value: stats?.totalDrivers ?? 0,
                    icon: Truck,
                    color: "text-stone-600",
                    bg: "bg-stone-100 dark:bg-stone-800/20",
                  },
                  {
                    label: "Delivered",
                    value: stats?.totalDelivered ?? 0,
                    icon: CheckCircle2,
                    color: "text-stone-600",
                    bg: "bg-stone-100 dark:bg-stone-800/20",
                  },
                  {
                    label: "Active Orders",
                    value: stats?.totalActiveOrders ?? 0,
                    icon: TrendingUp,
                    color: "text-stone-600",
                    bg: "bg-stone-100 dark:bg-stone-800/20",
                  },
                  {
                    label: "Listed (Marketplace)",
                    value: stats?.totalListedOrders ?? 0,
                    icon: ShoppingBag,
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
                  </div>
                ))}
              </div>

              {/* ── Company List ── */}
              <div className="bg-card rounded-3xl border border-border shadow-sm">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      Companies
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {companies.length} registered compan
                      {companies.length === 1 ? "y" : "ies"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-secondary rounded-full px-3 py-2">
                    <Search className="h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Filter companies..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-transparent outline-none text-sm w-40 text-secondary-foreground placeholder:text-gray-400"
                    />
                  </div>
                </div>

                {filteredCompanies.length === 0 ? (
                  <div className="p-12 text-center text-gray-400">
                    <Building2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">No companies found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {/* Table header */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider">
                      <div className="col-span-4">Company</div>
                      <div className="col-span-2">Plan</div>
                      <div className="col-span-1 text-center">Orders</div>
                      <div className="col-span-1 text-center">Drivers</div>
                      <div className="col-span-1 text-center">Location</div>
                      <div className="col-span-2">Created</div>
                      <div className="col-span-1 text-right">Actions</div>
                    </div>

                    {filteredCompanies.map((company) => (
                      <div
                        key={company.id}
                        className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-muted transition-colors"
                      >
                        <div className="col-span-4 flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">
                              {company.name.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {company.name}
                            </p>
                            {company.address && (
                              <p className="text-xs text-gray-400 truncate">
                                {company.address}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="col-span-2">
                          <span
                            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                              planColors[company.planType] ?? planColors.STARTER
                            }`}
                          >
                            {company.planType}
                          </span>
                        </div>

                        <div className="col-span-1 text-center">
                          <span className="text-sm font-medium text-foreground">
                            {company.orderCount}
                          </span>
                        </div>

                        <div className="col-span-1 text-center">
                          <span className="text-sm font-medium text-foreground">
                            {company.driverCount}
                          </span>
                        </div>

                        <div className="col-span-1 text-center">
                          <span className="text-sm font-medium text-foreground">
                            {company.location ?? company.address ?? "—"}
                          </span>
                        </div>

                        <div className="col-span-2">
                          <span className="text-xs text-gray-400">
                            {formatDate(company.createdAt)}
                          </span>
                        </div>

                        <div className="col-span-1 text-right">
                          <button
                            onClick={() =>
                              navigate(
                                `/superadmin/drivers?company=${encodeURIComponent(company.name)}`,
                              )
                            }
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title="View company drivers"
                          >
                            <ExternalLink className="h-4 w-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Quick Stats Cards ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Delivery success rate */}
                <div className="p-5 bg-card rounded-3xl border border-border shadow-sm">
                  <h3 className="text-sm font-bold text-foreground mb-3">
                    Delivery Success Rate
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-full border-4 border-green-500 flex items-center justify-center">
                      <span className="text-xl font-bold text-green-600">
                        {stats && stats.totalOrders > 0
                          ? Math.round(
                              (stats.totalDelivered / stats.totalOrders) * 100,
                            )
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      <p>
                        <span className="font-medium text-foreground">
                          {stats?.totalDelivered ?? 0}
                        </span>{" "}
                        delivered
                      </p>
                      <p>
                        out of{" "}
                        <span className="font-medium text-foreground">
                          {stats?.totalOrders ?? 0}
                        </span>{" "}
                        total
                      </p>
                    </div>
                  </div>
                </div>

                {/* Platform health */}
                <div className="p-5 bg-card rounded-3xl border border-border shadow-sm">
                  <h3 className="text-sm font-bold text-foreground mb-3">
                    Platform Health
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">API Status</span>
                      <span className="flex items-center gap-1.5 text-xs font-medium text-green-600">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        Operational
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">WebSocket</span>
                      <span className="flex items-center gap-1.5 text-xs font-medium text-green-600">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        Connected
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Database</span>
                      <span className="flex items-center gap-1.5 text-xs font-medium text-green-600">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        Healthy
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="p-5 bg-card rounded-3xl border border-border shadow-sm">
                  <h3 className="text-sm font-bold text-foreground mb-3">
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    <a
                      href="/superadmin/companies"
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-full bg-muted hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <Building2 className="h-4 w-4 text-primary" />
                      <span className="text-sm text-secondary-foreground">
                        Register New Company
                      </span>
                    </a>
                    <a
                      href="/superadmin/drivers"
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-full bg-muted hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <Truck className="h-4 w-4 text-stone-600" />
                      <span className="text-sm text-secondary-foreground">
                        Review Drivers
                      </span>
                    </a>
                    <a
                      href="/superadmin/analytics"
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-full bg-muted hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <TrendingUp className="h-4 w-4 text-stone-600" />
                      <span className="text-sm text-secondary-foreground">
                        View Analytics
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
