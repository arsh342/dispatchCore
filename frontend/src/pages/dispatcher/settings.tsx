import { useEffect, useMemo, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import {
  SettingsCard,
  SettingsNotice,
  SettingsWorkspace,
  ToggleRow,
  type SettingsTabItem,
} from "@/components/settings/workspace";
import { useTheme } from "@/hooks/useTheme";
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Loader2,
  Mail,
  MapPin,
  Palette,
  Save,
  Shield,
  Smartphone,
  User,
} from "lucide-react";
import LoadingPackage from "@/components/ui/loading-package";
import {
  changeCompanyPassword,
  fetchCompanySettings,
  saveCompanySettings,
} from "@/services/settings";
import type { CompanySettings } from "@/types/settings";

const tabs: SettingsTabItem[] = [
  { id: "profile", label: "Profile", icon: User, description: "Account identity" },
  { id: "company", label: "Company", icon: Building2, description: "Entity details" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Delivery alerts" },
  { id: "security", label: "Security", icon: Shield, description: "Password controls" },
  { id: "appearance", label: "Appearance", icon: Palette, description: "Theme preference" },
  { id: "plan", label: "Plan", icon: BriefcaseBusiness, description: "Current subscription" },
];

const accentClass =
  "bg-primary text-primary-foreground shadow-[0_24px_60px_-32px_rgba(251,146,60,0.95)]";

export default function SettingsPage() {
  const { isDark, setIsDark } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const companyId = localStorage.getItem("dc_company_id");

  useEffect(() => {
    async function load() {
      if (!companyId) {
        setError("No company session found.");
        setLoading(false);
        return;
      }

      try {
        const data = await fetchCompanySettings(companyId);
        setSettings(data);
        setIsDark(data.appearancePreferences.theme === "dark");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load settings.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [companyId, setIsDark]);

  const initials = useMemo(() => {
    const name = settings?.name || "Company";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [settings?.name]);

  function syncCompanyStorage(next: CompanySettings) {
    localStorage.setItem("dc_company_name", next.name);
    localStorage.setItem("dc_company_location", next.location);
    localStorage.setItem("dc_user_email", next.email);
  }

  async function handleSave() {
    if (!settings) return;

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const updated = await saveCompanySettings(settings);
      setSettings(updated);
      syncCompanyStorage(updated);
      setIsDark(updated.appearancePreferences.theme === "dark");
      setSuccess("Settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordSave() {
    if (!companyId) return;
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setPasswordSaving(true);
    setError("");
    setSuccess("");
    try {
      await changeCompanyPassword(companyId, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setSuccess("Password updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setPasswordSaving(false);
    }
  }

  function submitSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void handleSave();
  }

  function submitPasswordSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void handlePasswordSave();
  }

  if (loading || !settings) {
    return (
      <div className="flex min-h-screen w-full">
        <DashboardSidebar isDark={isDark} setIsDark={setIsDark} />
        <div className="flex flex-1 items-center justify-center">
          <LoadingPackage />
        </div>
      </div>
    );
  }

  return (
    <SettingsWorkspace
      title="Settings"
      description="Manage your company account, delivery preferences, and workspace appearance."
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      accentClass={accentClass}
      sidebar={<DashboardSidebar isDark={isDark} setIsDark={setIsDark} />}
    >
      {error && <SettingsNotice tone="error">{error}</SettingsNotice>}
      {success && <SettingsNotice tone="success">{success}</SettingsNotice>}

      {activeTab === "profile" && (
        <form className="space-y-6" onSubmit={submitSave}>
          <SettingsCard
            title="Company Identity"
            description="The company account is the dispatcher identity in this workspace."
            actions={
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Dispatcher
                </span>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {settings.planType}
                </span>
              </div>
            }
          >
            <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div className="rounded-3xl border border-border bg-muted/40 p-6">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-3xl font-bold text-primary-foreground">
                  {initials}
                </div>
                <p className="mt-4 text-lg font-semibold text-foreground">
                  {settings.name}
                </p>
                <p className="text-sm text-muted-foreground">{settings.email}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Entity-owned dispatcher account
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Company name"
                  icon={User}
                  value={settings.name}
                  onChange={(value) =>
                    setSettings((prev) =>
                      prev ? { ...prev, name: value } : prev,
                    )
                  }
                />
                <Field
                  label="Email"
                  icon={Mail}
                  type="email"
                  value={settings.email}
                  onChange={(value) =>
                    setSettings((prev) =>
                      prev ? { ...prev, email: value } : prev,
                    )
                  }
                />
                <Field
                  label="Phone"
                  icon={Smartphone}
                  value={settings.phone}
                  onChange={(value) =>
                    setSettings((prev) =>
                      prev ? { ...prev, phone: value } : prev,
                    )
                  }
                />
                <Field
                  label="Primary contact"
                  icon={User}
                  value={settings.contactName}
                  onChange={(value) =>
                    setSettings((prev) =>
                      prev ? { ...prev, contactName: value } : prev,
                    )
                  }
                />
                <Field
                  label="Location"
                  icon={MapPin}
                  value={settings.location}
                  onChange={(value) =>
                    setSettings((prev) =>
                      prev ? { ...prev, location: value } : prev,
                    )
                  }
                />
                <div className="rounded-3xl border border-border bg-muted/30 p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    Workspace Model
                  </p>
                  <p className="mt-3 text-sm text-foreground">
                    This dashboard is owned directly by the company entity. There
                    is no separate team admin layer in the current model.
                  </p>
                </div>
              </div>
            </div>
          </SettingsCard>

          <Actions saving={saving} onSave={handleSave} buttonType="submit" />
        </form>
      )}

      {activeTab === "company" && (
        <form className="space-y-6" onSubmit={submitSave}>
          <SettingsCard
            title="Company Details"
            description="Operational fields used across superadmin views and dispatcher screens."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <Field
                label="Address"
                icon={MapPin}
                value={settings.address}
                onChange={(value) =>
                  setSettings((prev) => (prev ? { ...prev, address: value } : prev))
                }
              />
              <Field
                label="Location"
                icon={MapPin}
                value={settings.location}
                onChange={(value) =>
                  setSettings((prev) => (prev ? { ...prev, location: value } : prev))
                }
              />
              <Field
                label="Support email"
                icon={Mail}
                type="email"
                value={settings.email}
                onChange={(value) =>
                  setSettings((prev) => (prev ? { ...prev, email: value } : prev))
                }
              />
              <Field
                label="Contact phone"
                icon={Smartphone}
                value={settings.phone}
                onChange={(value) =>
                  setSettings((prev) => (prev ? { ...prev, phone: value } : prev))
                }
              />
            </div>
          </SettingsCard>
          <Actions saving={saving} onSave={handleSave} buttonType="submit" />
        </form>
      )}

      {activeTab === "notifications" && (
        <>
          <SettingsCard
            title="Notification Preferences"
            description="Persisted per-company so the dispatcher workspace keeps the same behavior across sessions."
          >
            <div className="space-y-3">
              <ToggleRow
                label="New bid notifications"
                description="Get alerted when drivers place bids on marketplace orders."
                checked={settings.notificationPreferences.bid_notifications}
                onChange={(value) =>
                  setSettings((prev) =>
                    prev
                      ? {
                          ...prev,
                          notificationPreferences: {
                            ...prev.notificationPreferences,
                            bid_notifications: value,
                          },
                        }
                      : prev,
                  )
                }
                activeClass="bg-primary"
              />
              <ToggleRow
                label="Delivery updates"
                description="Receive status changes for active deliveries."
                checked={settings.notificationPreferences.delivery_updates}
                onChange={(value) =>
                  setSettings((prev) =>
                    prev
                      ? {
                          ...prev,
                          notificationPreferences: {
                            ...prev.notificationPreferences,
                            delivery_updates: value,
                          },
                        }
                      : prev,
                  )
                }
                activeClass="bg-primary"
              />
              <ToggleRow
                label="Driver messages"
                description="Flag new dispatcher-driver conversations."
                checked={settings.notificationPreferences.driver_messages}
                onChange={(value) =>
                  setSettings((prev) =>
                    prev
                      ? {
                          ...prev,
                          notificationPreferences: {
                            ...prev.notificationPreferences,
                            driver_messages: value,
                          },
                        }
                      : prev,
                  )
                }
                activeClass="bg-primary"
              />
              <ToggleRow
                label="Daily summary email"
                description="Email a day-end recap of deliveries and marketplace activity."
                checked={settings.notificationPreferences.daily_summary_email}
                onChange={(value) =>
                  setSettings((prev) =>
                    prev
                      ? {
                          ...prev,
                          notificationPreferences: {
                            ...prev.notificationPreferences,
                            daily_summary_email: value,
                          },
                        }
                      : prev,
                  )
                }
                activeClass="bg-primary"
              />
              <ToggleRow
                label="Independent driver applications"
                description="Track new independent drivers that join the platform."
                checked={settings.notificationPreferences.driver_applications}
                onChange={(value) =>
                  setSettings((prev) =>
                    prev
                      ? {
                          ...prev,
                          notificationPreferences: {
                            ...prev.notificationPreferences,
                            driver_applications: value,
                          },
                        }
                      : prev,
                  )
                }
                activeClass="bg-primary"
              />
              <ToggleRow
                label="Payment alerts"
                description="Reserved for future billing and invoice events."
                checked={settings.notificationPreferences.payment_alerts}
                onChange={(value) =>
                  setSettings((prev) =>
                    prev
                      ? {
                          ...prev,
                          notificationPreferences: {
                            ...prev.notificationPreferences,
                            payment_alerts: value,
                          },
                        }
                      : prev,
                  )
                }
                activeClass="bg-primary"
              />
            </div>
          </SettingsCard>
          <Actions saving={saving} onSave={handleSave} />
        </>
      )}

      {activeTab === "security" && (
        <form onSubmit={submitPasswordSave}>
          <SettingsCard
            title="Password"
            description="Change the company account password used at login."
          >
            <div className="grid max-w-2xl gap-4 md:grid-cols-3">
              <PasswordField
                label="Current password"
                value={passwordForm.currentPassword}
                onChange={(value) =>
                  setPasswordForm((prev) => ({ ...prev, currentPassword: value }))
                }
              />
              <PasswordField
                label="New password"
                value={passwordForm.newPassword}
                onChange={(value) =>
                  setPasswordForm((prev) => ({ ...prev, newPassword: value }))
                }
              />
              <PasswordField
                label="Confirm password"
                value={passwordForm.confirmPassword}
                onChange={(value) =>
                  setPasswordForm((prev) => ({ ...prev, confirmPassword: value }))
                }
              />
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={passwordSaving}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {passwordSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4" />
                )}
                Update password
              </button>
            </div>
          </SettingsCard>
        </form>
      )}

      {activeTab === "appearance" && (
        <>
          <SettingsCard
            title="Workspace Theme"
            description="This preference is stored on the account and mirrored to local storage for immediate theme application."
          >
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { label: "Dark", value: "dark" as const },
                { label: "Light", value: "light" as const },
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
                              appearancePreferences: {
                                theme: option.value,
                              },
                            }
                          : prev,
                      );
                      setIsDark(option.value === "dark");
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
                      {option.value === "dark"
                        ? "High-contrast dashboard styling for dense operations work."
                        : "Brighter canvas for daytime dispatch and review tasks."}
                    </p>
                  </button>
                );
              })}
            </div>
          </SettingsCard>
          <Actions saving={saving} onSave={handleSave} />
        </>
      )}

      {activeTab === "plan" && (
        <SettingsCard
          title="Current Plan"
          description="Plan state is read from the company record and displayed here without fake billing controls."
        >
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-primary/20 bg-primary/10 p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-primary/80">
                Active plan
              </p>
              <p className="mt-3 text-3xl font-bold text-foreground">
                {settings.planType}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Stored directly on the company record and used across the
                superadmin company listings.
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-muted/30 p-6">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Company entity billing model
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                There is no team billing layer in the current product. This
                dashboard belongs directly to the company entity.
              </p>
            </div>
          </div>
        </SettingsCard>
      )}
    </SettingsWorkspace>
  );
}

function Actions({
  saving,
  onSave,
  buttonType = "button",
}: {
  saving: boolean;
  onSave: () => void;
  buttonType?: "button" | "submit";
}) {
  return (
    <div className="sticky bottom-4 z-[1] flex justify-end">
      <button
        type={buttonType}
        onClick={buttonType === "submit" ? undefined : onSave}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-[0_24px_60px_-32px_rgba(251,146,60,0.95)] transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Save changes
      </button>
    </div>
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

function PasswordField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-full border border-border bg-muted/30 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
      />
    </label>
  );
}
