import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { qk } from '../../lib/queryKeys';
import api from '../../services/api';

const SIXTY_SECONDS = 60 * 1000;
const THIRTY_SECONDS = 30 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

type AuthCtx = { token: string | null };

export function useEarningsStatsQuery() {
  const { token } = useAuth() as AuthCtx;
  return useQuery({
    queryKey: qk.earningsStats(),
    queryFn: () => api.getDriverEarningsStats(token!),
    staleTime: SIXTY_SECONDS,
    gcTime: ONE_HOUR,
    enabled: !!token,
  });
}

export function useEarningsHistoryQuery(page = 1, limit = 10) {
  const { token } = useAuth() as AuthCtx;
  return useQuery({
    queryKey: qk.earningsHistory(page),
    queryFn: () => api.getDriverEarningsHistory(token!, { page, limit }),
    staleTime: THIRTY_SECONDS,
    gcTime: ONE_HOUR,
    enabled: !!token,
    placeholderData: keepPreviousData,
  });
}

export function useDailyBreakdownQuery() {
  const { token } = useAuth() as AuthCtx;
  return useQuery({
    queryKey: qk.dailyBreakdown(),
    queryFn: () => api.getDriverDailyBreakdown(token!),
    staleTime: SIXTY_SECONDS,
    gcTime: ONE_HOUR,
    enabled: !!token,
  });
}

export function useRequestPayout() {
  const { token } = useAuth() as AuthCtx;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      earningId,
      bankAccount,
    }: {
      earningId: string;
      bankAccount: unknown;
    }) => api.requestDriverPayout(token!, earningId, bankAccount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['earnings'] });
    },
  });
}
