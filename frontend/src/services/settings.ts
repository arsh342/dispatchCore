import { get, put } from "@/lib/api";
import type {
  CompanyNotificationPreferences,
  CompanySettings,
  DriverNotificationPreferences,
  DriverSettings,
  SuperadminNotificationPreferences,
  SuperadminSettings,
  ThemePreferences,
  VehicleSettings,
} from "@/types/settings";

interface BackendCompany {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  location: string | null;
  address: string | null;
  contact_name: string | null;
  plan_type: "STARTER" | "GROWTH" | "ENTERPRISE";
  notification_preferences?: Partial<CompanyNotificationPreferences> | null;
  appearance_preferences?: Partial<ThemePreferences> | null;
}

interface BackendDriver {
  id: number;
  company_id: number | null;
  type: "EMPLOYED" | "INDEPENDENT";
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  license_number?: string | null;
  notification_preferences?: Partial<DriverNotificationPreferences> | null;
  appearance_preferences?: Partial<ThemePreferences> | null;
  company?: {
    id: number;
    name: string;
    address?: string | null;
  } | null;
  vehicle?: {
    id: number;
    type: "BIKE" | "VAN" | "TRUCK";
    plate_number: string;
    capacity_kg: string | number;
    status: "ACTIVE" | "MAINTENANCE" | "RETIRED";
  } | null;
}

interface BackendSuperadminSettings {
  name: string;
  email: string;
  login_email: string;
  notification_preferences?: Partial<SuperadminNotificationPreferences> | null;
  appearance_preferences?: Partial<ThemePreferences> | null;
}

const defaultCompanyNotifications: CompanyNotificationPreferences = {
  bid_notifications: true,
  delivery_updates: true,
  driver_messages: true,
  daily_summary_email: false,
  driver_applications: true,
  payment_alerts: false,
};

const defaultDriverNotifications: DriverNotificationPreferences = {
  new_job_alerts: true,
  bid_updates: true,
  delivery_reminders: true,
  earnings_updates: false,
  dispatcher_messages: true,
  promotions: false,
};

const defaultSuperadminNotifications: SuperadminNotificationPreferences = {
  platform_alerts: true,
  company_registrations: true,
  driver_verifications: true,
  daily_summary: false,
};

const defaultAppearance: ThemePreferences = {
  theme: "dark",
};

function normalizeAppearance(
  appearance?: Partial<ThemePreferences> | null,
): ThemePreferences {
  return {
    ...defaultAppearance,
    ...appearance,
  };
}

function mapCompany(company: BackendCompany): CompanySettings {
  return {
    id: company.id,
    name: company.name,
    email: company.email,
    phone: company.phone ?? "",
    location: company.location ?? "",
    address: company.address ?? "",
    contactName: company.contact_name ?? "",
    planType: company.plan_type,
    notificationPreferences: {
      ...defaultCompanyNotifications,
      ...company.notification_preferences,
    },
    appearancePreferences: normalizeAppearance(company.appearance_preferences),
  };
}

function mapVehicle(vehicle: BackendDriver["vehicle"]): VehicleSettings | null {
  if (!vehicle) return null;

  return {
    id: vehicle.id,
    type: vehicle.type,
    plateNumber: vehicle.plate_number,
    capacityKg: String(vehicle.capacity_kg ?? ""),
    status: vehicle.status,
  };
}

function mapDriver(driver: BackendDriver): DriverSettings {
  return {
    id: driver.id,
    name: driver.name ?? "",
    email: driver.email ?? "",
    phone: driver.phone ?? "",
    licenseNumber: driver.license_number ?? "",
    driverType: driver.type,
    companyId: driver.company_id,
    companyName: driver.company?.name ?? null,
    companyAddress: driver.company?.address ?? null,
    notificationPreferences: {
      ...defaultDriverNotifications,
      ...driver.notification_preferences,
    },
    appearancePreferences: normalizeAppearance(driver.appearance_preferences),
    vehicle: mapVehicle(driver.vehicle),
  };
}

function mapSuperadmin(settings: BackendSuperadminSettings): SuperadminSettings {
  return {
    name: settings.name,
    email: settings.email,
    loginEmail: settings.login_email,
    notificationPreferences: {
      ...defaultSuperadminNotifications,
      ...settings.notification_preferences,
    },
    appearancePreferences: normalizeAppearance(settings.appearance_preferences),
  };
}

export async function fetchCompanySettings(companyId: string | number) {
  const company = await get<BackendCompany>(`/companies/${companyId}`);
  return mapCompany(company);
}

export async function saveCompanySettings(settings: CompanySettings) {
  const company = await put<BackendCompany>(`/companies/${settings.id}`, {
    name: settings.name,
    email: settings.email,
    phone: settings.phone || null,
    location: settings.location || null,
    address: settings.address || null,
    contact_name: settings.contactName || null,
    notification_preferences: settings.notificationPreferences,
    appearance_preferences: settings.appearancePreferences,
  });
  return mapCompany(company);
}

export async function changeCompanyPassword(
  companyId: string | number,
  payload: { currentPassword: string; newPassword: string },
) {
  return put<{ updated: boolean }>(`/companies/${companyId}/password`, {
    current_password: payload.currentPassword,
    new_password: payload.newPassword,
  });
}

export async function fetchDriverSettings(driverId: string | number) {
  const driver = await get<BackendDriver>(`/drivers/${driverId}`);

  if ((!driver.company || !driver.company.name) && driver.company_id) {
    try {
      const company = await get<BackendCompany>(`/companies/${driver.company_id}`);
      return mapDriver({
        ...driver,
        company: {
          id: company.id,
          name: company.name,
          address: company.address,
        },
      });
    } catch {
      // Fall through to driver-only data if the company lookup fails.
    }
  }

  return mapDriver(driver);
}

export async function saveDriverSettings(settings: DriverSettings) {
  const driver = await put<BackendDriver>(`/drivers/${settings.id}`, {
    name: settings.name,
    email: settings.email,
    phone: settings.phone || null,
    license_number: settings.licenseNumber || null,
    notification_preferences: settings.notificationPreferences,
    appearance_preferences: settings.appearancePreferences,
  });
  return mapDriver(driver);
}

export async function saveDriverVehicle(
  driverId: string | number,
  vehicle: VehicleSettings,
) {
  const savedVehicle = await put<BackendDriver["vehicle"]>(
    `/drivers/${driverId}/vehicle`,
    {
      type: vehicle.type,
      plate_number: vehicle.plateNumber,
      capacity_kg: parseFloat(vehicle.capacityKg),
      status: vehicle.status,
    },
  );

  return mapVehicle(savedVehicle);
}

export async function changeDriverPassword(
  driverId: string | number,
  payload: { currentPassword: string; newPassword: string },
) {
  return put<{ updated: boolean }>(`/drivers/${driverId}/password`, {
    current_password: payload.currentPassword,
    new_password: payload.newPassword,
  });
}

export async function fetchSuperadminSettings() {
  const settings = await get<BackendSuperadminSettings>("/superadmin/settings");
  return mapSuperadmin(settings);
}

export async function saveSuperadminSettings(settings: SuperadminSettings) {
  const updated = await put<BackendSuperadminSettings>("/superadmin/settings", {
    name: settings.name,
    email: settings.email,
    notification_preferences: settings.notificationPreferences,
    appearance_preferences: settings.appearancePreferences,
  });
  return mapSuperadmin(updated);
}
