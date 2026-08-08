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
  hasVehicle: boolean;
  // True once this driver has been observed to have a vehicle at all, even if
  // useMyVehicleQuery now returns none — distinguishes "never registered" from
  // "a manager unassigned it" (issue #21). Ignored when hasVehicle is true.
  hadVehicleBefore: boolean;
  secondsSinceFix: number | null;
}

export function deriveDutyHeroState({
  status,
  isReconnecting,
  connecting,
  permission,
  hasVehicle,
  hadVehicleBefore,
  secondsSinceFix,
}: DeriveDutyHeroStateInput): DutyHeroState {
  if (status === 'tracking') {
    if (isReconnecting) {
      return {
        headline: 'Reconnecting…',
        subline: 'Hang tight, finding the server',
        dot: 'warn',
        showAllowLocation: false,
        goDisabled: false,
      };
    }

    if (permission === 'denied') {
      return {
        headline: "You're live",
        subline: 'Allow location so riders can see your vehicle',
        dot: 'warn',
        showAllowLocation: true,
        goDisabled: false,
      };
    }

    return {
      headline: "You're live",
      subline:
        secondsSinceFix != null
          ? `Riders can see your vehicle · updated ${secondsSinceFix}s ago`
          : 'Riders can see your vehicle',
      dot: 'on',
      showAllowLocation: false,
      goDisabled: false,
    };
  }

  if (connecting) {
    return {
      headline: "You're off duty",
      subline: 'Hang tight, finding the server',
      dot: 'off',
      showAllowLocation: false,
      goDisabled: !hasVehicle,
    };
  }

  if (!hasVehicle) {
    return {
      headline: "You're off duty",
      subline: hadVehicleBefore
        ? 'Your vehicle assignment was removed — contact your manager'
        : 'Register your vehicle to go live',
      dot: 'off',
      showAllowLocation: false,
      goDisabled: true,
    };
  }

  return {
    headline: "You're off duty",
    subline: "Riders can't see you yet",
    dot: 'off',
    showAllowLocation: false,
    goDisabled: false,
  };
}

export function gpsQualityLabel(accuracy?: number | null): 'Good' | 'Weak' {
  if (accuracy == null) return 'Weak';
  return accuracy <= 25 ? 'Good' : 'Weak';
}
