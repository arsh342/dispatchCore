/**
 * useAuth — Hook to access Firebase Auth context
 *
 * Must be used within an <AuthProvider>.
 */

import { useContext } from "react";
import { AuthContext, type AuthContextValue } from "@/lib/authContext";

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
