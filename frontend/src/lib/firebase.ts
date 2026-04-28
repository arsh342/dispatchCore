/**
 * Firebase Client SDK Configuration
 *
 * Initializes the Firebase client for browser-side operations:
 *   - Auth: Email/password, Google OAuth, Phone sign-in
 *   - RTDB: Real-time listeners (replaces Socket.io)
 *   - Messaging: FCM token registration & foreground push handling
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getDatabase, type Database } from "firebase/database";
import { getMessaging, type Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

/** Initialize or reuse the Firebase app (singleton) */
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/** Firebase Auth instance (email, Google, phone providers) */
const auth: Auth = getAuth(app);

/** Firebase Realtime Database instance */
const rtdb: Database = getDatabase(app);

/**
 * Firebase Cloud Messaging instance.
 * Only available in browser contexts that support service workers.
 */
let messaging: Messaging | null = null;
try {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    messaging = getMessaging(app);
  }
} catch {
  // FCM not supported in this environment (e.g. SSR, incognito)
}

export { app, auth, rtdb, messaging };
