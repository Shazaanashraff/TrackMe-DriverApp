import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { AccessibilityInfo } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import ConfirmSheet from '../ConfirmSheet';

describe('ConfirmSheet', () => {
  it('renders the title and message when visible', () => {
    const { getByText } = render(
      <ConfirmSheet
        visible
        title="End this journey?"
        message="Riders will stop seeing your vehicle."
        confirmLabel="End journey"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(getByText('End this journey?')).toBeTruthy();
    expect(getByText('Riders will stop seeing your vehicle.')).toBeTruthy();
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
        message="Riders will stop seeing your vehicle."
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
        message="Riders will stop seeing your vehicle."
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

describe('ConfirmSheet on an edge-to-edge Android screen', () => {
  // The suite above ends by restoring jest-expo's automock, which returns no
  // promise, so this block brings its own.
  let spy: jest.SpyInstance;
  beforeEach(() => {
    spy = jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
  });
  afterEach(() => spy.mockRestore());

  const sheet = (bottom: number) =>
    render(
      <SafeAreaInsetsContext.Provider value={{ top: 0, right: 0, bottom, left: 0 }}>
        <ConfirmSheet
          visible
          title="End this journey?"
          message="Riders will stop seeing your vehicle."
          confirmLabel="End journey"
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      </SafeAreaInsetsContext.Provider>
    ).getByTestId('confirm-sheet');

  it('lifts its buttons above the back/home bar', () => {
    expect(StyleSheet.flatten(sheet(48).props.style).paddingBottom).toBe(20 + 48);
  });

  it('keeps its usual bottom spacing when there is no bar', () => {
    expect(StyleSheet.flatten(sheet(0).props.style).paddingBottom).toBe(32);
  });
});
