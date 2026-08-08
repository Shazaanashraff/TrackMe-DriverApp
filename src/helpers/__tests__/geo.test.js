import { haversineMeters, totalDistanceMeters, formatElapsed, appendBreadcrumbPoint } from '../geo';

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

describe('appendBreadcrumbPoint (issue #17)', () => {
  it('appends normally while under the cap — fidelity unaffected', () => {
    let points = [];
    for (let i = 0; i < 100; i += 1) {
      points = appendBreadcrumbPoint(points, { lat: i, lng: i }, 5000);
    }
    expect(points).toHaveLength(100);
    expect(points[0]).toEqual({ lat: 0, lng: 0 });
    expect(points[99]).toEqual({ lat: 99, lng: 99 });
  });

  it('halves resolution once the cap is exceeded instead of growing unbounded', () => {
    let points = [];
    for (let i = 0; i < 10; i += 1) {
      points = appendBreadcrumbPoint(points, { lat: i, lng: i }, 10);
    }
    expect(points).toHaveLength(10);

    // The 11th point pushes length to 11, over the cap of 10 — halve.
    points = appendBreadcrumbPoint(points, { lat: 10, lng: 10 }, 10);
    expect(points.length).toBeLessThan(11);
    expect(points.length).toBeGreaterThan(0);
  });

  it('always keeps the newest point after halving', () => {
    let points = [];
    for (let i = 0; i < 20; i += 1) {
      points = appendBreadcrumbPoint(points, { lat: i, lng: i }, 10);
    }
    expect(points[points.length - 1]).toEqual({ lat: 19, lng: 19 });
  });

  it('stays bounded across many points instead of growing forever', () => {
    let points = [];
    for (let i = 0; i < 5000; i += 1) {
      points = appendBreadcrumbPoint(points, { lat: i, lng: i }, 100);
    }
    expect(points.length).toBeLessThanOrEqual(100);
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
