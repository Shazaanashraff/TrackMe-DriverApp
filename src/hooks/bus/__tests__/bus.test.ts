import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useMyBusQuery, useRegisterBus, useUpdateBus } from '../index';

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    getMyBus: jest.fn(),
    registerBus: jest.fn(),
    updateBus: jest.fn(),
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

describe('useMyBusQuery', () => {
  it('returns the bus data from api.getMyBus', async () => {
    (mockApi.getMyBus as jest.Mock).mockResolvedValueOnce({ _id: 'b1', plateNumber: 'ABC-123' });

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useMyBusQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.getMyBus).toHaveBeenCalledWith('tok');
    expect(result.current.data).toEqual({ _id: 'b1', plateNumber: 'ABC-123' });
  });
});

describe('useRegisterBus', () => {
  it('calls api.registerBus and invalidates myBus on success', async () => {
    (mockApi.registerBus as jest.Mock).mockResolvedValueOnce({ _id: 'b1' });

    const { wrapper, invalidateSpy } = makeWrapper();
    const { result } = renderHook(() => useRegisterBus(), { wrapper });

    act(() => {
      result.current.mutate({ plateNumber: 'ABC-123' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.registerBus).toHaveBeenCalledWith({ plateNumber: 'ABC-123' }, 'tok');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['bus', 'mine'] });
  });
});

describe('useUpdateBus', () => {
  it('calls api.updateBus and invalidates myBus on success', async () => {
    (mockApi.updateBus as jest.Mock).mockResolvedValueOnce({ _id: 'b1', plateNumber: 'XYZ-999' });

    const { wrapper, invalidateSpy } = makeWrapper();
    const { result } = renderHook(() => useUpdateBus(), { wrapper });

    act(() => {
      result.current.mutate({ busId: 'b1', updateData: { plateNumber: 'XYZ-999' } });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.updateBus).toHaveBeenCalledWith('tok', 'b1', { plateNumber: 'XYZ-999' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['bus', 'mine'] });
  });
});
