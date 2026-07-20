import React from 'react';
import { RefreshControl } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import TripHistoryScreen from '../TripHistoryScreen';
import api from '../../services/api';

jest.mock('../../services/api', () => ({
  getDriverEarningsHistory: jest.fn(),
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
    api.getDriverEarningsHistory.mockResolvedValue({ earnings: [] });
    const { getByText } = render(<TripHistoryScreen />);
    expect(getByText('Trips')).toBeTruthy();
    expect(getByText('Your completed journeys')).toBeTruthy();
    await waitFor(() => expect(api.getDriverEarningsHistory).toHaveBeenCalled());
  });

  it('renders trip rows with route, date, amount, and status', async () => {
    api.getDriverEarningsHistory.mockResolvedValue({
      earnings: [
        {
          _id: 't1',
          routeId: { source: 'Colombo', destination: 'Galle' },
          journeyDate: '2026-01-01T00:00:00.000Z',
          netEarnings: 450,
          paymentStatus: 'PAID',
        },
      ],
    });
    const { findByText, getByText } = render(<TripHistoryScreen />);
    expect(await findByText('Colombo → Galle')).toBeTruthy();
    expect(getByText('Rs. 450.00')).toBeTruthy();
    expect(getByText('PAID')).toBeTruthy();
  });

  it('shows the empty state when there are no trips', async () => {
    api.getDriverEarningsHistory.mockResolvedValue({ earnings: [] });
    const { findByText } = render(<TripHistoryScreen />);
    expect(await findByText('No trips yet')).toBeTruthy();
    expect(await findByText('Your completed journeys will show up here.')).toBeTruthy();
  });

  it('shows the empty state when the fetch fails', async () => {
    api.getDriverEarningsHistory.mockRejectedValue(new Error('network down'));
    const { findByText } = render(<TripHistoryScreen />);
    expect(await findByText('No trips yet')).toBeTruthy();
  });

  it('reloads trips on pull-to-refresh', async () => {
    api.getDriverEarningsHistory.mockResolvedValue({ earnings: [] });
    const { findByText, UNSAFE_getByType } = render(<TripHistoryScreen />);
    await findByText('No trips yet');

    fireEvent(UNSAFE_getByType(RefreshControl), 'refresh');

    await waitFor(() => expect(api.getDriverEarningsHistory).toHaveBeenCalledTimes(2));
  });
});
