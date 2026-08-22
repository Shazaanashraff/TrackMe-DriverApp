// Contract test for the auth flow: login/register request+response shapes against
// the real services/api layer, the driver role-gate (useLogin + AuthContext wired
// together for real), 401 handling, and the refresh-then-retry / expired-refresh
// paths in AuthContext.authenticatedRequest. Only `global.fetch` is mocked — every
// other layer (transport, api, hooks/auth, AuthContext) is the real module, which
// is what makes this a contract test rather than a duplicate of the mocked-api unit
// tests in src/hooks/auth/__tests__/auth.test.ts and src/services/api/__tests__/api.test.ts.
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

import api from '../src/services/api';
import { useLogin } from '../src/hooks/auth';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

// AuthContext disconnects the socket on logout; the socket module itself has its
// own contract test (tracking.int.test.tsx) so it is stubbed out here.
jest.mock('../src/services/socket', () => ({
  __esModule: true,
  disconnectSocket: jest.fn(),
}));

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
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      QueryClientProvider,
      { client: qc },
      React.createElement(AuthProvider, null, children)
    );
  return wrapper;
}

function useAuthAndLogin() {
  return { auth: useAuth(), login: useLogin() };
}

const originalFetch = global.fetch;
// AuthProvider starts a 5s safety timeout on mount and clears it on unmount.
// Never unmounting would leave it pending after the test file finishes and
// make Jest report an open handle.
let pendingUnmounts: (() => void)[] = [];

function renderAuthHook<T>(cb: () => T, wrapper: ReturnType<typeof makeWrapper>) {
  const rendered = renderHook(cb, { wrapper });
  pendingUnmounts.push(rendered.unmount);
  return rendered;
}

beforeEach(async () => {
  jest.clearAllMocks();
  // AsyncStorage's mock persists across tests in this file (it's a module-level
  // mock, not reset per-render) — each AuthProvider mount reads it on init, so a
  // previous test's saved token otherwise leaks into the next one.
  await AsyncStorage.clear();
});

afterEach(() => {
  global.fetch = originalFetch;
  pendingUnmounts.forEach((unmount) => unmount());
  pendingUnmounts = [];
});

describe('api.login / api.register — request+response contract', () => {
  it('posts identifier+password to /api/auth/login and returns the parsed body', async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce(
      jsonResponse(200, {
        success: true,
        user: { _id: '1', name: 'A Driver', email: 'a@b.com', role: 'driver' },
        accessToken: 'access-1',
        refreshToken: 'refresh-1',
      })
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await api.login('DRV-1', 'Passw0rd!');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/auth\/login$/);
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(options.body)).toEqual({ identifier: 'DRV-1', password: 'Passw0rd!' });
    expect(result).toEqual({
      success: true,
      user: { _id: '1', name: 'A Driver', email: 'a@b.com', role: 'driver' },
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
    });
  });

  it('posts name+email+password+role to /api/auth/register', async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce(jsonResponse(201, { success: true }));
    global.fetch = fetchMock as unknown as typeof fetch;

    await api.register('Alice', 'alice@b.com', 'Passw0rd!', 'driver');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/auth\/register$/);
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({
      name: 'Alice',
      email: 'alice@b.com',
      password: 'Passw0rd!',
      role: 'driver',
    });
  });

  it('rejects with the server body message on a 401', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { message: 'Invalid driver ID or password' }));
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(api.login('DRV-1', 'wrong')).rejects.toMatchObject({
      kind: 'http',
      status: 401,
      message: 'Invalid driver ID or password',
    });
  });
});

