import { QueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { isOfflineError } from '../lib/errors';

const PERSIST_PREFIXES = ['bus', 'routes', 'earnings'];
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (count, err) => !isOfflineError(err) && count < 2,
      staleTime: 30_000,
      networkMode: 'offlineFirst',
      refetchOnWindowFocus: false,
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'trackme-driver-query-cache',
});

export const persistOptions = {
  persister: asyncStoragePersister,
  maxAge: MAX_AGE_MS,
  dehydrateOptions: {
    shouldDehydrateQuery: (query: { queryKey: readonly unknown[] }) => {
      const [prefix] = query.queryKey;
      return typeof prefix === 'string' && PERSIST_PREFIXES.includes(prefix);
    },
  },
};
