import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useRoutesQuery, useRoutesManagementQuery, useCreateRoute } from '../index';

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    getRoutes: jest.fn(),
    getRoutesManagementList: jest.fn(),
    createRoute: jest.fn(),
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

describe('useRoutesQuery', () => {
  it('returns data from api.getRoutes using the token', async () => {
    (mockApi.getRoutes as jest.Mock).mockResolvedValueOnce([{ _id: 'r1' }]);

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useRoutesQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.getRoutes).toHaveBeenCalledWith('tok');
    expect(result.current.data).toEqual([{ _id: 'r1' }]);
  });
});

describe('useRoutesManagementQuery', () => {
  it('returns data from api.getRoutesManagementList without a token', async () => {
    (mockApi.getRoutesManagementList as jest.Mock).mockResolvedValueOnce([{ _id: 'r2' }]);

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useRoutesManagementQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.getRoutesManagementList).toHaveBeenCalledWith();
    expect(result.current.data).toEqual([{ _id: 'r2' }]);
  });
});

describe('useCreateRoute', () => {
  it('calls api.createRoute and invalidates routes on success', async () => {
    (mockApi.createRoute as jest.Mock).mockResolvedValueOnce({ _id: 'r3' });

    const { wrapper, invalidateSpy } = makeWrapper();
    const { result } = renderHook(() => useCreateRoute(), { wrapper });

    act(() => {
      result.current.mutate({ source: 'A', destination: 'B' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.createRoute).toHaveBeenCalledWith('tok', { source: 'A', destination: 'B' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['routes'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['routes', 'management'] });
  });
});
