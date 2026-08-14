import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import {
  isBackgroundTrackingActive,
  startBackgroundTracking,
  stopBackgroundTracking,
} from '../services/backgroundLocation';

export type BackgroundPermissionStatus =
  | 'unsupported'
  | 'undetermined'
  | 'granted'
  | 'denied';

export interface UseBackgroundTrackingResult {
  permission: BackgroundPermissionStatus;
  isActive: boolean;
  // True when the driver is on duty but the shift would stop broadcasting on a
  // screen lock — what the dashboard prompts about.
  shouldOfferUpgrade: boolean;
  enableBackground: () => Promise<boolean>;
  dismissOffer: () => void;
}

/**
 * Background location is a permission Google Play reviews individually and that
 * the OS prompts for separately from foreground. The flow is deliberately
 * two-step: a shift starts foreground-only on GO, and background is offered
 * afterwards behind an in-app disclosure — Play policy requires the disclosure
 * to precede the system prompt.
 */
export function useBackgroundTracking(tracking: boolean): UseBackgroundTrackingResult {
  const supported = Platform.OS === 'ios' || Platform.OS === 'android';
  const [permission, setPermission] = useState<BackgroundPermissionStatus>(
    supported ? 'undetermined' : 'unsupported'
  );
  const [isActive, setIsActive] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!supported) return undefined;
    let cancelled = false;

    (async () => {
      const { status } = await Location.getBackgroundPermissionsAsync();
      if (cancelled) return;
      setPermission(status === 'granted' ? 'granted' : 'undetermined');
      setIsActive(await isBackgroundTrackingActive());
    })();

    return () => {
      cancelled = true;
    };
  }, [supported]);

  // Once granted, every later shift promotes to background automatically — the
  // driver should not have to re-approve each time they go on duty.
  useEffect(() => {
    if (!supported) return;
    let cancelled = false;

    (async () => {
      if (tracking && permission === 'granted' && !startedRef.current) {
        startedRef.current = true;
        const ok = await startBackgroundTracking();
        if (!cancelled) setIsActive(ok);
      } else if (!tracking && startedRef.current) {
        startedRef.current = false;
        await stopBackgroundTracking();
        if (!cancelled) setIsActive(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tracking, permission, supported]);

  useEffect(() => {
    if (!tracking) setDismissed(false);
  }, [tracking]);

  // Logout or navigating away tears this hook down without `tracking` ever
  // going false — the OS would otherwise keep the foreground service running.
  useEffect(() => {
    return () => {
      if (startedRef.current) {
        startedRef.current = false;
        void stopBackgroundTracking();
      }
    };
  }, []);

  const enableBackground = useCallback(async () => {
    if (!supported) return false;

    const { status } = await Location.requestBackgroundPermissionsAsync();
    if (status !== 'granted') {
      setPermission('denied');
      return false;
    }

    setPermission('granted');
    const ok = await startBackgroundTracking();
    startedRef.current = ok;
    setIsActive(ok);
    return ok;
  }, [supported]);

  const dismissOffer = useCallback(() => setDismissed(true), []);

  return {
    permission,
    isActive,
    shouldOfferUpgrade:
      supported && tracking && permission !== 'granted' && !dismissed,
    enableBackground,
    dismissOffer,
  };
}
