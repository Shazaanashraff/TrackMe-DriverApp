import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import EnrollmentKeyCard from '../EnrollmentKeyCard';

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(true),
}));

const KEY = 'TMD-QMCZ-9NL2-TJNQ';

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as never);
});

describe('EnrollmentKeyCard', () => {
  it('masks the key until it is asked for', () => {
    // A credential should not be sitting in the open on a screen the driver
    // holds up in public.
    const { getByTestId, queryByTestId, getByText } = render(<EnrollmentKeyCard enrollmentKey={KEY} />);
    // Nothing of the key is rendered at all while it is covered, and the field
    // says what it is rather than standing in for the value.
    expect(queryByTestId('enrollment-key-value')).toBeNull();
    expect(getByTestId('enrollment-key-mask')).toBeTruthy();
    expect(getByText('Tap to reveal')).toBeTruthy();
  });

  it('reveals the key on the toggle and hides it again', () => {
    const { getByTestId, queryByTestId } = render(<EnrollmentKeyCard enrollmentKey={KEY} />);
    const toggle = getByTestId('toggle-enrollment-key');

    fireEvent.press(toggle);
    expect(getByTestId('enrollment-key-value').props.accessibilityLabel).toBe(KEY);

    fireEvent.press(toggle);
    expect(queryByTestId('enrollment-key-value')).toBeNull();
  });

  it('re-hides a revealed key on its own', () => {
    // Left revealed, the key stays readable to whoever next looks at the phone.
    jest.useFakeTimers();
    const { getByTestId, queryByTestId } = render(<EnrollmentKeyCard enrollmentKey={KEY} />);

    fireEvent.press(getByTestId('toggle-enrollment-key'));
    expect(getByTestId('enrollment-key-value').props.accessibilityLabel).toBe(KEY);

    act(() => { jest.advanceTimersByTime(21000); });
    expect(queryByTestId('enrollment-key-value')).toBeNull();
    jest.useRealTimers();
  });

  it('names the toggle by what it will do', () => {
    const { getByLabelText } = render(<EnrollmentKeyCard enrollmentKey={KEY} />);
    fireEvent.press(getByLabelText('Show enrollment key'));
    expect(getByLabelText('Hide enrollment key')).toBeTruthy();
  });

  it('copies the real key while it is still masked on screen', async () => {
    // The driver can hand the key over without ever putting it on display.
    const { getByTestId, queryByTestId } = render(<EnrollmentKeyCard enrollmentKey={KEY} />);

    fireEvent.press(getByTestId('copy-enrollment-key'));
    await waitFor(() => expect(Clipboard.setStringAsync).toHaveBeenCalledWith(KEY));
    expect(queryByTestId('enrollment-key-value')).toBeNull();
  });

  it('copies the key and says so, then offers the action again', async () => {
    jest.useFakeTimers();
    const { getByTestId, getByText } = render(<EnrollmentKeyCard enrollmentKey={KEY} />);

    fireEvent.press(getByTestId('copy-enrollment-key'));
    await waitFor(() => expect(Clipboard.setStringAsync).toHaveBeenCalledWith(KEY));
    await waitFor(() => expect(getByText('Copied')).toBeTruthy());

    // The confirmation is temporary; a button stuck on "Copied" stops naming
    // what it does.
    act(() => { jest.advanceTimersByTime(2500); });
    await waitFor(() => expect(getByText('Copy')).toBeTruthy());
    jest.useRealTimers();
  });

  it('shares the key with a message a passenger can act on', async () => {
    const { getByTestId } = render(<EnrollmentKeyCard enrollmentKey={KEY} />);
    fireEvent.press(getByTestId('share-enrollment-key'));

    await waitFor(() => expect(Share.share).toHaveBeenCalled());
    const { message } = (Share.share as jest.Mock).mock.calls[0][0];
    expect(message).toContain(KEY);
  });

  it('survives Share being unavailable or dismissed', async () => {
    (Share.share as jest.Mock).mockRejectedValueOnce(new Error('unavailable'));
    const { getByTestId } = render(<EnrollmentKeyCard enrollmentKey={KEY} />);

    // An unhandled rejection here would surface as a redbox over a screen whose
    // key is on display and copyable anyway.
    fireEvent.press(getByTestId('share-enrollment-key'));
    await waitFor(() => expect(Share.share).toHaveBeenCalled());
    expect(getByTestId('enrollment-key-mask')).toBeTruthy();
  });

  it('drops the copied confirmation when the key is rotated underneath it', async () => {
    const { getByTestId, getByText, rerender } = render(<EnrollmentKeyCard enrollmentKey={KEY} />);
    fireEvent.press(getByTestId('copy-enrollment-key'));
    await waitFor(() => expect(getByText('Copied')).toBeTruthy());

    // What sits on the clipboard is the old key, so still claiming "Copied"
    // next to a new one would be a lie.
    rerender(<EnrollmentKeyCard enrollmentKey="TMD-P44B-X3RF-YGNX" />);
    await waitFor(() => expect(getByText('Copy')).toBeTruthy());
  });

  it('re-masks when the key is rotated while revealed', async () => {
    // Reveal is a decision about one key; a replacement has not been consented
    // to and should not inherit it.
    const { getByTestId, queryByTestId, rerender } = render(<EnrollmentKeyCard enrollmentKey={KEY} />);
    fireEvent.press(getByTestId('toggle-enrollment-key'));
    expect(getByTestId('enrollment-key-value').props.accessibilityLabel).toBe(KEY);

    const rotated = 'TMD-P44B-X3RF-YGNX';
    rerender(<EnrollmentKeyCard enrollmentKey={rotated} />);
    await waitFor(() =>
      expect(queryByTestId('enrollment-key-value')).toBeNull()
    );
  });

  it('offers a retry instead of a blank card when the key will not load', () => {
    const onRetry = jest.fn();
    const { getByText, queryByTestId } = render(<EnrollmentKeyCard error onRetry={onRetry} />);

    expect(queryByTestId('enrollment-key-value')).toBeNull();
    fireEvent.press(getByText('Try again'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('shows no key or actions while it is still loading', () => {
    const { queryByTestId } = render(<EnrollmentKeyCard loading />);
    expect(queryByTestId('enrollment-key-value')).toBeNull();
    expect(queryByTestId('copy-enrollment-key')).toBeNull();
  });
});
