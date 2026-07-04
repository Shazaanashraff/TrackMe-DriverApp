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
  start: (busId: string) => Promise<void>;
  stop: (busId: string) => void;
}

export function useTrackingSession(): UseTrackingSessionResult {
  const [status, setStatus] = useState<TrackingStatus>('idle');
  const [error, setError] = useState<AppError | undefined>(undefined);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const statusRef = useRef<TrackingStatus>('idle');
  const activeBusIdRef = useRef<string | null>(null);

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
      if (activeBusIdRef.current) {
        stopTracking(activeBusIdRef.current);
      }
    };
  }, []);

  const start = useCallback(async (busId: string) => {
    setStatus('starting');
    setError(undefined);
    setIsReconnecting(false);

    const ack = await startTracking(busId);

    if (ack.success) {
      activeBusIdRef.current = busId;
      setStatus('tracking');
    } else {
      setStatus('error');
      setError(new AppError('tracking', ack.error || 'Failed to start tracking'));
    }
  }, []);

  const stop = useCallback((busId: string) => {
    stopTracking(busId);
    activeBusIdRef.current = null;
    setIsReconnecting(false);
    setError(undefined);
    setStatus('idle');
  }, []);

  return { status, error, isReconnecting, start, stop };
}
