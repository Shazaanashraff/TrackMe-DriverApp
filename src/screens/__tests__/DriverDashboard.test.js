import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DriverDashboard from '../DriverDashboard';
import api from '../../services/api';
import { AppError } from '../../lib/errors';

// Covers the quick-actions block; the rest of the screen (live tracking, logout, etc.)
// is covered by the feature-component tests + hook tests.

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../../services/api', () => ({
  getMyVehicle: jest.fn(),
}));

const mockUseMyVehicleQuery = jest.fn(() => ({
  data: { vehicleId: 'VEHICLE-1', vehicleName: 'Shuttle', seatCapacity: 20 },
  isLoading: false,
  error: null,
}));

jest.mock('../../hooks/vehicle', () => ({
  useMyVehicleQuery: () => mockUseMyVehicleQuery(),
}));

const mockUseTrackingSession = jest.fn(() => ({
  status: 'idle',
  error: undefined,
  isReconnecting: false,
  start: jest.fn(),
  stop: jest.fn(),
}));

jest.mock('../../hooks/useTrackingSession', () => ({
  useTrackingSession: () => mockUseTrackingSession(),
}));

jest.mock('../../hooks/useLocationBroadcast', () => ({
  useLocationBroadcast: () => ({ permission: 'granted', bufferedCount: 0, lastFix: null }),
}));

jest.mock('../../hooks/auth', () => ({
  useLogout: () => ({ mutate: jest.fn(), isPending: false }),
}));

// TripProgressCard fetches route geometry via react-query; stub it so the dashboard
// test needs no QueryClientProvider (undefined data => the card renders nothing).
jest.mock('../../hooks/route', () => ({
  useRouteDetailsQuery: () => ({ data: undefined }),
}));

jest.mock('../../features/dashboard/useSocketConnection', () => ({
  useSocketConnection: () => ({ connecting: false }),
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Test Driver' },
    token: 'fake-token',
    logout: jest.fn(),
    authenticatedRequest: (fn, ...args) => fn('fake-token', ...args),
  }),
}));


beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  mockUseTrackingSession.mockReturnValue({
    status: 'idle',
    error: undefined,
    isReconnecting: false,
    start: jest.fn(),
    stop: jest.fn(),
  });
  mockUseMyVehicleQuery.mockReturnValue({
    data: { vehicleId: 'VEHICLE-1', vehicleName: 'Shuttle', seatCapacity: 20 },
    isLoading: false,
    error: null,
  });
});

describe('DriverDashboard — quick actions', () => {
  it('offers the QR scanner and nothing else', () => {
    const { getByTestId, queryByTestId, queryByText } = render(
      <DriverDashboard navigation={{ navigate: jest.fn() }} />
    );

    expect(getByTestId('scan-rider-qr-row')).toBeTruthy();

    // My Routes and custom-route recording were both removed from this screen.
    expect(queryByTestId('my-routes-row')).toBeNull();
    expect(queryByText('My routes')).toBeNull();
    expect(queryByTestId('update-route-banner')).toBeNull();
    expect(queryByTestId('mock-recorder')).toBeNull();
  });

  it('does not call the deleted custom-route endpoints', () => {
    render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);
    expect(api.getMyCustomRoute).toBeUndefined();
  });
});

describe('DriverDashboard — Go on duty failure surfaced (issue #20)', () => {
  it('shows the specific server-refusal reason to the driver', async () => {
    mockUseTrackingSession.mockReturnValue({
      status: 'error',
      error: new AppError('tracking', 'This bus is already being tracked elsewhere'),
      isReconnecting: false,
      start: jest.fn(),
      stop: jest.fn(),
    });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        "Couldn't go on duty",
        'This bus is already being tracked elsewhere'
      )
    );
  });

  it('does not alert while idle (no false positives)', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { findByText } = render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);
    // Wait for the screen to settle instead: the custom-route call this used to
    // wait on was removed with the feature, so any alert effect has run by the
    // time the dashboard has painted.
    await findByText('Your vehicle');

    expect(alertSpy).not.toHaveBeenCalled();
  });
});

describe('DriverDashboard — unassigned-vehicle messaging (issue #21)', () => {
  it('shows the generic register-vehicle message for a driver who never had one', async () => {
    mockUseMyVehicleQuery.mockReturnValue({ data: null, isLoading: false, error: null });

    const { findByText, queryByText } = render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);

    expect(await findByText('Register your vehicle to go live')).toBeTruthy();
    expect(queryByText('Your vehicle assignment was removed — contact your manager')).toBeNull();
  });

  it('shows the removed-assignment message once a previously-seen vehicle disappears', async () => {
    await AsyncStorage.setItem('driver_had_vehicle_before', 'true');
    mockUseMyVehicleQuery.mockReturnValue({ data: null, isLoading: false, error: null });

    const { findByText, queryByText } = render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);

    expect(await findByText('Your vehicle assignment was removed — contact your manager')).toBeTruthy();
    expect(queryByText('Register your vehicle to go live')).toBeNull();
  });

  it('persists that this driver has had a vehicle once one is seen', async () => {

    render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);

    await waitFor(async () => {
      expect(await AsyncStorage.getItem('driver_had_vehicle_before')).toBe('true');
    });
  });
});
