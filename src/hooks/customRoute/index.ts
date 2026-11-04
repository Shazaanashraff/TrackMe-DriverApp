import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { qk } from '../../lib/queryKeys';
import api from '../../services/api';
import {
  ActiveRecording,
  AddStopResult,
  addStop as recorderAddStop,
  nameStop as recorderNameStop,
  discardRecording,
  enqueueRun,
  finishRecording,
  flushQueue,
  getRecording,
  isRetryable,
  recordingStats,
  startRecording,
  subscribeToRecording,
} from '../../services/routeRecorder';
import type { CustomRouteRunPayload } from '../../services/api/customRoutes';
import type { RunOutcome } from '../../features/dashboard/customRouteMessages';

type AuthCtx = { token: string | null };

export interface CustomRouteProgress {
  routeId: string;
  status: 'RECORDING' | 'PENDING_REVIEW' | 'ACTIVE';
  requiredRuns: number;
  acceptedRuns: number;
}

// "Ride 2 of 5" for a driver on a custom route; null for everyone else. The answer
// only changes when a ride is uploaded or the manager acts, so it is not polled.
export function useCustomRouteQuery() {
  const { token } = useAuth() as AuthCtx;
  return useQuery({
    queryKey: qk.customRoute(),
    queryFn: () => api.getCurrentCustomRoute(token!) as Promise<{ data: CustomRouteProgress | null }>,
    select: (res) => res?.data ?? null,
    enabled: !!token,
    retry: false,
  });
}

interface RecorderOptions {
  // The vehicle is on a custom route that is still collecting rides.
  enabled: boolean;
  // The driver is on duty (the GPS pipeline is running).
  onDuty: boolean;
  vehicleId: string;
}

export interface UseRouteRecorderResult {
  isRecording: boolean;
  pointCount: number;
  stopCount: number;
  distanceMeters: number;
  // Name of the most recently marked stop ('' when it has none or nothing is marked).
  lastStopName: string;
  addStop: (name?: string) => AddStopResult;
  // Names a stop already marked on this ride, by the time it was marked.
  nameStop: (markedAt: number, name: string) => boolean;
  // Ends the ride and uploads it (queues it if the network is down).
  finish: () => Promise<RunOutcome>;
  discard: () => Promise<void>;
}

// Records the ride a driver is on while the route is collecting rides. It rides on the
// same GPS pipeline as the live broadcast and never starts a watcher of its own.
export function useRouteRecorder({ enabled, onDuty, vehicleId }: RecorderOptions): UseRouteRecorderResult {
  const { token } = useAuth() as AuthCtx;
  const queryClient = useQueryClient();
  const [recording, setRecording] = useState<ActiveRecording | null>(getRecording());
  const tokenRef = useRef(token);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => subscribeToRecording(setRecording), []);

  // Begin (or carry on with) the ride when the shift starts.
  useEffect(() => {
    if (!enabled || !onDuty || !vehicleId) return;
    void startRecording(vehicleId);
  }, [enabled, onDuty, vehicleId]);

  const submit = useCallback(
    (payload: CustomRouteRunPayload) => api.submitCustomRouteRun(tokenRef.current!, payload),
    []
  );

  // Rides that could not be sent earlier go out whenever the dashboard is open and signed in.
  useEffect(() => {
    if (!enabled || !token) return;
    void flushQueue(submit).then((delivered) => {
      if (delivered > 0) void queryClient.invalidateQueries({ queryKey: qk.customRoute() });
    });
  }, [enabled, token, submit, queryClient]);

  const finish = useCallback(async (): Promise<RunOutcome> => {
    const payload = await finishRecording();
    if (!payload || payload.points.length === 0) return { kind: 'nothing' };

    try {
      const res = (await submit(payload)) as {
        data?: {
          run?: { status?: RunOutcome['runStatus']; rejectReason?: string; runNumber?: number | null };
          route?: { status?: string; acceptedRuns?: number; requiredRuns?: number };
        };
      };
      void queryClient.invalidateQueries({ queryKey: qk.customRoute() });
      return {
        kind: 'sent',
        runStatus: res?.data?.run?.status,
        rejectReason: res?.data?.run?.rejectReason,
        runNumber: res?.data?.run?.runNumber,
        routeStatus: res?.data?.route?.status,
        acceptedRuns: res?.data?.route?.acceptedRuns,
        requiredRuns: res?.data?.route?.requiredRuns,
      };
    } catch (error) {
      if (isRetryable(error)) {
        await enqueueRun(payload);
        return { kind: 'queued' };
      }
      // The server said no for good (e.g. the route is no longer collecting rides).
      void queryClient.invalidateQueries({ queryKey: qk.customRoute() });
      return { kind: 'nothing' };
    }
  }, [submit, queryClient]);

  const stats = recordingStats(recording);
  return {
    isRecording: !!recording,
    pointCount: stats.pointCount,
    stopCount: stats.stopCount,
    distanceMeters: stats.distanceMeters,
    addStop: recorderAddStop,
    nameStop: recorderNameStop,
    lastStopName: recording?.stops.length ? recording.stops[recording.stops.length - 1].name : '',
    finish,
    discard: discardRecording,
  };
}
