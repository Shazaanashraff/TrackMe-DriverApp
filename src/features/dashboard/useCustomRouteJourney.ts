import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export type CustomRoute = {
  isCustomRoute?: boolean;
  status?: string;
  stopsCount?: number;
  distance?: number;
  routeId?: string;
  hasPendingChangeRequest?: boolean;
} | null;

type Fix = { lat: number; lng: number };

function unwrap<T>(response: unknown): T {
  return ((response as { data?: T })?.data ?? response) as T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AuthenticatedRequest = (fn: (...args: any[]) => Promise<unknown>, ...args: unknown[]) => Promise<unknown>;

export function useCustomRouteJourney(busId: string) {
  const { authenticatedRequest } = useAuth() as { authenticatedRequest: AuthenticatedRequest };
  const [customRoute, setCustomRoute] = useState<CustomRoute>(null);
  const [showUpdateRecorder, setShowUpdateRecorder] = useState(false);
  const breadcrumbRef = useRef<Fix[]>([]);

  const isActive = customRoute?.isCustomRoute && customRoute?.status === 'ACTIVE';

  const reload = useCallback(async () => {
    try {
      const res = await authenticatedRequest(api.getMyCustomRoute);
      setCustomRoute(unwrap<CustomRoute>(res));
    } catch {
      setCustomRoute(null);
    }
  }, [authenticatedRequest]);

  useEffect(() => {
    reload();
  }, [reload]);

  const recordFix = useCallback(
    (fix: Fix) => {
      if (isActive) breadcrumbRef.current.push(fix);
    },
    [isActive]
  );

  const reportCompletedJourney = useCallback(async () => {
    if (!isActive || breadcrumbRef.current.length < 2) return;
    try {
      const res = await authenticatedRequest(api.reportJourney, {
        routeId: customRoute?.routeId,
        busId,
        breadcrumb: breadcrumbRef.current,
      });
      if (unwrap<{ flagged?: boolean }>(res)?.flagged) {
        reload();
      }
    } catch {
      // Best-effort; off-route detection is not journey-blocking.
    } finally {
      breadcrumbRef.current = [];
    }
  }, [authenticatedRequest, isActive, customRoute, busId, reload]);

  return {
    customRoute,
    showUpdateRecorder,
    setShowUpdateRecorder,
    reload,
    recordFix,
    reportCompletedJourney,
  };
}
