/**
 * AuthProvider — Firebase Auth Context Provider
 *
 * Wraps the React app with Firebase Auth state management.
 * Only exports React components (required by Vite Fast Refresh).
 */

import {
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  applyAuthSession,
  clearSessionStorage,
  type AuthSessionResponse,
} from "@/lib/session";
import { post } from "@/lib/api";
import { AuthContext } from "@/lib/authContext";

const googleProvider = new GoogleAuthProvider();

/**
 * After any Firebase sign-in, call the backend to create a session
 * (link Firebase UID to MySQL record, set custom claims).
 */
async function createBackendSession(): Promise<AuthSessionResponse> {
  const sessionData = await post<AuthSessionResponse>("/auth/session");
  applyAuthSession(sessionData);
  return sessionData;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<AuthSessionResponse | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const sessionData = await createBackendSession();
          setSession(sessionData);
        } catch {
          console.warn("Failed to create backend session");
        }
      } else {
        setSession(null);
        clearSessionStorage();
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInEmail = useCallback(
    async (email: string, password: string): Promise<AuthSessionResponse> => {
      await signInWithEmailAndPassword(auth, email, password);
      return createBackendSession();
    },
    [],
  );

  const signInGoogle = useCallback(async (): Promise<AuthSessionResponse> => {
    await signInWithPopup(auth, googleProvider);
    return createBackendSession();
  }, []);

  const handleSignOut = useCallback(async () => {
    await auth.signOut();
    clearSessionStorage();
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        session,
        signInEmail,
        signInGoogle,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
