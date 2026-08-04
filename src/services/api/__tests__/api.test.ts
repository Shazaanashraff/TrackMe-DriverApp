import api from '../index';

describe('api surface stability', () => {
  const expectedMethods = [
    'login',
    'register',
    'refreshToken',
    'logout',
    'getMyVehicle',
    'registerVehicle',
    'updateVehicle',
    'getRoutes',
    'getRoutesManagementList',
    'createRoute',
    'getDriverEarningsStats',
    'getDriverEarningsHistory',
    'getDriverDailyBreakdown',
    'requestDriverPayout',
    'getMyCustomRoute',
    'recordCustomRoute',
    'reportJourney',
    'recordRouteUpdate',
  ];

  it.each(expectedMethods)('exports %s as a function', (method) => {
    expect(typeof (api as Record<string, unknown>)[method]).toBe('function');
  });
});
