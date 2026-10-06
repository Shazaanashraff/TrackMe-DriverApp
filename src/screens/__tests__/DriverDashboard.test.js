import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DriverDashboard from '../DriverDashboard';
import api from '../../services/api';
import { AppError } from '../../lib/errors';
// Broadcast interactions have their own real QueryClient behavior suite.
jest.mock('../../features/communications/BroadcastPanel', () => () => null);

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

const mockUseLocationBroadcast = jest.fn(() => ({
  permission: 'granted',
  bufferedCount: 0,
  lastFix: null,
  lostConnection: false,
}));

jest.mock('../../hooks/useLocationBroadcast', () => ({
  useLocationBroadcast: () => mockUseLocationBroadcast(),
}));

const mockUseBackgroundTracking = jest.fn(() => ({
  permission: 'granted',
  isActive: true,
  shouldOfferUpgrade: false,
  enableBackground: jest.fn(),
  dismissOffer: jest.fn(),
}));

jest.mock('../../hooks/useBackgroundTracking', () => ({
  useBackgroundTracking: () => mockUseBackgroundTracking(),
}));

jest.mock('../../hooks/auth', () => ({
  useLogout: () => ({ mutate: jest.fn(), isPending: false }),
}));

// The vehicle's route carries the manager's QR boarding switch (qrEnabled). Stubbed so
// the dashboard test needs no QueryClientProvider; each test sets the route it wants.
let mockRoute;
jest.mock('../../hooks/route', () => ({
  useRouteDetailsQuery: () => ({ data: mockRoute }),
}));

jest.mock('../../features/dashboard/OnBoardCard', () => {
  const { View } = jest.requireActual('react-native');
  return function MockOnBoardCard() {
    return <View testID="on-board-card" />;
  };
});

jest.mock('../../features/dashboard/useSocketConnection', () => ({
  useSocketConnection: () => ({ connecting: false }),
}));

let mockBufferedCount = 0;
const mockGetBufferedCount = jest.fn(() => mockBufferedCount);
const mockSubscribeToBufferCount = jest.fn((cb) => {
  cb(mockBufferedCount);
  return () => {};
});
jest.mock('../../services/locationDispatch', () => ({
  getBufferedCount: (...args) => mockGetBufferedCount(...args),
  subscribeToBufferCount: (...args) => mockSubscribeToBufferCount(...args),
}));

// OnBoardCard (Home "X / Y on board") owns its own roster query; stub it so this
// banner-focused test needs no QueryClient. Its own behaviour is covered in OnBoardCard.test.tsx.
jest.mock('../../hooks/boarding', () => ({
  useBoardingRosterQuery: () => ({ data: undefined, isLoading: false, isError: true }),
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
  mockBufferedCount = 0;
  mockRoute = undefined;
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
  mockUseLocationBroadcast.mockReturnValue({
    permission: 'granted',
    bufferedCount: 0,
    lastFix: null,
    lostConnection: false,
  });
});

describe('DriverDashboard — lost connection warning (issue #30)', () => {
  it('surfaces the warning on the hero while tracking with a rejection streak', () => {
    mockUseTrackingSession.mockReturnValue({
      status: 'tracking',
      error: undefined,
      isReconnecting: false,
      start: jest.fn(),
      stop: jest.fn(),
    });
    mockUseLocationBroadcast.mockReturnValue({
      permission: 'granted',
      bufferedCount: 5,
      lastFix: null,
      lostConnection: true,
    });

    const { getByText } = render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);

    expect(
      getByText('Connection unstable')
    ).toBeTruthy();
  });

  it('does not surface the warning while off duty even if the hook reports a stale streak', () => {
    mockUseLocationBroadcast.mockReturnValue({
      permission: 'granted',
      bufferedCount: 0,
      lastFix: null,
      lostConnection: true,
    });

    const { queryByText } = render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);

    expect(
      queryByText('Connection unstable')
    ).toBeNull();
  });
});

