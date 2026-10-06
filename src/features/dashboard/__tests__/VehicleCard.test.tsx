import React from 'react';
import { render } from '@testing-library/react-native';
import { Ionicons } from '@expo/vector-icons';
import VehicleCard from '../VehicleCard';

describe('VehicleCard', () => {
  it('names the vehicle without its internal ID or a seat count', () => {
    const { getByText, queryByText } = render(
      <VehicleCard
        vehicle={{ vehicleName: 'Shuttle 1' }}
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
      />
    );
    expect(getByText('Campus Loop')).toBeTruthy();
  });

  it('renders a real bus glyph rather than the missing-icon placeholder', () => {
    const { UNSAFE_getByType } = render(
      <VehicleCard vehicle={{ vehicleName: 'Shuttle 1' }} />
    );
    // "vehicle" is not an Ionicons name and silently rendered "?" on screen.
    expect(UNSAFE_getByType(Ionicons).props.name).toBe('bus');
  });

  // The pill briefly read "Approval required"/"Open enrolment" to avoid colliding
  // with serviceType, then was deliberately reverted to Public/Private. These
  // assert the wording that actually ships. The behaviour below is the point.
  it('reads Private when the driver gates enrolment, Public otherwise', () => {
    const gated = render(
      <VehicleCard
        vehicle={{ vehicleName: 'Shuttle 1', driverId: { isPrivate: true } }}
      />
    );
    expect(gated.getByText('Private')).toBeTruthy();
    expect(gated.queryByText('Public')).toBeNull();

    const open = render(
      <VehicleCard
        vehicle={{ vehicleName: 'Shuttle 1', driverId: { isPrivate: false } }}
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
      />
    );
    expect(asId.getByText('Public')).toBeTruthy();
  });

  it('shows no privacy pill when there is no vehicle', () => {
    const { queryByTestId } = render(<VehicleCard vehicle={null} />);
    expect(queryByTestId('vehicle-privacy-pill')).toBeNull();
  });

  // The manager assigns vehicles in WebAdmin; the driver app has no form to send
  // them to, so the empty state says who to ask and is not a button.
  it('renders the no-vehicle empty state pointing the driver to their manager', () => {
    const { getByText, getByTestId } = render(<VehicleCard vehicle={null} />);

    expect(getByText('No vehicle yet')).toBeTruthy();
    expect(getByText('Ask your manager to assign one')).toBeTruthy();
    expect(getByTestId('vehicle-card-empty').props.accessibilityRole).toBeUndefined();
    expect(getByTestId('vehicle-card-empty').props.onPress).toBeUndefined();
  });
});
