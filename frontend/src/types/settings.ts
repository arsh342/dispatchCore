export interface ThemePreferences {
  theme: "light" | "dark";
}

export interface CompanyNotificationPreferences {
  bid_notifications: boolean;
  delivery_updates: boolean;
  driver_messages: boolean;
  daily_summary_email: boolean;
  driver_applications: boolean;
  payment_alerts: boolean;
}

export interface DriverNotificationPreferences {
  new_job_alerts: boolean;
  bid_updates: boolean;
  delivery_reminders: boolean;
  earnings_updates: boolean;
  dispatcher_messages: boolean;
  promotions: boolean;
}

export interface SuperadminNotificationPreferences {
  platform_alerts: boolean;
  company_registrations: boolean;
  driver_verifications: boolean;
  daily_summary: boolean;
}

export interface VehicleSettings {
  id?: number;
  type: "BIKE" | "VAN" | "TRUCK";
  plateNumber: string;
  capacityKg: string;
  status: "ACTIVE" | "MAINTENANCE" | "RETIRED";
}

export interface CompanySettings {
  id: number;
  name: string;
  email: string;
  phone: string;
  location: string;
  address: string;
  contactName: string;
  planType: "STARTER" | "GROWTH" | "ENTERPRISE";
  notificationPreferences: CompanyNotificationPreferences;
  appearancePreferences: ThemePreferences;
}

export interface DriverSettings {
  id: number;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  driverType: "EMPLOYED" | "INDEPENDENT";
  companyId: number | null;
  companyName: string | null;
  companyAddress: string | null;
  notificationPreferences: DriverNotificationPreferences;
  appearancePreferences: ThemePreferences;
  vehicle: VehicleSettings | null;
}

export interface SuperadminSettings {
  name: string;
  email: string;
  loginEmail: string;
  notificationPreferences: SuperadminNotificationPreferences;
  appearancePreferences: ThemePreferences;
}
