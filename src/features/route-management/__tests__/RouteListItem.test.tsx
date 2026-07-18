import React from 'react';
import { render } from '@testing-library/react-native';
import RouteListItem from '../RouteListItem';

describe('RouteListItem', () => {
  it('renders route details', () => {
    const { getByText } = render(
      <RouteListItem
        route={{
          routeId: 'R101',
          routeName: 'Express Way',
          source: 'Colombo',
          destination: 'Galle',
          distance: 120,
          estimatedTime: 90,
          fare: 250,
          isActive: true,
        }}
      />
    );

    expect(getByText('Express Way')).toBeTruthy();
    expect(getByText('R101')).toBeTruthy();
    expect(getByText('Colombo')).toBeTruthy();
    expect(getByText('Galle')).toBeTruthy();
    expect(getByText('ACTIVE')).toBeTruthy();
    expect(getByText('120 km')).toBeTruthy();
    expect(getByText('90 min')).toBeTruthy();
    expect(getByText('Rs. 250.00')).toBeTruthy();
  });

  it('shows INACTIVE when the route is not active', () => {
    const { getByText } = render(
      <RouteListItem
        route={{
          routeId: 'R102',
          routeName: 'Local Loop',
          source: 'A',
          destination: 'B',
          distance: 5,
          estimatedTime: 10,
          fare: 20,
          isActive: false,
        }}
      />
    );
    expect(getByText('INACTIVE')).toBeTruthy();
  });
});
