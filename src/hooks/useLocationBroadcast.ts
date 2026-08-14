import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Location from 'expo-location';
import {
  dispatchFix,
  getBufferedCount,
  resetDispatch,
  setTrackingTarget,
  startReplayOnReconnect,
  stopReplayOnReconnect,
  subscribeToBufferCount,
  subscribeToFixes,
} from '../services/locationDispatch';
import { LocationFix } from '../helpers/locationUtils';

export type LocationPermissionStatus = 'granted' | 'denied' | 'undetermined';

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
  // When the OS-managed background task is delivering fixes, the foreground
  // watcher is redundant — both feed the same dispatcher.
  backgroundActive?: boolean;
}

export interface UseLocationBroadcastResult {
  permission: LocationPermissionStatus;
  bufferedCount: number;
  lastFix: LocationFix | null;
}

export function useLocationBroadcast({
  active,
  vehicleId,
  routeId,
  backgroundActive = false,
}: UseLocationBroadcastOptions): UseLocationBroadcastResult {
  const [permission, setPermission] = useState<LocationPermissionStatus>('undetermined');
  const [bufferedCount, setBufferedCount] = useState(getBufferedCount());
  const [lastFix, setLastFix] = useState<LocationFix | null>(null);

  const subscriptionRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    const unsubscribeFixes = subscribeToFixes(setLastFix);
    const unsubscribeBuffer = subscribeToBufferCount(setBufferedCount);
    return () => {
      unsubscribeFixes();
      unsubscribeBuffer();
    };
  }, []);

  useEffect(() => {
    if (!active) return undefined;
    void setTrackingTarget({ vehicleId, routeId });
    startReplayOnReconnect();
    return () => {
      stopReplayOnReconnect();
    };
  }, [active, vehicleId, routeId]);

  const handleFix = useCallback((fix: LocationFix) => {
    dispatchFix(fix);
  }, []);

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
      if (backgroundActive) return;

      const subscription = await beginWatching();
      if (cancelled) {
        safeRemove(subscription);
        return;
      }
      subscriptionRef.current = subscription;
    }

    if (active) {
      start();
    } else {
      void resetDispatch();
    }

    return () => {
      cancelled = true;
      if (subscriptionRef.current) {
        safeRemove(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      setLastFix(null);
    };
  }, [active, beginWatching, backgroundActive]);

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
        if (backgroundActive || subscriptionRef.current) return;

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
  }, [active, beginWatching, backgroundActive]);

  return { permission, bufferedCount, lastFix };
}
