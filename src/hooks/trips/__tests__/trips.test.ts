import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useDriverTripsQuery } from '../index';

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    getDriverTrips: jest.fn(),
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
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return { wrapper, qc };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useDriverTripsQuery', () => {
  it('returns trips from api.getDriverTrips', async () => {
    (mockApi.getDriverTrips as jest.Mock).mockResolvedValueOnce({ trips: [{ _id: 't1' }] });

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useDriverTripsQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.getDriverTrips).toHaveBeenCalledWith('tok', { page: 1, limit: 30 });
    expect(result.current.data).toEqual({ trips: [{ _id: 't1' }] });
  });

  it('is loading only until the first response resolves', async () => {
    let resolveFn: (value: unknown) => void = () => {};
    (mockApi.getDriverTrips as jest.Mock).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFn = resolve;
        })
    );

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useDriverTripsQuery(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveFn({ trips: [] });
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  // Issue #15: cached trips must render instantly on revisit, and a later
  // background-refetch failure must not clear them back to an empty list.
  it('serves cached data instantly and keeps it after a later fetch error', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(['trips', 'history', 1], { trips: [{ _id: 'cached' }] });
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children);

    (mockApi.getDriverTrips as jest.Mock).mockRejectedValueOnce(new Error('network down'));

    const { result } = renderHook(() => useDriverTripsQuery(), { wrapper });

    // Cached data is available immediately — no skeleton/blank state on revisit.
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual({ trips: [{ _id: 'cached' }] });

    await waitFor(() => expect(result.current.isError).toBe(true));
    // The failed background refresh must not wipe the previously cached trips.
    expect(result.current.data).toEqual({ trips: [{ _id: 'cached' }] });
  });
});
