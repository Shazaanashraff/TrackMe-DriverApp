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

describe('qk.trips', () => {
  it('includes page in the key', () => {
    expect(qk.trips(1)).toEqual(['trips', 'history', 1]);
    expect(qk.trips(2)).toEqual(['trips', 'history', 2]);
  });

  it('produces distinct keys for distinct pages', () => {
    expect(qk.trips(1)).not.toEqual(qk.trips(2));
  });
});
