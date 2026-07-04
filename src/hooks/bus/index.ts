import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { qk } from '../../lib/queryKeys';
import api from '../../services/api';

const FIVE_MINUTES = 5 * 60 * 1000;

type AuthCtx = { token: string | null };

export function useMyBusQuery() {
  const { token } = useAuth() as AuthCtx;
  return useQuery({
    queryKey: qk.myBus(),
    queryFn: () => api.getMyBus(token!),
    staleTime: FIVE_MINUTES,
    enabled: !!token,
  });
}

export function useRegisterBus() {
  const { token } = useAuth() as AuthCtx;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (busData: Record<string, unknown>) => api.registerBus(busData, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.myBus() });
    },
  });
}

export function useUpdateBus() {
  const { token } = useAuth() as AuthCtx;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      busId,
      updateData,
    }: {
      busId: string;
      updateData: Record<string, unknown>;
    }) => api.updateBus(token!, busId, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.myBus() });
    },
  });
}
