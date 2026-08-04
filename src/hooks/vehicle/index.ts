import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { qk } from '../../lib/queryKeys';
import api from '../../services/api';

const FIVE_MINUTES = 5 * 60 * 1000;

type AuthCtx = { token: string | null };

export function useMyVehicleQuery() {
  const { token } = useAuth() as AuthCtx;
  return useQuery({
    queryKey: qk.myVehicle(),
    queryFn: () => api.getMyVehicle(token!),
    staleTime: FIVE_MINUTES,
    enabled: !!token,
  });
}

export function useRegisterVehicle() {
  const { token } = useAuth() as AuthCtx;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vehicleData: Record<string, unknown>) => api.registerVehicle(vehicleData, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.myVehicle() });
    },
  });
}

export function useUpdateVehicle() {
  const { token } = useAuth() as AuthCtx;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      vehicleId,
      updateData,
    }: {
      vehicleId: string;
      updateData: Record<string, unknown>;
    }) => api.updateVehicle(token!, vehicleId, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.myVehicle() });
    },
  });
}
