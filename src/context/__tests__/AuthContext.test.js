import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AppError } from '../../lib/errors';
import api from '../../services/api';
import { disconnectSocket, setSocketTokenRefresher } from '../../services/socket';
import { AuthProvider, useAuth } from '../AuthContext';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: { refreshToken: jest.fn(), logout: jest.fn(() => Promise.resolve()) },
}));

jest.mock('../../services/socket', () => ({
  __esModule: true,
  disconnectSocket: jest.fn(),
  setSocketTokenRefresher: jest.fn(),
}));

jest.mock('../../app/queryClient', () => ({
  __esModule: true,
  queryClient: { clear: jest.fn() },
}));

jest.mock('../../services/api/transport', () => ({
  __esModule: true,
  requestJson: jest.fn(),
}));

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

const rotated = { user: { _id: 'driver-1' }, accessToken: 'access-2', refreshToken: 'refresh-2' };

async function signedIn() {
  const hook = renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  await act(() => hook.result.current.login({ _id: 'driver-1' }, 'access-1', 'refresh-1'));
  return hook;
}

// The refresher the provider most recently handed to the socket layer.
const socketRefresher = () =>
  setSocketTokenRefresher.mock.calls.filter(([fn]) => typeof fn === 'function').at(-1)[0];

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

describe('AuthContext socket token refresh', () => {
  it('hands the socket layer a refresher that rotates the session', async () => {
    api.refreshToken.mockResolvedValue(rotated);
    const hook = await signedIn();

    let fresh;
    await act(async () => {
      fresh = await socketRefresher()();
    });

    expect(api.refreshToken).toHaveBeenCalledWith('refresh-1');
    expect(fresh).toBe('access-2');
    expect(hook.result.current.token).toBe('access-2');
  });

  it('shares one refresh between concurrent callers, since the refresh token is single-use', async () => {
    let resolveRefresh;
    api.refreshToken.mockReturnValue(new Promise((resolve) => { resolveRefresh = resolve; }));
    const hook = await signedIn();

    let results;
    await act(async () => {
      const fromSocket = socketRefresher()();
      const fromRequest = hook.result.current.authenticatedRequest(
        jest.fn()
          .mockRejectedValueOnce(Object.assign(new Error('expired'), { status: 401 }))
          .mockResolvedValueOnce('ok')
      );
      resolveRefresh(rotated);
      results = await Promise.all([fromSocket, fromRequest]);
    });

    expect(api.refreshToken).toHaveBeenCalledTimes(1);
    expect(results).toEqual(['access-2', 'ok']);
  });

  it('keeps the driver signed in when the refresh fails for lack of network', async () => {
    api.refreshToken.mockRejectedValue(new AppError('offline', 'No network connection'));
    const hook = await signedIn();

    let fresh;
    await act(async () => {
      fresh = await socketRefresher()();
    });

    expect(fresh).toBeNull();
    expect(hook.result.current.token).toBe('access-1');
    expect(disconnectSocket).not.toHaveBeenCalled();
  });

  it('signs the driver out when the server rejects the refresh', async () => {
    api.refreshToken.mockRejectedValue(new AppError('http', 'Invalid refresh token', { status: 401 }));
    const hook = await signedIn();

    await act(async () => {
      await socketRefresher()();
    });

    await waitFor(() => expect(hook.result.current.token).toBeNull());
    expect(disconnectSocket).toHaveBeenCalled();
  });
});
