import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import DriverDashboard from '../DriverDashboard';
import api from '../../services/api';

// Covers only the Phase-2 "Update Route" banner behavior; the rest of the screen
// (live tracking, logout, etc.) is covered by the feature-component tests + hook tests.

jest.mock('../../services/api', () => ({
  getMyCustomRoute: jest.fn(),
  reportJourney: jest.fn(() => Promise.resolve({ flagged: false })),
}));

jest.mock('../../hooks/bus', () => ({
  useMyBusQuery: () => ({
    data: { busId: 'BUS-1', busName: 'Shuttle', seatCapacity: 20 },
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

beforeEach(() => {
  jest.clearAllMocks();
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
