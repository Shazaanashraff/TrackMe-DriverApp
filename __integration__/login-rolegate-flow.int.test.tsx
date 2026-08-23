// Full-flow test for todo 060 / issue #29 item 2: a non-driver account is rejected
// AND a real driver can then log in successfully, in one flow, walked through the
// real LoginScreen UI (not by calling useLogin directly). Real modules wired
// together: LoginScreen, useLogin, AuthContext, DriverDashboard, hooks/vehicle,
// hooks/boarding. Only the wire boundaries are mocked: global.fetch (HTTP),
// socket.io-client + services/notificationService (realtime — not exercised here,
// stubbed so DriverDashboard's socket-connection hook doesn't hit a real socket),
// expo-location (GPS permission — not exercised here either) and
// services/backgroundLocation (OS background task, covered by its own contract
// test in services/__tests__/backgroundLocation.test.ts).
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AuthProvider, useAuth } from '../src/context/AuthContext';
import LoginScreen from '../src/screens/LoginScreen';
import DriverDashboard from '../src/screens/DriverDashboard';

jest.mock('../src/context/NetworkStatusContext', () => ({
  __esModule: true,
  useNetworkStatus: () => ({
    networkState: 'online',
    isOnline: true,
    isDegraded: false,
    isOffline: false,
    retry: jest.fn(),
  }),
}));

jest.mock('../src/services/notificationService', () => ({
  __esModule: true,
  setupSocketNotificationListeners: jest.fn(() => ({ cleanup: jest.fn() })),
}));

jest.mock('../src/services/backgroundLocation', () => ({
  __esModule: true,
  isBackgroundTrackingActive: jest.fn().mockResolvedValue(false),
  startBackgroundTracking: jest.fn().mockResolvedValue(false),
  stopBackgroundTracking: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-location', () => ({
  __esModule: true,
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getBackgroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'undetermined' }),
  watchPositionAsync: jest.fn().mockResolvedValue({ remove: jest.fn() }),
  Accuracy: { High: 4 },
}));

const mockSocket = { connected: false, on: jest.fn(), emit: jest.fn(), disconnect: jest.fn() };
jest.mock('socket.io-client', () => ({
  __esModule: true,
  io: jest.fn(() => mockSocket),
}));

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    text: async () => JSON.stringify(body),
  };
}

// Mirrors AppNavigator's own auth gate (`!user ? <Login/> : <MainTabs/>`), using
// the real screens rather than reimplementing the switch.
function Root() {
  const { user, loading } = useAuth() as { user: { name?: string } | null; loading: boolean };
  if (loading) return null;
  const navigation = { navigate: jest.fn() };
  return user ? <DriverDashboard navigation={navigation} /> : <LoginScreen />;
}

function renderApp() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </QueryClientProvider>
  );
}

const originalFetch = global.fetch;

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe('login role-gate, end to end through the real LoginScreen', () => {
  it('rejects a non-driver account, then lets a real driver sign in and reach the dashboard', async () => {
    const fetchMock = jest.fn((url: string, options: RequestInit = {}) => {
      if (url.endsWith('/api/auth/login')) {
        const body = JSON.parse((options.body as string) || '{}');
        if (body.identifier === 'passenger@trackme.test') {
          return Promise.resolve(
            jsonResponse(200, {
              user: { _id: 'p1', name: 'A Passenger', email: 'passenger@trackme.test', role: 'passenger' },
              accessToken: 'access-passenger',
              refreshToken: 'refresh-passenger',
            })
          );
        }
        return Promise.resolve(
          jsonResponse(200, {
            user: { _id: 'd1', name: 'Nadia Perera', email: 'nadia@trackme.test', role: 'driver' },
            accessToken: 'access-driver',
            refreshToken: 'refresh-driver',
          })
        );
      }
      if (url.endsWith('/api/vehicle/my-vehicle')) {
        return Promise.resolve(jsonResponse(404, { message: 'No vehicle registered yet' }));
      }
      return Promise.reject(new Error(`Unexpected fetch in test: ${url}`));
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { getByLabelText, getByText, findByText, findByLabelText, queryByText } = renderApp();

    // AuthProvider resolves its stored-session check asynchronously; wait for the
    // real LoginScreen to actually mount before interacting with it.
    await findByLabelText('Driver ID or email');

    // 1) A passenger account tries to sign in through the real form.
    fireEvent.changeText(getByLabelText('Driver ID or email'), 'passenger@trackme.test');
    fireEvent.changeText(getByLabelText('Password'), 'Passw0rd!');
    fireEvent.press(getByText('Sign in'));

    // Role-gate rejects it: LoginScreen stays put and shows the specific copy,
    // AuthContext never persisted a session for it.
    expect(await findByText(/registered as a driver/i)).toBeTruthy();
    expect(queryByText('Hi Nadia')).toBeNull();
    expect(await AsyncStorage.getItem('token')).toBeNull();

    // 2) The same screen, now with real driver credentials, in the same flow.
    fireEvent.changeText(getByLabelText('Driver ID or email'), 'nadia@trackme.test');
    fireEvent.changeText(getByLabelText('Password'), 'Passw0rd!');
    fireEvent.press(getByText('Sign in'));

    // The role-gate passes, AuthContext persists the session, and Root's real
    // auth-gate switch (mirroring AppNavigator) swaps LoginScreen for the real
    // DriverDashboard.
    expect(await findByText('Hi Nadia')).toBeTruthy();
    await waitFor(async () => expect(await AsyncStorage.getItem('token')).toBe('access-driver'));

    const loginCalls = fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/api/auth/login'));
    expect(loginCalls).toHaveLength(2);
  });
});
