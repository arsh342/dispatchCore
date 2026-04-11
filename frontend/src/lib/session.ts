export interface AuthLoginResponse {
  accountType:
    | "superadmin"
    | "company"
    | "employed_driver"
    | "independent_driver";
  targetRoute: string;
  session: {
    companyId?: number | null;
    companyName?: string | null;
    companyLocation?: string | null;
    driverId?: number | null;
    driverType?: string | null;
    name: string;
    email: string;
    phone?: string | null;
  };
}

const SESSION_KEYS = [
  "dc_company_id",
  "dc_company_name",
  "dc_company_location",
  "dc_driver_id",
  "dc_user_name",
  "dc_driver_name",
  "dc_user_role",
  "dc_user_email",
] as const;

export function getIdentityHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};

  const companyId = localStorage.getItem("dc_company_id");
  const driverId = localStorage.getItem("dc_driver_id");

  if (companyId) headers["x-company-id"] = companyId;
  if (driverId) headers["x-driver-id"] = driverId;

  return headers;
}

export function clearSessionStorage() {
  SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
}

export function applyAuthSession(payload: AuthLoginResponse) {
  clearSessionStorage();

  localStorage.setItem("dc_user_role", payload.accountType);
  localStorage.setItem("dc_user_name", payload.session.name);
  localStorage.setItem("dc_user_email", payload.session.email);

  if (payload.session.companyId) {
    localStorage.setItem("dc_company_id", String(payload.session.companyId));
  }
  if (payload.session.companyName) {
    localStorage.setItem("dc_company_name", payload.session.companyName);
  }
  if (payload.session.companyLocation) {
    localStorage.setItem("dc_company_location", payload.session.companyLocation);
  }
  if (payload.session.driverId) {
    localStorage.setItem("dc_driver_id", String(payload.session.driverId));
    localStorage.setItem("dc_driver_name", payload.session.name);
  }
}

/**
 * Call backend logout endpoint and clear session
 * Note: JWT tokens are cleared server-side via httpOnly cookies
 */
export async function logout() {
  try {
    const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:8000/api")
      .trim()
      .replace(/\/$/, "");
    
    await fetch(`${apiBase}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // Continue with logout even if backend call fails
  }

  clearSessionStorage();
}
