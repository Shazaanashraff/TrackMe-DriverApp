import { deriveDutyHeroState, gpsQualityLabel } from '../dutyHeroState';

const base = {
  status: 'idle' as const,
  isReconnecting: false,
  connecting: false,
  permission: 'granted' as const,
  hasBus: true,
  secondsSinceFix: null,
};

describe('deriveDutyHeroState', () => {
  it('off duty with a bus', () => {
    const state = deriveDutyHeroState(base);
    expect(state).toEqual({
      headline: "You're off duty",
      subline: "Riders can't see your bus yet",
      dot: 'off',
      showAllowLocation: false,
      goDisabled: false,
    });
  });

  it('off duty without a bus disables GO', () => {
    const state = deriveDutyHeroState({ ...base, hasBus: false });
    expect(state.subline).toBe('Register your bus to go live');
    expect(state.goDisabled).toBe(true);
  });

  it('off duty while the socket is still connecting', () => {
    const state = deriveDutyHeroState({ ...base, connecting: true });
    expect(state.headline).toBe("You're off duty");
    expect(state.subline).toBe('Hang tight — finding the server');
  });

  it('live and broadcasting', () => {
    const state = deriveDutyHeroState({
      ...base,
      status: 'tracking',
      secondsSinceFix: 4,
    });
    expect(state).toEqual({
      headline: "You're live",
      subline: 'Riders can see your bus · updated 4s ago',
      dot: 'on',
      showAllowLocation: false,
      goDisabled: false,
    });
  });

  it('live with no fix yet omits the "updated Ns ago" suffix', () => {
    const state = deriveDutyHeroState({ ...base, status: 'tracking', secondsSinceFix: null });
    expect(state.subline).toBe('Riders can see your bus');
  });

  it('reconnecting while tracking', () => {
    const state = deriveDutyHeroState({
      ...base,
      status: 'tracking',
      isReconnecting: true,
    });
    expect(state).toEqual({
      headline: 'Reconnecting…',
      subline: 'Hang tight — finding the server',
      dot: 'warn',
      showAllowLocation: false,
      goDisabled: false,
    });
  });

  it('permission denied while tracking shows the Allow location subline', () => {
    const state = deriveDutyHeroState({
      ...base,
      status: 'tracking',
      permission: 'denied',
    });
    expect(state).toEqual({
      headline: "You're live",
      subline: 'Allow location so riders can see your bus',
      dot: 'warn',
      showAllowLocation: true,
      goDisabled: false,
    });
  });

  it('reconnecting takes priority over permission denied', () => {
    const state = deriveDutyHeroState({
      ...base,
      status: 'tracking',
      isReconnecting: true,
      permission: 'denied',
    });
    expect(state.headline).toBe('Reconnecting…');
    expect(state.showAllowLocation).toBe(false);
  });
});

describe('gpsQualityLabel', () => {
  it('is Weak when accuracy is unknown', () => {
    expect(gpsQualityLabel(undefined)).toBe('Weak');
    expect(gpsQualityLabel(null)).toBe('Weak');
  });

  it('is Good at or under 25 meters', () => {
    expect(gpsQualityLabel(25)).toBe('Good');
    expect(gpsQualityLabel(10)).toBe('Good');
  });

  it('is Weak over 25 meters', () => {
    expect(gpsQualityLabel(26)).toBe('Weak');
    expect(gpsQualityLabel(100)).toBe('Weak');
  });
});
