import React from 'react';
import { RefreshControl } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TripHistoryScreen from '../TripHistoryScreen';
import api from '../../services/api';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    getDriverTrips: jest.fn(),
  },
}));

jest.mock('../../context/AuthContext', () => ({
  __esModule: true,
  useAuth: () => ({ token: 'tok' }),
}));

function renderWithClient(ui) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('TripHistoryScreen', () => {
  it('shows the header copy', async () => {
    api.getDriverTrips.mockResolvedValue({ trips: [] });
    const { getByText } = renderWithClient(<TripHistoryScreen />);
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
    const { findByText } = renderWithClient(<TripHistoryScreen />);
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
    const { findByText, queryByText } = renderWithClient(<TripHistoryScreen />);
    await findByText('Colombo → Galle');
    expect(queryByText('Rs. 450.00')).toBeNull();
    expect(queryByText('PAID')).toBeNull();
  });

  it('shows the empty state when there are no trips', async () => {
    api.getDriverTrips.mockResolvedValue({ trips: [] });
    const { findByText } = renderWithClient(<TripHistoryScreen />);
    expect(await findByText('No trips yet')).toBeTruthy();
    expect(await findByText('Finish a journey and it will show up here.')).toBeTruthy();
  });

  it('shows the empty state when the fetch fails and nothing was ever cached', async () => {
    api.getDriverTrips.mockRejectedValue(new Error('network down'));
    const { findByText } = renderWithClient(<TripHistoryScreen />);
    expect(await findByText('No trips yet')).toBeTruthy();
  });

  it('reloads trips on pull-to-refresh', async () => {
    api.getDriverTrips.mockResolvedValue({ trips: [] });
    const { findByText, UNSAFE_getByType } = renderWithClient(<TripHistoryScreen />);
    await findByText('No trips yet');

    fireEvent(UNSAFE_getByType(RefreshControl), 'refresh');

    await waitFor(() => expect(api.getDriverTrips).toHaveBeenCalledTimes(2));
  });

  // Issue #15: the old useState/useEffect version called setTrips([]) on any
  // error, so a driver who lost connection mid-pull-to-refresh saw their trip
  // list vanish. The TanStack Query cache must keep serving the last-known
  // list when a background refresh fails.
  it('keeps showing previously loaded trips when a pull-to-refresh fails', async () => {
    api.getDriverTrips
      .mockResolvedValueOnce({
        trips: [
          {
            _id: 't1',
            routeId: { source: 'Colombo', destination: 'Galle' },
            journeyDate: '2026-01-01T00:00:00.000Z',
          },
        ],
      })
      .mockRejectedValueOnce(new Error('network down'));

    const { findByText, UNSAFE_getByType } = renderWithClient(<TripHistoryScreen />);
    await findByText('Colombo → Galle');

    fireEvent(UNSAFE_getByType(RefreshControl), 'refresh');

    await waitFor(() => expect(api.getDriverTrips).toHaveBeenCalledTimes(2));
    expect(await findByText('Colombo → Galle')).toBeTruthy();
  });
});
