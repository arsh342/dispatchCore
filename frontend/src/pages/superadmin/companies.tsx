/**
 * SuperAdmin — Companies Management Page
 *
 * Full company list with search, plan badges, KPI counts,
 * and a "Register Company" modal.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SuperAdminSidebar } from "@/components/dashboard/superadmin-sidebar";
import { useTheme } from "@/hooks/useTheme";
import {
  Building2,
  Search,
  Plus,
  Loader2,
  AlertCircle,
  Package,
  Truck,
  MapPin,
  X,
  ChevronDown,
} from "lucide-react";
import LoadingPackage from "@/components/ui/loading-package";
import {
  fetchCompanies,
  type CompanySummary,
} from "@/services/superadmin/dashboard";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

const planColors: Record<string, string> = {
  STARTER: "text-gray-500 bg-secondary",
  GROWTH: "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
  ENTERPRISE: "text-amber-500 bg-amber-50 dark:bg-amber-900/20",
};

export default function SuperAdminCompaniesPage() {
  const navigate = useNavigate();
  const { isDark, setIsDark } = useTheme();
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("ALL");

  // Register company modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    location: "",
    address: "",
    plan_type: "STARTER",
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const loadCompanies = async () => {
    try {
      const c = await fetchCompanies();
      setCompanies(c);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const filtered = companies.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.location ?? c.address ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = planFilter === "ALL" || c.planType === planFilter;
    return matchesSearch && matchesPlan;
  });

  const totalOrders = companies.reduce((s, c) => s + c.orderCount, 0);
  const totalDrivers = companies.reduce((s, c) => s + c.driverCount, 0);

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

  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      setCreateError("Company name is required.");
      return;
    }
    if (!createForm.email.trim() || !createForm.password.trim() || !createForm.location.trim()) {
      setCreateError("Email, password, and location are required.");
      return;
    }
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch(`${API_BASE}/companies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const body = await res.json();
      if (!res.ok || !body.success)
        throw new Error(body.error?.message ?? "Failed to create company");
      setShowCreate(false);
      setCreateForm({
        name: "",
        email: "",
        password: "",
        location: "",
        address: "",
        plan_type: "STARTER",
      });
      await loadCompanies();
    } catch (err) {
      setCreateError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      <SuperAdminSidebar isDark={isDark} setIsDark={setIsDark} />

      <div className="flex-1 bg-background overflow-auto">
        {/* Top Bar */}
        <header className="sticky top-0 z-10 bg-card backdrop-blur-xl border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Building2 className="h-5 w-5 text-stone-600" />
                Companies
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage all registered companies on the platform.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Register Company
              </button>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Total Companies",
                value: companies.length,
                icon: Building2,
                color: "text-stone-600",
                bg: "bg-stone-100 dark:bg-stone-800/20",
              },
              {
                label: "Total Orders",
                value: totalOrders,
                icon: Package,
                color: "text-stone-600",
                bg: "bg-stone-100 dark:bg-stone-800/20",
              },
              {
                label: "Total Drivers",
                value: totalDrivers,
                icon: Truck,
                color: "text-stone-600",
                bg: "bg-stone-100 dark:bg-stone-800/20",
              },
              {
                label: "Tracked Locations",
                value: companies.filter((c) => !!(c.location ?? c.address)).length,
                icon: MapPin,
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
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent outline-none text-sm w-full text-secondary-foreground placeholder:text-gray-400"
              />
            </div>
            <div className="flex gap-1.5">
              {["ALL", "STARTER", "GROWTH", "ENTERPRISE"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPlanFilter(p)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    planFilter === p
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-gray-500 border-border hover:border-gray-400"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Company table */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <LoadingPackage />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-24">
              <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center bg-card rounded-3xl border border-border">
              <Building2 className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm font-medium text-gray-400">
                No companies found
              </p>
            </div>
          ) : (
            <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider border-b border-border">
                <div className="col-span-3">Company</div>
                <div className="col-span-2">Location</div>
                <div className="col-span-1">Plan</div>
                <div className="col-span-1 text-center">Orders</div>
                <div className="col-span-1 text-center">Drivers</div>
                <div className="col-span-1 text-center">Status</div>
                <div className="col-span-2">Registered</div>
                <div className="col-span-1 text-center">Actions</div>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((c) => (
                  <div
                    key={c.id}
                    className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-muted transition-colors"
                  >
                    <div className="col-span-3 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary">
                          {c.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {c.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          ID: {c.id}
                        </p>
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-500 truncate">
                        {c.location || c.address || "—"}
                      </span>
                    </div>
                    <div className="col-span-1">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${planColors[c.planType] ?? planColors.STARTER}`}
                      >
                        {c.planType}
                      </span>
                    </div>
                    <div className="col-span-1 text-center">
                      <span className="text-sm font-medium text-foreground">
                        {c.orderCount}
                      </span>
                    </div>
                    <div className="col-span-1 text-center">
                      <span className="text-sm font-medium text-foreground">
                        {c.driverCount}
                      </span>
                    </div>
                    <div className="col-span-1 text-center">
                      <span className="flex items-center justify-center gap-1.5 text-xs font-medium text-green-600">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        Active
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs text-gray-400">{formatDate(c.createdAt)}</span>
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        onClick={() =>
                          navigate(
                            `/superadmin/drivers?company=${encodeURIComponent(c.name)}`,
                          )
                        }
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        View Drivers
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Register Company Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-secondary rounded-3xl border border-border shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Register Company
              </h2>
              <button
                onClick={() => setShowCreate(false)}
                className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-secondary-foreground">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Acme Logistics"
                  className="w-full px-4 py-2.5 rounded-full border border-border bg-card text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-secondary-foreground">
                  Company Email *
                </label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="ops@acme.com"
                  className="w-full px-4 py-2.5 rounded-full border border-border bg-card text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-secondary-foreground">
                  Password *
                </label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, password: e.target.value }))
                  }
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-2.5 rounded-full border border-border bg-card text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-secondary-foreground">
                  Location *
                </label>
                <input
                  type="text"
                  value={createForm.location}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, location: e.target.value }))
                  }
                  placeholder="San Francisco, CA"
                  className="w-full px-4 py-2.5 rounded-full border border-border bg-card text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-secondary-foreground">
                  Address
                </label>
                <input
                  type="text"
                  value={createForm.address}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, address: e.target.value }))
                  }
                  placeholder="123 Main St, City"
                  className="w-full px-4 py-2.5 rounded-full border border-border bg-card text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-secondary-foreground">
                  Plan
                </label>
                <div className="relative">
                <select
                  value={createForm.plan_type}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, plan_type: e.target.value }))
                  }
                  className="w-full appearance-none px-4 pe-12 py-2.5 rounded-full border border-border bg-card text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                >
                  <option value="STARTER">Starter</option>
                  <option value="GROWTH">Growth</option>
                  <option value="ENTERPRISE">Enterprise</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
              {createError && (
                <div className="rounded-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-2.5 text-sm text-red-600">
                  {createError}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-full text-sm font-medium text-gray-500 hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="px-5 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {creating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
