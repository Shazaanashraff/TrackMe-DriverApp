// Full-flow test for todo 062 / issue #29 item 1: login → go on duty → send a
// stream of location updates → end duty, as one test. Walked through the real
// LoginScreen and DriverDashboard (DutyHero/GoButton/ConfirmSheet included), driven
// by the same real hooks production uses: useLogin, AuthContext, useTrackingSession,
// useLocationBroadcast, useBackgroundTracking, useSocketConnection, and the shared
// services/locationDispatch pipeline. Only the wire boundaries are mocked:
// global.fetch (HTTP), socket.io-client + notificationService (realtime, following
// the same pattern as __integration__/tracking.int.test.tsx), expo-location (the
// OS GPS watcher — capturing its callback the same way
// src/hooks/__tests__/useLocationBroadcast.test.ts does), and
// services/backgroundLocation (the OS background task, covered by its own contract
// test in services/__tests__/backgroundLocation.test.ts).
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AuthProvider, useAuth } from '../src/context/AuthContext';
import LoginScreen from '../src/screens/LoginScreen';
import DriverDashboard from '../src/screens/DriverDashboard';
import { resetDispatch } from '../src/services/locationDispatch';

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

let watchCallback:
  | ((location: { coords: { latitude: number; longitude: number; accuracy?: number | null } }) => void)
  | null = null;

jest.mock('expo-location', () => ({
  __esModule: true,
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getBackgroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'undetermined' }),
  watchPositionAsync: jest.fn((_opts: unknown, cb: typeof watchCallback) => {
    watchCallback = cb;
    return Promise.resolve({ remove: jest.fn() });
  }),
  Accuracy: { High: 4 },
}));

// Same fake socket shape as __integration__/tracking.int.test.tsx: only
// socket.io-client is mocked, so services/socket.ts and services/locationDispatch.ts
// run for real against this fake wire.
const mockSocket = { connected: false, on: jest.fn(), emit: jest.fn(), disconnect: jest.fn() };
const handlers: Record<string, (...args: unknown[]) => void> = {};
mockSocket.on.mockImplementation((event: string, cb: (...args: unknown[]) => void) => {
  handlers[event] = cb;
});
jest.mock('socket.io-client', () => ({
  __esModule: true,
  io: jest.fn(() => mockSocket),
}));

function simulateSocketConnect() {
  mockSocket.connected = true;
  act(() => {
    handlers['connect']?.();
  });
}

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    text: async () => JSON.stringify(body),
  };
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Mirrors AppNavigator's own auth gate, using the real screens.
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
  await resetDispatch();
  watchCallback = null;
  mockSocket.connected = false;
  for (const key of Object.keys(handlers)) delete handlers[key];
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe('shift lifecycle: login → go on duty → location stream → end duty', () => {
  it(
    'walks a driver through one full shift as a single flow',
    async () => {
      const fetchMock = jest.fn((url: string) => {
        if (url.endsWith('/api/auth/login')) {
          return Promise.resolve(
            jsonResponse(200, {
              user: { _id: 'd1', name: 'Nadia Perera', email: 'nadia@trackme.test', role: 'driver' },
              accessToken: 'access-1',
              refreshToken: 'refresh-1',
            })
          );
        }
        if (url.endsWith('/api/vehicle/my-vehicle')) {
          return Promise.resolve(
            jsonResponse(200, { data: { vehicleId: 'VEHICLE-1', vehicleName: 'Shuttle 1', routeId: '' } })
          );
        }
        if (url.includes('/api/driver/boarding/roster')) {
          return Promise.resolve(
            jsonResponse(200, {
              data: { vehicleId: 'VEHICLE-1', routeId: '', tripId: '', enrolledCount: 0, onBoardCount: 0, roster: [], guests: [] },
            })
          );
        }
        return Promise.reject(new Error(`Unexpected fetch in test: ${url}`));
      });
      global.fetch = fetchMock as unknown as typeof fetch;

      // Every driver:* ack (start-tracking / location / stop-tracking) succeeds.
      mockSocket.emit.mockImplementation((_event: string, _payload: unknown, cb?: (r: unknown) => void) => {
        cb?.({ success: true });
      });

      const { getByLabelText, getByText, findByText, findByLabelText } = renderApp();

      // 1) LOGIN — a real driver signs in through the real LoginScreen + useLogin + AuthContext.
      await waitFor(() => getByLabelText('Driver ID or email'));
      fireEvent.changeText(getByLabelText('Driver ID or email'), 'nadia@trackme.test');
      fireEvent.changeText(getByLabelText('Password'), 'Passw0rd!');
      fireEvent.press(getByText('Sign in'));

      expect(await findByText('Hi Nadia · Shuttle 1')).toBeTruthy();

      // The socket connects as soon as DriverDashboard mounts with a token.
      await waitFor(() => expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function)));
      simulateSocketConnect();

      // 2) GO ON DUTY.
      fireEvent.press(getByLabelText('Go online'));
      await findByLabelText('End journey'); // GoButton's own a11y label, once isLive flips

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'driver:start-tracking',
        { vehicleId: 'VEHICLE-1' },
        expect.any(Function)
      );

      // 3) A STREAM OF LOCATION UPDATES — the real GPS watcher delivers three fixes,
      // spaced past locationDispatch's MIN_INTERVAL_MS (2.5s) so the throttle lets
      // each one through rather than dropping it as "too soon".
      await waitFor(() => expect(watchCallback).not.toBeNull());

      await act(async () => {
        watchCallback!({ coords: { latitude: 6.9, longitude: 79.8, accuracy: 5 } });
      });
      await act(async () => {
        await wait(2600);
        watchCallback!({ coords: { latitude: 6.91, longitude: 79.81, accuracy: 5 } });
      });
      await act(async () => {
        await wait(2600);
        watchCallback!({ coords: { latitude: 6.92, longitude: 79.82, accuracy: 5 } });
      });

      const locationCalls = mockSocket.emit.mock.calls.filter(([event]) => event === 'driver:location');
      expect(locationCalls).toHaveLength(3);
      expect(locationCalls[0][1]).toMatchObject({ vehicleId: 'VEHICLE-1' });

      // DutyHero's own "updates sent" stat chip reflects the same stream.
      await findByText('3');

      // 4) END DUTY — GO/END is now the End-journey control; tapping it opens the
      // real ConfirmSheet, and confirming calls session.stop().
      fireEvent.press(getByLabelText('End journey'));
      fireEvent.press(getByText('End journey')); // ConfirmSheet's confirm button

      expect(await findByLabelText('Go online')).toBeTruthy(); // back to off-duty
      expect(mockSocket.emit).toHaveBeenCalledWith(
        'driver:stop-tracking',
        { vehicleId: 'VEHICLE-1' },
        expect.any(Function)
      );
    },
    20000
  );
});
