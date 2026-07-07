import { computeTripProgress } from '../tripProgress';

// A simple 2-stop east-west route along the equator. 1° of longitude ≈ 111.2 km,
// so passing totalDistanceKm=100 makes the scaled numbers easy to reason about.
const twoStops = [
  { lat: 0, lng: 0, order: 1 },
  { lat: 0, lng: 1, order: 2 },
];

describe('computeTripProgress', () => {
  it('returns 0% at the start of the route', () => {
    const p = computeTripProgress(twoStops, 100, 0, 0);
    expect(p).not.toBeNull();
    expect(p.percent).toBe(0);
    expect(p.coveredKm).toBeCloseTo(0, 1);
    expect(p.remainingKm).toBeCloseTo(100, 1);
  });

  it('returns 100% at the destination', () => {
    const p = computeTripProgress(twoStops, 100, 0, 1);
    expect(p.percent).toBe(100);
    expect(p.coveredKm).toBeCloseTo(100, 1);
    expect(p.remainingKm).toBeCloseTo(0, 1);
  });

  it('returns ~50% at the midpoint, scaled onto the route distance', () => {
    const p = computeTripProgress(twoStops, 100, 0, 0.5);
    expect(p.percent).toBe(50);
    expect(p.coveredKm).toBeCloseTo(50, 0);
  });

  it('clamps to 100% when the driver is past the last stop', () => {
    const p = computeTripProgress(twoStops, 100, 0, 1.5);
    expect(p.percent).toBe(100);
    expect(p.remainingKm).toBe(0);
  });

  it('falls back to the stop-chain distance when no route distance is given', () => {
    const p = computeTripProgress(twoStops, undefined, 0, 0.5);
    expect(p.percent).toBe(50);
    // Half of the ~111 km great-circle chain.
    expect(p.coveredKm).toBeCloseTo(55.6, 0);
  });

  it('respects stop order even when the list is unsorted', () => {
    const unsorted = [
      { lat: 0, lng: 1, order: 2 },
      { lat: 0, lng: 0, order: 1 },
    ];
    const p = computeTripProgress(unsorted, 100, 0, 0);
    expect(p.percent).toBe(0);
  });

  it('projects an off-route point onto the nearest segment', () => {
    // Slightly north of the midpoint — should still read ~50% along.
    const p = computeTripProgress(twoStops, 100, 0.02, 0.5);
    expect(p.percent).toBe(50);
  });

  it('returns null for fewer than two usable stops', () => {
    expect(computeTripProgress([{ lat: 0, lng: 0 }], 100, 0, 0)).toBeNull();
    expect(computeTripProgress([], 100, 0, 0)).toBeNull();
    expect(computeTripProgress(null, 100, 0, 0)).toBeNull();
  });

  it('returns null for an invalid fix', () => {
    expect(computeTripProgress(twoStops, 100, NaN, 0)).toBeNull();
    expect(computeTripProgress(twoStops, 100, 0, Infinity)).toBeNull();
  });

  it('ignores stops with non-finite coordinates', () => {
    const withJunk = [
      { lat: 0, lng: 0, order: 1 },
      { lat: NaN, lng: 5, order: 2 },
      { lat: 0, lng: 1, order: 3 },
    ];
    const p = computeTripProgress(withJunk, 100, 0, 1);
    expect(p.percent).toBe(100);
  });
});
