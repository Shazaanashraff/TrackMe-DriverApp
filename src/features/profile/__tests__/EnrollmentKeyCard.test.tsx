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
  it('shows the key so it can be read aloud or typed', () => {
    const { getByTestId } = render(<EnrollmentKeyCard enrollmentKey={KEY} />);
    expect(getByTestId('enrollment-key-value').props.children).toBe(KEY);
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
    expect(getByTestId('enrollment-key-value')).toBeTruthy();
  });

  it('says approval is needed only when the driver is private', () => {
    const gated = render(<EnrollmentKeyCard enrollmentKey={KEY} isPrivate />);
    expect(gated.getByText(/approve each request/i)).toBeTruthy();

    const open = render(<EnrollmentKeyCard enrollmentKey={KEY} isPrivate={false} />);
    expect(open.getByText(/enrolled straight away/i)).toBeTruthy();
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
