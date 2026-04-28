/**
 * Session Management (Firebase Auth)
 *
 * Manages the client-side session state.
 * Auth tokens are now managed by Firebase SDK (auto-refresh).
 * localStorage still stores UI convenience data (company name, etc).
 */

import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export interface AuthSessionResponse {
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
    email?: string;
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

/**
 * Waits for Firebase Auth to restore the session on page reload.
 * Resolves immediately on subsequent calls after first init.
 */
let authReady: Promise<void> | null = null;
function waitForAuth(): Promise<void> {
  if (!authReady) {
    authReady = new Promise<void>((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, () => {
        unsubscribe();
        resolve();
      });
    });
  }
  return authReady;
}

/**
 * Build identity headers for API requests.
 * Waits for Firebase to restore the session before reading the token.
 */
export async function getIdentityHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};

  const companyId = localStorage.getItem("dc_company_id");
  const driverId = localStorage.getItem("dc_driver_id");

  if (companyId) headers["x-company-id"] = companyId;
  if (driverId) headers["x-driver-id"] = driverId;

  // Wait for Firebase to restore auth session on reload
  await waitForAuth();

  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      const idToken = await currentUser.getIdToken();
      headers.Authorization = `Bearer ${idToken}`;
    } catch {
      // Token fetch failed — request will proceed without auth
    }
  }

  return headers;
}

export function clearSessionStorage() {
  SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
}

export function applyAuthSession(payload: AuthSessionResponse) {
  clearSessionStorage();

  localStorage.setItem("dc_user_role", payload.accountType);
  localStorage.setItem("dc_user_name", payload.session.name);
  if (payload.session.email) {
    localStorage.setItem("dc_user_email", payload.session.email);
  }

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
 * Logout — sign out from Firebase and clear local session.
 */
export async function logout() {
  try {
    await auth.signOut();
  } catch {
    // Continue with logout even if Firebase call fails
  }

  clearSessionStorage();
}
