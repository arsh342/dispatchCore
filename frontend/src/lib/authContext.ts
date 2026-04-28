/**
 * Auth Context — Shared between AuthProvider and useAuth
 *
 * Separated from AuthProvider.tsx so that file only exports
 * React components (required by Vite Fast Refresh).
 */

import { createContext } from "react";
import type { User } from "firebase/auth";
import type { ConfirmationResult } from "firebase/auth";
import type { AuthSessionResponse } from "@/lib/session";

export interface AuthContextValue {
  /** The current Firebase user, or null if not authenticated */
  user: User | null;
  /** True while Firebase is checking the initial auth state */
  loading: boolean;
  /** Session data from the backend (role, companyId, etc) */
  session: AuthSessionResponse | null;
  /** Sign in with email and password */
  signInEmail: (email: string, password: string) => Promise<AuthSessionResponse>;
  /** Sign in with Google popup */
  signInGoogle: () => Promise<AuthSessionResponse>;
  /** Start phone sign-in — returns a ConfirmationResult to verify OTP */
  startPhoneSignIn: (
    phoneNumber: string,
    recaptchaContainer: HTMLElement,
  ) => Promise<ConfirmationResult>;
  /** Verify phone OTP and complete sign-in */
  verifyPhoneOtp: (
    confirmationResult: ConfirmationResult,
    otp: string,
  ) => Promise<AuthSessionResponse>;
  /** Sign out */
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
