import {
  haversineMeters,
  shouldRefetchPlace,
  MOVE_THRESHOLD_M,
  MIN_INTERVAL_MS,
} from '../usePlaceName';

describe('haversineMeters', () => {
  it('is zero for identical points', () => {
    expect(haversineMeters(6.9271, 79.8612, 6.9271, 79.8612)).toBe(0);
  });

  it('measures a known short distance roughly correctly', () => {
    // ~0.001 deg latitude ≈ 111 m.
    const d = haversineMeters(6.9271, 79.8612, 6.9281, 79.8612);
    expect(d).toBeGreaterThan(100);
    expect(d).toBeLessThan(125);
  });
});

describe('shouldRefetchPlace', () => {
  const base = { lat: 6.9271, lng: 79.8612, ms: 1_000_000 };

  it('always fetches on the first fix (no previous)', () => {
    expect(shouldRefetchPlace(null, 6.9271, 79.8612, 2_000_000)).toBe(true);
  });

  it('does not fetch when the bus has barely moved', () => {
    // A few metres away, well after the interval.
    expect(shouldRefetchPlace(base, 6.92715, 79.86125, base.ms + MIN_INTERVAL_MS + 1)).toBe(false);
  });

  it('does not fetch when moved far but too soon', () => {
    const farLat = base.lat + 0.01; // ~1.1 km
    expect(shouldRefetchPlace(base, farLat, base.lng, base.ms + 5_000)).toBe(false);
  });

  it('fetches when moved far AND enough time has passed', () => {
    const farLat = base.lat + 0.01; // ~1.1 km > MOVE_THRESHOLD_M
    expect(shouldRefetchPlace(base, farLat, base.lng, base.ms + MIN_INTERVAL_MS + 1)).toBe(true);
  });

  it('threshold and interval are sane bounds', () => {
    expect(MOVE_THRESHOLD_M).toBeGreaterThanOrEqual(100);
    expect(MIN_INTERVAL_MS).toBeGreaterThanOrEqual(15_000);
  });
});
