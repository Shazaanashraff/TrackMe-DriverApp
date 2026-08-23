// Full-flow test for todo 061 / issue #29 item 4: register a bus, then confirm the
// Dashboard reflects the new bus after navigating back — walked through the real
// VehicleRegistrationScreen and DriverDashboard components, pushed/popped by a
// navigation harness that mirrors AppNavigator's own push-above-the-tabs pattern
// for VehicleRegistration (see src/navigation/AppNavigator.js). Real modules wired
// together: DriverDashboard, VehicleCard, VehicleRegistrationScreen,
// useRegisterVehicle/useMyVehicleQuery, AuthContext. Only the wire boundaries are
// mocked: global.fetch (HTTP), socket.io-client + notificationService (realtime —
// not exercised here), expo-location, and services/backgroundLocation.
import React, { useState } from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AuthProvider } from '../src/context/AuthContext';
import DriverDashboard from '../src/screens/DriverDashboard';
import VehicleRegistrationScreen from '../src/screens/VehicleRegistrationScreen';

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

jest.mock('socket.io-client', () => ({
  __esModule: true,
  io: jest.fn(() => ({ connected: false, on: jest.fn(), emit: jest.fn(), disconnect: jest.fn() })),
}));

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    text: async () => JSON.stringify(body),
  };
}

// Mirrors AppNavigator pushing VehicleRegistration above the tabs and popping it
// back with goBack() — the two real screens involved in this journey, without
// pulling in the rest of MainTabs.
function NavHarness() {
  const [screen, setScreen] = useState<'dashboard' | 'registration'>('dashboard');
  const navigation = {
    navigate: (name: string) => {
      if (name === 'VehicleRegistration') setScreen('registration');
    },
    goBack: () => setScreen('dashboard'),
  };
  return screen === 'dashboard' ? (
    <DriverDashboard navigation={navigation} />
  ) : (
    <VehicleRegistrationScreen navigation={navigation} />
  );
}

function renderApp() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <NavHarness />
      </AuthProvider>
    </QueryClientProvider>
  );
}

const originalFetch = global.fetch;

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  // A returning, already-authenticated driver — AuthContext's loadStoredAuth()
  // reads exactly these keys on mount. The login flow itself is covered by
  // login-rolegate-flow.int.test.tsx; this test starts past it.
  await AsyncStorage.setItem('token', 'access-driver');
  await AsyncStorage.setItem('user', JSON.stringify({ _id: 'd1', name: 'Nadia Perera', role: 'driver' }));
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe('bus registration end to end: register → Dashboard reflects it after navigating back', () => {
  it('shows the new vehicle on the Dashboard once VehicleRegistrationScreen navigates back', async () => {
    let vehicleRegistered = false;

    const fetchMock = jest.fn((url: string, options: RequestInit = {}) => {
      if (url.endsWith('/api/vehicle/my-vehicle')) {
        if (!vehicleRegistered) {
          return Promise.resolve(jsonResponse(404, { message: 'No vehicle registered yet' }));
        }
        return Promise.resolve(
          jsonResponse(200, {
            data: {
              vehicleId: 'NIGHT-OWL-1',
              vehicleName: 'Night Owl',
              registrationNumber: 'NB-4521',
              routeId: '',
            },
          })
        );
      }
      if (url.endsWith('/api/vehicle/register')) {
        const body = JSON.parse((options.body as string) || '{}');
        expect(body).toMatchObject({
          vehicleId: 'NIGHT-OWL-1',
          vehicleName: 'Night Owl',
          registrationNumber: 'NB-4521',
        });
        vehicleRegistered = true;
        return Promise.resolve(jsonResponse(201, { success: true, data: { _id: 'v1', ...body } }));
      }
      if (url.includes('/api/driver/boarding/roster')) {
        return Promise.resolve(
          jsonResponse(200, {
            data: { vehicleId: 'NIGHT-OWL-1', routeId: '', tripId: '', enrolledCount: 0, onBoardCount: 0, roster: [], guests: [] },
          })
        );
      }
      return Promise.reject(new Error(`Unexpected fetch in test: ${url}`));
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { getByText, getByLabelText, findByText, queryByText } = renderApp();

    // 1) Dashboard starts with no vehicle registered.
    expect(await findByText('No vehicle yet')).toBeTruthy();

    // 2) Tap through to the real registration screen (the same navigation target
    // AppNavigator wires VehicleCard's empty-state action to).
    fireEvent.press(getByText('Add my vehicle'));
    await findByText('Your vehicle'); // ScreenHeader title on VehicleRegistrationScreen

    // 3) Fill in and submit the real form.
    fireEvent.changeText(getByLabelText('Vehicle ID'), 'night-owl-1');
    fireEvent.changeText(getByLabelText('Vehicle name'), 'Night Owl');
    fireEvent.changeText(getByLabelText('Registration number'), 'nb-4521');
    fireEvent.press(getByText('Save vehicle'));

    // Confirms the save inline before the screen navigates back.
    await findByText('Saved');

    // 4) VehicleRegistrationScreen calls navigation.goBack() ~700ms after a
    // successful save — back on the (freshly remounted) Dashboard, VehicleCard
    // now shows the vehicle registerVehicle's onSuccess invalidated the query for.
    await waitFor(() => expect(getByText('Night Owl')).toBeTruthy(), { timeout: 3000 });
    expect(queryByText('No vehicle yet')).toBeNull();

    const registerCalls = fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/api/vehicle/register'));
    expect(registerCalls).toHaveLength(1);
  });
});
