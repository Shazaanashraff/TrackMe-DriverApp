// Contract test for the routes surface the driver app still has: a single
// public route lookup used by the trip-progress card. "My Routes" and
// custom-route recording/creation were removed from the app (commits e69eeac,
// eba9229) — the api surface stability test in
// src/services/api/__tests__/api.test.ts asserts createRoute/getRoutes/
// recordCustomRoute etc. are gone — so the "custom-route submission payload
// shape" case docs/TESTING_GUIDE.md originally promised no longer applies.
// What remains, and what this file covers, is the public/protected access rule
// on GET /api/routes/:id: a PUBLIC route resolves, while a PRIVATE (manager-only
// custom) route 404s and the query surfaces that as an error rather than crashing.
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import api from '../src/services/api';
import { useRouteDetailsQuery } from '../src/hooks/route';

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    text: async () => JSON.stringify(body),
  };
}

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

describe('api.getRouteById — contract', () => {
  it('gets a PUBLIC route with no auth header required', async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce(
      jsonResponse(200, {
        data: { routeId: 'r1', routeName: 'City Loop', source: 'A', destination: 'B' },
      })
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await api.getRouteById('r1');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/routes\/r1$/);
    expect(options?.headers).toBeUndefined();
    expect(result).toEqual({
      data: { routeId: 'r1', routeName: 'City Loop', source: 'A', destination: 'B' },
    });
  });

  it('404s for a PRIVATE (manager-only custom) route', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse(404, { message: 'Route not found' }));
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(api.getRouteById('private-r1')).rejects.toMatchObject({
      kind: 'http',
      status: 404,
      message: 'Route not found',
    });
  });

  it('encodes the route id in the URL', async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce(jsonResponse(200, { data: {} }));
    global.fetch = fetchMock as unknown as typeof fetch;

    await api.getRouteById('r1/with spaces');

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/routes\/r1%2Fwith%20spaces$/);
  });
});

describe('useRouteDetailsQuery — public vs. protected access, wired to the real api layer', () => {
  it('resolves and unwraps a PUBLIC route', async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce(
      jsonResponse(200, {
        data: { routeId: 'r1', routeName: 'City Loop' },
      })
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useRouteDetailsQuery('r1'), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ routeId: 'r1', routeName: 'City Loop' });
  });

  // The trip-progress card treats this as "no progress available" rather than
  // crashing — see the `retry: false` + query-error comment in hooks/route/index.ts.
  it('surfaces a PRIVATE route 404 as a query error, and does not retry', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse(404, { message: 'Route not found' }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useRouteDetailsQuery('private-r1'), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect((result.current.error as { status?: number }).status).toBe(404);
  });

  it('does not query when there is no routeId', () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useRouteDetailsQuery(undefined), {
      wrapper: makeWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
