import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SuperAdminSidebar } from "@/components/dashboard/superadmin-sidebar";
import {
  SettingsCard,
  SettingsNotice,
  SettingsWorkspace,
  ToggleRow,
  type SettingsTabItem,
} from "@/components/settings/workspace";
import { useTheme } from "@/hooks/app/useTheme";
import {
  Bell,
  Database,
  Globe,
  Loader2,
  LogOut,
  Mail,
  Palette,
  Save,
  Server,
  Settings,
  Shield,
  User,
} from "lucide-react";
import LoadingPackage from "@/components/ui/loading-package";
import {
  fetchSuperadminSettings,
  saveSuperadminSettings,
} from "@/services/shared/settings";
import { API_BASE } from "@/lib/api";
import type { SuperadminSettings } from "@/types/shared/settings";

const tabs: SettingsTabItem[] = [
  { id: "profile", label: "Profile", icon: User, description: "Platform identity" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Platform alerts" },
  { id: "appearance", label: "Appearance", icon: Palette, description: "Theme preference" },
  { id: "system", label: "System", icon: Settings, description: "Read-only environment" },
];

const accentClass =
  "bg-primary text-primary-foreground shadow-lg";

export default function SuperAdminSettingsPage() {
  const { setMode } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [settings, setSettings] = useState<SuperadminSettings | null>(null);
  const [apiHealth, setApiHealth] = useState<{
    status: string;
    uptime?: number;
  } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchSuperadminSettings();
        setSettings(data);
        setMode((data.appearancePreferences.theme as "dark" | "light" | "system") || "system");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load settings.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [setMode]);

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((response) => response.json())
      .then((body) => setApiHealth(body.data ?? body))
      .catch(() => setApiHealth({ status: "error" }));
  }, []);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const updated = await saveSuperadminSettings(settings);
      setSettings(updated);
      setMode((updated.appearancePreferences.theme as "dark" | "light" | "system") || "system");
      setSuccess("Superadmin settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  function submitSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void handleSave();
  }

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (loading || !settings) {
    return (
      <div className="flex min-h-screen w-full">
        <SuperAdminSidebar />
        <div className="flex flex-1 items-center justify-center">
          <LoadingPackage text="Loading platform settings..." delay={650} />
        </div>
      </div>
    );
  }

  return (
    <SettingsWorkspace
      title="Platform Settings"
      description="Persistent profile and preference controls for the dispatchCore superadmin workspace."
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      accentClass={accentClass}
      sidebar={<SuperAdminSidebar />}
    >
      {error && <SettingsNotice tone="error">{error}</SettingsNotice>}
      {success && <SettingsNotice tone="success">{success}</SettingsNotice>}

      {activeTab === "profile" && (
        <form className="space-y-6" onSubmit={submitSave}>
          <SettingsCard
            title="Superadmin Profile"
            description="Persistent profile values are stored separately from environment-based login credentials."
            actions={
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                SUPERADMIN
              </span>
            }
          >
            <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div className="rounded-3xl border border-border bg-muted/40 p-6">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-3xl font-bold text-white">
                  {settings.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <p className="mt-4 text-lg font-semibold text-foreground">
                  {settings.name}
                </p>
                <p className="text-sm text-muted-foreground">{settings.email}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Platform control plane
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Display name"
                  icon={User}
                  value={settings.name}
                  onChange={(value) =>
                    setSettings((prev) => (prev ? { ...prev, name: value } : prev))
                  }
                />
                <Field
                  label="Profile email"
                  icon={Mail}
                  type="email"
                  value={settings.email}
                  onChange={(value) =>
                    setSettings((prev) => (prev ? { ...prev, email: value } : prev))
                  }
                />
                <ReadOnly label="Login email" value={settings.loginEmail} />
                <ReadOnly label="Role" value="superadmin" />
              </div>
            </div>
          </SettingsCard>

          <div className="sticky bottom-4 z-[1] flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-white shadow-lg transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save changes
            </button>
          </div>
        </form>
      )}

      {activeTab === "notifications" && (
        <>
          <SettingsCard
            title="Platform Alerts"
            description="Persisted alert preferences for the superadmin surface."
          >
            <div className="space-y-3">
              <ToggleRow
                label="Platform alerts"
                description="Critical platform health and incident updates."
                checked={settings.notificationPreferences.platform_alerts}
                onChange={(value) =>
                  setSettings((prev) =>
                    prev
                      ? {
                          ...prev,
                          notificationPreferences: {
                            ...prev.notificationPreferences,
                            platform_alerts: value,
                          },
                        }
                      : prev,
                  )
                }
                activeClass="bg-primary"
              />
              <ToggleRow
                label="Company registrations"
                description="Notify when new companies are created on the platform."
                checked={settings.notificationPreferences.company_registrations}
                onChange={(value) =>
                  setSettings((prev) =>
                    prev
                      ? {
                          ...prev,
                          notificationPreferences: {
                            ...prev.notificationPreferences,
                            company_registrations: value,
                          },
                        }
                      : prev,
                  )
                }
                activeClass="bg-primary"
              />
              <ToggleRow
                label="Driver verifications"
                description="Signal verification pipeline changes for independent drivers."
                checked={settings.notificationPreferences.driver_verifications}
                onChange={(value) =>
                  setSettings((prev) =>
                    prev
                      ? {
                          ...prev,
                          notificationPreferences: {
                            ...prev.notificationPreferences,
                            driver_verifications: value,
                          },
                        }
                      : prev,
                  )
                }
                activeClass="bg-primary"
              />
              <ToggleRow
                label="Daily summary"
                description="Send a platform summary snapshot once per day."
                checked={settings.notificationPreferences.daily_summary}
                onChange={(value) =>
                  setSettings((prev) =>
                    prev
                      ? {
                          ...prev,
                          notificationPreferences: {
                            ...prev.notificationPreferences,
                            daily_summary: value,
                          },
                        }
                      : prev,
                  )
                }
                activeClass="bg-primary"
              />
            </div>
          </SettingsCard>
          <div className="sticky bottom-4 z-[1] flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-white shadow-lg transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save changes
            </button>
          </div>
        </>
      )}

      {activeTab === "appearance" && (
        <>
          <SettingsCard
            title="Theme Preference"
            description="Stored in persistent superadmin settings and applied immediately."
          >
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { label: "Dark", value: "dark" as const, description: "Best fit for dense platform monitoring and admin review." },
                { label: "Light", value: "light" as const, description: "Brighter surface for audits, listings, and operations checks." },
                { label: "System", value: "system" as const, description: "Follows your operating system's light or dark mode setting." },
              ].map((option) => {
                const active = settings.appearancePreferences.theme === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSettings((prev) =>
                        prev
                          ? {
                              ...prev,
                              appearancePreferences: { theme: option.value },
                            }
                          : prev,
                      );
                      setMode(option.value);
                    }}
                    className={`rounded-3xl border p-6 text-left transition-all ${
                      active
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted/30 hover:border-primary/40"
                    }`}
                  >
                    <p className="text-lg font-semibold text-foreground">
                      {option.label}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </SettingsCard>
          <div className="sticky bottom-4 z-[1] flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-white shadow-lg transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save changes
            </button>
          </div>
        </>
      )}

      {activeTab === "system" && (
        <>
          <SettingsCard
            title="Platform Information"
            description="Read-only platform identity and environment context for the current control plane."
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon={Shield}
                label="Platform"
                value="dispatchCore"
              />
              <MetricCard
                icon={Settings}
                label="Environment"
                value={import.meta.env.MODE ?? "development"}
              />
              <MetricCard
                icon={Globe}
                label="Frontend URL"
                value={window.location.origin}
              />
              <MetricCard
                icon={Server}
                label="API Base URL"
                value={API_BASE}
              />
            </div>
          </SettingsCard>

          <SettingsCard
            title="System Health"
            description="Current service visibility across the platform control stack."
          >
            <div className="grid gap-4 lg:grid-cols-3">
              <HealthStatusCard
                label="REST API"
                status={
                  apiHealth?.status === "ok" || apiHealth?.status === "healthy"
                    ? "operational"
                    : apiHealth?.status === "error"
                      ? "error"
                      : "checking"
                }
                detail={
                  apiHealth?.uptime !== undefined
                    ? `Uptime ${formatUptime(apiHealth.uptime)}`
                    : "Health endpoint status"
                }
              />
              <HealthStatusCard
                label="WebSocket"
                status={
                  apiHealth?.status === "ok" || apiHealth?.status === "healthy"
                    ? "operational"
                    : apiHealth?.status === "error"
                      ? "error"
                      : "checking"
                }
                detail="Socket server shares the backend runtime."
              />
              <HealthStatusCard
                label="Database"
                status={
                  apiHealth?.status === "ok" || apiHealth?.status === "healthy"
                    ? "operational"
                    : apiHealth?.status === "error"
                      ? "error"
                      : "checking"
                }
                detail="Database health is inferred from backend availability."
              />
            </div>
          </SettingsCard>

          <SettingsCard
            title="API Endpoints"
            description="Core operational endpoints used across platform dashboards."
          >
            <div className="grid gap-3">
              <EndpointRow
                label="Health check"
                value={`${API_BASE}/health`}
              />
              <EndpointRow
                label="Companies"
                value={`${API_BASE}/companies`}
              />
              <EndpointRow
                label="Drivers"
                value={`${API_BASE}/drivers`}
              />
              <EndpointRow
                label="Orders"
                value={`${API_BASE}/orders`}
              />
            </div>
          </SettingsCard>

          <SettingsCard
            title="Database"
            description="Read-only storage context for this environment."
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard icon={Database} label="Engine" value="MySQL" />
              <MetricCard icon={Server} label="ORM" value="Sequelize v6" />
              <MetricCard icon={Shield} label="Schema" value="dispatchCore" />
              <MetricCard
                icon={Settings}
                label="Mode"
                value={import.meta.env.MODE ?? "development"}
              />
            </div>
          </SettingsCard>

          <SettingsCard
            title="Session"
            description="Current control-plane session actions."
          >
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </SettingsCard>
        </>
      )}
    </SettingsWorkspace>
  );
}

function Field({
  label,
  icon: Icon,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  icon: typeof User;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-full border border-border bg-muted/30 py-3 pl-11 pr-4 text-sm text-foreground outline-none transition-colors focus:border-primary"
        />
      </div>
    </label>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border bg-muted/30 px-4 py-4">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Globe;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-muted/30 p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-4 text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 break-all text-sm font-medium text-foreground">
        {value}
      </p>
    </div>
  );
}

function HealthStatusCard({
  label,
  status,
  detail,
}: {
  label: string;
  status: "operational" | "error" | "checking";
  detail: string;
}) {
  const tone =
    status === "operational"
      ? "bg-emerald-500/10 text-emerald-400"
      : status === "error"
        ? "bg-red-500/10 text-red-400"
        : "bg-amber-500/10 text-amber-300";

  const text =
    status === "operational"
      ? "Operational"
      : status === "error"
        ? "Error"
        : "Checking";

  return (
    <div className="rounded-3xl border border-border bg-muted/30 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">{detail}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${tone}`}>
          {text}
        </span>
      </div>
    </div>
  );
}

function EndpointRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border bg-muted/30 px-4 py-4">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 break-all text-sm font-medium text-foreground">
        {value}
      </p>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
