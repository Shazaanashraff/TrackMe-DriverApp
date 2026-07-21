import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useBoardingRosterQuery } from '../index';

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    getBoardingRoster: jest.fn(),
  },
}));

jest.mock('../../../context/AuthContext', () => ({
  __esModule: true,
  useAuth: () => ({ token: 'tok' }),
}));

import api from '../../../services/api';

const mockApi = api as jest.Mocked<typeof api>;

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return { wrapper };
}

const ROSTER = {
  busId: 'BUS-1',
  routeId: 'RT-1',
  tripId: 'BUS-1#2026-07-22',
  enrolledCount: 3,
  onBoardCount: 1,
  roster: [{ studentId: 's1', studentName: 'Anna', status: 'ON', lastEventAt: '2026-07-22T08:00:00Z' }],
  guests: [],
};

beforeEach(() => jest.clearAllMocks());

describe('useBoardingRosterQuery', () => {
  it('unwraps { data } and returns the roster', async () => {
    (mockApi.getBoardingRoster as jest.Mock).mockResolvedValueOnce({ success: true, data: ROSTER });

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useBoardingRosterQuery('BUS-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.getBoardingRoster).toHaveBeenCalledWith('tok', { busId: 'BUS-1' });
    expect(result.current.data?.enrolledCount).toBe(3);
    expect(result.current.data?.onBoardCount).toBe(1);
    expect(result.current.data?.roster[0].studentName).toBe('Anna');
  });

  it('is disabled (no fetch) when busId is empty', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useBoardingRosterQuery(''), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockApi.getBoardingRoster).not.toHaveBeenCalled();
  });

  it('surfaces an error from the endpoint', async () => {
    (mockApi.getBoardingRoster as jest.Mock).mockRejectedValueOnce(new Error('403'));

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useBoardingRosterQuery('BUS-1'), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
