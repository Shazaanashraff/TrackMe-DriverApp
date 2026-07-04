import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { emitLocation, getConnectionState, onConnectionStateChange } from '../services/socket';
import { shouldEmit, LocationFix } from '../helpers/locationUtils';

export type LocationPermissionStatus = 'granted' | 'denied' | 'undetermined';

const MIN_DISTANCE_METERS = 3;
const MIN_INTERVAL_MS = 2500;
const MAX_BUFFER_SIZE = 50;

export interface UseLocationBroadcastOptions {
  active: boolean;
  busId: string;
  routeId: string;
}

export interface UseLocationBroadcastResult {
  permission: LocationPermissionStatus;
  bufferedCount: number;
  lastFix: LocationFix | null;
}

function isNackResponse(response: unknown): boolean {
  return !!response && typeof response === 'object' && (response as { success?: boolean }).success === false;
}

export function useLocationBroadcast({
  active,
  busId,
  routeId,
}: UseLocationBroadcastOptions): UseLocationBroadcastResult {
  const [permission, setPermission] = useState<LocationPermissionStatus>('undetermined');
  const [bufferedCount, setBufferedCount] = useState(0);
  const [lastFix, setLastFix] = useState<LocationFix | null>(null);

  const subscriptionRef = useRef<{ remove: () => void } | null>(null);
  const lastFixRef = useRef<LocationFix | null>(null);
  const bufferRef = useRef<LocationFix[]>([]);

  const pushToBuffer = useCallback((fix: LocationFix) => {
    bufferRef.current.push(fix);
    if (bufferRef.current.length > MAX_BUFFER_SIZE) bufferRef.current.shift();
    setBufferedCount(bufferRef.current.length);
  }, []);

  const emitFix = useCallback(
    (fix: LocationFix) => {
      emitLocation(busId, routeId, fix.lat, fix.lng, (response: unknown) => {
        if (isNackResponse(response)) {
          pushToBuffer(fix);
        }
      });
    },
    [busId, routeId, pushToBuffer]
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

  useEffect(() => {
    let cancelled = false;

    async function start() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      setPermission(status === 'granted' ? 'granted' : 'denied');
      if (status !== 'granted') return;

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 3,
        },
        (location: { coords: { latitude: number; longitude: number } }) => {
          handleFix({
            lat: location.coords.latitude,
            lng: location.coords.longitude,
            timestamp: Date.now(),
          });
        }
      );
      if (cancelled) {
        subscription.remove();
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
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
      lastFixRef.current = null;
      setLastFix(null);
    };
  }, [active, handleFix]);

  return { permission, bufferedCount, lastFix };
}
