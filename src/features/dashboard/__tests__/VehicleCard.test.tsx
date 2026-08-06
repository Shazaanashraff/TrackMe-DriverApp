import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Ionicons } from '@expo/vector-icons';
import VehicleCard from '../VehicleCard';

describe('VehicleCard', () => {
  it('names the vehicle without its internal ID or a seat count', () => {
    const { getByText, queryByText } = render(
      <VehicleCard
        vehicle={{ vehicleName: 'Shuttle 1' }}
        onRegisterPress={jest.fn()}
      />
    );
    expect(getByText('Shuttle 1')).toBeTruthy();
    expect(queryByText(/seats/i)).toBeNull();
    expect(queryByText(/ABC-123/)).toBeNull();
  });

  it('shows the route as the sub-line when there is one', () => {
    const { getByText } = render(
      <VehicleCard
        vehicle={{ vehicleName: 'Shuttle 1', routeName: 'Campus Loop' }}
        onRegisterPress={jest.fn()}
      />
    );
    expect(getByText('Campus Loop')).toBeTruthy();
  });

  it('renders a real bus glyph rather than the missing-icon placeholder', () => {
    const { UNSAFE_getByType } = render(
      <VehicleCard vehicle={{ vehicleName: 'Shuttle 1' }} onRegisterPress={jest.fn()} />
    );
    // "vehicle" is not an Ionicons name and silently rendered "?" on screen.
    expect(UNSAFE_getByType(Ionicons).props.name).toBe('bus');
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
