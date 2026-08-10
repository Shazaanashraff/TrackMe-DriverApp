import { useEffect, useRef, useState } from 'react';
import { reverseGeocode } from '../services/api/places';

// Re-geocode only after the vehicle has moved a meaningful distance AND enough time has
// passed. Reverse-geocoding is a paid API call and the GPS fix updates every ~3s, so
// without this a moving vehicle would fire hundreds of calls per hour. These bounds keep
// it to roughly one call every 30s+ while moving.
export const MOVE_THRESHOLD_M = 250;
export const MIN_INTERVAL_MS = 30_000;

interface Fix {
  lat: number;
  lng: number;
  ms: number;
}

export function haversineMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// Pure decision: should we spend an API call to refresh the place name? Yes on the
// first fix, otherwise only when the vehicle moved far enough AND enough time elapsed.
export function shouldRefetchPlace(last: Fix | null, lat: number, lng: number, now: number): boolean {
  if (!last) return true;
  const movedFar = haversineMeters(last.lat, last.lng, lat, lng) > MOVE_THRESHOLD_M;
  const enoughTime = now - last.ms > MIN_INTERVAL_MS;
  return movedFar && enoughTime;
}

// Returns the reverse-geocoded place name for the given coordinate, refreshed
// sparingly as the vehicle moves.
export function usePlaceName(lat: number | null, lng: number | null, enabled: boolean): string | null {
  const [name, setName] = useState<string | null>(null);
  const lastRef = useRef<Fix | null>(null);

  useEffect(() => {
    if (!enabled || lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const now = Date.now();
    if (!shouldRefetchPlace(lastRef.current, lat, lng, now)) return;

    lastRef.current = { lat, lng, ms: now };
    let cancelled = false;
    reverseGeocode(lat, lng)
      .then((r) => {
        if (!cancelled && r) setName(r.name || r.address || null);
      })
      .catch(() => {
        /* keep the previous name on a failed lookup */
      });
    return () => {
      cancelled = true;
    };
  }, [lat, lng, enabled]);

  // Clear when tracking stops so a stale place name isn't shown next journey.
  useEffect(() => {
    if (!enabled) {
      setName(null);
      lastRef.current = null;
    }
  }, [enabled]);

  return name;
}
