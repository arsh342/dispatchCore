import { useEffect, useMemo, useState } from "react";
import { EmployedDriverSidebar } from "@/components/dashboard/employed-driver-sidebar";
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
  Building2,
  ChevronDown,
  Loader2,
  Mail,
  MapPin,
  Palette,
  Save,
  Shield,
  Smartphone,
  Truck,
  User,
} from "lucide-react";
import LoadingPackage from "@/components/ui/loading-package";
import {
  changeDriverPassword,
  fetchDriverSettings,
  saveDriverSettings,
  saveDriverVehicle,
} from "@/services/settings";
import type { DriverSettings, VehicleSettings } from "@/types/settings";

const tabs: SettingsTabItem[] = [
  { id: "profile", label: "Profile", icon: User, description: "Personal details" },
  { id: "company", label: "Company", icon: Building2, description: "Assigned company" },
  { id: "vehicle", label: "Vehicle", icon: Truck, description: "Current assignment" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Shift and message alerts" },
  { id: "security", label: "Security", icon: Shield, description: "Password controls" },
  { id: "appearance", label: "Appearance", icon: Palette, description: "Theme preference" },
];

const accentClass =
  "bg-blue-600 text-white shadow-[0_24px_60px_-32px_rgba(37,99,235,0.95)]";

const createEmptyVehicle = (): VehicleSettings => ({
  type: "VAN",
  plateNumber: "",
  capacityKg: "1000",
  status: "ACTIVE",
});

export default function EmployedDriverSettingsPage() {
  const { isDark, setIsDark } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vehicleSaving, setVehicleSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [settings, setSettings] = useState<DriverSettings | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const driverId = localStorage.getItem("dc_driver_id");

  useEffect(() => {
    async function load() {
      if (!driverId) {
        setError("No driver session found.");
        setLoading(false);
        return;
      }

      try {
        const data = await fetchDriverSettings(driverId);
        setSettings(data);
        if (data.companyName) {
          localStorage.setItem("dc_company_name", data.companyName);
        }
        setIsDark(data.appearancePreferences.theme === "dark");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load settings.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [driverId, setIsDark]);

  const initials = useMemo(() => {
    const name = settings?.name || "Driver";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [settings?.name]);

  function syncStorage(next: DriverSettings) {
    localStorage.setItem("dc_driver_name", next.name);
    localStorage.setItem("dc_user_name", next.name);
    if (next.companyName) {
      localStorage.setItem("dc_company_name", next.companyName);
    }
  }

  async function handleSaveProfile() {
    if (!settings) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const updated = await saveDriverSettings(settings);
      setSettings(updated);
      syncStorage(updated);
      setIsDark(updated.appearancePreferences.theme === "dark");
      setSuccess("Profile saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveVehicle() {
    if (!driverId || !settings?.vehicle) return;
    setVehicleSaving(true);
    setError("");
    setSuccess("");
    try {
      const vehicle = await saveDriverVehicle(driverId, settings.vehicle);
      setSettings((prev) => (prev ? { ...prev, vehicle } : prev));
      setSuccess("Vehicle saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save vehicle.");
    } finally {
      setVehicleSaving(false);
    }
  }

  async function handlePasswordSave() {
    if (!driverId) return;
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setPasswordSaving(true);
    setError("");
    setSuccess("");
    try {
      await changeDriverPassword(driverId, {
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

  function submitProfileSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void handleSaveProfile();
  }

  function submitVehicleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void handleSaveVehicle();
  }

  function submitPasswordSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void handlePasswordSave();
  }

  if (loading || !settings) {
    return (
      <div className="flex min-h-screen w-full">
        <EmployedDriverSidebar isDark={isDark} setIsDark={setIsDark} />
        <div className="flex flex-1 items-center justify-center">
          <LoadingPackage />
        </div>
      </div>
    );
  }

  return (
    <SettingsWorkspace
      title="Driver Settings"
      description="Manage your employed-driver account, assigned vehicle, and company-linked preferences."
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      accentClass={accentClass}
      sidebar={<EmployedDriverSidebar isDark={isDark} setIsDark={setIsDark} />}
    >
      {error && <SettingsNotice tone="error">{error}</SettingsNotice>}
      {success && <SettingsNotice tone="success">{success}</SettingsNotice>}

      {activeTab === "profile" && (
        <form className="space-y-6" onSubmit={submitProfileSave}>
          <SettingsCard
            title="Personal Profile"
            description="Editable fields stored directly on the employed driver account."
            actions={
              <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                EMPLOYED
              </span>
            }
          >
            <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div className="rounded-3xl border border-border bg-muted/40 p-6">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-400 text-3xl font-bold text-white">
                  {initials}
                </div>
                <p className="mt-4 text-lg font-semibold text-foreground">
                  {settings.name}
                </p>
                <p className="text-sm text-muted-foreground">{settings.email}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  {settings.companyName ?? "Assigned company"}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Name"
                  icon={User}
                  value={settings.name}
                  onChange={(value) =>
                    setSettings((prev) => (prev ? { ...prev, name: value } : prev))
                  }
                />
                <Field
                  label="Email"
                  icon={Mail}
                  type="email"
                  value={settings.email}
                  onChange={(value) =>
                    setSettings((prev) => (prev ? { ...prev, email: value } : prev))
                  }
                />
                <Field
                  label="Phone"
                  icon={Smartphone}
                  value={settings.phone}
                  onChange={(value) =>
                    setSettings((prev) => (prev ? { ...prev, phone: value } : prev))
                  }
                />
                <Field
                  label="License number"
                  icon={MapPin}
                  value={settings.licenseNumber}
                  onChange={(value) =>
                    setSettings((prev) =>
                      prev ? { ...prev, licenseNumber: value } : prev,
                    )
                  }
                />
              </div>
            </div>
          </SettingsCard>
          <Actions
            saving={saving}
            onSave={handleSaveProfile}
            buttonType="submit"
          />
        </form>
      )}

      {activeTab === "company" && (
        <SettingsCard
          title="Company Assignment"
          description="This information is read from your linked company account."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <ReadOnly label="Company" value={settings.companyName ?? "—"} />
            <ReadOnly label="Company ID" value={String(settings.companyId ?? "—")} />
            <ReadOnly
              label="Company address"
              value={settings.companyAddress ?? "—"}
            />
            <ReadOnly label="Driver type" value={settings.driverType} />
          </div>
        </SettingsCard>
      )}

      {activeTab === "vehicle" && (
        <form className="space-y-6" onSubmit={submitVehicleSave}>
          <SettingsCard
            title="Assigned Vehicle"
            description="Vehicle values are persisted to the driver's linked vehicle record."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Vehicle type
                </span>
                <div className="relative">
                <select
                  value={settings.vehicle?.type ?? "VAN"}
                  onChange={(event) =>
                    setSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            vehicle: {
                              ...(prev.vehicle ?? createEmptyVehicle()),
                              type: event.target.value as VehicleSettings["type"],
                            },
                          }
                        : prev,
                    )
                  }
                  className="w-full appearance-none rounded-full border border-border bg-muted/30 px-4 pe-12 py-3 text-sm text-foreground outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="BIKE">Bike</option>
                  <option value="VAN">Van</option>
                  <option value="TRUCK">Truck</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </label>
              <Field
                label="Plate number"
                icon={Truck}
                value={settings.vehicle?.plateNumber ?? ""}
                onChange={(value) =>
                  setSettings((prev) =>
                    prev
                      ? {
                          ...prev,
                          vehicle: {
                            ...(prev.vehicle ?? createEmptyVehicle()),
                            plateNumber: value,
                          },
                        }
                      : prev,
                  )
                }
              />
              <Field
                label="Capacity (kg)"
                icon={Truck}
                type="number"
                value={settings.vehicle?.capacityKg ?? ""}
                onChange={(value) =>
                  setSettings((prev) =>
                    prev
                      ? {
                          ...prev,
                          vehicle: {
                            ...(prev.vehicle ?? createEmptyVehicle()),
                            capacityKg: value,
                          },
                        }
                      : prev,
                  )
                }
              />
              <label className="block">
                <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Vehicle status
                </span>
                <div className="relative">
                <select
                  value={settings.vehicle?.status ?? "ACTIVE"}
                  onChange={(event) =>
                    setSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            vehicle: {
                              ...(prev.vehicle ?? createEmptyVehicle()),
                              status: event.target.value as VehicleSettings["status"],
                            },
                          }
                        : prev,
                    )
                  }
                  className="w-full appearance-none rounded-full border border-border bg-muted/30 px-4 pe-12 py-3 text-sm text-foreground outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="RETIRED">Retired</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </label>
            </div>
          </SettingsCard>
          <Actions
            saving={vehicleSaving}
            onSave={handleSaveVehicle}
            buttonType="submit"
          />
        </form>
      )}

      {activeTab === "notifications" && (
        <>
          <SettingsCard
            title="Notification Preferences"
            description="These toggles are stored on your employed-driver account."
          >
            <div className="space-y-3">
              <ToggleRow
                label="New job alerts"
                description="Signal new assignments and work requests."
                checked={settings.notificationPreferences.new_job_alerts}
                onChange={(value) =>
                  setSettings((prev) =>
                    prev
                      ? {
                          ...prev,
                          notificationPreferences: {
                            ...prev.notificationPreferences,
                            new_job_alerts: value,
                          },
                        }
                      : prev,
                  )
                }
                activeClass="bg-blue-600"
              />
              <ToggleRow
                label="Bid updates"
                description="Reserved for any bidding states linked to your driver record."
                checked={settings.notificationPreferences.bid_updates}
                onChange={(value) =>
                  setSettings((prev) =>
                    prev
                      ? {
                          ...prev,
                          notificationPreferences: {
                            ...prev.notificationPreferences,
                            bid_updates: value,
                          },
                        }
                      : prev,
                  )
                }
                activeClass="bg-blue-600"
              />
              <ToggleRow
                label="Delivery reminders"
                description="Alerts before pickup, departure, and final delivery."
                checked={settings.notificationPreferences.delivery_reminders}
                onChange={(value) =>
                  setSettings((prev) =>
                    prev
                      ? {
                          ...prev,
                          notificationPreferences: {
                            ...prev.notificationPreferences,
                            delivery_reminders: value,
                          },
                        }
                      : prev,
                  )
                }
                activeClass="bg-blue-600"
              />
              <ToggleRow
                label="Dispatcher messages"
                description="Highlight new supervisor and dispatcher chats."
                checked={settings.notificationPreferences.dispatcher_messages}
                onChange={(value) =>
                  setSettings((prev) =>
                    prev
                      ? {
                          ...prev,
                          notificationPreferences: {
                            ...prev.notificationPreferences,
                            dispatcher_messages: value,
                          },
                        }
                      : prev,
                  )
                }
                activeClass="bg-blue-600"
              />
            </div>
          </SettingsCard>
          <Actions saving={saving} onSave={handleSaveProfile} />
        </>
      )}

      {activeTab === "security" && (
        <form onSubmit={submitPasswordSave}>
          <SettingsCard
            title="Password"
            description="Change the password used to log into the employed-driver dashboard."
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
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
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
            title="Theme Preference"
            description="Saved on the employed-driver account and applied to the current browser."
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
                              appearancePreferences: { theme: option.value },
                            }
                          : prev,
                      );
                      setIsDark(option.value === "dark");
                    }}
                    className={`rounded-3xl border p-6 text-left transition-all ${
                      active
                        ? "border-blue-600 bg-blue-600/10"
                        : "border-border bg-muted/30 hover:border-blue-500/40"
                    }`}
                  >
                    <p className="text-lg font-semibold text-foreground">
                      {option.label}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {option.value === "dark"
                        ? "Suited to dense route, order, and shift workflows."
                        : "Cleaner daytime contrast when reviewing assignments."}
                    </p>
                  </button>
                );
              })}
            </div>
          </SettingsCard>
          <Actions saving={saving} onSave={handleSaveProfile} />
        </>
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
        className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-medium text-white shadow-[0_24px_60px_-32px_rgba(37,99,235,0.95)] transition-colors hover:bg-blue-700 disabled:opacity-60"
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
          className="w-full rounded-full border border-border bg-muted/30 py-3 pl-11 pr-4 text-sm text-foreground outline-none transition-colors focus:border-blue-500"
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
        className="w-full rounded-full border border-border bg-muted/30 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-blue-500"
      />
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
