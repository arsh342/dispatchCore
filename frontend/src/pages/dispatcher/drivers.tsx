import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { useTheme } from "@/hooks/useTheme";
import {
  Search,
  Plus,
  Loader2,
  ChevronDown,
  X,
  Users,
  Mail,
  Phone,
  CreditCard,
  UserCheck,
  UserX,
  Truck,
} from "lucide-react";
import LoadingPackage from "@/components/ui/loading-package";

/* ─── Types ─── */
interface DriverUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
}

interface DriverRecord {
  id: number;
  company_id: number;
  type: "EMPLOYED" | "INDEPENDENT";
  status: "AVAILABLE" | "BUSY" | "OFFLINE";
  verification_status: "PENDING" | "VERIFIED" | "REJECTED";
  license_number: string | null;
  user?: DriverUser;
  vehicle?: {
    id: number;
    plate_number: string;
    type: "BIKE" | "VAN" | "TRUCK";
    capacity_kg: string;
    status: string;
  };
}

const statusColors: Record<string, string> = {
  AVAILABLE: "text-green-600 bg-green-50 dark:bg-green-900/20",
  BUSY: "text-orange-600 bg-orange-50 dark:bg-orange-900/20",
  OFFLINE: "text-gray-500 bg-secondary",
};

/* ─── Drivers Page ─── */
export default function DriversPage() {
  const { isDark, setIsDark } = useTheme();
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    license_number: "",
    vehicle_type: "",
    plate_number: "",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
  const companyId = localStorage.getItem("dc_company_id") || "";

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/drivers?type=EMPLOYED`, {
        headers: { "x-company-id": companyId },
      });
      const data = await res.json();
      if (data.success) setDrivers(data.data || []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleAddDriver = async () => {
    setFormError("");
    if (!form.name || !form.email || !form.password) {
      setFormError("Name, email, and password are required.");
      return;
    }
    setFormSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/drivers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-company-id": companyId,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error?.message || "Failed to create driver");
      setShowAddDriver(false);
      setForm({
        name: "",
        email: "",
        password: "",
        phone: "",
        license_number: "",
        vehicle_type: "",
        plate_number: "",
      });
      fetchDrivers();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setFormSubmitting(false);
    }
  };

  const filteredDrivers = drivers.filter(
    (d) =>
      d.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.user?.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex min-h-screen w-full">
      <DashboardSidebar isDark={isDark} setIsDark={setIsDark} />

      <div className="flex-1 bg-background overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-card backdrop-blur-xl border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Employed Drivers
              </h1>
              <p className="text-sm text-muted-foreground">
                {drivers.length} driver{drivers.length !== 1 ? "s" : ""} in your
                company
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-card border border-border rounded-full px-3 py-2">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search drivers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent outline-none text-sm text-secondary-foreground placeholder:text-gray-400 w-40"
                />
              </div>
              <button
                onClick={() => setShowAddDriver(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Driver
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <LoadingPackage />
            </div>
          ) : filteredDrivers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Users className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">No employed drivers yet</p>
              <p className="text-xs mt-1">
                Click "Add Driver" to create your first driver
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDrivers.map((d) => (
                <div
                  key={d.id}
                  className="bg-card rounded-3xl border border-border p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xs font-bold">
                        {d.user?.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase() || "??"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {d.user?.name}
                        </p>
                        <p className="text-xs text-gray-400">{d.user?.email}</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusColors[d.status]}`}
                    >
                      {d.status}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    {d.user?.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3" /> {d.user.phone}
                      </div>
                    )}
                    {d.license_number && (
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="h-3 w-3" /> License:{" "}
                        {d.license_number}
                      </div>
                    )}
                    {d.vehicle && (
                      <div className="flex items-center gap-1.5">
                        <Truck className="h-3 w-3" /> {d.vehicle.type}
                        {d.vehicle.plate_number
                          ? ` · ${d.vehicle.plate_number}`
                          : ""}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      {d.verification_status === "VERIFIED" ? (
                        <>
                          <UserCheck className="h-3 w-3 text-green-500" />{" "}
                          Verified
                        </>
                      ) : (
                        <>
                          <UserX className="h-3 w-3 text-orange-500" />{" "}
                          {d.verification_status}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Add Driver Modal ─── */}
      {showAddDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card rounded-3xl border border-border shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">
                Add Employed Driver
              </h2>
              <button
                onClick={() => {
                  setShowAddDriver(false);
                  setFormError("");
                }}
                className="p-1.5 rounded-lg hover:bg-secondary text-gray-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                  {formError}
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Full Name *
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    placeholder="John Doe"
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                    className="w-full pl-10 pr-4 py-2.5 rounded-full border border-border bg-card text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    placeholder="driver@company.com"
                    value={form.email}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, email: e.target.value }))
                    }
                    className="w-full pl-10 pr-4 py-2.5 rounded-full border border-border bg-card text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Temporary Password *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="password"
                    placeholder="At least 6 characters"
                    value={form.password}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, password: e.target.value }))
                    }
                    className="w-full pl-10 pr-4 py-2.5 rounded-full border border-border bg-card text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    placeholder="+1 234 567 8900"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, phone: e.target.value }))
                    }
                    className="w-full pl-10 pr-4 py-2.5 rounded-full border border-border bg-card text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  License Number
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    placeholder="DL-123456"
                    value={form.license_number}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, license_number: e.target.value }))
                    }
                    className="w-full pl-10 pr-4 py-2.5 rounded-full border border-border bg-card text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Vehicle Type *
                  </label>
                  <div className="relative">
                    <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      value={form.vehicle_type}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, vehicle_type: e.target.value }))
                      }
                      className="w-full pl-10 pe-12 py-2.5 rounded-full border border-border bg-card text-sm text-foreground outline-none focus:border-primary appearance-none cursor-pointer"
                    >
                      <option value="">Select type</option>
                      <option value="BIKE">Bike</option>
                      <option value="VAN">Van</option>
                      <option value="TRUCK">Truck</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Plate Number
                  </label>
                  <input
                    placeholder="ABC-1234"
                    value={form.plate_number}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, plate_number: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 rounded-full border border-border bg-card text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-border">
              <button
                onClick={() => {
                  setShowAddDriver(false);
                  setFormError("");
                }}
                className="px-4 py-2.5 rounded-full text-sm font-medium text-secondary-foreground hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={formSubmitting}
                onClick={handleAddDriver}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {formSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Add Driver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
