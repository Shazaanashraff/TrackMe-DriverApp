import React from 'react';
import { AppState, Platform, Text } from 'react-native';
import { render, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainerRefContext } from '@react-navigation/native';
import { CommunicationProvider, pushTapParams } from '../provider';

// A pushed driver update must open the right screen when tapped from the shade or
// lock screen, including the tap that launches a killed app, and Android must get
// the channels the backend names.
const mockSocket = { connected: true, on: jest.fn(), off: jest.fn(), connect: jest.fn() };
jest.mock('../../../services/socket', () => ({
  connectSocket: jest.fn(() => mockSocket),
  disconnectSocket: jest.fn(),
  getSocket: jest.fn(() => mockSocket),
}));
jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ user: { _id: 'driver-1', role: 'driver' }, token: 'token' }),
}));
jest.mock('../../../context/NetworkStatusContext', () => ({ useNetworkStatus: () => ({ isOffline: false }) }));
jest.mock('../transport', () => ({ useCommunicationTransport: () => jest.fn(() => Promise.resolve({})) }));
jest.mock('expo-constants', () => ({ expoConfig: { extra: { eas: { projectId: 'project-1' } } } }));

let mockLast = null;
const mockResponseListeners = [];
const mockNotifications = {
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'ExponentPushToken[abc]' })),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn((fn) => { mockResponseListeners.push(fn); return { remove: jest.fn() }; }),
  getLastNotificationResponseAsync: jest.fn(() => Promise.resolve(mockLast)),
  addPushTokenListener: jest.fn(() => ({ remove: jest.fn() })),
  AndroidImportance: { HIGH: 4, DEFAULT: 3 },
  AndroidNotificationVisibility: { PUBLIC: 1 },
};
jest.mock('expo-notifications', () => mockNotifications);

const push = (data, id = 'n1') => ({ notification: { request: { identifier: id, content: { data } } } });
let navigation;
const originalOS = Platform.OS;

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  mockLast = null;
  mockResponseListeners.length = 0;
  navigation = { isReady: () => true, navigate: jest.fn() };
  jest.spyOn(AppState, 'addEventListener').mockImplementation(() => ({ remove: jest.fn() }));
});
afterEach(() => { jest.useRealTimers(); Platform.OS = originalOS; });

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <NavigationContainerRefContext.Provider value={navigation}>
      <QueryClientProvider client={client}>
        <CommunicationProvider><Text>child</Text></CommunicationProvider>
      </QueryClientProvider>
    </NavigationContainerRefContext.Provider>
  );
}
const flush = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });

describe('pushTapParams', () => {
  test('an absence change opens the Absences list, anything else the Riders tab', () => {
    expect(pushTapParams({ absenceStatus: 'ABSENT' })).toMatchObject({ screen: 'Riders', params: { tab: 'absences' } });
    expect(pushTapParams({ sender: 'rider' })).toEqual({ screen: 'Riders', params: undefined });
  });
});

describe('tapping a push', () => {
  test('opens the Absences list for an absence push', async () => {
    mount(); await flush();
    mockResponseListeners[0](push({ type: 'COMMUNICATION', absenceStatus: 'ABSENT' }));
    expect(navigation.navigate).toHaveBeenCalledWith('MainTabs', expect.objectContaining({ screen: 'Riders', params: expect.objectContaining({ tab: 'absences' }) }));
  });

  test('ignores pushes of other types', async () => {
    mount(); await flush();
    mockResponseListeners[0](push({ type: 'APP_UPDATE_AVAILABLE' }));
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  test('the push that launched the app opens its screen, once per push', async () => {
    mockLast = push({ type: 'COMMUNICATION', absenceStatus: 'CANCELLED' }, 'launch-1');
    mount(); await flush();
    expect(navigation.navigate).toHaveBeenCalledTimes(1);
    mount(); await flush(); // sign-out/in or remount in the same session
    expect(navigation.navigate).toHaveBeenCalledTimes(1);
  });

  test('waits for the navigator when the app was launched by the tap', async () => {
    let ready = false;
    navigation = { isReady: () => ready, navigate: jest.fn() };
    mockLast = push({ type: 'COMMUNICATION', absenceStatus: 'ABSENT' }, 'launch-2');
    mount(); await flush();
    expect(navigation.navigate).not.toHaveBeenCalled();
    ready = true;
    await act(async () => { jest.advanceTimersByTime(500); });
    expect(navigation.navigate).toHaveBeenCalledTimes(1);
  });
});

describe('Android channels', () => {
  test('creates communications and account, visible on the lock screen', async () => {
    Platform.OS = 'android';
    mount(); await flush();
    const calls = mockNotifications.setNotificationChannelAsync.mock.calls;
    expect(calls.map((c) => c[0])).toEqual(['communications', 'account']);
    expect(calls.every((c) => c[1].lockscreenVisibility === 1)).toBe(true);
  });
});
