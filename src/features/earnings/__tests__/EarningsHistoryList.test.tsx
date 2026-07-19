import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import EarningsHistoryList from '../EarningsHistoryList';
import { AppError } from '../../../lib/errors';

const baseProps = {
  isLoading: false,
  isError: false,
  error: null,
  onRetry: jest.fn(),
  onRequestPayout: jest.fn(),
};

describe('EarningsHistoryList', () => {
  it('renders history items with a StatusPill', () => {
    const { getByText } = render(
      <EarningsHistoryList
        {...baseProps}
        history={[
          {
            _id: 'abc123def',
            routeId: { source: 'Colombo', destination: 'Galle' },
            journeyDate: '2026-01-01T00:00:00.000Z',
            netEarnings: 450,
            paymentStatus: 'PAID',
          },
        ]}
      />
    );
    expect(getByText('Colombo → Galle')).toBeTruthy();
    expect(getByText('+Rs. 450.00')).toBeTruthy();
    expect(getByText('PAID')).toBeTruthy();
  });

  it('fires onRequestPayout when a pending item\'s payout link is pressed', () => {
    const onRequestPayout = jest.fn();
    const item = {
      _id: 'e1',
      routeId: { source: 'A', destination: 'B' },
      journeyDate: '2026-01-01T00:00:00.000Z',
      netEarnings: 100,
      paymentStatus: 'PENDING' as const,
    };
    const { getByText } = render(
      <EarningsHistoryList {...baseProps} history={[item]} onRequestPayout={onRequestPayout} />
    );

    fireEvent.press(getByText('Request payout'));
    expect(onRequestPayout).toHaveBeenCalledWith(item);
  });

  it('does not show a payout link for non-pending items', () => {
    const { queryByText } = render(
      <EarningsHistoryList
        {...baseProps}
        history={[
          {
            _id: 'e2',
            routeId: { source: 'A', destination: 'B' },
            journeyDate: '2026-01-01T00:00:00.000Z',
            netEarnings: 100,
            paymentStatus: 'PAID',
          },
        ]}
      />
    );
    expect(queryByText('Request payout')).toBeNull();
  });

  it('shows the empty state when history is empty', () => {
    const { getByText } = render(<EarningsHistoryList {...baseProps} history={[]} />);
    expect(getByText('No history yet')).toBeTruthy();
  });

  it('shows skeletons while loading instead of rows', () => {
    const { queryByText } = render(<EarningsHistoryList {...baseProps} history={[]} isLoading />);
    expect(queryByText('No history yet')).toBeNull();
  });

  it('shows an error state with retry when isError', () => {
    const onRetry = jest.fn();
    const { getByText } = render(
      <EarningsHistoryList
        {...baseProps}
        history={[]}
        isError
        error={new AppError('http', 'Server exploded')}
        onRetry={onRetry}
      />
    );
    expect(getByText("Couldn't load. Pull down to try again.")).toBeTruthy();
    fireEvent.press(getByText('Try again'));
    expect(onRetry).toHaveBeenCalled();
  });
});
