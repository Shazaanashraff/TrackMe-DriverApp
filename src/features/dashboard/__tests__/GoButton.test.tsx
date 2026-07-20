import React from 'react';
import { AccessibilityInfo } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import GoButton from '../GoButton';

describe('GoButton', () => {
  it('shows GO and labels itself "Go online" when off duty', () => {
    const { getByText, getByLabelText } = render(<GoButton isLive={false} onPress={jest.fn()} />);
    expect(getByText('GO')).toBeTruthy();
    expect(getByLabelText('Go online')).toBeTruthy();
  });

  it('shows END and labels itself "End journey" when live', () => {
    const { getByText, getByLabelText } = render(<GoButton isLive onPress={jest.fn()} />);
    expect(getByText('END')).toBeTruthy();
    expect(getByLabelText('End journey')).toBeTruthy();
  });

  it('fires onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByLabelText } = render(<GoButton isLive={false} onPress={onPress} />);
    fireEvent.press(getByLabelText('Go online'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByLabelText } = render(<GoButton isLive={false} disabled onPress={onPress} />);
    fireEvent.press(getByLabelText('Go online'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('exposes disabled and busy via accessibilityState', () => {
    const { getByLabelText, rerender } = render(
      <GoButton isLive={false} disabled busy onPress={jest.fn()} />
    );
    expect(getByLabelText('Go online').props.accessibilityState).toEqual({ disabled: true, busy: true });

    rerender(<GoButton isLive={false} onPress={jest.fn()} />);
    expect(getByLabelText('Go online').props.accessibilityState).toEqual({ disabled: false, busy: false });
  });

  it('only renders the idle pulse ring when off duty and enabled', () => {
    const { queryByTestId, rerender } = render(<GoButton isLive={false} onPress={jest.fn()} />);
    expect(queryByTestId('go-button-pulse')).toBeTruthy();

    rerender(<GoButton isLive onPress={jest.fn()} />);
    expect(queryByTestId('go-button-pulse')).toBeNull();

    rerender(<GoButton isLive={false} disabled onPress={jest.fn()} />);
    expect(queryByTestId('go-button-pulse')).toBeNull();
  });

  // Last in the file: mockRestore() here reverts to jest-expo's automock (a
  // plain jest.fn() with no resolved value), which breaks any test after it.
  it('checks reduce-motion before starting the idle pulse loop', async () => {
    const spy = jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const { queryByTestId } = render(<GoButton isLive={false} onPress={jest.fn()} />);
    await Promise.resolve();
    expect(spy).toHaveBeenCalled();
    // The ring view still renders (it's just not animating) — reduce-motion
    // means "skip the loop", not "hide the affordance".
    expect(queryByTestId('go-button-pulse')).toBeTruthy();
    spy.mockRestore();
  });
});
