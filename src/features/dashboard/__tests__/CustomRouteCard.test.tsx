import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CustomRouteCard from '../CustomRouteCard';

const base = {
  status: 'RECORDING' as const,
  acceptedRuns: 2,
  requiredRuns: 5,
  onDuty: false,
  distanceMeters: 0,
  stopCount: 0,
  onAddStop: jest.fn(),
  onDiscard: jest.fn(),
};

describe('CustomRouteCard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows nothing for a route that is already live', () => {
    const { queryByTestId } = render(<CustomRouteCard {...base} status="ACTIVE" />);
    expect(queryByTestId('custom-route-card')).toBeNull();
  });

  it('shows which ride the driver is on', () => {
    const { getByTestId } = render(<CustomRouteCard {...base} />);
    expect(getByTestId('custom-route-progress').props.children.join('')).toBe('Ride 3 of 5');
  });

  it('never counts past the last ride', () => {
    const { getByTestId } = render(<CustomRouteCard {...base} acceptedRuns={5} />);
    expect(getByTestId('custom-route-progress').props.children.join('')).toBe('Ride 5 of 5');
  });

  it('draws one pip per ride, filled for the rides already recorded', () => {
    const { getByTestId } = render(<CustomRouteCard {...base} acceptedRuns={2} />);
    for (let i = 0; i < 5; i += 1) expect(getByTestId(`custom-route-pip-${i}`)).toBeTruthy();
    const done = (i: number) => [getByTestId(`custom-route-pip-${i}`).props.style].flat(Infinity)
      .some((s: { backgroundColor?: string } | false) => s && s.backgroundColor === '#10B981');
    expect([0, 1, 2, 3, 4].map(done)).toEqual([true, true, false, false, false]);
  });

  it('off duty, explains what to do and offers no recording controls', () => {
    const { getByText, queryByTestId } = render(<CustomRouteCard {...base} onDuty={false} />);
    expect(getByText(/go on duty and drive your normal route/i)).toBeTruthy();
    expect(queryByTestId('add-stop-button')).toBeNull();
    expect(queryByTestId('discard-ride-button')).toBeNull();
  });

  it('on duty, shows live distance and stops and the controls', () => {
    const { getByTestId } = render(
      <CustomRouteCard {...base} onDuty distanceMeters={1840} stopCount={1} />,
    );
    expect(getByTestId('custom-route-distance').props.children.join('')).toBe('1.8 km recorded');
    expect(getByTestId('custom-route-stops').props.children.join('')).toBe('1 stop');
    expect(getByTestId('add-stop-button')).toBeTruthy();
  });

  it('shows short distances in metres and pluralises stops', () => {
    const { getByTestId } = render(<CustomRouteCard {...base} onDuty distanceMeters={240} stopCount={3} />);
    expect(getByTestId('custom-route-distance').props.children.join('')).toBe('240 m recorded');
    expect(getByTestId('custom-route-stops').props.children.join('')).toBe('3 stops');
  });

  it('calls back when Add stop and Discard are pressed', () => {
    const { getByTestId } = render(<CustomRouteCard {...base} onDuty />);
    fireEvent.press(getByTestId('add-stop-button'));
    expect(base.onAddStop).toHaveBeenCalledTimes(1);
    fireEvent.press(getByTestId('discard-ride-button'));
    expect(base.onDiscard).toHaveBeenCalledTimes(1);
  });

  it('shows the feedback line after a tap', () => {
    const { getByTestId } = render(<CustomRouteCard {...base} onDuty notice="Stop added" />);
    expect(getByTestId('custom-route-notice').props.children).toBe('Stop added');
  });

  it('once the rides are in, tells the driver the route is with the manager', () => {
    const { getByText, queryByTestId } = render(
      <CustomRouteCard {...base} status="PENDING_REVIEW" acceptedRuns={5} onDuty />,
    );
    expect(getByText('Route sent to your manager')).toBeTruthy();
    expect(queryByTestId('add-stop-button')).toBeNull();
  });

  it('shows the name of the stop just added so the driver can see it was kept', () => {
    const { getByTestId, queryByTestId, rerender } = render(
      <CustomRouteCard {...base} onDuty stopCount={1} lastStopName="Nimal's house" />,
    );
    expect(getByTestId('custom-route-last-stop').props.children.join('')).toBe("Last stop: Nimal's house");
    rerender(<CustomRouteCard {...base} onDuty stopCount={1} lastStopName="" />);
    expect(queryByTestId('custom-route-last-stop')).toBeNull();
  });

  it('tells a driver who is off duty to name stops as they go', () => {
    const { getByText } = render(<CustomRouteCard {...base} />);
    expect(getByText(/give it a name, like a student's house/i)).toBeTruthy();
  });
});
