import { useState, useEffect } from "react";
import { EmployedDriverSidebar } from "@/components/dashboard/employed-driver-sidebar";
import { useTheme } from "@/hooks/useTheme";
import {
  User,
  Truck,
  Bell,
  Shield,
  Palette,
  Camera,
  Save,
  Moon,
  Sun,
  Mail,
  Smartphone,
  MapPin,
  Building,
} from "lucide-react";
import LoadingPackage from "@/components/ui/loading-package";
import {
  fetchEmployedDriverProfile,
  type EmployedDriverProfile,
} from "@/services/employed-driver/dashboard";

export default function EmployedDriverSettingsPage() {
  const { isDark, setIsDark } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState<EmployedDriverProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const p = await fetchEmployedDriverProfile();
      setProfile(p);
      setLoading(false);
    }
    load();
  }, []);

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "company", label: "Company", icon: Building },
    { id: "vehicle", label: "Vehicle", icon: Truck },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Palette },
  ];

  const nameParts = (profile?.name ?? "— —").split(" ");
  const initials = nameParts
    .map((p) => p[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  if (loading) {
    return (
      <div className="flex min-h-screen w-full">
        <EmployedDriverSidebar isDark={isDark} setIsDark={setIsDark} />
        <div className="flex-1 flex items-center justify-center">
          <LoadingPackage />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <EmployedDriverSidebar isDark={isDark} setIsDark={setIsDark} />
      <div className="flex-1 bg-background overflow-auto">
        <header className="sticky top-0 z-10 bg-card backdrop-blur-xl border-b border-border px-6 py-4">
          <h1 className="text-xl font-bold text-foreground">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your profile and preferences
          </p>
        </header>

        <div className="flex flex-col lg:flex-row max-w-5xl mx-auto p-6 gap-6">
          <div className="lg:w-56 shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-sm transition-colors ${activeTab === tab.id ? "bg-blue-500/10 text-blue-600 font-medium" : "text-muted-foreground hover:bg-secondary"}`}
                >
                  <tab.icon className="h-4 w-4" /> {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex-1 space-y-6">
            {activeTab === "profile" && (
              <>
                <div className="bg-card rounded-3xl border border-border p-6">
                  <h2 className="text-lg font-bold text-foreground mb-4">
                    Profile Photo
                  </h2>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center text-white text-xl font-bold">
                        {initials}
                      </div>
                      <button className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-card border border-border flex items-center justify-center shadow-sm">
                        <Camera className="h-3.5 w-3.5 text-gray-500" />
                      </button>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {profile?.name ?? "—"}
                      </p>
                      <p className="text-xs text-gray-400">
                        Employed Driver · {profile?.companyName ?? "—"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-card rounded-3xl border border-border p-6">
                  <h2 className="text-lg font-bold text-foreground mb-4">
                    Personal Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        label: "Name",
                        value: profile?.name ?? "—",
                        icon: User,
                      },
                      {
                        label: "Email",
                        value: profile?.email ?? "—",
                        icon: Mail,
                      },
                      {
                        label: "Phone",
                        value: profile?.phone ?? "—",
                        icon: Smartphone,
                      },
                      {
                        label: "License #",
                        value: profile?.licenseNumber ?? "—",
                        icon: MapPin,
                      },
                    ].map((f) => (
                      <label key={f.label} className="block">
                        <span className="text-xs font-medium text-muted-foreground mb-1.5 block">
                          {f.label}
                        </span>
                        <div className="relative">
                          <f.icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            defaultValue={f.value}
                            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-border bg-card text-sm text-foreground outline-none focus:border-blue-500"
                          />
                        </div>
                      </label>
                    ))}
                  </div>
                  <button className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors">
                    <Save className="h-4 w-4" /> Save Changes
                  </button>
                </div>
              </>
            )}

            {activeTab === "company" && (
              <div className="bg-card rounded-3xl border border-border p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">
                  Company Details
                </h2>
                <div className="flex items-center gap-4 mb-6 p-4 rounded-full bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30">
                  <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-lg">
                    {(profile?.companyName ?? "—")
                      .substring(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {profile?.companyName ?? "—"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {profile?.companyAddress ?? "—"}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Employee ID", value: profile?.employeeId ?? "—" },
                    { label: "Driver Type", value: profile?.driverType ?? "—" },
                    {
                      label: "License Number",
                      value: profile?.licenseNumber ?? "—",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <span className="text-sm text-gray-500">
                        {item.label}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "vehicle" && (
              <div className="bg-card rounded-3xl border border-border p-6">
                <h2 className="text-lg font-bold text-foreground mb-2">
                  Company Vehicle
                </h2>
                <p className="text-xs text-gray-400 mb-4">
                  Assigned by {profile?.companyName ?? "—"}
                </p>
                <p className="text-sm text-gray-500">
                  Vehicle details will be available once the vehicle API is
                  implemented.
                </p>
                <p className="text-xs text-gray-400 mt-4">
                  Contact your supervisor to request vehicle changes.
                </p>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="bg-card rounded-3xl border border-border p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">
                  Notification Preferences
                </h2>
                <div className="space-y-4">
                  {[
                    {
                      label: "New order assignments",
                      desc: "When dispatcher assigns you a new order",
                      default: true,
                    },
                    {
                      label: "Route updates",
                      desc: "When your delivery route changes",
                      default: true,
                    },
                    {
                      label: "Shift reminders",
                      desc: "Reminder before shift starts",
                      default: true,
                    },
                    {
                      label: "Supervisor messages",
                      desc: "Direct messages from your supervisor",
                      default: true,
                    },
                    {
                      label: "Daily summary",
                      desc: "End-of-day performance report",
                      default: false,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {item.label}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked={item.default}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                <div className="bg-card rounded-3xl border border-border p-6">
                  <h2 className="text-lg font-bold text-foreground mb-4">
                    Change Password
                  </h2>
                  <div className="space-y-3 max-w-sm">
                    <input
                      type="password"
                      placeholder="Current password"
                      className="w-full px-4 py-2.5 rounded-full border border-border bg-card text-sm outline-none focus:border-blue-500"
                    />
                    <input
                      type="password"
                      placeholder="New password"
                      className="w-full px-4 py-2.5 rounded-full border border-border bg-card text-sm outline-none focus:border-blue-500"
                    />
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className="w-full px-4 py-2.5 rounded-full border border-border bg-card text-sm outline-none focus:border-blue-500"
                    />
                    <button className="px-5 py-2.5 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700">
                      Update Password
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="bg-card rounded-3xl border border-border p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">
                  Appearance
                </h2>
                <div className="flex gap-3">
                  {[
                    { mode: false, label: "Light", icon: Sun },
                    { mode: true, label: "Dark", icon: Moon },
                  ].map((theme) => (
                    <button
                      key={theme.label}
                      onClick={() => setIsDark(theme.mode)}
                      className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-full border-2 transition-all ${isDark === theme.mode ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 text-blue-600" : "border-border text-gray-500 hover:border-gray-300"}`}
                    >
                      <theme.icon className="h-5 w-5" />{" "}
                      <span className="text-sm font-medium">{theme.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
