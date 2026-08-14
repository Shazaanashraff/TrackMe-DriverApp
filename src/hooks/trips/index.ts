import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { qk } from '../../lib/queryKeys';
import api from '../../services/api';

type AuthCtx = { token: string | null };

export interface Trip {
  _id: string;
  routeId?: { source?: string; destination?: string };
  journeyDate?: string;
  startTime?: string;
}

export interface DriverTripsResponse {
  trips: Trip[];
}

// Mirrors useMyVehicleQuery / useRouteDetailsQuery: cached data renders instantly on
// revisit (see queryClient.ts's `trips` persist prefix) and a failed background
// refetch leaves the last-known trips in place instead of clearing the screen
// (issue #15 — the old useState/useEffect version called setTrips([]) on any error).
export function useDriverTripsQuery() {
  const { token } = useAuth() as AuthCtx;
  return useQuery({
    queryKey: qk.trips(1),
    queryFn: () => api.getDriverTrips(token!, { page: 1, limit: 30 }) as Promise<DriverTripsResponse>,
    enabled: !!token,
    retry: false,
  });
}
