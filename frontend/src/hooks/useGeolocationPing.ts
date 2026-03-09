/**
 * useGeolocationPing Hook
 *
 * Uses the browser Geolocation API to track the driver's real-time
 * location and send periodic pings to POST /api/location/ping.
 */

import { useEffect, useRef } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const PING_INTERVAL = 15_000; // Send location every 15 seconds

export function useGeolocationPing() {
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestPos = useRef<{
    lat: number;
    lng: number;
    speed: number | null;
    heading: number | null;
  } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn("Geolocation not supported");
      return;
    }

    const driverId = localStorage.getItem("dc_driver_id");
    const companyId = localStorage.getItem("dc_company_id");
    if (!driverId) return;

    // Watch position — updates latestPos ref on every change
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        latestPos.current = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
        };
      },
      (err) => console.warn("Geolocation error:", err.message),
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 5_000 },
    );

    // Send a ping every PING_INTERVAL ms
    async function sendPing() {
      if (!latestPos.current) return;
      try {
        await fetch(`${API_URL}/location/ping`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-driver-id": driverId!,
            ...(companyId ? { "x-company-id": companyId } : {}),
          },
          body: JSON.stringify({
            lat: latestPos.current.lat,
            lng: latestPos.current.lng,
            speed: latestPos.current.speed ?? 0,
            heading: latestPos.current.heading ?? 0,
          }),
        });
      } catch {
        // Silently fail — will retry on next interval
      }
    }

    // Send immediately, then at intervals
    sendPing();
    intervalRef.current = setInterval(sendPing, PING_INTERVAL);

    return () => {
      if (watchIdRef.current !== null)
        navigator.geolocation.clearWatch(watchIdRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
}
