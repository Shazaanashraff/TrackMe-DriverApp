import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { queryClient } from '../../app/queryClient';
import { AppError } from '../../lib/errors';
import api from '../../services/api';

// AuthContext is JavaScript; cast to avoid TS inference of `{}` from createContext({}).
type AuthCtx = {
  login: (user: unknown, token: string, refreshToken?: string | null) => Promise<void>;
  logout: () => Promise<void>;
};

type DriverUser = {
  _id: string;
  name: string;
  email: string;
  // The permanent sign-in ID. Absent on accounts created before driver IDs
  // existed, until the backend backfill runs.
  driverCode?: string;
  role: string;
};

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

export function useLogout() {
  const { logout } = useAuth() as AuthCtx;

  return useMutation({
    mutationFn: () => logout(),
    onSettled: () => {
      queryClient.clear();
    },
  });
}
