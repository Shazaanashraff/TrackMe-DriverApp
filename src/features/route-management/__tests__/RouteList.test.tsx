import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import RouteList from '../RouteList';
import { AppError } from '../../../lib/errors';

const baseProps = {
  isError: false,
  error: null,
  onRetry: jest.fn(),
  refreshing: false,
  onRefresh: jest.fn(),
  formSlot: <Text>form-slot</Text>,
};

describe('RouteList', () => {
  it('renders routes with a count badge', () => {
    const { getByText } = render(
      <RouteList
        {...baseProps}
        routes={[
          { routeId: 'R1', routeName: 'Route One', source: 'A', destination: 'B', distance: 1, estimatedTime: 5, fare: 10 },
        ]}
      />
    );
    expect(getByText('Route One')).toBeTruthy();
    expect(getByText('1')).toBeTruthy();
    expect(getByText('form-slot')).toBeTruthy();
  });

  it('shows the empty state when there are no routes', () => {
    const { getByText } = render(<RouteList {...baseProps} routes={[]} />);
    expect(getByText('No routes found. Start by creating one!')).toBeTruthy();
  });

  it('shows an error state with retry when isError', () => {
    const onRetry = jest.fn();
    const { getByText } = render(
      <RouteList {...baseProps} routes={[]} isError error={new AppError('http', 'boom')} onRetry={onRetry} />
    );
    fireEvent.press(getByText('Try again'));
    expect(onRetry).toHaveBeenCalled();
  });
});
