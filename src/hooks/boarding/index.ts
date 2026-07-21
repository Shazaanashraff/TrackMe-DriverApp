import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { qk } from '../../lib/queryKeys';
import api from '../../services/api';

const THIRTY_SECONDS = 30 * 1000;

export type RosterStatus = 'ON' | 'OFF' | 'NOT_BOARDED';

export type RosterRider = {
  studentId: string;
  studentName: string;
  status: RosterStatus;
  lastEventAt: string | null;
};

export type RosterGuest = {
  studentId: string;
  studentName: string;
  lastEventAt: string | null;
};

export type BoardingRoster = {
  busId: string;
  routeId: string;
  tripId: string;
  enrolledCount: number;
  onBoardCount: number;
  roster: RosterRider[];
  guests: RosterGuest[];
};

type AuthCtx = { token: string | null };

function unwrap<T>(response: unknown): T {
  return ((response as { data?: T })?.data ?? response) as T;
}

// Enrolled roster + live on-board count for the driver's assigned bus. Powers the
// dashboard "X / Y on board" card and the BoardingRoster screen. Kept short-lived so a
// return to the Home tab after scanning reflects the latest counts; the scanner also
// invalidates this query on a successful scan (see useBoardingScan).
export function useBoardingRosterQuery(busId: string) {
  const { token } = useAuth() as AuthCtx;
  return useQuery<BoardingRoster>({
    queryKey: qk.boardingRoster(busId),
    queryFn: async () => unwrap<BoardingRoster>(await api.getBoardingRoster(token!, { busId })),
    enabled: !!token && !!busId,
    staleTime: THIRTY_SECONDS,
  });
}
