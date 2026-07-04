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
  it('renders history items', () => {
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
  });

  it('fires onRequestPayout when a pending item is pressed', () => {
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

    fireEvent.press(getByText('Request Payout'));
    expect(onRequestPayout).toHaveBeenCalledWith(item);
  });

  it('shows the empty state when history is empty', () => {
    const { getByText } = render(<EarningsHistoryList {...baseProps} history={[]} />);
    expect(getByText('No History Yet')).toBeTruthy();
  });

  it('shows a loading message while loading', () => {
    const { getByText } = render(<EarningsHistoryList {...baseProps} history={[]} isLoading />);
    expect(getByText('Loading history…')).toBeTruthy();
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
    fireEvent.press(getByText('Try again'));
    expect(onRetry).toHaveBeenCalled();
  });
});
