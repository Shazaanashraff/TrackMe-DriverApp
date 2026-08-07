import React from 'react';
import { render } from '@testing-library/react-native';
import DriverDashboard from '../DriverDashboard';
import api from '../../services/api';

// Covers the quick-actions block; the rest of the screen (live tracking, logout, etc.)
// is covered by the feature-component tests + hook tests.

jest.mock('../../services/api', () => ({
  getMyVehicle: jest.fn(),
}));

jest.mock('../../hooks/vehicle', () => ({
  useMyVehicleQuery: () => ({
    data: { vehicleId: 'VEHICLE-1', vehicleName: 'Shuttle', seatCapacity: 20 },
    isLoading: false,
    error: null,
  }),
}));

jest.mock('../../hooks/useTrackingSession', () => ({
  useTrackingSession: () => ({
    status: 'idle',
    error: undefined,
    isReconnecting: false,
    start: jest.fn(),
    stop: jest.fn(),
  }),
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


beforeEach(() => {
  jest.clearAllMocks();
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
