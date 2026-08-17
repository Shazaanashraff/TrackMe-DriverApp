import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { queryClient } from '../../app/queryClient';
import { qk } from '../../lib/queryKeys';
import { AppError } from '../../lib/errors';
import api from '../../services/api';

// AuthContext is JavaScript; cast to avoid TS inference of `{}` from createContext({}).
type AuthCtx = {
  login: (user: unknown, token: string, refreshToken?: string | null) => Promise<void>;
  logout: () => Promise<void>;
  token: string | null;
};

type DriverUser = {
  _id: string;
  name: string;
  email: string;
  // The permanent sign-in ID. Absent on accounts created before driver IDs
  // existed, until the backend backfill runs.
  driverCode?: string;
  // Set by the driver's manager, not by the driver.
  phoneNumber?: string;
  role: string;
};

// A driver's own details are maintained by their manager on another device, so
// what was stored at sign-in can be out of date with nothing to announce it.
// Revalidating on mount and on focus is what makes an edit show up, rather than
// waiting for the driver to sign out and back in.
export function useMeQuery() {
  const { token } = useAuth() as AuthCtx;
  return useQuery({
    queryKey: qk.me(),
    queryFn: () => api.getMe(token!),
    enabled: !!token,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

// The manager can rotate this key, which silently invalidates the old one, so a
// driver reading a stale card would be handing out a code that no longer works.
// Same revalidation as useMeQuery, and note the `me` prefix keeps it out of the
// persisted cache (see app/queryClient) — a bearer credential stays in memory.
export function useMyEnrollmentKeyQuery() {
  const { token } = useAuth() as AuthCtx;
  return useQuery({
    queryKey: qk.myEnrollmentKey(),
    queryFn: () => api.getMyEnrollmentKey(token!),
    enabled: !!token,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

export function useLogin() {
  const { login } = useAuth() as AuthCtx;

  return useMutation({
    // `identifier` is whatever was typed into the sign-in box: a driver ID or
    // an email.
    mutationFn: async ({ identifier, password }: { identifier: string; password: string }) => {
      const response = (await api.login(identifier, password)) as {
        user: DriverUser;
        accessToken: string;
        refreshToken?: string;
      };
      const { user, accessToken, refreshToken } = response;

      // Driver role-gate: mirrors the current LoginScreen: reject and do not save
      // auth for non-driver accounts.
      if (user.role !== 'driver') {
        throw new AppError('http', 'This app is for drivers only', {
          status: 403,
          code: 'NOT_A_DRIVER',
        });
      }

      await login(
        {
          _id: user._id,
          name: user.name,
          email: user.email,
          driverCode: user.driverCode,
          phoneNumber: user.phoneNumber,
          role: user.role,
        },
        accessToken,
        refreshToken
      );

      return response;
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: ({
      name,
      email,
      password,
    }: {
      name: string;
      email: string;
      password: string;
    }) => api.register(name, email, password, 'driver'),
  });
}

export function useRequestPasswordResetOtp() {
  return useMutation({
    mutationFn: ({ email }: { email: string }) => api.requestPasswordResetOtp(email),
  });
}

export function useVerifyPasswordResetOtp() {
  return useMutation({
    mutationFn: ({ email, otp }: { email: string; otp: string }) =>
      api.verifyPasswordResetOtp(email, otp),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({
      email,
      resetToken,
      password,
    }: {
      email: string;
      resetToken: string;
      password: string;
    }) => api.resetPassword(email, resetToken, password),
  });
}

export function useLogout() {
  const { logout } = useAuth() as AuthCtx;

  return useMutation({
    mutationFn: () => logout(),
    onSettled: () => {
      queryClient.clear();
    },
  });
}
