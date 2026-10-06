import { useQuery } from '@tanstack/react-query';
import { qk } from '../../lib/queryKeys';
import api from '../../services/api';

const FIVE_MINUTES = 5 * 60 * 1000;

export interface RouteStop {
  lat: number;
  lng: number;
  order?: number;
  stopName?: string;
}

export interface RouteDetails {
  routeId: string;
  routeName?: string;
  source?: string;
  destination?: string;
  distance?: number;
  stops?: RouteStop[];
  // The manager's per-route QR boarding switch; drives the On board card and scanner.
  qrEnabled?: boolean;
}

function unwrap<T>(response: unknown): T {
  return ((response as { data?: T })?.data ?? response) as T;
}

// Route geometry changes rarely, so cache it for a while. Only runs when we have a
// routeId. A 404 (e.g. a manager's PRIVATE custom route) surfaces as a query error.
export function useRouteDetailsQuery(routeId: string | undefined) {
  return useQuery({
    queryKey: qk.route(routeId ?? ''),
    queryFn: async () => unwrap<RouteDetails>(await api.getRouteById(routeId as string)),
    enabled: !!routeId,
    staleTime: FIVE_MINUTES,
    retry: false,
  });
}
