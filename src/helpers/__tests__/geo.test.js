import { haversineMeters, totalDistanceMeters, formatElapsed } from '../geo';

describe('haversineMeters', () => {
  it('is ~0 for identical points', () => {
    expect(haversineMeters(6.9271, 79.8612, 6.9271, 79.8612)).toBeLessThan(0.01);
  });

  it('measures ~1.11km for a 0.01 degree latitude step', () => {
    const d = haversineMeters(6.9271, 79.8612, 6.9371, 79.8612);
    expect(d).toBeGreaterThan(1050);
    expect(d).toBeLessThan(1150);
  });
});

describe('totalDistanceMeters', () => {
  it('returns 0 for fewer than 2 points', () => {
    expect(totalDistanceMeters([])).toBe(0);
    expect(totalDistanceMeters([{ lat: 1, lng: 1 }])).toBe(0);
  });

  it('sums distance across multiple segments', () => {
    const points = [
      { lat: 6.9271, lng: 79.8612 },
      { lat: 6.9321, lng: 79.8612 },
      { lat: 6.9371, lng: 79.8612 }
    ];
    const total = totalDistanceMeters(points);
    const direct = haversineMeters(6.9271, 79.8612, 6.9371, 79.8612);
    expect(total).toBeCloseTo(direct, 0);
  });
});

describe('formatElapsed', () => {
  it('formats sub-hour durations as MM:SS', () => {
    expect(formatElapsed(0)).toBe('00:00');
    expect(formatElapsed(65000)).toBe('01:05');
  });

  it('formats hour-plus durations as H:MM:SS', () => {
    expect(formatElapsed(3661000)).toBe('1:01:01');
  });
});
