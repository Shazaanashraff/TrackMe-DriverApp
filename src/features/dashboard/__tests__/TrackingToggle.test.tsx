import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TrackingToggle from '../TrackingToggle';

describe('TrackingToggle', () => {
  it('shows "Start Journey" and fires onStart when idle', () => {
    const onStart = jest.fn();
    const onStop = jest.fn();
    const { getByText, getByTestId } = render(
      <TrackingToggle isTracking={false} disabled={false} onStart={onStart} onStop={onStop} />
    );
    expect(getByText('Start Journey')).toBeTruthy();
    fireEvent.press(getByTestId('tracking-toggle'));
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStop).not.toHaveBeenCalled();
  });

  it('shows "End Journey" and fires onStop when tracking', () => {
    const onStart = jest.fn();
    const onStop = jest.fn();
    const { getByText, getByTestId } = render(
      <TrackingToggle isTracking disabled={false} onStart={onStart} onStop={onStop} />
    );
    expect(getByText('End Journey')).toBeTruthy();
    fireEvent.press(getByTestId('tracking-toggle'));
    expect(onStop).toHaveBeenCalledTimes(1);
    expect(onStart).not.toHaveBeenCalled();
  });

  it('is disabled when not tracking and disabled is true (no bus assigned)', () => {
    const { getByTestId } = render(
      <TrackingToggle isTracking={false} disabled onStart={jest.fn()} onStop={jest.fn()} />
    );
    expect(getByTestId('tracking-toggle').props.accessibilityState?.disabled).toBe(true);
  });

  it('is never disabled while tracking, even if disabled is true', () => {
    const { getByTestId } = render(
      <TrackingToggle isTracking disabled onStart={jest.fn()} onStop={jest.fn()} />
    );
    expect(getByTestId('tracking-toggle').props.accessibilityState?.disabled).toBe(false);
  });
});
