import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AssignedBusCard from '../AssignedBusCard';

describe('AssignedBusCard', () => {
  it('renders bus details when a bus is assigned', () => {
    const { getByText } = render(
      <AssignedBusCard
        bus={{ busName: 'Shuttle 1', registrationNumber: 'ABC-123', seatCapacity: 20 }}
        onRegisterPress={jest.fn()}
      />
    );
    expect(getByText('Shuttle 1')).toBeTruthy();
    expect(getByText('ABC-123')).toBeTruthy();
    expect(getByText('20 Seats')).toBeTruthy();
  });

  it('shows a fallback registration label when missing', () => {
    const { getByText } = render(
      <AssignedBusCard bus={{ busName: 'Shuttle 1' }} onRegisterPress={jest.fn()} />
    );
    expect(getByText('No Registration')).toBeTruthy();
  });

  it('renders an empty state and fires onRegisterPress when no bus is assigned', () => {
    const onRegisterPress = jest.fn();
    const { getByText } = render(<AssignedBusCard bus={null} onRegisterPress={onRegisterPress} />);

    const prompt = getByText('No bus assigned. Tap to register.');
    expect(prompt).toBeTruthy();
    fireEvent.press(prompt);
    expect(onRegisterPress).toHaveBeenCalledTimes(1);
  });
});
