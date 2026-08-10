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
    // The vehicle carries the driver's privacy status, which only the manager
    // can change and only from another device. Left to staleTime alone, the
    // persisted cache re-serves the old answer on every restart inside the
    // window, so a driver switched to public still reads Private. Revalidating
    // on mount and on focus keeps the cached copy for an instant first paint
    // while correcting it from the server.
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
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
