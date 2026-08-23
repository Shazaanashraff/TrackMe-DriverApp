import React from 'react';
import { render } from '@testing-library/react-native';
import OfflineBanner from '../OfflineBanner';

let mockNetworkState: 'online' | 'degraded' | 'offline' = 'online';

jest.mock('../../../context/NetworkStatusContext', () => ({
  __esModule: true,
  useNetworkStatus: () => ({
    networkState: mockNetworkState,
    isOnline: mockNetworkState === 'online',
    isDegraded: mockNetworkState === 'degraded',
    isOffline: mockNetworkState === 'offline',
    retry: jest.fn(),
  }),
}));

beforeEach(() => {
  mockNetworkState = 'online';
});

describe('OfflineBanner', () => {
  it('renders nothing while online', () => {
    const { toJSON } = render(<OfflineBanner />);
    expect(toJSON()).toBeNull();
  });

  it('renders the offline message when the device has no connection', () => {
    mockNetworkState = 'offline';
    const { getByText, toJSON } = render(<OfflineBanner />);
    expect(getByText(/no connection/i)).toBeTruthy();
    expect(toJSON()).not.toBeNull();
  });

  it('shows a distinct message when online but the backend is unreachable', () => {
    mockNetworkState = 'degraded';
    const { getByText } = render(<OfflineBanner />);
    expect(getByText(/can't reach the server/i)).toBeTruthy();
  });
});
