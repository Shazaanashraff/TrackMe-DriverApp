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

  it('reads Private when the driver gates enrolment, Public otherwise', () => {
    const gated = render(
      <VehicleCard
        vehicle={{ vehicleName: 'Shuttle 1', driverId: { isPrivate: true } }}
        onRegisterPress={jest.fn()}
      />
    );
    expect(gated.getByText('Private')).toBeTruthy();
    expect(gated.queryByText('Public')).toBeNull();

    const open = render(
      <VehicleCard
        vehicle={{ vehicleName: 'Shuttle 1', driverId: { isPrivate: false } }}
        onRegisterPress={jest.fn()}
      />
    );
    expect(open.getByText('Public')).toBeTruthy();
    expect(open.queryByText('Private')).toBeNull();
  });

  it('reads Public when the driver is not populated, rather than guessing Private', () => {
    // my-vehicle can hand back an unpopulated ObjectId string. Defaulting to
    // Private there would tell a public driver their key is gated.
    const asId = render(
      <VehicleCard
        vehicle={{ vehicleName: 'Shuttle 1', driverId: '65f0aa11bb22cc33dd44ee55' }}
        onRegisterPress={jest.fn()}
      />
    );
    expect(asId.getByText('Public')).toBeTruthy();
  });

  it('shows no privacy pill when there is no vehicle', () => {
    const { queryByTestId } = render(<VehicleCard vehicle={null} onRegisterPress={jest.fn()} />);
    expect(queryByTestId('vehicle-privacy-pill')).toBeNull();
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
