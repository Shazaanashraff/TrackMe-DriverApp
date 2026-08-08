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
  stop: (vehicleId: string) => void;
}

export function useTrackingSession(): UseTrackingSessionResult {
  const [status, setStatus] = useState<TrackingStatus>('idle');
  const [error, setError] = useState<AppError | undefined>(undefined);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const statusRef = useRef<TrackingStatus>('idle');
  const activeVehicleIdRef = useRef<string | null>(null);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const unsubscribe = onConnectionStateChange((state) => {
      if (statusRef.current === 'tracking') {
        setIsReconnecting(state.status !== 'connected');
      }
    });
    return unsubscribe;
  }, []);

  // Stop cleanly on unmount (covers logout / navigating away mid-session).
  useEffect(() => {
    return () => {
      if (activeVehicleIdRef.current) {
        stopTracking(activeVehicleIdRef.current);
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

  const stop = useCallback((vehicleId: string) => {
    stopTracking(vehicleId);
    activeVehicleIdRef.current = null;
    setIsReconnecting(false);
    setError(undefined);
    setStatus('idle');
  }, []);

  return { status, error, isReconnecting, start, stop };
}
