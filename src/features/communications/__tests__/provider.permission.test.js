import React from 'react';
import { AppState, Text } from 'react-native';
import { render, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CommunicationProvider } from '../provider';

// Push registration asks Android for the notification permission. Asking (even when
// already granted) opens the system permission screen, which backgrounds the app, and
// registration re-runs on every return to the foreground. On the driver app that loop
// swallowed taps and, since every return also reloads the dashboard lists, ran the
// backend rate limit out. These lock down when the prompt may appear at all.
const mockSocket = { connected: true, on: jest.fn(), off: jest.fn(), connect: jest.fn() };
jest.mock('../../../services/socket', () => ({
  connectSocket: jest.fn(() => mockSocket),
  disconnectSocket: jest.fn(),
  getSocket: jest.fn(() => mockSocket),
}));
jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ user: { _id: 'driver-1', role: 'driver' }, token: 'token' }),
}));
jest.mock('../../../context/NetworkStatusContext', () => ({
  useNetworkStatus: () => ({ isOffline: false }),
}));
const mockRequest = jest.fn(() => Promise.resolve({}));
jest.mock('../transport', () => ({ useCommunicationTransport: () => mockRequest }));
jest.mock('expo-constants', () => ({ expoConfig: { extra: { eas: { projectId: 'project-1' } } } }));

const mockNotifications = {
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'ExponentPushToken[abc]' })),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addPushTokenListener: jest.fn(() => ({ remove: jest.fn() })),
  AndroidImportance: { HIGH: 4 },
};
jest.mock('expo-notifications', () => mockNotifications);

const foregroundHandlers = [];
beforeEach(() => {
  jest.clearAllMocks();
  foregroundHandlers.length = 0;
  jest.spyOn(AppState, 'addEventListener').mockImplementation((event, handler) => {
    foregroundHandlers.push(handler);
    return { remove: jest.fn() };
  });
});

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <CommunicationProvider>
        <Text>child</Text>
      </CommunicationProvider>
    </QueryClientProvider>
  );
}

async function returnToForeground() {
  await act(async () => { foregroundHandlers.forEach((h) => h('active')); });
}

describe('CommunicationProvider push permission', () => {
  test('never opens the permission prompt when notifications are already allowed', async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValue({ status: 'granted', canAskAgain: true });
    mount();
    await waitFor(() => expect(mockNotifications.getExpoPushTokenAsync).toHaveBeenCalled());
    await returnToForeground();
    await returnToForeground();

    expect(mockNotifications.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(mockRequest).toHaveBeenCalledWith('/notifications/device-token', 'POST', { token: 'ExponentPushToken[abc]' });
  });

  test('asks once when it may, and not again on each return to the app', async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValue({ status: 'undetermined', canAskAgain: true });
    mockNotifications.requestPermissionsAsync.mockResolvedValue({ status: 'denied', canAskAgain: true });
    mount();
    await waitFor(() => expect(mockNotifications.requestPermissionsAsync).toHaveBeenCalledTimes(1));
    await returnToForeground();
    await returnToForeground();

    expect(mockNotifications.getPermissionsAsync.mock.calls.length).toBeGreaterThan(1);
    expect(mockNotifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(mockNotifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  test('does not ask when Android will no longer show the prompt', async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValue({ status: 'denied', canAskAgain: false });
    mount();
    await waitFor(() => expect(mockNotifications.getPermissionsAsync).toHaveBeenCalled());
    await returnToForeground();

    expect(mockNotifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });
});
