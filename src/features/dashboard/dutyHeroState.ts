// Pure state machine for DutyHero's headline/subline/dot per STYLEGUIDE §6.2 + §8.
// Kept separate from the component so the state mapping is unit-testable without
// rendering React Native views.
import { TrackingStatus } from '../../hooks/useTrackingSession';
import { LocationPermissionStatus } from '../../hooks/useLocationBroadcast';

export type DutyHeroDotTone = 'on' | 'off' | 'warn';

export interface DutyHeroState {
  headline: string;
  subline: string;
  dot: DutyHeroDotTone;
  showAllowLocation: boolean;
  goDisabled: boolean;
}

export interface DeriveDutyHeroStateInput {
  status: TrackingStatus;
  isReconnecting: boolean;
  connecting: boolean;
  permission: LocationPermissionStatus;
  hasBus: boolean;
  secondsSinceFix: number | null;
}

export function deriveDutyHeroState({
  status,
  isReconnecting,
  connecting,
  permission,
  hasBus,
  secondsSinceFix,
}: DeriveDutyHeroStateInput): DutyHeroState {
  if (status === 'tracking') {
    if (isReconnecting) {
      return {
        headline: 'Reconnecting…',
        subline: 'Hang tight — finding the server',
        dot: 'warn',
        showAllowLocation: false,
        goDisabled: false,
      };
    }

    if (permission === 'denied') {
      return {
        headline: "You're live",
        subline: 'Allow location so riders can see your bus',
        dot: 'warn',
        showAllowLocation: true,
        goDisabled: false,
      };
    }

    return {
      headline: "You're live",
      subline:
        secondsSinceFix != null
          ? `Riders can see your bus · updated ${secondsSinceFix}s ago`
          : 'Riders can see your bus',
      dot: 'on',
      showAllowLocation: false,
      goDisabled: false,
    };
  }

  if (connecting) {
    return {
      headline: "You're off duty",
      subline: 'Hang tight — finding the server',
      dot: 'off',
      showAllowLocation: false,
      goDisabled: !hasBus,
    };
  }

  if (!hasBus) {
    return {
      headline: "You're off duty",
      subline: 'Register your bus to go live',
      dot: 'off',
      showAllowLocation: false,
      goDisabled: true,
    };
  }

  return {
    headline: "You're off duty",
    subline: "Riders can't see your bus yet",
    dot: 'off',
    showAllowLocation: false,
    goDisabled: false,
  };
}

export function gpsQualityLabel(accuracy?: number | null): 'Good' | 'Weak' {
  if (accuracy == null) return 'Weak';
  return accuracy <= 25 ? 'Good' : 'Weak';
}
