import { useCallback, useEffect, useRef, useState } from 'react';
import { onConnectionStateChange, startTracking, stopTracking } from '../services/socket';
import { AppError } from '../lib/errors';

export type TrackingStatus = 'idle' | 'starting' | 'tracking' | 'error';

export interface UseTrackingSessionResult {
  status: TrackingStatus;
  error?: AppError;
  // True while `status` is 'tracking' but the socket has dropped — coordinates with
  // useLocationBroadcast (019) and the offline buffer (073) to show "reconnecting, buffering".
  isReconnecting: boolean;
  start: (vehicleId: string) => Promise<void>;
  stop: (vehicleId: string) => Promise<void>;
}

export function useTrackingSession(): UseTrackingSessionResult {
  const [status, setStatus] = useState<TrackingStatus>('idle');
  const [error, setError] = useState<AppError | undefined>(undefined);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const statusRef = useRef<TrackingStatus>('idle');
  const activeVehicleIdRef = useRef<string | null>(null);
  const reassertingRef = useRef(false);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const unsubscribe = onConnectionStateChange((state) => {
      if (statusRef.current !== 'tracking') return;

      if (state.status !== 'connected') {
        setIsReconnecting(true);
        return;
      }

      const vehicleId = activeVehicleIdRef.current;
      if (!vehicleId || reassertingRef.current) return;

      // The backend may have restarted while this screen stayed mounted. Its
      // in-memory live registry is then empty even though the driver still sees
      // an active trip. Re-announce the session as soon as the socket returns;
      // waiting for the next GPS movement can leave riders on "WAITING" forever.
      reassertingRef.current = true;
      void startTracking(vehicleId).then((ack) => {
        reassertingRef.current = false;
        if (statusRef.current !== 'tracking' || activeVehicleIdRef.current !== vehicleId) return;
        if (ack.success) {
          setIsReconnecting(false);
          setError(undefined);
        } else {
          setIsReconnecting(true);
          setError(new AppError('tracking', ack.error || 'Failed to restore live tracking'));
        }
      });
    });
    return unsubscribe;
  }, []);

  // Stop cleanly on unmount (covers logout / navigating away mid-session).
  // Fire-and-forget: the component is gone, so there's nothing left to
  // update the ack result into.
  useEffect(() => {
    return () => {
      if (activeVehicleIdRef.current) {
        void stopTracking(activeVehicleIdRef.current);
      }
    };
  }, []);

  const start = useCallback(async (vehicleId: string) => {
    setStatus('starting');
    setError(undefined);
    setIsReconnecting(false);

    const ack = await startTracking(vehicleId);

    if (ack.success) {
      activeVehicleIdRef.current = vehicleId;
      setStatus('tracking');
    } else {
      const reason = ack.error || 'Failed to start tracking';
      // No crash-reporting SDK wired up yet — console.error is the floor so a
      // "go on duty" failure is at least visible in device/Metro logs (issue #20).
      console.error(`[useTrackingSession] start('${vehicleId}') refused:`, reason);
      setStatus('error');
      setError(new AppError('tracking', reason));
    }
  }, []);

  const stop = useCallback(async (vehicleId: string) => {
    setError(undefined);

    const ack = await stopTracking(vehicleId);

    if (ack.success) {
      activeVehicleIdRef.current = null;
      setIsReconnecting(false);
      setStatus('idle');
    } else {
      // Don't show "off duty" as confirmed until the server has actually
      // acknowledged the stop (issue #12) — status stays 'tracking' so the
      // driver knows to retry, and location keeps broadcasting in the
      // meantime rather than going dark on an unconfirmed stop.
      const reason = ack.error || "Failed to confirm you're off duty";
      console.error(`[useTrackingSession] stop('${vehicleId}') unconfirmed:`, reason);
      setError(new AppError('tracking', reason));
    }
  }, []);

  return { status, error, isReconnecting, start, stop };
}
