import { qk } from '../queryKeys';

describe('qk.myVehicle', () => {
  it('returns a stable key', () => {
    expect(qk.myVehicle()).toEqual(['vehicle', 'mine']);
    expect(qk.myVehicle()).toEqual(qk.myVehicle());
  });
});

describe('qk.routes', () => {
  it('returns a stable key', () => {
    expect(qk.routes()).toEqual(['routes']);
  });
});

describe('qk.routesManagement', () => {
  it('returns a stable key distinct from qk.routes', () => {
    expect(qk.routesManagement()).toEqual(['routes', 'management']);
    expect(qk.routesManagement()).not.toEqual(qk.routes());
  });
});

describe('qk.earningsStats', () => {
  it('returns a stable key', () => {
    expect(qk.earningsStats()).toEqual(['earnings', 'stats']);
  });
});

describe('qk.earningsHistory', () => {
  it('includes page in the key', () => {
    expect(qk.earningsHistory(1)).toEqual(['earnings', 'history', 1]);
    expect(qk.earningsHistory(2)).toEqual(['earnings', 'history', 2]);
  });

  it('produces distinct keys for distinct pages', () => {
    expect(qk.earningsHistory(1)).not.toEqual(qk.earningsHistory(2));
  });
});

describe('qk.dailyBreakdown', () => {
  it('returns a stable key', () => {
    expect(qk.dailyBreakdown()).toEqual(['earnings', 'daily']);
  });
});
