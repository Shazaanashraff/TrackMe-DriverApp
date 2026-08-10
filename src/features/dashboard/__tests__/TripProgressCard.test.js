import React from 'react';
import { render } from '@testing-library/react-native';
import TripProgressCard from '../TripProgressCard';

// The card reads route geometry from useRouteDetailsQuery; stub it so we can drive
// the loaded / not-found states. computeTripProgress runs for real (it's pure).

let mockRouteData;

jest.mock('../../../hooks/route', () => ({
  useRouteDetailsQuery: () => ({ data: mockRouteData }),
}));

const route = {
  routeId: 'SL-1/3',
  source: 'Avissawella',
  destination: 'Pettah',
  distance: 100,
  stops: [
    { lat: 0, lng: 0, order: 1 },
    { lat: 0, lng: 1, order: 2 },
  ],
};

beforeEach(() => {
  mockRouteData = undefined;
});

describe('TripProgressCard', () => {
  it('renders nothing when the route has not resolved', () => {
    mockRouteData = undefined;
    const { queryByTestId } = render(
      <TripProgressCard routeId="SL-1/3" fix={{ lat: 0, lng: 0.5, timestamp: 0 }} isTracking />
    );
    expect(queryByTestId('trip-progress-card')).toBeNull();
  });

  it('shows live covered/remaining while tracking with a fix', () => {
    mockRouteData = route;
    const { getByTestId } = render(
      <TripProgressCard routeId="SL-1/3" fix={{ lat: 0, lng: 0.5, timestamp: 0 }} isTracking />
    );
    expect(getByTestId('trip-progress-card')).toBeTruthy();
    expect(getByTestId('trip-progress-covered').props.children.join('')).toContain('50.0 km');
    // The live position marker rides the bar while tracking.
    expect(getByTestId('trip-progress-marker')).toBeTruthy();
  });

  it('shows an idle hint when the route is known but not tracking', () => {
    mockRouteData = route;
    const { getByTestId, queryByTestId } = render(
      <TripProgressCard routeId="SL-1/3" fix={null} isTracking={false} />
    );
    expect(getByTestId('trip-progress-idle')).toBeTruthy();
    expect(queryByTestId('trip-progress-covered')).toBeNull();
    // No live marker when there's no fix to place it.
    expect(queryByTestId('trip-progress-marker')).toBeNull();
  });
});