describe('DriverDashboard — quick actions', () => {
  it('offers the QR scanner and nothing else when the route uses QR boarding', () => {
    mockRoute = { routeId: 'GVC-MORNING', qrEnabled: true };
    const { getByTestId, queryByTestId, queryByText } = render(
      <DriverDashboard navigation={{ navigate: jest.fn() }} />
    );

    expect(getByTestId('scan-rider-qr-row')).toBeTruthy();
    expect(getByTestId('on-board-card')).toBeTruthy();

    // My Routes and custom-route recording were both removed from this screen.
    expect(queryByTestId('my-routes-row')).toBeNull();
    expect(queryByText('My routes')).toBeNull();
    expect(queryByTestId('update-route-banner')).toBeNull();
    expect(queryByTestId('mock-recorder')).toBeNull();
  });

  // Not every shuttle scans passes: QR boarding is the manager's per-route switch.
  it('hides the scanner and On board when the route has QR boarding off', () => {
    mockRoute = { routeId: 'HBT-EAST', qrEnabled: false };
    const { queryByTestId, queryByText } = render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);
    expect(queryByTestId('scan-rider-qr-row')).toBeNull();
    expect(queryByText('Scan rider QR')).toBeNull();
    expect(queryByTestId('on-board-card')).toBeNull();
  });

  it('hides the scanner and On board until the route has loaded', () => {
    mockRoute = undefined;
    const { queryByTestId } = render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);
    expect(queryByTestId('scan-rider-qr-row')).toBeNull();
    expect(queryByTestId('on-board-card')).toBeNull();
  });

  it('hides them without a vehicle, even on a QR route', () => {
    mockRoute = { routeId: 'GVC-MORNING', qrEnabled: true };
    mockUseMyVehicleQuery.mockReturnValue({ data: null, isLoading: false, error: null });
    const { queryByTestId } = render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);
    expect(queryByTestId('scan-rider-qr-row')).toBeNull();
    expect(queryByTestId('on-board-card')).toBeNull();
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
    await findByText('YOUR VEHICLE');

    expect(alertSpy).not.toHaveBeenCalled();
  });
});

describe('DriverDashboard — stop-tracking ack failure surfaced (issue #12)', () => {
  it('alerts and stays on "You\'re live" when the server never confirms the stop', async () => {
    mockUseTrackingSession.mockReturnValue({
      status: 'tracking',
      error: new AppError('tracking', 'No response from server'),
      isReconnecting: false,
      start: jest.fn(),
      stop: jest.fn(),
    });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith("Couldn't confirm you're off duty", 'No response from server')
    );
  });

  it('does not alert while tracking cleanly with no error', async () => {
    mockUseTrackingSession.mockReturnValue({
      status: 'tracking',
      error: undefined,
      isReconnecting: false,
      start: jest.fn(),
      stop: jest.fn(),
    });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { findByText } = render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);
    await findByText('YOUR VEHICLE');

    expect(alertSpy).not.toHaveBeenCalled();
  });
});

describe('DriverDashboard — buffered GPS fixes surfaced (offline audit)', () => {
  it('shows the buffered-fix count on the hero once fixes start piling up', () => {
    mockUseTrackingSession.mockReturnValue({
      status: 'tracking',
      error: undefined,
      isReconnecting: false,
      start: jest.fn(),
      stop: jest.fn(),
    });
    mockBufferedCount = 12;

    const { getByText, getByTestId } = render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);

    expect(getByTestId('buffered-count-chip')).toBeTruthy();
    expect(getByText('12')).toBeTruthy();
    expect(getByText('UNSENT')).toBeTruthy();
  });

  it('shows the normal "updates sent" chip when nothing is buffered', () => {
    mockUseTrackingSession.mockReturnValue({
      status: 'tracking',
      error: undefined,
      isReconnecting: false,
      start: jest.fn(),
      stop: jest.fn(),
    });
    mockBufferedCount = 0;

    const { getByText, queryByText } = render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);

    expect(getByText('UPDATES')).toBeTruthy();
    expect(queryByText('UNSENT')).toBeNull();
  });
});

describe('DriverDashboard — unassigned-vehicle messaging (issue #21)', () => {
  it('shows the generic register-vehicle message for a driver who never had one', async () => {
    mockUseMyVehicleQuery.mockReturnValue({ data: null, isLoading: false, error: null });

    const { findByText, queryByText } = render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);

    expect(await findByText('Vehicle registration required')).toBeTruthy();
    expect(queryByText('Vehicle assignment removed')).toBeNull();
  });

  it('shows the removed-assignment message once a previously-seen vehicle disappears', async () => {
    await AsyncStorage.setItem('driver_had_vehicle_before', 'true');
    mockUseMyVehicleQuery.mockReturnValue({ data: null, isLoading: false, error: null });

    const { findByText, queryByText } = render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);

    expect(await findByText('Vehicle assignment removed')).toBeTruthy();
    expect(queryByText('Vehicle registration required')).toBeNull();
  });

  it('persists that this driver has had a vehicle once one is seen', async () => {

    render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);

    await waitFor(async () => {
      expect(await AsyncStorage.getItem('driver_had_vehicle_before')).toBe('true');
    });
  });
});
