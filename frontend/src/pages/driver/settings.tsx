import { useState, useEffect } from "react";
import { DriverSidebar } from "@/components/dashboard/driver-sidebar";
import { useTheme } from "@/hooks/useTheme";
import {
  User,
  Truck,
  Bell,
  Shield,
  Palette,
  CreditCard,
  Camera,
  Save,
  Moon,
  Sun,
  MapPin,
  FileText,
} from "lucide-react";
import LoadingPackage from "@/components/ui/loading-package";
import { fetchDriverUser } from "@/services/driver/dashboard";
import type { DriverUser } from "@/types/driver/dashboard";

export default function DriverSettingsPage() {
  const { isDark, setIsDark } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState<DriverUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const user = await fetchDriverUser();
      setProfile(user);
      setLoading(false);
    }
    load();
  }, []);

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "vehicle", label: "Vehicle", icon: Truck },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "payout", label: "Payout", icon: CreditCard },
  ];

  const initials = (profile?.name ?? "—")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  if (loading) {
    return (
      <div className="flex min-h-screen w-full">
        <DriverSidebar isDark={isDark} setIsDark={setIsDark} />
        <div className="flex-1 flex items-center justify-center">
          <LoadingPackage />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <DriverSidebar isDark={isDark} setIsDark={setIsDark} />
      <div className="flex-1 bg-background overflow-auto">
        <header className="sticky top-0 z-10 bg-card backdrop-blur-xl border-b border-border px-6 py-4">
          <h1 className="text-xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your driver profile and preferences
          </p>
        </header>

        <div className="flex flex-col lg:flex-row max-w-5xl mx-auto p-6 gap-6">
          {/* Sidebar tabs */}
          <div className="lg:w-56 shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-sm transition-colors ${activeTab === tab.id ? "bg-green-500/10 text-green-600 font-medium" : "text-muted-foreground hover:bg-secondary"}`}
                >
                  <tab.icon className="h-4 w-4" /> {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-6">
            {activeTab === "profile" && (
              <>
                <div className="bg-card rounded-3xl border border-border p-6">
                  <h2 className="text-lg font-bold text-foreground mb-4">
                    Profile Photo
                  </h2>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="h-20 w-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center text-white text-xl font-bold">
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
                        Driver · Independent
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
                        label: "Location",
                        value: profile?.location ?? "—",
                        icon: MapPin,
                      },
                      {
                        label: "Vehicle",
                        value: `${profile?.vehicleType ?? "—"} (${profile?.vehiclePlate ?? "—"})`,
                        icon: Truck,
                      },
                    ].map((field) => (
                      <label key={field.label} className="block">
                        <span className="text-xs font-medium text-muted-foreground mb-1.5 block">
                          {field.label}
                        </span>
                        <div className="relative">
                          <field.icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            defaultValue={field.value}
                            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-border bg-card text-sm text-foreground outline-none focus:border-green-500"
                          />
                        </div>
                      </label>
                    ))}
                  </div>
                  <button className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700 transition-colors">
                    <Save className="h-4 w-4" /> Save Changes
                  </button>
                </div>
              </>
            )}

            {activeTab === "vehicle" && (
              <div className="bg-card rounded-3xl border border-border p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">
                  Vehicle Information
                </h2>
                <div className="space-y-4">
                  {[
                    { label: "Vehicle Type", value: "Van" },
                    { label: "License Plate", value: "DC-V12" },
                    { label: "Make & Model", value: "Ford Transit 2024" },
                    { label: "Color", value: "White" },
                    { label: "Max Payload", value: "20 kg" },
                  ].map((field) => (
                    <label key={field.label} className="block">
                      <span className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        {field.label}
                      </span>
                      <input
                        type="text"
                        defaultValue={field.value}
                        className="w-full px-4 py-2.5 rounded-full border border-border bg-card text-sm text-foreground outline-none focus:border-green-500"
                      />
                    </label>
                  ))}
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700 transition-colors">
                    <Save className="h-4 w-4" /> Save
                  </button>
                </div>
              </div>
            )}

            {activeTab === "documents" && (
              <div className="bg-card rounded-3xl border border-border p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">
                  Documents
                </h2>
                <div className="space-y-3">
                  {[
                    {
                      name: "Driver's License",
                      status: "Verified",
                      expiry: "Dec 2028",
                    },
                    {
                      name: "Vehicle Insurance",
                      status: "Verified",
                      expiry: "Jun 2026",
                    },
                    {
                      name: "Vehicle Registration",
                      status: "Pending",
                      expiry: "—",
                    },
                    {
                      name: "Background Check",
                      status: "Verified",
                      expiry: "Lifetime",
                    },
                  ].map((doc) => (
                    <div
                      key={doc.name}
                      className="flex items-center justify-between p-4 rounded-full bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-9 w-9 rounded-lg flex items-center justify-center ${doc.status === "Verified" ? "bg-green-50 dark:bg-green-900/20" : "bg-amber-50 dark:bg-amber-900/20"}`}
                        >
                          <FileText
                            className={`h-4 w-4 ${doc.status === "Verified" ? "text-green-500" : "text-amber-500"}`}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {doc.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            Expires: {doc.expiry}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${doc.status === "Verified" ? "bg-green-50 text-green-600 dark:bg-green-900/20" : "bg-amber-50 text-amber-500 dark:bg-amber-900/20"}`}
                      >
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
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
                      label: "New job alerts",
                      desc: "Get notified when matching orders are listed",
                      default: true,
                    },
                    {
                      label: "Bid updates",
                      desc: "When bids are accepted or rejected",
                      default: true,
                    },
                    {
                      label: "Delivery reminders",
                      desc: "Pickup and delivery time reminders",
                      default: true,
                    },
                    {
                      label: "Earnings updates",
                      desc: "Daily earnings summary",
                      default: false,
                    },
                    {
                      label: "Dispatcher messages",
                      desc: "New messages from dispatchers",
                      default: true,
                    },
                    {
                      label: "Promotions",
                      desc: "Bonus opportunities and incentives",
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
                        <div className="w-9 h-5 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500" />
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
                      className="w-full px-4 py-2.5 rounded-full border border-border bg-card text-sm outline-none focus:border-green-500"
                    />
                    <input
                      type="password"
                      placeholder="New password"
                      className="w-full px-4 py-2.5 rounded-full border border-border bg-card text-sm outline-none focus:border-green-500"
                    />
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className="w-full px-4 py-2.5 rounded-full border border-border bg-card text-sm outline-none focus:border-green-500"
                    />
                    <button className="px-5 py-2.5 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700">
                      Update Password
                    </button>
                  </div>
                </div>
                <div className="bg-card rounded-3xl border border-border p-6">
                  <h2 className="text-lg font-bold text-foreground mb-2">
                    Two-Factor Authentication
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add extra security to your account
                  </p>
                  <button className="px-5 py-2.5 border border-border text-secondary-foreground rounded-full text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800">
                    Enable 2FA
                  </button>
                </div>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="bg-card rounded-3xl border border-border p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">
                  Appearance
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose your preferred theme
                </p>
                <div className="flex gap-3">
                  {[
                    { mode: false, label: "Light", icon: Sun },
                    { mode: true, label: "Dark", icon: Moon },
                  ].map((theme) => (
                    <button
                      key={theme.label}
                      onClick={() => setIsDark(theme.mode)}
                      className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-full border-2 transition-all ${isDark === theme.mode ? "border-green-500 bg-green-50/50 dark:bg-green-900/10 text-green-600" : "border-border text-gray-500 hover:border-gray-300"}`}
                    >
                      <theme.icon className="h-5 w-5" />{" "}
                      <span className="text-sm font-medium">{theme.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "payout" && (
              <div className="bg-card rounded-3xl border border-border p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">
                  Payout Method
                </h2>
                <div className="p-4 rounded-full bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        Bank Account
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Chase •••• 4521
                      </p>
                    </div>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-600 dark:bg-green-900/30">
                      Active
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Payout Schedule
                      </p>
                      <p className="text-xs text-gray-400">
                        How often you receive payouts
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Weekly (Fridays)
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Minimum Payout
                      </p>
                      <p className="text-xs text-gray-400">
                        Must accumulate before payout
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      $25.00
                    </span>
                  </div>
                </div>
                <button className="mt-4 text-sm text-green-600 font-medium hover:underline">
                  Change payout method →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
