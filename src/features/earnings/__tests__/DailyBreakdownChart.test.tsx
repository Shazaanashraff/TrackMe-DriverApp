import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import DailyBreakdownChart from '../DailyBreakdownChart';
import { AppError } from '../../../lib/errors';

const baseProps = {
  isLoading: false,
  isError: false,
  error: null,
  onRetry: jest.fn(),
};

describe('DailyBreakdownChart', () => {
  it('renders daily breakdown rows', () => {
    const { getByText } = render(
      <DailyBreakdownChart {...baseProps} breakdown={[{ _id: '2026-01-15', trips: 4, passengers: 20, earnings: 300 }]} />
    );
    expect(getByText('4 Trips • 20 Passengers')).toBeTruthy();
    expect(getByText('Rs. 300.00')).toBeTruthy();
  });

  it('shows the empty state when breakdown is empty', () => {
    const { getByText } = render(<DailyBreakdownChart {...baseProps} breakdown={[]} />);
    expect(getByText('No Breakdown Available')).toBeTruthy();
  });

  it('shows an error state with retry when isError', () => {
    const onRetry = jest.fn();
    const { getByText } = render(
      <DailyBreakdownChart {...baseProps} breakdown={[]} isError error={new AppError('http', 'boom')} onRetry={onRetry} />
    );
    fireEvent.press(getByText('Try again'));
    expect(onRetry).toHaveBeenCalled();
  });
});
