import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import VehicleCard from '../VehicleCard';

describe('VehicleCard', () => {
  it('renders vehicle details when a vehicle is assigned', () => {
    const { getByText } = render(
      <VehicleCard
        vehicle={{ vehicleName: 'Shuttle 1', registrationNumber: 'ABC-123', seatCapacity: 20 }}
        onRegisterPress={jest.fn()}
      />
    );
    expect(getByText('Shuttle 1')).toBeTruthy();
    expect(getByText('ABC-123 · 20 seats')).toBeTruthy();
  });

  it('includes the route name in the sub-line when present', () => {
    const { getByText } = render(
      <VehicleCard
        vehicle={{ vehicleName: 'Shuttle 1', registrationNumber: 'ABC-123', seatCapacity: 20, routeName: 'Campus Loop' }}
        onRegisterPress={jest.fn()}
      />
    );
    expect(getByText('ABC-123 · 20 seats · Campus Loop')).toBeTruthy();
  });

  it('shows a fallback registration label when missing', () => {
    const { getByText } = render(
      <VehicleCard vehicle={{ vehicleName: 'Shuttle 1' }} onRegisterPress={jest.fn()} />
    );
    expect(getByText('No registration · 0 seats')).toBeTruthy();
  });

  it('renders the no-vehicle EmptyState and fires onRegisterPress from its action', () => {
    const onRegisterPress = jest.fn();
    const { getByText } = render(<VehicleCard vehicle={null} onRegisterPress={onRegisterPress} />);

    expect(getByText('No vehicle yet')).toBeTruthy();
    expect(getByText('Add your vehicle so riders can find it')).toBeTruthy();
    fireEvent.press(getByText('Add my vehicle'));
    expect(onRegisterPress).toHaveBeenCalledTimes(1);
  });
});
