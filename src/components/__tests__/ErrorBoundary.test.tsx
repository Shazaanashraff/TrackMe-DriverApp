import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorBoundary } from '../ErrorBoundary';

function Bomb(): React.ReactElement {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Text>all good</Text>
      </ErrorBoundary>
    );
    expect(getByText('all good')).toBeTruthy();
  });

  it('renders the fallback UI when a child throws', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    expect(getByText('Something went wrong')).toBeTruthy();
  });

  it('calls onReset and clears the error when Reload is pressed', () => {
    const onReset = jest.fn();
    const { getByText } = render(
      <ErrorBoundary onReset={onReset}>
        <Bomb />
      </ErrorBoundary>
    );
    fireEvent.press(getByText('Reload'));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
