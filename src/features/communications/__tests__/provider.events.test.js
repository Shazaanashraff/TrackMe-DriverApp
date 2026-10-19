import React from 'react';
import { AppState, StyleSheet, Text } from 'react-native';
import { render, act, fireEvent, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainerRefContext } from '@react-navigation/native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { CommunicationProvider, RELOAD_COALESCE_MS, popupFor } from '../provider';

// What the driver sees when a socket event arrives. A broadcast to 20 riders
// comes back as 20 events (one per rider's copy), and each used to reload every
// list and pop "New message or absence change", even for the driver's own
// broadcast. These lock down one reload per burst and a popup that says what
// happened, only for things someone else did.
const handlers = {};
const mockSocket = { connected: true, on: jest.fn((event, fn) => { handlers[event] = fn; }), off: jest.fn(), connect: jest.fn() };
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
// No project id: push registration returns before it touches the permission.
jest.mock('expo-constants', () => ({ expoConfig: { extra: {} } }));
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addPushTokenListener: jest.fn(() => ({ remove: jest.fn() })),
}));

const navigation = { isReady: () => true, navigate: jest.fn() };
const insets = { top: 30, bottom: 0, left: 0, right: 0 };

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  jest.spyOn(AppState, 'addEventListener').mockImplementation(() => ({ remove: jest.fn() }));
});
afterEach(() => {
  jest.useRealTimers();
});

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidate = jest.spyOn(client, 'invalidateQueries');
  render(
    <SafeAreaInsetsContext.Provider value={insets}>
      <NavigationContainerRefContext.Provider value={navigation}>
        <QueryClientProvider client={client}>
          <CommunicationProvider>
            <Text>child</Text>
          </CommunicationProvider>
        </QueryClientProvider>
      </NavigationContainerRefContext.Provider>
    </SafeAreaInsetsContext.Provider>
  );
  return invalidate;
}

const deliver = (event) => act(async () => { handlers['communication:event'](event); });
const absent = { eventId: 'absence:c1:2026-10-19:1:ABSENT', sender: 'system', absenceStatus: 'ABSENT', text: 'Amal will be absent on 2026-10-19.' };

describe('CommunicationProvider events', () => {
  test('a burst of events from one broadcast reloads the lists once', async () => {
    const invalidate = mount();
    for (let i = 0; i < 20; i += 1) await deliver({ eventId: `announcement:a1:rider-${i}`, sender: 'driver', text: 'On my way' });
    expect(invalidate).not.toHaveBeenCalled();

    await act(async () => { jest.advanceTimersByTime(RELOAD_COALESCE_MS); });
    expect(invalidate).toHaveBeenCalledTimes(1);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['communications', 'driver-1'] });

    // A later event starts a new window.
    await deliver(absent);
    await act(async () => { jest.advanceTimersByTime(RELOAD_COALESCE_MS); });
    expect(invalidate).toHaveBeenCalledTimes(2);
  });

  test('nothing pops up for the driver’s own broadcast, own acknowledgment or a read receipt', async () => {
    mount();
    await deliver({ eventId: 'announcement:a1:rider-1', sender: 'driver', text: 'On my way' });
    await deliver({ eventId: 'absence:c1:2026-10-19:1:ACKNOWLEDGED', sender: 'system', absenceStatus: 'ACKNOWLEDGED', text: 'Driver acknowledged that Amal will be absent on 2026-10-19.' });
    await deliver({ eventId: 'read:c1:user:m1' });

    expect(screen.queryByRole('button')).toBeNull();
  });

  test('an absence pops up with what happened, below the status bar, and a tap opens Absences', async () => {
    mount();
    await deliver(absent);

    expect(screen.getByText('Absence reported')).toBeTruthy();
    expect(screen.getByText('Amal will be absent on 2026-10-19.')).toBeTruthy();
    const popup = screen.getByTestId('communication-popup');
    expect(StyleSheet.flatten(popup.props.style).top).toBe(insets.top + 8);

    fireEvent.press(popup);
    expect(navigation.navigate).toHaveBeenCalledWith('MainTabs', { screen: 'Riders', params: { tab: 'absences', openedAt: expect.any(Number) } });
    expect(screen.queryByTestId('communication-popup')).toBeNull();
  });

  test('the same event arriving twice pops up once', async () => {
    mount();
    await deliver(absent);
    fireEvent.press(screen.getByTestId('communication-popup'));
    await deliver(absent);

    expect(screen.queryByTestId('communication-popup')).toBeNull();
  });
});

describe('popupFor', () => {
  test('names each absence change and falls back to a message', () => {
    expect(popupFor({ eventId: 'e1', absenceStatus: 'CANCELLED', text: 'Amal is coming on 2026-10-19, absence cancelled.' }))
      .toEqual({ title: 'Absence cancelled', body: 'Amal is coming on 2026-10-19, absence cancelled.', absence: true });
    expect(popupFor({ eventId: 'e2', absenceStatus: 'RETIRED', text: 'Retired.' }).title).toBe('Absence notice retired');
    expect(popupFor({ eventId: 'e3', sender: 'user', text: 'Hello' })).toEqual({ title: 'New message', body: 'Hello', absence: false });
  });
});
