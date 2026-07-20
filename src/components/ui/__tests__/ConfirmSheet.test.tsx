import React from 'react';
import { AccessibilityInfo } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import ConfirmSheet from '../ConfirmSheet';

describe('ConfirmSheet', () => {
  it('renders the title and message when visible', () => {
    const { getByText } = render(
      <ConfirmSheet
        visible
        title="End this journey?"
        message="Riders will stop seeing your bus."
        confirmLabel="End journey"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(getByText('End this journey?')).toBeTruthy();
    expect(getByText('Riders will stop seeing your bus.')).toBeTruthy();
  });

  it('fires onConfirm when the confirm button is pressed', () => {
    const onConfirm = jest.fn();
    const { getByText } = render(
      <ConfirmSheet
        visible
        title="Log out?"
        message="You'll stop broadcasting and need to sign in again."
        confirmLabel="Log out"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />
    );
    fireEvent.press(getByText('Log out'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('fires onCancel when the cancel button is pressed', () => {
    const onCancel = jest.fn();
    const { getByText } = render(
      <ConfirmSheet
        visible
        title="Log out?"
        message="You'll stop broadcasting and need to sign in again."
        confirmLabel="Log out"
        onConfirm={() => {}}
        onCancel={onCancel}
      />
    );
    fireEvent.press(getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('defaults the cancel button label to "Cancel"', () => {
    const { getByText } = render(
      <ConfirmSheet
        visible
        title="End this journey?"
        message="Riders will stop seeing your bus."
        confirmLabel="End journey"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(getByText('Cancel')).toBeTruthy();
  });

  // Last in the file: mockRestore() here reverts to jest-expo's automock (a
  // plain jest.fn() with no resolved value), which breaks any test after it.
  it('skips the spring animation and snaps into place when reduce-motion is enabled', async () => {
    const spy = jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const { getByText } = render(
      <ConfirmSheet
        visible
        title="End this journey?"
        message="Riders will stop seeing your bus."
        confirmLabel="End journey"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    await Promise.resolve();
    expect(spy).toHaveBeenCalled();
    expect(getByText('End this journey?')).toBeTruthy();
    spy.mockRestore();
  });
});
