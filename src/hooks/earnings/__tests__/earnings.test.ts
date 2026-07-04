import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useEarningsStatsQuery,
  useEarningsHistoryQuery,
  useDailyBreakdownQuery,
  useRequestPayout,
} from '../index';

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    getDriverEarningsStats: jest.fn(),
    getDriverEarningsHistory: jest.fn(),
    getDriverDailyBreakdown: jest.fn(),
    requestDriverPayout: jest.fn(),
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

describe('useEarningsStatsQuery', () => {
  it('returns data from api.getDriverEarningsStats', async () => {
    (mockApi.getDriverEarningsStats as jest.Mock).mockResolvedValueOnce({ totalEarnings: 500 });

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useEarningsStatsQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.getDriverEarningsStats).toHaveBeenCalledWith('tok');
    expect(result.current.data).toEqual({ totalEarnings: 500 });
  });
});

describe('useEarningsHistoryQuery', () => {
  it('requests the given page and limit', async () => {
    (mockApi.getDriverEarningsHistory as jest.Mock).mockResolvedValueOnce({ earnings: ['p1'] });

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useEarningsHistoryQuery(1, 10), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.getDriverEarningsHistory).toHaveBeenCalledWith('tok', { page: 1, limit: 10 });
  });

  it('fetches a distinct page independently', async () => {
    (mockApi.getDriverEarningsHistory as jest.Mock)
      .mockResolvedValueOnce({ earnings: ['p1'] })
      .mockResolvedValueOnce({ earnings: ['p2'] });

    const { wrapper } = makeWrapper();
    const { result, rerender } = renderHook(({ page }) => useEarningsHistoryQuery(page, 10), {
      wrapper,
      initialProps: { page: 1 },
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    rerender({ page: 2 });
    await waitFor(() =>
      expect(mockApi.getDriverEarningsHistory).toHaveBeenLastCalledWith('tok', {
        page: 2,
        limit: 10,
      })
    );
  });
});

describe('useDailyBreakdownQuery', () => {
  it('returns data from api.getDriverDailyBreakdown', async () => {
    (mockApi.getDriverDailyBreakdown as jest.Mock).mockResolvedValueOnce({ breakdown: [] });

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useDailyBreakdownQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.getDriverDailyBreakdown).toHaveBeenCalledWith('tok');
  });
});

describe('useRequestPayout', () => {
  it('calls api.requestDriverPayout and invalidates earnings on success', async () => {
    (mockApi.requestDriverPayout as jest.Mock).mockResolvedValueOnce({ status: 'PENDING' });

    const { wrapper, invalidateSpy } = makeWrapper();
    const { result } = renderHook(() => useRequestPayout(), { wrapper });

    act(() => {
      result.current.mutate({ earningId: 'e1', bankAccount: { accountNo: '123' } });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.requestDriverPayout).toHaveBeenCalledWith('tok', 'e1', { accountNo: '123' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['earnings'] });
  });
});
