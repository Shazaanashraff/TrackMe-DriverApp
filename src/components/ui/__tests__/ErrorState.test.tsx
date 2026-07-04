import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ErrorState from '../ErrorState';
import { AppError } from '../../../lib/errors';

describe('ErrorState', () => {
  it('renders the userMessage for the given error', () => {
    const { getByText } = render(<ErrorState error={new AppError('offline', 'No network')} />);
    expect(getByText(/offline/i)).toBeTruthy();
  });

  it('fires onRetry when the retry button is pressed', () => {
    const onRetry = jest.fn();
    const { getByText } = render(
      <ErrorState error={new AppError('unknown', 'oops')} onRetry={onRetry} />
    );
    fireEvent.press(getByText('Try again'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render a retry button when onRetry is omitted', () => {
    const { queryByText } = render(<ErrorState error={new AppError('unknown', 'oops')} />);
    expect(queryByText('Try again')).toBeNull();
  });

  it('renders the compact variant', () => {
    const { getByText } = render(
      <ErrorState error={new AppError('tracking', 'ack failed')} variant="compact" />
    );
    expect(getByText(/tracking/i)).toBeTruthy();
  });
});
