import { haversineMeters } from './geo';

export interface LocationFix {
  lat: number;
  lng: number;
  timestamp: number;
  // Horizontal accuracy in meters, when the platform reports one. UI-only (e.g. the
  // Signal Ink GPS stat chip) — never sent over the wire, never used by shouldEmit().
  accuracy?: number | null;
}

/** Haversine distance in metres between two coordinates. */
export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return haversineMeters(lat1, lng1, lat2, lng2);
}

/** True if lat/lng are finite numbers within valid geographic ranges. */
export function isValidCoord(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Decides whether a new location fix is worth emitting, given the last emitted fix.
 * Skips fixes that arrive too soon (minMs) or haven't moved far enough (minMeters) —
 * the min-distance + min-time battery policy from docs/LOCATION_TRACKING.md.
 * Always emits when there is no prior fix.
 */
export function shouldEmit(
  last: LocationFix | null,
  next: LocationFix,
  minMeters: number,
  minMs: number
): boolean {
  if (!last) return true;
  if (next.timestamp - last.timestamp < minMs) return false;
  return distanceMeters(last.lat, last.lng, next.lat, next.lng) >= minMeters;
}
