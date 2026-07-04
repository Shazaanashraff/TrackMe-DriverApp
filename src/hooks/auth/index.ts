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
  role: string;
};

export function useLogin() {
  const { login } = useAuth() as AuthCtx;

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = (await api.login(email, password)) as {
        user: DriverUser;
        accessToken: string;
        refreshToken?: string;
      };
      const { user, accessToken, refreshToken } = response;

      // Driver role-gate: mirrors the current LoginScreen — reject and do not save
      // auth for non-driver accounts.
      if (user.role !== 'driver') {
        throw new AppError('http', 'This app is for drivers only', { status: 403 });
      }

      await login(
        { _id: user._id, name: user.name, email: user.email, role: user.role },
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
