import React from 'react';
import { RefreshControl } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import TripHistoryScreen from '../TripHistoryScreen';
import api from '../../services/api';

jest.mock('../../services/api', () => ({
  getDriverTrips: jest.fn(),
}));

const mockAuthenticatedRequest = jest.fn((fn, ...args) => fn(...args));

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ authenticatedRequest: mockAuthenticatedRequest }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthenticatedRequest.mockImplementation((fn, ...args) => fn(...args));
});

describe('TripHistoryScreen', () => {
  it('shows the header copy', async () => {
    api.getDriverTrips.mockResolvedValue({ trips: [] });
    const { getByText } = render(<TripHistoryScreen />);
    expect(getByText('Trips')).toBeTruthy();
    expect(getByText('Your completed journeys')).toBeTruthy();
    await waitFor(() => expect(api.getDriverTrips).toHaveBeenCalled());
  });

  it('renders trip rows with route and date', async () => {
    api.getDriverTrips.mockResolvedValue({
      trips: [
        {
          _id: 't1',
          routeId: { source: 'Colombo', destination: 'Galle' },
          journeyDate: '2026-01-01T00:00:00.000Z',
          startTime: '2026-01-01T08:30:00.000Z',
        },
      ],
    });
    const { findByText } = render(<TripHistoryScreen />);
    expect(await findByText('Colombo → Galle')).toBeTruthy();
  });

  it('shows no money or payment status on a trip row', async () => {
    api.getDriverTrips.mockResolvedValue({
      trips: [
        {
          _id: 't1',
          routeId: { source: 'Colombo', destination: 'Galle' },
          journeyDate: '2026-01-01T00:00:00.000Z',
          // Stray fields from legacy records must never be rendered.
          netEarnings: 450,
          paymentStatus: 'PAID',
        },
      ],
    });
    const { findByText, queryByText } = render(<TripHistoryScreen />);
    await findByText('Colombo → Galle');
    expect(queryByText('Rs. 450.00')).toBeNull();
    expect(queryByText('PAID')).toBeNull();
  });

  it('shows the empty state when there are no trips', async () => {
    api.getDriverTrips.mockResolvedValue({ trips: [] });
    const { findByText } = render(<TripHistoryScreen />);
    expect(await findByText('No trips yet')).toBeTruthy();
    expect(await findByText('Your completed journeys will show up here.')).toBeTruthy();
  });

  it('shows the empty state when the fetch fails', async () => {
    api.getDriverTrips.mockRejectedValue(new Error('network down'));
    const { findByText } = render(<TripHistoryScreen />);
    expect(await findByText('No trips yet')).toBeTruthy();
  });

  it('reloads trips on pull-to-refresh', async () => {
    api.getDriverTrips.mockResolvedValue({ trips: [] });
    const { findByText, UNSAFE_getByType } = render(<TripHistoryScreen />);
    await findByText('No trips yet');

    fireEvent(UNSAFE_getByType(RefreshControl), 'refresh');

    await waitFor(() => expect(api.getDriverTrips).toHaveBeenCalledTimes(2));
  });
});
