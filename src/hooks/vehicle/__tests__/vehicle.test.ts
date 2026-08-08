import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useMyVehicleQuery, useRegisterVehicle, useUpdateVehicle } from '../index';

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    getMyVehicle: jest.fn(),
    registerVehicle: jest.fn(),
    updateVehicle: jest.fn(),
  },
}));

jest.mock('../../../context/AuthContext', () => ({
  __esModule: true,
  useAuth: () => ({ token: 'tok' }),
}));

import api from '../../../services/api';

const mockApi = api as jest.Mocked<typeof api>;

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidateSpy = jest.spyOn(qc, 'invalidateQueries');
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return { wrapper, invalidateSpy };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useMyVehicleQuery', () => {
  it('returns the vehicle data from api.getMyVehicle', async () => {
    (mockApi.getMyVehicle as jest.Mock).mockResolvedValueOnce({ _id: 'b1', plateNumber: 'ABC-123' });

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useMyVehicleQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.getMyVehicle).toHaveBeenCalledWith('tok');
    expect(result.current.data).toEqual({ _id: 'b1', plateNumber: 'ABC-123' });
  });

  it('refetches on mount even when a cached vehicle is still within staleTime', async () => {
    // The cache is persisted to storage, so a restart restores it. Privacy is
    // set by the manager elsewhere, so serving that copy unchecked left the
    // driver reading Private after being switched to public.
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    qc.setQueryData(['vehicle', 'mine'], {
      data: { driverId: { isPrivate: true } },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children);

    (mockApi.getMyVehicle as jest.Mock).mockResolvedValueOnce({
      data: { driverId: { isPrivate: false } },
    });

    const { result } = renderHook(() => useMyVehicleQuery(), { wrapper });

    await waitFor(() => expect(mockApi.getMyVehicle).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect((result.current.data as { data: { driverId: { isPrivate: boolean } } }).data.driverId.isPrivate).toBe(false)
    );
  });
});

describe('useRegisterVehicle', () => {
  it('calls api.registerVehicle and invalidates myVehicle on success', async () => {
    (mockApi.registerVehicle as jest.Mock).mockResolvedValueOnce({ _id: 'b1' });

    const { wrapper, invalidateSpy } = makeWrapper();
    const { result } = renderHook(() => useRegisterVehicle(), { wrapper });

    act(() => {
      result.current.mutate({ plateNumber: 'ABC-123' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.registerVehicle).toHaveBeenCalledWith({ plateNumber: 'ABC-123' }, 'tok');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['vehicle', 'mine'] });
  });
});

describe('useUpdateVehicle', () => {
  it('calls api.updateVehicle and invalidates myVehicle on success', async () => {
    (mockApi.updateVehicle as jest.Mock).mockResolvedValueOnce({ _id: 'b1', plateNumber: 'XYZ-999' });

    const { wrapper, invalidateSpy } = makeWrapper();
    const { result } = renderHook(() => useUpdateVehicle(), { wrapper });

    act(() => {
      result.current.mutate({ vehicleId: 'b1', updateData: { plateNumber: 'XYZ-999' } });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.updateVehicle).toHaveBeenCalledWith('tok', 'b1', { plateNumber: 'XYZ-999' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['vehicle', 'mine'] });
  });
});
