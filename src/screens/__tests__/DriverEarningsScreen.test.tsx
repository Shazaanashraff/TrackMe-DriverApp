import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import DriverEarningsScreen from '../DriverEarningsScreen';

const mockRefetch = jest.fn().mockResolvedValue(undefined);
const mockMutate = jest.fn();

jest.mock('../../hooks/earnings', () => ({
  useEarningsStatsQuery: () => ({
    data: {
      today: { totalEarnings: 500, totalTrips: 2 },
      week: { totalEarnings: 2500, totalTrips: 10 },
      month: { totalEarnings: 9000, totalTrips: 40 },
      pending: { totalPending: 1200, count: 1 },
    },
    isLoading: false,
    refetch: mockRefetch,
  }),
  useEarningsHistoryQuery: () => ({
    data: {
      earnings: [
        {
          _id: 'e1',
          routeId: { source: 'Colombo', destination: 'Galle' },
          journeyDate: '2026-01-01T00:00:00.000Z',
          netEarnings: 300,
          paymentStatus: 'PENDING',
        },
      ],
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: mockRefetch,
  }),
  useDailyBreakdownQuery: () => ({
    data: { breakdown: [{ _id: '2026-01-01', trips: 2, passengers: 8, earnings: 300 }] },
    isLoading: false,
    isError: false,
    error: null,
    refetch: mockRefetch,
  }),
  useRequestPayout: () => ({
    mutate: mockMutate,
    isPending: false,
    isError: false,
    error: null,
  }),
}));

jest.mock('../../services/backendStatus', () => ({
  getBackendOnline: () => true,
  subscribeBackendStatus: () => () => {},
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('DriverEarningsScreen', () => {
  it('shows the monthly balance and Summary content by default', () => {
    const { getByText, getAllByText } = render(<DriverEarningsScreen />);
    expect(getByText("You've earned")).toBeTruthy();
    // Appears twice: the big balance display and the "This month" stat card.
    expect(getAllByText('Rs. 9000.00').length).toBe(2);
    expect(getByText('this month')).toBeTruthy();
    expect(getByText('Daily breakdown')).toBeTruthy();
  });

  it('switches to the History segment and shows history rows', () => {
    const { getByText, queryByText } = render(<DriverEarningsScreen />);
    fireEvent.press(getByText('History'));
    expect(getByText('Colombo → Galle')).toBeTruthy();
    expect(queryByText('Daily breakdown')).toBeNull();
  });

  it('runs the payout flow end to end from a history row', async () => {
    const { getByText, getByPlaceholderText } = render(<DriverEarningsScreen />);
    fireEvent.press(getByText('History'));
    fireEvent.press(getByText('Request payout'));

    expect(getByText('Rs. 300.00 will be sent to this account')).toBeTruthy();

    fireEvent.changeText(getByPlaceholderText('1234567890'), '100200300');
    fireEvent.changeText(getByPlaceholderText('Bank of Example'), 'Example Bank');
    fireEvent.changeText(getByPlaceholderText('ABCD0123456'), 'ABCD0123456');
    fireEvent.press(getByText('Submit'));

    await waitFor(() =>
      expect(mockMutate).toHaveBeenCalledWith(
        {
          earningId: 'e1',
          bankAccount: { accountNumber: '100200300', bankName: 'Example Bank', ifscCode: 'ABCD0123456' },
        },
        expect.any(Object)
      )
    );
  });
});