describe('driver role-gate (useLogin wired to the real AuthContext)', () => {
  it('a driver account logs in and AuthContext persists the token', async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce(
      jsonResponse(200, {
        user: { _id: '1', name: 'A Driver', email: 'a@b.com', role: 'driver' },
        accessToken: 'access-1',
        refreshToken: 'refresh-1',
      })
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderAuthHook(() => useAuthAndLogin(), makeWrapper());

    await waitFor(() => expect(result.current.auth.loading).toBe(false));

    act(() => {
      result.current.login.mutate({ identifier: 'a@b.com', password: 'pass' });
    });

    await waitFor(() => expect(result.current.login.isSuccess).toBe(true));
    await waitFor(() => expect(result.current.auth.token).toBe('access-1'));
    expect(await AsyncStorage.getItem('token')).toBe('access-1');
  });

  it('a non-driver account is rejected and no auth is persisted', async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce(
      jsonResponse(200, {
        user: { _id: '2', name: 'A Passenger', email: 'p@b.com', role: 'passenger' },
        accessToken: 'access-2',
        refreshToken: 'refresh-2',
      })
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderAuthHook(() => useAuthAndLogin(), makeWrapper());

    await waitFor(() => expect(result.current.auth.loading).toBe(false));

    act(() => {
      result.current.login.mutate({ identifier: 'p@b.com', password: 'pass' });
    });

    await waitFor(() => expect(result.current.login.isError).toBe(true));
    expect((result.current.login.error as Error).message).toBe('This app is for drivers only');
    expect(result.current.auth.token).toBeNull();
    expect(await AsyncStorage.getItem('token')).toBeNull();
  });
});

describe('AuthContext.authenticatedRequest — 401, refresh-then-retry, expired-refresh', () => {
  async function loginDriver(result: { current: { auth: ReturnType<typeof useAuth> } }) {
    await act(async () => {
      await result.current.auth.login(
        { _id: '1', name: 'A Driver', role: 'driver' },
        'stale-access',
        'refresh-1'
      );
    });
  }

  it('refreshes an expired token and retries the original call', async () => {
    const fetchMock = jest
      .fn()
      // 1) getMe with the stale token -> 401
      .mockResolvedValueOnce(jsonResponse(401, { message: 'jwt expired' }))
      // 2) refresh-token -> new tokens
      .mockResolvedValueOnce(
        jsonResponse(200, {
          user: { _id: '1', name: 'A Driver', role: 'driver' },
          accessToken: 'fresh-access',
          refreshToken: 'fresh-refresh',
        })
      )
      // 3) getMe retried with the fresh token -> success
      .mockResolvedValueOnce(jsonResponse(200, { user: { _id: '1', name: 'A Driver' } }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderAuthHook(() => ({ auth: useAuth() }), makeWrapper());
    await waitFor(() => expect(result.current.auth.loading).toBe(false));
    await loginDriver(result);

    let response: unknown;
    await act(async () => {
      response = await result.current.auth.authenticatedRequest(api.getMe);
    });

    expect(response).toEqual({ user: { _id: '1', name: 'A Driver' } });
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const [refreshUrl, refreshOptions] = fetchMock.mock.calls[1];
    expect(refreshUrl).toMatch(/\/api\/auth\/refresh-token$/);
    expect(JSON.parse(refreshOptions.body)).toEqual({ refreshToken: 'refresh-1' });

    await waitFor(() => expect(result.current.auth.token).toBe('fresh-access'));
  });

  it('logs out when the refresh token itself is rejected', async () => {
    const fetchMock = jest
      .fn()
      // 1) getMe with the stale token -> 401
      .mockResolvedValueOnce(jsonResponse(401, { message: 'jwt expired' }))
      // 2) refresh-token -> also rejected (refresh token expired too)
      .mockResolvedValueOnce(jsonResponse(401, { message: 'Refresh token expired' }))
      // 3) best-effort server logout call fired by AuthContext.logout()
      .mockResolvedValueOnce(jsonResponse(200, { success: true }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderAuthHook(() => ({ auth: useAuth() }), makeWrapper());
    await waitFor(() => expect(result.current.auth.loading).toBe(false));
    await loginDriver(result);

    let caught: unknown;
    await act(async () => {
      try {
        await result.current.auth.authenticatedRequest(api.getMe);
      } catch (err) {
        caught = err;
      }
    });
    expect(caught).toMatchObject({ status: 401 });

    await waitFor(() => expect(result.current.auth.token).toBeNull());
    expect(await AsyncStorage.getItem('token')).toBeNull();
  });
});
