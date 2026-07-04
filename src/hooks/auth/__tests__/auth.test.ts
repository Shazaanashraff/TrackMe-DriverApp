import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useLogin, useRegister, useLogout } from '../index';

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  },
}));

jest.mock('../../../app/queryClient', () => ({
  __esModule: true,
  queryClient: { clear: jest.fn() },
}));

const mockLogin = jest.fn();
const mockLogout = jest.fn();

jest.mock('../../../context/AuthContext', () => ({
  __esModule: true,
  useAuth: () => ({
    login: mockLogin,
    logout: mockLogout,
  }),
}));

import api from '../../../services/api';
import { queryClient } from '../../../app/queryClient';

const mockApi = api as jest.Mocked<typeof api>;

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useLogin', () => {
  it('calls api.login and saves auth on success for a driver', async () => {
    const fakeData = {
      user: { _id: '1', name: 'Driver One', email: 'a@b.com', role: 'driver' },
      accessToken: 'tok',
      refreshToken: 'ref',
    };
    (mockApi.login as jest.Mock).mockResolvedValueOnce(fakeData);

    const { result } = renderHook(() => useLogin(), { wrapper: makeWrapper() });
    act(() => {
      result.current.mutate({ email: 'a@b.com', password: 'pass' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.login).toHaveBeenCalledWith('a@b.com', 'pass');
    expect(mockLogin).toHaveBeenCalledWith(
      { _id: '1', name: 'Driver One', email: 'a@b.com', role: 'driver' },
      'tok',
      'ref'
    );
  });

  it('rejects a non-driver account and does not save auth', async () => {
    const fakeData = {
      user: { _id: '2', name: 'Passenger', email: 'p@b.com', role: 'passenger' },
      accessToken: 'tok',
      refreshToken: 'ref',
    };
    (mockApi.login as jest.Mock).mockResolvedValueOnce(fakeData);

    const { result } = renderHook(() => useLogin(), { wrapper: makeWrapper() });
    act(() => {
      result.current.mutate({ email: 'p@b.com', password: 'pass' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockLogin).not.toHaveBeenCalled();
    expect((result.current.error as Error).message).toBe('This app is for drivers only');
  });

  it('surfaces error on api failure', async () => {
    (mockApi.login as jest.Mock).mockRejectedValueOnce(new Error('Bad credentials'));

    const { result } = renderHook(() => useLogin(), { wrapper: makeWrapper() });
    act(() => {
      result.current.mutate({ email: 'a@b.com', password: 'wrong' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('Bad credentials');
  });
});

describe('useRegister', () => {
  it('calls api.register with the driver role', async () => {
    (mockApi.register as jest.Mock).mockResolvedValueOnce({ message: 'registered' });

    const { result } = renderHook(() => useRegister(), { wrapper: makeWrapper() });
    act(() => {
      result.current.mutate({ name: 'Alice', email: 'a@b.com', password: 'pass' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.register).toHaveBeenCalledWith('Alice', 'a@b.com', 'pass', 'driver');
  });
});

describe('useLogout', () => {
  it('calls logout and clears the query cache', async () => {
    mockLogout.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useLogout(), { wrapper: makeWrapper() });
    act(() => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockLogout).toHaveBeenCalled();
    expect(queryClient.clear).toHaveBeenCalled();
  });
});
