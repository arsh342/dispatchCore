/**
 * Haversine distance calculation between two lat/lng coordinate pairs.
 * Returns a human-readable distance string (e.g. "12.3 km" or "850 m").
 */

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format a distance in km to a human-readable string.
 * Under 1 km → "850 m", otherwise → "12.3 km".
 */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/**
 * Calculate and format distance between pickup and delivery coordinates.
 * Returns "—" if coordinates are missing or invalid.
 */
export function calcDistance(
  pickupLat: number | string | null | undefined,
  pickupLng: number | string | null | undefined,
  deliveryLat: number | string | null | undefined,
  deliveryLng: number | string | null | undefined,
): string {
  const pLat = parseFloat(String(pickupLat ?? ""));
  const pLng = parseFloat(String(pickupLng ?? ""));
  const dLat = parseFloat(String(deliveryLat ?? ""));
  const dLng = parseFloat(String(deliveryLng ?? ""));

  if (isNaN(pLat) || isNaN(pLng) || isNaN(dLat) || isNaN(dLng)) return "—";
  if (pLat === 0 && pLng === 0) return "—";
  if (dLat === 0 && dLng === 0) return "—";

  const km = haversineDistance(pLat, pLng, dLat, dLng);
  return formatDistance(km);
}

/**
 * Estimate driving time based on straight-line distance.
 * Uses a rough multiplier (1.3x for road factor) and average 40 km/h city speed.
 */
export function estimateTime(
  pickupLat: number | string | null | undefined,
  pickupLng: number | string | null | undefined,
  deliveryLat: number | string | null | undefined,
  deliveryLng: number | string | null | undefined,
): string {
  const pLat = parseFloat(String(pickupLat ?? ""));
  const pLng = parseFloat(String(pickupLng ?? ""));
  const dLat = parseFloat(String(deliveryLat ?? ""));
  const dLng = parseFloat(String(deliveryLng ?? ""));

  if (isNaN(pLat) || isNaN(pLng) || isNaN(dLat) || isNaN(dLng)) return "—";
  if (pLat === 0 && pLng === 0) return "—";
  if (dLat === 0 && dLng === 0) return "—";

  const km = haversineDistance(pLat, pLng, dLat, dLng);
  const roadKm = km * 1.3; // rough road-distance multiplier
  const hours = roadKm / 40; // average city speed
  const minutes = Math.round(hours * 60);

  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
