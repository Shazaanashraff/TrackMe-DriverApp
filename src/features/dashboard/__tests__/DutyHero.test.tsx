import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import DutyHero from '../DutyHero';

const baseProps = {
  firstName: 'Nadia',
  vehicleName: 'Shuttle 1',
  status: 'idle' as const,
  isReconnecting: false,
  connecting: false,
  permission: 'granted' as const,
  lastFix: null,
  hasVehicle: true,
  hadVehicleBefore: false,
  onGoPress: jest.fn(),
  onEndPress: jest.fn(),
};

describe('DutyHero', () => {
  it('renders the greeting with first name and vehicle name', () => {
    const { getByText } = render(<DutyHero {...baseProps} />);
    expect(getByText('Hi Nadia · Shuttle 1')).toBeTruthy();
  });

  it('omits the vehicle name from the greeting when there is none', () => {
    const { getByText } = render(<DutyHero {...baseProps} vehicleName={undefined} />);
    expect(getByText('Hi Nadia')).toBeTruthy();
  });

  describe('off duty state', () => {
    it('shows the off-duty headline and fires onGoPress from GO', () => {
      const onGoPress = jest.fn();
      const { getByText, getByLabelText } = render(
        <DutyHero {...baseProps} onGoPress={onGoPress} />
      );
      expect(getByText("You're off duty")).toBeTruthy();
      expect(getByText("Riders can't see you yet")).toBeTruthy();
      fireEvent.press(getByLabelText('Go online'));
      expect(onGoPress).toHaveBeenCalledTimes(1);
    });

    it('shows no more than 2 blocks (no stat chip row) while off duty', () => {
      const { queryByText } = render(<DutyHero {...baseProps} />);
      expect(queryByText('time online')).toBeNull();
    });
  });

  describe('no vehicle state', () => {
    it('disables GO and shows the register-vehicle subline', () => {
      const onGoPress = jest.fn();
      const { getByText, getByLabelText } = render(
        <DutyHero {...baseProps} hasVehicle={false} onGoPress={onGoPress} />
      );
      expect(getByText('Register your vehicle to go live')).toBeTruthy();
      fireEvent.press(getByLabelText('Go online'));
      expect(onGoPress).not.toHaveBeenCalled();
    });

    it('shows the unassigned message instead when the driver had a vehicle before (issue #21)', () => {
      const { getByText, queryByText } = render(
        <DutyHero {...baseProps} hasVehicle={false} hadVehicleBefore />
      );
      expect(getByText('Your vehicle assignment was removed — contact your manager')).toBeTruthy();
      expect(queryByText('Register your vehicle to go live')).toBeNull();
    });
  });

  describe('live state', () => {
    it('shows the live headline, stat chips, and fires onEndPress from END', () => {
      const onEndPress = jest.fn();
      const { getByText, getByLabelText } = render(
        <DutyHero {...baseProps} status="tracking" onEndPress={onEndPress} />
      );
      expect(getByText("You're live")).toBeTruthy();
      expect(getByText('time online')).toBeTruthy();
      expect(getByText('updates sent')).toBeTruthy();
      expect(getByText('GPS')).toBeTruthy();
      fireEvent.press(getByLabelText('End journey'));
      expect(onEndPress).toHaveBeenCalledTimes(1);
    });

    it('shows the "updated Ns ago" subline once a fix has arrived', () => {
      const { getByText } = render(
        <DutyHero {...baseProps} status="tracking" lastFix={{ lat: 1, lng: 1, timestamp: Date.now() }} />
      );
      expect(getByText(/Riders can see your vehicle · updated \d+s ago/)).toBeTruthy();
    });

    it('counts a new updates-sent tick each time lastFix changes', () => {
      const { getByText, rerender } = render(
        <DutyHero {...baseProps} status="tracking" lastFix={{ lat: 1, lng: 1, timestamp: 1000 }} />
      );
      expect(getByText('1')).toBeTruthy();

      rerender(
        <DutyHero {...baseProps} status="tracking" lastFix={{ lat: 1, lng: 1, timestamp: 2000 }} />
      );
      expect(getByText('2')).toBeTruthy();
    });

    it('shows GPS quality from lastFix accuracy', () => {
      const { getByText, rerender } = render(
        <DutyHero
          {...baseProps}
          status="tracking"
          lastFix={{ lat: 1, lng: 1, timestamp: Date.now(), accuracy: 10 }}
        />
      );
      expect(getByText('Good')).toBeTruthy();

      rerender(
        <DutyHero
          {...baseProps}
          status="tracking"
          lastFix={{ lat: 1, lng: 1, timestamp: Date.now(), accuracy: 100 }}
        />
      );
      expect(getByText('Weak')).toBeTruthy();
    });
  });

  describe('pending state (offline GO — Offline & Caching Audit, chunk 1)', () => {
    it('reads as on duty, shows the sync subline, and fires onEndPress from END', () => {
      const onEndPress = jest.fn();
      const { getByText, getByLabelText } = render(
        <DutyHero {...baseProps} status="pending" onEndPress={onEndPress} />
      );
      expect(getByText("You're on duty")).toBeTruthy();
      expect(getByText("No signal — you'll sync when you're back online")).toBeTruthy();
      fireEvent.press(getByLabelText('End journey'));
      expect(onEndPress).toHaveBeenCalledTimes(1);
    });

    it('shows the stat chip row while pending', () => {
      const { getByText } = render(<DutyHero {...baseProps} status="pending" />);
      expect(getByText('time online')).toBeTruthy();
      expect(getByText('GPS')).toBeTruthy();
    });

    it('surfaces the buffered-count chip while pending', () => {
      const { getByText, getByTestId } = render(
        <DutyHero {...baseProps} status="pending" bufferedCount={7} />
      );
      expect(getByTestId('buffered-count-chip')).toBeTruthy();
      expect(getByText('saved, not sent')).toBeTruthy();
      expect(getByText('7')).toBeTruthy();
    });
  });

  describe('reconnecting state', () => {
    it('shows the reconnecting headline while tracking with a dropped socket', () => {
      const { getByText } = render(
        <DutyHero {...baseProps} status="tracking" isReconnecting />
      );
      expect(getByText('Reconnecting…')).toBeTruthy();
      expect(getByText('Hang tight, finding the server')).toBeTruthy();
    });
  });

  describe('permission denied state', () => {
    it('swaps the subline and shows the Allow location action', () => {
      const { getByText } = render(
        <DutyHero {...baseProps} status="tracking" permission="denied" />
      );
      expect(getByText("You're live")).toBeTruthy();
      expect(getByText('Allow location so riders can see your vehicle')).toBeTruthy();
      expect(getByText('Allow location')).toBeTruthy();
    });
  });

  describe('lost connection warning (issue #30)', () => {
    it('shows the warning subline while tracking', () => {
      const { getByText, queryByText } = render(
        <DutyHero {...baseProps} status="tracking" lostConnection />
      );
      expect(getByText("You're live")).toBeTruthy();
      expect(
        getByText('Losing connection — recent updates may not be reaching the server')
      ).toBeTruthy();
      expect(queryByText("Riders can't see you yet")).toBeNull();
    });

    it('defaults to false and does not warn when omitted', () => {
      const { queryByText } = render(<DutyHero {...baseProps} status="tracking" />);
      expect(
        queryByText('Losing connection — recent updates may not be reaching the server')
      ).toBeNull();
    });
  });

  it('sets accessibilityState busy while the session is starting', () => {
    const { getByLabelText } = render(<DutyHero {...baseProps} status="starting" />);
    expect(getByLabelText('Go online').props.accessibilityState.busy).toBe(true);
  });

  describe('buffered GPS fixes not yet sent', () => {
    it('shows "updates sent" as normal when nothing is buffered', () => {
      const { getByText, queryByText } = render(
        <DutyHero {...baseProps} status="tracking" bufferedCount={0} />
      );
      expect(getByText('updates sent')).toBeTruthy();
      expect(queryByText('saved, not sent')).toBeNull();
    });

    it('replaces "updates sent" with the buffered count once fixes are piling up', () => {
      const { getByText, getByTestId, queryByText } = render(
        <DutyHero {...baseProps} status="tracking" bufferedCount={18} />
      );
      expect(queryByText('updates sent')).toBeNull();
      expect(getByText('saved, not sent')).toBeTruthy();
      expect(getByTestId('buffered-count-chip')).toBeTruthy();
      expect(getByText('18')).toBeTruthy();
    });

    it('defaults to 0 (no buffered chip) when the prop is omitted', () => {
      const { queryByText } = render(<DutyHero {...baseProps} status="tracking" />);
      expect(queryByText('saved, not sent')).toBeNull();
    });
  });
});
