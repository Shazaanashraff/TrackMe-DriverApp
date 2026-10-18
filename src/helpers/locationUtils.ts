import { haversineMeters } from './geo';

export interface LocationFix {
  lat: number;
  lng: number;
  timestamp: number;
  // Horizontal accuracy in meters, when the platform reports one. UI-only (e.g. the
  // Signal Ink GPS stat chip) — never sent over the wire, never used by shouldEmit().
  accuracy?: number | null;
  // Direction of travel in degrees clockwise from north, or null when unknown.
  // Sent with the fix so rider and manager maps can turn the vehicle icon.
  heading?: number | null;
}

// Below this speed (m/s, about 3.6 km/h) the GPS course is noise: a parked or
// crawling shuttle reports a heading that swings at random.
export const MIN_HEADING_SPEED_MPS = 1;

/**
 * The GPS heading worth sending, or null. Platforms report -1 (iOS) or a stale
 * 0 (Android) when they have no course, and any course is unreliable while
 * stopped, so the heading only counts when the vehicle is actually moving.
 * Map clients keep the last direction they saw when this is null.
 */
export function usableHeading(coords: { heading?: number | null; speed?: number | null }): number | null {
  const { heading, speed } = coords || {};
  if (typeof heading !== 'number' || !Number.isFinite(heading) || heading < 0) return null;
  if (typeof speed !== 'number' || !Number.isFinite(speed) || speed < MIN_HEADING_SPEED_MPS) return null;
  return heading % 360;
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
 *
 * `maxMs` overrides the distance gate once that much time has passed: a shuttle
 * waiting at a stop is still on duty, but the distance gate alone would let the
 * backend's staleness sweeper end the session under it. Defaults to Infinity so
 * a caller that doesn't care keeps the pure min-distance behaviour.
 */
export function shouldEmit(
  last: LocationFix | null,
  next: LocationFix,
  minMeters: number,
  minMs: number,
  maxMs: number = Infinity
): boolean {
  if (!last) return true;
  const elapsed = next.timestamp - last.timestamp;
  if (elapsed < minMs) return false;
  if (elapsed >= maxMs) return true;
  return distanceMeters(last.lat, last.lng, next.lat, next.lng) >= minMeters;
}
