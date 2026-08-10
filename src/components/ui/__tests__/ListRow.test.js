import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ListRow from '../ListRow';

describe('ListRow', () => {
  it('renders title and subtitle', () => {
    const { getByText } = render(<ListRow title="Your vehicle" subtitle="2 seats" icon="bus-outline" />);
    expect(getByText('Your vehicle')).toBeTruthy();
    expect(getByText('2 seats')).toBeTruthy();
  });

  it('renders an optional trailing value', () => {
    const { getByText } = render(<ListRow title="Fare" value="Rs. 150.00" />);
    expect(getByText('Rs. 150.00')).toBeTruthy();
  });

  it('fires onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(<ListRow title="Log out" onPress={onPress} />);
    fireEvent.press(getByText('Log out'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is not pressable without onPress', () => {
    const { queryByRole } = render(<ListRow title="Static row" />);
    expect(queryByRole('button')).toBeNull();
  });
});
