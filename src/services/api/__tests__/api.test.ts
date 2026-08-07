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
    'getRouteById',
    'getDriverTrips',
    'getDriverTripDetails',
  ];

  it.each(expectedMethods)('exports %s as a function', (method) => {
    expect(typeof (api as Record<string, unknown>)[method]).toBe('function');
  });

  // My Routes and custom-route recording were removed. getRouteById stays because
  // the trip-progress card uses it.
  it.each([
    'getRoutes',
    'getRoutesManagementList',
    'createRoute',
    'getMyCustomRoute',
    'recordCustomRoute',
    'reportJourney',
    'recordRouteUpdate',
  ])('no longer exports %s', (method) => {
    expect((api as Record<string, unknown>)[method]).toBeUndefined();
  });
});

describe('api.login', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // The sign-in field carries a driver ID or an email, so it goes out as
  // `identifier` rather than `email`.
  it('posts the identifier and password to the login endpoint', async () => {
    // The transport reads the body as text and checks content-length itself.
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
      text: async () => JSON.stringify({ success: true }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await api.login('DRV-4K7P-9XQ2', 'DriverPass1!');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/auth\/login$/);
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({
      identifier: 'DRV-4K7P-9XQ2',
      password: 'DriverPass1!',
    });
  });
});
