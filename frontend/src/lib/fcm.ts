/**
 * FCM (Firebase Cloud Messaging) Client
 *
 * Handles push notification permission, token registration,
 * and foreground message handling.
 */

import { getToken, onMessage, type MessagePayload } from "firebase/messaging";
import { ref, set } from "firebase/database";
import { messaging, rtdb } from "@/lib/firebase";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "";

/**
 * Request notification permission and register FCM token.
 * Stores the token in Firebase RTDB at /deviceTokens/{driverId}.
 *
 * @param driverId - The driver's ID to associate with the FCM token
 * @returns The FCM token, or null if permission denied / unsupported
 */
export async function registerFcmToken(
  driverId: string | number,
): Promise<string | null> {
  if (!messaging) {
    console.warn("[FCM] Messaging not available in this environment");
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("[FCM] Notification permission denied");
      return null;
    }

    const token = await getToken(messaging, { vapidKey: VAPID_KEY });

    if (token) {
      // Store token in RTDB for the backend to look up
      const tokenRef = ref(rtdb, `deviceTokens/${driverId}/${token}`);
      await set(tokenRef, true);
      console.log("[FCM] Token registered");
    }

    return token;
  } catch (error) {
    console.error("[FCM] Token registration failed:", error);
    return null;
  }
}

/**
 * Listen for foreground push notifications.
 * Called when the app is open and a push arrives.
 *
 * @param callback - Handler for incoming messages
 * @returns Unsubscribe function
 */
export function onForegroundMessage(
  callback: (payload: MessagePayload) => void,
): () => void {
  if (!messaging) {
    return () => {};
  }

  return onMessage(messaging, callback);
}
