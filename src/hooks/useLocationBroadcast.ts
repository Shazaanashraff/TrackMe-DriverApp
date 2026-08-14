import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Location from 'expo-location';
import { emitLocation, getConnectionState, onConnectionStateChange } from '../services/socket';
import { shouldEmit, LocationFix } from '../helpers/locationUtils';

export type LocationPermissionStatus = 'granted' | 'denied' | 'undetermined';

const MIN_DISTANCE_METERS = 3;
const MIN_INTERVAL_MS = 2500;
const MAX_BUFFER_SIZE = 50;
// Consecutive NACKs (server rejecting an update while the socket believes it's
// connected — e.g. repeated ack timeouts, issue #13) before surfacing a "lost
// connection" warning to the driver (issue #30). A single rejection is common
// and already handled by re-buffering; only a run of them is worth alarming on.
const REJECTION_STREAK_THRESHOLD = 5;

// expo-location's web build can throw on subscription.remove()
// ("LocationEventEmitter.removeSubscription is not a function") depending on the
// Expo/RN version. Removing the watcher must never crash the app (e.g. on End
// Journey), so swallow that teardown error.
export function safeRemove(subscription: { remove: () => void } | null): void {
  try {
    subscription?.remove();
  } catch {
    /* expo-location web teardown incompatibility — safe to ignore */
  }
}

export interface UseLocationBroadcastOptions {
  active: boolean;
  vehicleId: string;
  routeId: string;
}

export interface UseLocationBroadcastResult {
  permission: LocationPermissionStatus;
  bufferedCount: number;
  lastFix: LocationFix | null;
  // True once the server has rejected REJECTION_STREAK_THRESHOLD updates in a row —
  // a signal distinct from bufferedCount/offline, since these rejections happen while
  // the socket believes it's connected (issue #30).
  lostConnection: boolean;
}

function isNackResponse(response: unknown): boolean {
  return !!response && typeof response === 'object' && (response as { success?: boolean }).success === false;
}

export function useLocationBroadcast({
  active,
  vehicleId,
  routeId,
}: UseLocationBroadcastOptions): UseLocationBroadcastResult {
  const [permission, setPermission] = useState<LocationPermissionStatus>('undetermined');
  const [bufferedCount, setBufferedCount] = useState(0);
  const [lastFix, setLastFix] = useState<LocationFix | null>(null);
  const [lostConnection, setLostConnection] = useState(false);

  const subscriptionRef = useRef<{ remove: () => void } | null>(null);
  const lastFixRef = useRef<LocationFix | null>(null);
  const bufferRef = useRef<LocationFix[]>([]);
  const rejectionStreakRef = useRef(0);

  const pushToBuffer = useCallback((fix: LocationFix) => {
    bufferRef.current.push(fix);
    if (bufferRef.current.length > MAX_BUFFER_SIZE) bufferRef.current.shift();
    setBufferedCount(bufferRef.current.length);
  }, []);

  const emitFix = useCallback(
    (fix: LocationFix) => {
      emitLocation(vehicleId, routeId, fix.lat, fix.lng, (response: unknown) => {
        if (isNackResponse(response)) {
          pushToBuffer(fix);
          rejectionStreakRef.current += 1;
          if (rejectionStreakRef.current >= REJECTION_STREAK_THRESHOLD) {
            setLostConnection(true);
          }
        } else {
          rejectionStreakRef.current = 0;
          setLostConnection(false);
        }
      });
    },
    [vehicleId, routeId, pushToBuffer]
  );

  const handleFix = useCallback(
    (fix: LocationFix) => {
      if (!shouldEmit(lastFixRef.current, fix, MIN_DISTANCE_METERS, MIN_INTERVAL_MS)) return;
      lastFixRef.current = fix;
      setLastFix(fix);

      if (getConnectionState().status !== 'connected') {
        pushToBuffer(fix);
        return;
      }
      emitFix(fix);
    },
    [emitFix, pushToBuffer]
  );

  // Replay buffered fixes in order once the socket reconnects.
  useEffect(() => {
    const unsubscribe = onConnectionStateChange((state) => {
      if (state.status === 'connected' && bufferRef.current.length > 0) {
        const queued = bufferRef.current;
        bufferRef.current = [];
        setBufferedCount(0);
        queued.forEach(emitFix);
      }
    });
    return unsubscribe;
  }, [emitFix]);

  const beginWatching = useCallback(() => {
    return Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 3000,
        distanceInterval: 3,
      },
      (location: { coords: { latitude: number; longitude: number; accuracy?: number | null } }) => {
        handleFix({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          timestamp: Date.now(),
          accuracy: location.coords.accuracy,
        });
      }
    );
  }, [handleFix]);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      setPermission(status === 'granted' ? 'granted' : 'denied');
      if (status !== 'granted') return;

      const subscription = await beginWatching();
      if (cancelled) {
        safeRemove(subscription);
        return;
      }
      subscriptionRef.current = subscription;
    }

    if (active) {
      start();
    }

    return () => {
      cancelled = true;
      if (subscriptionRef.current) {
        safeRemove(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      lastFixRef.current = null;
      setLastFix(null);
      rejectionStreakRef.current = 0;
      setLostConnection(false);
    };
  }, [active, beginWatching]);

  // Permission can change in either direction while a driver is on duty: granted
  // later via the OS Settings app after an earlier denial (issue #26), or revoked
  // mid-shift (issue #14) — neither was picked up without an app restart, since
  // permission was only ever checked once at mount. Re-checks (without prompting)
  // whenever the app returns to the foreground while tracking is meant to be
  // active: starts the watcher if now granted and not already watching, and stops
  // it (surfacing the denied state to DutyHero's live-status UI) if now denied.
  useEffect(() => {
    let cancelled = false;

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState !== 'active' || !active) return;

      (async () => {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (cancelled) return;

        if (status !== 'granted') {
          setPermission('denied');
          if (subscriptionRef.current) {
            safeRemove(subscriptionRef.current);
            subscriptionRef.current = null;
          }
          return;
        }

        setPermission('granted');
        if (subscriptionRef.current) return;

        const watcher = await beginWatching();
        if (cancelled || subscriptionRef.current) {
          safeRemove(watcher);
          return;
        }
        subscriptionRef.current = watcher;
      })();
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [active, beginWatching]);

  return { permission, bufferedCount, lastFix, lostConnection };
}
