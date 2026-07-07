import { haversineMeters } from './geo';

// Computes how far a bus has travelled along its route, from the driver's live GPS
// fix and the route's ordered stop list. Pure + I/O-free so it is cheap to unit-test.
//
// The stop chain is a straight-line (great-circle) approximation of the road, while
// `route.distance` is the real road distance. We measure progress as a *fraction* of
// the chain, then scale it onto `route.distance` so the headline km match the trip
// distance the driver already knows. Approximate by design — never invents precision
// it doesn't have.

export interface RouteStop {
  lat: number;
  lng: number;
  order?: number;
  stopName?: string;
}

export interface TripProgress {
  coveredKm: number;
  remainingKm: number;
  percent: number; // 0..100, integer
}

const toRad = (deg: number): number => (deg * Math.PI) / 180;

/**
 * Project point `p` onto segment `a`->`b` using a local equirectangular
 * approximation (accurate enough at bus-route scale). Returns the clamped
 * position along the segment `t` in [0,1] and the perpendicular distance in metres.
 */
function projectOntoSegment(
  p: { lat: number; lng: number },
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): { t: number; distanceM: number } {
  const latRad = toRad(a.lat);
  const mPerDegLat = 111_320;
  const mPerDegLng = 111_320 * Math.cos(latRad);

  const bx = (b.lng - a.lng) * mPerDegLng;
  const by = (b.lat - a.lat) * mPerDegLat;
  const px = (p.lng - a.lng) * mPerDegLng;
  const py = (p.lat - a.lat) * mPerDegLat;

  const lenSq = bx * bx + by * by;
  let t = lenSq === 0 ? 0 : (px * bx + py * by) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const cx = t * bx;
  const cy = t * by;
  const dx = px - cx;
  const dy = py - cy;
  return { t, distanceM: Math.sqrt(dx * dx + dy * dy) };
}

const isFiniteCoord = (s: RouteStop | undefined): s is RouteStop =>
  !!s && Number.isFinite(s.lat) && Number.isFinite(s.lng);

/**
 * How far along the route the point (lat,lng) is.
 * Returns null when there isn't enough usable geometry to say anything honest
 * (fewer than 2 valid stops, or an invalid fix).
 */
export function computeTripProgress(
  stops: RouteStop[] | undefined | null,
  totalDistanceKm: number | undefined,
  lat: number,
  lng: number
): TripProgress | null {
  const valid = Array.isArray(stops) ? stops.filter(isFiniteCoord) : [];
  if (valid.length < 2 || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  // Respect the intended travel order when present.
  const chain = [...valid].sort((s1, s2) => (s1.order ?? 0) - (s2.order ?? 0));

  const segLenKm: number[] = [];
  for (let i = 0; i < chain.length - 1; i += 1) {
    segLenKm.push(haversineMeters(chain[i].lat, chain[i].lng, chain[i + 1].lat, chain[i + 1].lng) / 1000);
  }
  const chainKm = segLenKm.reduce((sum, d) => sum + d, 0);
  if (chainKm <= 0) return null;

  // Find the segment the driver is closest to, and how far along it they are.
  let best = { i: 0, t: 0, distanceM: Infinity };
  for (let i = 0; i < chain.length - 1; i += 1) {
    const { t, distanceM } = projectOntoSegment({ lat, lng }, chain[i], chain[i + 1]);
    if (distanceM < best.distanceM) best = { i, t, distanceM };
  }

  let coveredChainKm = 0;
  for (let i = 0; i < best.i; i += 1) coveredChainKm += segLenKm[i];
  coveredChainKm += best.t * segLenKm[best.i];

  const total = Number.isFinite(totalDistanceKm) && (totalDistanceKm as number) > 0
    ? (totalDistanceKm as number)
    : chainKm;

  const coveredKm = Math.max(0, Math.min((coveredChainKm / chainKm) * total, total));
  const percent = Math.round((coveredKm / total) * 100);

  return {
    coveredKm,
    remainingKm: Math.max(total - coveredKm, 0),
    percent: Math.max(0, Math.min(100, percent)),
  };
}
