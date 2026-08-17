import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useLogin,
  useRegister,
  useLogout,
  useMeQuery,
  useMyEnrollmentKeyQuery,
  useRequestPasswordResetOtp,
  useVerifyPasswordResetOtp,
  useResetPassword,
} from '../index';

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getMe: jest.fn(),
    getMyEnrollmentKey: jest.fn(),
    requestPasswordResetOtp: jest.fn(),
    verifyPasswordResetOtp: jest.fn(),
    resetPassword: jest.fn(),
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
    token: 'tok',
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
      result.current.mutate({ identifier: 'a@b.com', password: 'pass' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.login).toHaveBeenCalledWith('a@b.com', 'pass');
    expect(mockLogin).toHaveBeenCalledWith(
      { _id: '1', name: 'Driver One', email: 'a@b.com', role: 'driver' },
      'tok',
      'ref'
    );
  });

  it('signs in with a driver ID and keeps it on the saved account', async () => {
    const fakeData = {
      user: {
        _id: '3', name: 'Code Driver', email: '', driverCode: 'DRV-4K7P-9XQ2', role: 'driver',
      },
      accessToken: 'tok',
      refreshToken: 'ref',
    };
    (mockApi.login as jest.Mock).mockResolvedValueOnce(fakeData);

    const { result } = renderHook(() => useLogin(), { wrapper: makeWrapper() });
    act(() => {
      result.current.mutate({ identifier: 'DRV-4K7P-9XQ2', password: 'pass' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.login).toHaveBeenCalledWith('DRV-4K7P-9XQ2', 'pass');
    expect(mockLogin).toHaveBeenCalledWith(
      { _id: '3', name: 'Code Driver', email: '', driverCode: 'DRV-4K7P-9XQ2', role: 'driver' },
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
      result.current.mutate({ identifier: 'p@b.com', password: 'pass' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockLogin).not.toHaveBeenCalled();
    expect((result.current.error as Error).message).toBe('This app is for drivers only');
  });

  it('surfaces error on api failure', async () => {
    (mockApi.login as jest.Mock).mockRejectedValueOnce(new Error('Bad credentials'));

    const { result } = renderHook(() => useLogin(), { wrapper: makeWrapper() });
    act(() => {
      result.current.mutate({ identifier: 'a@b.com', password: 'wrong' });
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

describe('useLogin — manager-maintained details', () => {
  it('keeps the phone number on the saved account', async () => {
    // The stored account is built field by field, so anything left out of that
    // list is simply absent afterwards. The profile screen showed "-" for every
    // driver's phone because phoneNumber was never carried over.
    (mockApi.login as jest.Mock).mockResolvedValueOnce({
      user: {
        _id: '4', name: 'Phoned Driver', email: '', driverCode: 'DRV-1111-2222',
        phoneNumber: '0766518388', role: 'driver',
      },
      accessToken: 'tok',
      refreshToken: 'ref',
    });

    const { result } = renderHook(() => useLogin(), { wrapper: makeWrapper() });
    act(() => {
      result.current.mutate({ identifier: 'DRV-1111-2222', password: 'pass' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockLogin).toHaveBeenCalledWith(
      expect.objectContaining({ phoneNumber: '0766518388' }),
      'tok',
      'ref'
    );
  });
});

describe('useMeQuery', () => {
  it('reads the account back from the server', async () => {
    (mockApi.getMe as jest.Mock).mockResolvedValueOnce({
      user: { _id: '1', name: 'Driver One', phoneNumber: '0766518388', role: 'driver' },
    });

    const { result } = renderHook(() => useMeQuery(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.getMe).toHaveBeenCalledWith('tok');
    expect((result.current.data as { user: { phoneNumber: string } }).user.phoneNumber)
      .toBe('0766518388');
  });

  it('refetches on mount rather than trusting what is already cached', async () => {
    // A manager edits these details on their own device, so a cached copy has
    // no way of knowing it is out of date.
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    qc.setQueryData(['me'], { user: { phoneNumber: '0000000000' } });
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children);

    (mockApi.getMe as jest.Mock).mockResolvedValueOnce({
      user: { phoneNumber: '0771234567' },
    });

    const { result } = renderHook(() => useMeQuery(), { wrapper });

    await waitFor(() => expect(mockApi.getMe).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect((result.current.data as { user: { phoneNumber: string } }).user.phoneNumber)
        .toBe('0771234567')
    );
  });
});

describe('useMyEnrollmentKeyQuery', () => {
  it('reads the driver own key', async () => {
    (mockApi.getMyEnrollmentKey as jest.Mock).mockResolvedValueOnce({
      data: { enrollmentKey: 'TMD-QMCZ-9NL2-TJNQ', isPrivate: true },
    });

    const { result } = renderHook(() => useMyEnrollmentKeyQuery(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.getMyEnrollmentKey).toHaveBeenCalledWith('tok');
  });

  it('refetches on mount, since a rotation silently voids the cached key', async () => {
    // Handing out a key the manager has already replaced is worse than a
    // spinner: the passenger's redeem just fails.
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    qc.setQueryData(['me', 'enrollment-key'], { data: { enrollmentKey: 'TMD-OLD0-OLD0-OLD0' } });
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children);

    (mockApi.getMyEnrollmentKey as jest.Mock).mockResolvedValueOnce({
      data: { enrollmentKey: 'TMD-P44B-X3RF-YGNX' },
    });

    const { result } = renderHook(() => useMyEnrollmentKeyQuery(), { wrapper });

    await waitFor(() => expect(mockApi.getMyEnrollmentKey).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect((result.current.data as { data: { enrollmentKey: string } }).data.enrollmentKey)
        .toBe('TMD-P44B-X3RF-YGNX')
    );
  });
});

describe('useRequestPasswordResetOtp', () => {
  it('calls api.requestPasswordResetOtp with the email', async () => {
    (mockApi.requestPasswordResetOtp as jest.Mock).mockResolvedValueOnce({ message: 'sent' });

    const { result } = renderHook(() => useRequestPasswordResetOtp(), { wrapper: makeWrapper() });
    act(() => {
      result.current.mutate({ email: 'driver@company.com' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.requestPasswordResetOtp).toHaveBeenCalledWith('driver@company.com');
  });
});

describe('useVerifyPasswordResetOtp', () => {
  it('calls api.verifyPasswordResetOtp with email and otp', async () => {
    (mockApi.verifyPasswordResetOtp as jest.Mock).mockResolvedValueOnce({ resetToken: 'tok' });

    const { result } = renderHook(() => useVerifyPasswordResetOtp(), { wrapper: makeWrapper() });
    act(() => {
      result.current.mutate({ email: 'driver@company.com', otp: '123456' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.verifyPasswordResetOtp).toHaveBeenCalledWith('driver@company.com', '123456');
  });
});

describe('useResetPassword', () => {
  it('calls api.resetPassword with email, resetToken, and password', async () => {
    (mockApi.resetPassword as jest.Mock).mockResolvedValueOnce({ message: 'reset' });

    const { result } = renderHook(() => useResetPassword(), { wrapper: makeWrapper() });
    act(() => {
      result.current.mutate({ email: 'driver@company.com', resetToken: 'tok', password: 'newpass1' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.resetPassword).toHaveBeenCalledWith('driver@company.com', 'tok', 'newpass1');
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
