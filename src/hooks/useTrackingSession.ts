import { useCallback, useEffect, useRef, useState } from 'react';
import { onConnectionStateChange, startTracking, stopTracking } from '../services/socket';
import { AppError } from '../lib/errors';

// 'pending' — the driver pressed GO with no connection. The shift is treated as
// on-duty locally (GPS buffers, screen stays awake) but the server does not know
// about it yet; it is announced for real on the next reconnect. See §chunk-1 of
// the Offline & Caching Audit.
export type TrackingStatus = 'idle' | 'starting' | 'tracking' | 'pending' | 'error';

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
  // Epoch ms of the GO press for a shift started while offline — sent as the
  // real `startedAt` when the pending shift is announced on reconnect.
  const pendingSinceRef = useRef<number | null>(null);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const unsubscribe = onConnectionStateChange((state) => {
      const current = statusRef.current;
      if (current !== 'tracking' && current !== 'pending') return;

      if (state.status !== 'connected') {
        // A pending shift is already showing "no signal" — only a live shift
        // needs to flip into the reconnecting sub-state.
        if (current === 'tracking') setIsReconnecting(true);
        return;
      }

      const vehicleId = activeVehicleIdRef.current;
      if (!vehicleId || reassertingRef.current) return;
      reassertingRef.current = true;

      if (current === 'pending') {
        // The driver pressed GO with no signal. Now that the socket is back,
        // announce the shift for real — stamped with the actual press time so
        // the recorded duration is honest — then let locationDispatch replay
        // the fixes buffered in the meantime.
        const startedAtIso =
          pendingSinceRef.current != null
            ? new Date(pendingSinceRef.current).toISOString()
            : undefined;
        void startTracking(vehicleId, startedAtIso).then((ack) => {
          reassertingRef.current = false;
          if (statusRef.current !== 'pending' || activeVehicleIdRef.current !== vehicleId) return;
          if (ack.success) {
            pendingSinceRef.current = null;
            setStatus('tracking');
            setError(undefined);
          } else if (!ack.offline) {
            // The server refused it — most likely the vehicle was un-assigned
            // during the offline window. Drop the shift; useLocationBroadcast
            // then sees `active` go false and clears the local buffer.
            pendingSinceRef.current = null;
            activeVehicleIdRef.current = null;
            setStatus('error');
            setError(new AppError('tracking', ack.error || 'Failed to start live tracking'));
          }
          // ack.offline: the socket dropped again before the emit landed — stay
          // pending; the next reconnect retries.
        });
        return;
      }

      // current === 'tracking' — re-announce a live shift after a drop. The
      // backend may have restarted while this screen stayed mounted. Its
      // in-memory live registry is then empty even though the driver still sees
      // an active trip. Re-announce the session as soon as the socket returns;
      // waiting for the next GPS movement can leave riders on "WAITING" forever.
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
      pendingSinceRef.current = null;
      setStatus('tracking');
    } else if (ack.offline) {
      // No connection yet — don't fail the shift. Hold it as pending: the GPS
      // pipeline starts buffering locally (DriverDashboard turns it on for
      // 'pending' too) and the reconnect handler above announces it to the
      // server, backdated to now, as soon as the socket returns.
      activeVehicleIdRef.current = vehicleId;
      pendingSinceRef.current = Date.now();
      setStatus('pending');
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

    // A pending shift never reached the server — there is nothing to stop there.
    // Go straight to idle; DriverDashboard then drops `active` and
    // locationDispatch clears the buffered-but-unsent fixes.
    if (statusRef.current === 'pending') {
      activeVehicleIdRef.current = null;
      pendingSinceRef.current = null;
      setIsReconnecting(false);
      setStatus('idle');
      return;
    }

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
