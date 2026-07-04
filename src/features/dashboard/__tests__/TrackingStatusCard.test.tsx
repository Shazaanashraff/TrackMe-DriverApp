import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import TrackingStatusCard from '../TrackingStatusCard';

describe('TrackingStatusCard', () => {
  it('shows "Standby Mode" when idle and not connecting', () => {
    const { getByText } = render(
      <TrackingStatusCard status="idle" isReconnecting={false} connecting={false} lastFix={null} />
    );
    expect(getByText('Standby Mode')).toBeTruthy();
  });

  it('shows "Connecting to server..." when idle and the socket is connecting', () => {
    const { getByText } = render(
      <TrackingStatusCard status="idle" isReconnecting={false} connecting lastFix={null} />
    );
    expect(getByText('Connecting to server...')).toBeTruthy();
  });

  it('shows "Currently On Journey" while tracking', () => {
    const { getByText } = render(
      <TrackingStatusCard status="tracking" isReconnecting={false} connecting={false} lastFix={null} />
    );
    expect(getByText('Currently On Journey')).toBeTruthy();
  });

  it('renders the live coordinates when tracking with a lastFix', () => {
    const { getByText } = render(
      <TrackingStatusCard
        status="tracking"
        isReconnecting={false}
        connecting={false}
        lastFix={{ lat: 6.9271, lng: 79.8612 }}
      />
    );
    expect(getByText('6.92710, 79.86120')).toBeTruthy();
  });

  it('renders its children (e.g. the toggle button)', () => {
    const { getByText } = render(
      <TrackingStatusCard status="idle" isReconnecting={false} connecting={false} lastFix={null}>
        <Text>toggle-slot</Text>
      </TrackingStatusCard>
    );
    expect(getByText('toggle-slot')).toBeTruthy();
  });
});
