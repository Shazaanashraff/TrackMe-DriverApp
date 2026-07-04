import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, asyncStoragePersister, persistOptions } from '../queryClient';
import { QueryClient } from '@tanstack/react-query';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('queryClient', () => {
  it('is a QueryClient instance', () => {
    expect(queryClient).toBeInstanceOf(QueryClient);
  });

  it('has offlineFirst networkMode for queries', () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.queries?.networkMode).toBe('offlineFirst');
  });

  it('has offlineFirst networkMode for mutations', () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.mutations?.networkMode).toBe('offlineFirst');
  });

  it('has staleTime of 30 seconds', () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.queries?.staleTime).toBe(30_000);
  });
});

describe('asyncStoragePersister', () => {
  it('is constructed without throwing', () => {
    expect(asyncStoragePersister).toBeDefined();
  });
});

describe('persistOptions', () => {
  it('has a 24h maxAge', () => {
    expect(persistOptions.maxAge).toBe(24 * 60 * 60 * 1000);
  });

  it('persists bus prefix', () => {
    const { shouldDehydrateQuery } = persistOptions.dehydrateOptions;
    expect(shouldDehydrateQuery({ queryKey: ['bus', 'mine'] })).toBe(true);
  });

  it('persists routes prefix', () => {
    const { shouldDehydrateQuery } = persistOptions.dehydrateOptions;
    expect(shouldDehydrateQuery({ queryKey: ['routes'] })).toBe(true);
  });

  it('persists earnings prefix', () => {
    const { shouldDehydrateQuery } = persistOptions.dehydrateOptions;
    expect(shouldDehydrateQuery({ queryKey: ['earnings', 'stats'] })).toBe(true);
  });

  it('does not persist an unrelated prefix', () => {
    const { shouldDehydrateQuery } = persistOptions.dehydrateOptions;
    expect(shouldDehydrateQuery({ queryKey: ['tracking', 'session'] })).toBe(false);
  });
});

describe('PersistQueryClientProvider', () => {
  it('renders children without crashing (AsyncStorage mocked)', () => {
    const { getByText } = render(
      <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
        <Text>ready</Text>
      </PersistQueryClientProvider>
    );
    expect(getByText('ready')).toBeTruthy();
  });
});
