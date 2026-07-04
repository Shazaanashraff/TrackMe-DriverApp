import { distanceMeters, isValidCoord, shouldEmit } from '../locationUtils';

describe('distanceMeters', () => {
  it('returns ~0 for identical coordinates', () => {
    expect(distanceMeters(6.9271, 79.8612, 6.9271, 79.8612)).toBeCloseTo(0, 5);
  });

  it('returns a known value for two known points', () => {
    // Colombo Fort to Kandy, roughly 95km apart.
    const d = distanceMeters(6.9344, 79.8428, 7.2906, 80.6337);
    expect(d).toBeGreaterThan(90000);
    expect(d).toBeLessThan(100000);
  });

  it('is symmetric', () => {
    const a = distanceMeters(6.9271, 79.8612, 7.2906, 80.6337);
    const b = distanceMeters(7.2906, 80.6337, 6.9271, 79.8612);
    expect(a).toBeCloseTo(b, 6);
  });
});

describe('isValidCoord', () => {
  it('accepts valid coordinates', () => {
    expect(isValidCoord(6.9271, 79.8612)).toBe(true);
    expect(isValidCoord(-90, -180)).toBe(true);
    expect(isValidCoord(90, 180)).toBe(true);
  });

  it('rejects out-of-range coordinates', () => {
    expect(isValidCoord(91, 0)).toBe(false);
    expect(isValidCoord(0, 181)).toBe(false);
    expect(isValidCoord(-91, 0)).toBe(false);
    expect(isValidCoord(0, -181)).toBe(false);
  });

  it('rejects non-finite coordinates', () => {
    expect(isValidCoord(NaN, 0)).toBe(false);
    expect(isValidCoord(0, Infinity)).toBe(false);
  });
});

describe('shouldEmit', () => {
  const base = { lat: 6.9271, lng: 79.8612, timestamp: 1000 };

  it('always emits when there is no prior fix', () => {
    expect(shouldEmit(null, base, 10, 3000)).toBe(true);
  });

  it('skips a fix that arrives before minMs has elapsed', () => {
    const next = { lat: 6.93, lng: 79.87, timestamp: 1500 };
    expect(shouldEmit(base, next, 10, 3000)).toBe(false);
  });

  it('skips a fix that has not moved minMeters', () => {
    const next = { lat: base.lat, lng: base.lng, timestamp: 5000 };
    expect(shouldEmit(base, next, 10, 3000)).toBe(false);
  });

  it('emits when both minMs and minMeters thresholds are met', () => {
    const next = { lat: 6.93, lng: 79.87, timestamp: 5000 };
    expect(shouldEmit(base, next, 10, 3000)).toBe(true);
  });
});
