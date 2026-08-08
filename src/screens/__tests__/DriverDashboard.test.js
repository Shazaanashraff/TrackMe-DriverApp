import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DriverDashboard from '../DriverDashboard';
import api from '../../services/api';
import { AppError } from '../../lib/errors';

// Covers only the Phase-2 "Update Route" banner behavior; the rest of the screen
// (live tracking, logout, etc.) is covered by the feature-component tests + hook tests.

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../../services/api', () => ({
  getMyCustomRoute: jest.fn(),
  reportJourney: jest.fn(() => Promise.resolve({ flagged: false })),
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

jest.mock('react-native-copilot', () => ({
  CopilotProvider: ({ children }) => children,
}));

jest.mock('../../components/CustomRouteRecorder', () => {
  const { Text } = require('react-native');
  return function MockCustomRouteRecorder({ mode, routeId }) {
    return <Text testID="mock-recorder">{`recorder:${mode}:${routeId}`}</Text>;
  };
});

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
  it('offers My routes on Home so the route list is not buried under Profile', async () => {
    api.getMyCustomRoute.mockResolvedValue({ data: { isCustomRoute: false } });
    const navigate = jest.fn();
    const { getByTestId } = render(<DriverDashboard navigation={{ navigate }} />);

    await waitFor(() => expect(api.getMyCustomRoute).toHaveBeenCalled());
    fireEvent.press(getByTestId('my-routes-row'));
    expect(navigate).toHaveBeenCalledWith('RouteManagement');
  });
});

describe('DriverDashboard — Update Route banner (Phase 2)', () => {
  it('does not show the banner for a normal (non-custom) route', async () => {
    api.getMyCustomRoute.mockResolvedValue({ data: { isCustomRoute: false } });
    const { queryByTestId } = render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);

    await waitFor(() => expect(api.getMyCustomRoute).toHaveBeenCalled());
    expect(queryByTestId('update-route-banner')).toBeNull();
  });

  it('does not show the banner for an ACTIVE custom route with no pending change request', async () => {
    api.getMyCustomRoute.mockResolvedValue({
      data: { isCustomRoute: true, status: 'ACTIVE', routeId: 'ROUTE-1', hasPendingChangeRequest: false },
    });
    const { queryByTestId } = render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);

    await waitFor(() => expect(api.getMyCustomRoute).toHaveBeenCalled());
    expect(queryByTestId('update-route-banner')).toBeNull();
  });

  it('shows the banner when an ACTIVE custom route has a pending change request', async () => {
    api.getMyCustomRoute.mockResolvedValue({
      data: { isCustomRoute: true, status: 'ACTIVE', routeId: 'ROUTE-1', hasPendingChangeRequest: true },
    });
    const { findByTestId } = render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);

    expect(await findByTestId('update-route-banner')).toBeTruthy();
  });

  it('opens the recorder in update mode with the correct routeId when tapped', async () => {
    api.getMyCustomRoute.mockResolvedValue({
      data: { isCustomRoute: true, status: 'ACTIVE', routeId: 'ROUTE-1', hasPendingChangeRequest: true },
    });
    const { findByTestId, getByTestId } = render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);

    const banner = await findByTestId('update-route-banner');
    expect(banner).toBeTruthy();

    fireEvent.press(getByTestId('update-route-button'));

    const recorder = await findByTestId('mock-recorder');
    expect(recorder.props.children).toBe('recorder:update:ROUTE-1');
  });
});

describe('DriverDashboard — Go on duty failure surfaced (issue #20)', () => {
  it('shows the specific server-refusal reason to the driver', async () => {
    api.getMyCustomRoute.mockResolvedValue({ data: { isCustomRoute: false } });
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
    api.getMyCustomRoute.mockResolvedValue({ data: { isCustomRoute: false } });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);
    await waitFor(() => expect(api.getMyCustomRoute).toHaveBeenCalled());

    expect(alertSpy).not.toHaveBeenCalled();
  });
});

describe('DriverDashboard — unassigned-vehicle messaging (issue #21)', () => {
  it('shows the generic register-vehicle message for a driver who never had one', async () => {
    api.getMyCustomRoute.mockResolvedValue({ data: { isCustomRoute: false } });
    mockUseMyVehicleQuery.mockReturnValue({ data: null, isLoading: false, error: null });

    const { findByText, queryByText } = render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);

    expect(await findByText('Register your vehicle to go live')).toBeTruthy();
    expect(queryByText('Your vehicle assignment was removed — contact your manager')).toBeNull();
  });

  it('shows the removed-assignment message once a previously-seen vehicle disappears', async () => {
    api.getMyCustomRoute.mockResolvedValue({ data: { isCustomRoute: false } });
    await AsyncStorage.setItem('driver_had_vehicle_before', 'true');
    mockUseMyVehicleQuery.mockReturnValue({ data: null, isLoading: false, error: null });

    const { findByText, queryByText } = render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);

    expect(await findByText('Your vehicle assignment was removed — contact your manager')).toBeTruthy();
    expect(queryByText('Register your vehicle to go live')).toBeNull();
  });

  it('persists that this driver has had a vehicle once one is seen', async () => {
    api.getMyCustomRoute.mockResolvedValue({ data: { isCustomRoute: false } });

    render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);

    await waitFor(async () => {
      expect(await AsyncStorage.getItem('driver_had_vehicle_before')).toBe('true');
    });
  });
});
