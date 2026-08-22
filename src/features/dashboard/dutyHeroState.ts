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
  // True once the server has rejected several consecutive location updates in a row
  // while the socket believed it was connected (issue #30) — a distinct warning from
  // isReconnecting (a dropped socket) or permission === 'denied'.
  lostConnection?: boolean;
}

export function deriveDutyHeroState({
  status,
  isReconnecting,
  connecting,
  permission,
  hasVehicle,
  hadVehicleBefore,
  secondsSinceFix,
  lostConnection,
}: DeriveDutyHeroStateInput): DutyHeroState {
  if (status === 'tracking') {
    if (isReconnecting) {
      return {
        headline: 'Reconnecting…',
        subline: 'Reconnecting...',
        dot: 'warn',
        showAllowLocation: false,
        goDisabled: false,
      };
    }

    // A dropped socket (isReconnecting) and a rejected-but-connected socket
    // (lostConnection) can't both be true — pushToBuffer's non-emit offline path
    // is what covers a dropped socket, so this only fires for the issue #13/#30
    // "connected but the server keeps NACKing" scenario.
    if (lostConnection) {
      return {
        headline: "You're live",
        subline: "Connection unstable",
        dot: 'warn',
        showAllowLocation: false,
        goDisabled: false,
      };
    }

    if (permission === 'denied') {
      return {
        headline: "You're live",
        subline: 'Location access required',
        dot: 'warn',
        showAllowLocation: true,
        goDisabled: false,
      };
    }

    return {
      headline: "You're live",
      subline: 'Visible to riders',
      dot: 'on',
      showAllowLocation: false,
      goDisabled: false,
    };
  }

  if (connecting) {
    return {
      headline: "You're off duty",
      subline: 'Connecting...',
      dot: 'off',
      showAllowLocation: false,
      goDisabled: !hasVehicle,
    };
  }

  if (!hasVehicle) {
    return {
      headline: "You're off duty",
      subline: hadVehicleBefore
        ? 'Vehicle assignment removed'
        : 'Vehicle registration required',
      dot: 'off',
      showAllowLocation: false,
      goDisabled: true,
    };
  }

  return {
    headline: "You're off duty",
    subline: 'Hidden from riders',
    dot: 'off',
    showAllowLocation: false,
    goDisabled: false,
  };
}

export function gpsQualityLabel(accuracy?: number | null): 'Good' | 'Weak' {
  if (accuracy == null) return 'Weak';
  return accuracy <= 25 ? 'Good' : 'Weak';
}
