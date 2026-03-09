import { useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { useTheme } from "@/hooks/useTheme";
import {
  User,
  Building2,
  Bell,
  Shield,
  Palette,
  Globe,
  CreditCard,
  Users,
  Camera,
  Save,
  Moon,
  Sun,
  Mail,
  Smartphone,
  MapPin,
} from "lucide-react";

/* ─── Settings Page ─── */
export default function SettingsPage() {
  const { isDark, setIsDark } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");

  // Pull real user data from localStorage
  const userEmail = localStorage.getItem("dc_user_email") || "";
  const companyName = localStorage.getItem("dc_company_name") || "My Company";
  const companyInitials =
    companyName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "MC";

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "company", label: "Company", icon: Building2 },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "team", label: "Team", icon: Users },
  ];

  return (
    <div className="flex min-h-screen w-full">
      <DashboardSidebar isDark={isDark} setIsDark={setIsDark} />
      <div className="flex-1 bg-background overflow-auto">
        <header className="sticky top-0 z-10 bg-card backdrop-blur-xl border-b border-border px-6 py-4">
          <h1 className="text-xl font-bold text-foreground">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your account and company preferences
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
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-sm transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-6">
            {activeTab === "profile" && (
              <>
                {/* Avatar */}
                <div className="bg-card rounded-3xl border border-border p-6">
                  <h2 className="text-lg font-bold text-foreground mb-4">
                    Profile Photo
                  </h2>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xl font-bold">
                        {companyInitials}
                      </div>
                      <button className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-card border border-border flex items-center justify-center shadow-sm">
                        <Camera className="h-3.5 w-3.5 text-gray-500" />
                      </button>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {companyName}
                      </p>
                      <p className="text-xs text-gray-400">
                        Dispatcher · Company Account
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form */}
                <div className="bg-card rounded-3xl border border-border p-6">
                  <h2 className="text-lg font-bold text-foreground mb-4">
                    Personal Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: "Company Name", value: companyName, icon: User },
                      { label: "Email", value: userEmail, icon: Mail },
                      { label: "Phone", value: "", icon: Smartphone },
                      { label: "Location", value: "", icon: MapPin },
                      { label: "Language", value: "English (US)", icon: Globe },
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
                            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-border bg-card text-sm text-foreground outline-none focus:border-primary transition-colors"
                          />
                        </div>
                      </label>
                    ))}
                  </div>
                  <button className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors">
                    <Save className="h-4 w-4" />
                    Save Changes
                  </button>
                </div>
              </>
            )}

            {activeTab === "company" && (
              <div className="bg-card rounded-3xl border border-border p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">
                  Company Settings
                </h2>
                <div className="space-y-4">
                  {[
                    { label: "Company Name", value: companyName },
                    { label: "Business Address", value: "" },
                    { label: "Support Email", value: userEmail },
                    { label: "Dispatch Zone", value: "" },
                  ].map((field) => (
                    <label key={field.label} className="block">
                      <span className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        {field.label}
                      </span>
                      <input
                        type="text"
                        defaultValue={field.value}
                        className="w-full px-4 py-2.5 rounded-full border border-border bg-card text-sm text-foreground outline-none focus:border-primary"
                      />
                    </label>
                  ))}
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors">
                    <Save className="h-4 w-4" />
                    Save
                  </button>
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
                      label: "New bid notifications",
                      desc: "Get notified when drivers bid on your orders",
                      default: true,
                    },
                    {
                      label: "Delivery updates",
                      desc: "Status changes for active deliveries",
                      default: true,
                    },
                    {
                      label: "Driver messages",
                      desc: "New messages from drivers",
                      default: true,
                    },
                    {
                      label: "Daily summary email",
                      desc: "Receive a daily recap of all activity",
                      default: false,
                    },
                    {
                      label: "New driver applications",
                      desc: "When independent drivers apply to your company",
                      default: true,
                    },
                    {
                      label: "Payment alerts",
                      desc: "Invoice and payment notifications",
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
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
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
                      className="w-full px-4 py-2.5 rounded-full border border-border bg-card text-sm outline-none focus:border-primary"
                    />
                    <input
                      type="password"
                      placeholder="New password"
                      className="w-full px-4 py-2.5 rounded-full border border-border bg-card text-sm outline-none focus:border-primary"
                    />
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className="w-full px-4 py-2.5 rounded-full border border-border bg-card text-sm outline-none focus:border-primary"
                    />
                    <button className="px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors">
                      Update Password
                    </button>
                  </div>
                </div>
                <div className="bg-card rounded-3xl border border-border p-6">
                  <h2 className="text-lg font-bold text-foreground mb-2">
                    Two-Factor Authentication
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add an extra layer of security to your account
                  </p>
                  <button className="px-5 py-2.5 border border-border text-secondary-foreground rounded-full text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
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
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
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
                        className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-full border-2 transition-all ${
                          isDark === theme.mode
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        <theme.icon className="h-5 w-5" />
                        <span className="text-sm font-medium">
                          {theme.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "billing" && (
              <div className="bg-card rounded-3xl border border-border p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">
                  Billing & Subscription
                </h2>
                <div className="p-4 rounded-full bg-primary/5 border border-primary/20 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        Pro Plan
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        $49/month · Renews Mar 15, 2026
                      </p>
                    </div>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-600 dark:bg-green-900/30">
                      Active
                    </span>
                  </div>
                </div>
                <button className="text-sm text-primary font-medium hover:underline">
                  Manage subscription →
                </button>
              </div>
            )}

            {activeTab === "team" && (
              <div className="bg-card rounded-3xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-foreground">
                    Team Members
                  </h2>
                  <button className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors">
                    Invite
                  </button>
                </div>
                <div className="space-y-3">
                  {[
                    {
                      name: "Jack Ryad",
                      email: "jack@ml.com",
                      role: "Dispatcher",
                      initials: "JR",
                    },
                    {
                      name: "Sarah Kim",
                      email: "sarah@ml.com",
                      role: "Dispatcher",
                      initials: "SK",
                    },
                    {
                      name: "Alex Turner",
                      email: "alex@ml.com",
                      role: "Dispatcher",
                      initials: "AT",
                    },
                  ].map((m) => (
                    <div
                      key={m.email}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/80 to-primary/40 flex items-center justify-center text-white text-xs font-bold">
                          {m.initials}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {m.name}
                          </p>
                          <p className="text-xs text-gray-400">{m.email}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 bg-secondary px-2.5 py-1 rounded-full">
                        {m.role}
                      </span>
                    </div>
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
