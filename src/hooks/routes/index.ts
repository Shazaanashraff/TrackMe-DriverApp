import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { qk } from '../../lib/queryKeys';
import api from '../../services/api';

const FIVE_MINUTES = 5 * 60 * 1000;

type AuthCtx = { token: string | null };

export function useRoutesQuery() {
  const { token } = useAuth() as AuthCtx;
  return useQuery({
    queryKey: qk.routes(),
    queryFn: () => api.getRoutes(token!),
    staleTime: FIVE_MINUTES,
    enabled: !!token,
  });
}

// Public — no auth header, no token gate.
export function useRoutesManagementQuery() {
  return useQuery({
    queryKey: qk.routesManagement(),
    queryFn: () => api.getRoutesManagementList(),
    staleTime: FIVE_MINUTES,
  });
}

export function useCreateRoute() {
  const { token } = useAuth() as AuthCtx;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (routeData: Record<string, unknown>) => api.createRoute(token!, routeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.routes() });
      queryClient.invalidateQueries({ queryKey: qk.routesManagement() });
    },
  });
}
