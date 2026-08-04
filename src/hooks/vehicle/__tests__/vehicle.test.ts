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
