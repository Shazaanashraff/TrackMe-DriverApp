import AsyncStorage from '@react-native-async-storage/async-storage';

const mockDispatchFix = jest.fn();
const mockRestoreDispatchState = jest.fn().mockResolvedValue(undefined);
const mockStartReplayOnReconnect = jest.fn();
const mockGetTrackingTarget = jest.fn();

jest.mock('../locationDispatch', () => ({
  __esModule: true,
  dispatchFix: (...args: unknown[]) => mockDispatchFix(...args),
  restoreDispatchState: () => mockRestoreDispatchState(),
  startReplayOnReconnect: () => mockStartReplayOnReconnect(),
  getTrackingTarget: () => mockGetTrackingTarget(),
}));

const mockConnectSocket = jest.fn();
const mockGetConnectionState = jest.fn();

jest.mock('../socket', () => ({
  __esModule: true,
  connectSocket: (...args: unknown[]) => mockConnectSocket(...args),
  getConnectionState: () => mockGetConnectionState(),
}));

const mockStartLocationUpdatesAsync = jest.fn();
const mockStopLocationUpdatesAsync = jest.fn();
const mockHasStartedLocationUpdatesAsync = jest.fn();

jest.mock('expo-location', () => ({
  __esModule: true,
  startLocationUpdatesAsync: (...args: unknown[]) => mockStartLocationUpdatesAsync(...args),
  stopLocationUpdatesAsync: (...args: unknown[]) => mockStopLocationUpdatesAsync(...args),
  hasStartedLocationUpdatesAsync: (...args: unknown[]) =>
    mockHasStartedLocationUpdatesAsync(...args),
  Accuracy: { High: 4 },
  ActivityType: { AutomotiveNavigation: 3 },
}));

import {
  LOCATION_TASK_NAME,
  handleBackgroundLocations,
  isBackgroundTrackingActive,
  startBackgroundTracking,
  stopBackgroundTracking,
} from '../backgroundLocation';

const location = (lat: number, lng: number, timestamp?: number) => ({
  coords: { latitude: lat, longitude: lng, accuracy: 8 },
  timestamp,
});

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  mockGetTrackingTarget.mockReturnValue({ vehicleId: 'VH-1', routeId: 'R-1' });
  mockGetConnectionState.mockReturnValue({ status: 'connected' });
  mockHasStartedLocationUpdatesAsync.mockResolvedValue(false);
});

describe('handleBackgroundLocations', () => {
  it('dispatches each fix delivered by the OS', async () => {
    await handleBackgroundLocations([location(6.9271, 79.8612, 1000), location(6.94, 79.88, 5000)]);

    expect(mockDispatchFix).toHaveBeenCalledTimes(2);
    expect(mockDispatchFix).toHaveBeenCalledWith({
      lat: 6.9271,
      lng: 79.8612,
      timestamp: 1000,
      accuracy: 8,
    });
  });

  it('restores persisted state first, since the OS can launch it headless', async () => {
    await handleBackgroundLocations([location(6.9271, 79.8612)]);
    expect(mockRestoreDispatchState).toHaveBeenCalled();
  });

  it('does nothing when no shift is active', async () => {
    mockGetTrackingTarget.mockReturnValue(null);
    await handleBackgroundLocations([location(6.9271, 79.8612)]);
    expect(mockDispatchFix).not.toHaveBeenCalled();
  });

  it('ignores an empty batch', async () => {
    await handleBackgroundLocations([]);
    expect(mockRestoreDispatchState).not.toHaveBeenCalled();
  });

  it('reconnects the socket with the stored token when launched with none', async () => {
    mockGetConnectionState.mockReturnValue({ status: 'disconnected' });
    await AsyncStorage.setItem('token', 'stored-jwt');

    await handleBackgroundLocations([location(6.9271, 79.8612)]);

    expect(mockConnectSocket).toHaveBeenCalledWith('stored-jwt');
    expect(mockStartReplayOnReconnect).toHaveBeenCalled();
  });

  it('still buffers the fix when there is no stored token to reconnect with', async () => {
    mockGetConnectionState.mockReturnValue({ status: 'disconnected' });

    await handleBackgroundLocations([location(6.9271, 79.8612)]);

    expect(mockConnectSocket).not.toHaveBeenCalled();
    expect(mockDispatchFix).toHaveBeenCalled();
  });

  it('does not reconnect when the socket is already up', async () => {
    await handleBackgroundLocations([location(6.9271, 79.8612)]);
    expect(mockConnectSocket).not.toHaveBeenCalled();
  });

  it('falls back to now for a fix the OS reports without a timestamp', async () => {
    await handleBackgroundLocations([location(6.9271, 79.8612)]);
    expect(mockDispatchFix).toHaveBeenCalledWith(
      expect.objectContaining({ timestamp: expect.any(Number) })
    );
  });
});

describe('startBackgroundTracking', () => {
  it('registers OS updates with an Android foreground service', async () => {
    await expect(startBackgroundTracking()).resolves.toBe(true);

    const [taskName, options] = mockStartLocationUpdatesAsync.mock.calls[0];
    expect(taskName).toBe(LOCATION_TASK_NAME);
    // Without this notification Android kills the process within minutes.
    expect(options.foregroundService).toEqual(
      expect.objectContaining({ notificationTitle: expect.any(String) })
    );
    expect(options.pausesUpdatesAutomatically).toBe(false);
  });

  it('is a no-op when updates are already running', async () => {
    mockHasStartedLocationUpdatesAsync.mockResolvedValue(true);

    await expect(startBackgroundTracking()).resolves.toBe(true);
    expect(mockStartLocationUpdatesAsync).not.toHaveBeenCalled();
  });

  it('reports failure rather than throwing when the OS refuses', async () => {
    mockStartLocationUpdatesAsync.mockRejectedValue(new Error('permission denied'));
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(startBackgroundTracking()).resolves.toBe(false);
  });
});

describe('stopBackgroundTracking', () => {
  it('stops OS updates when running', async () => {
    mockHasStartedLocationUpdatesAsync.mockResolvedValue(true);

    await stopBackgroundTracking();

    expect(mockStopLocationUpdatesAsync).toHaveBeenCalledWith(LOCATION_TASK_NAME);
  });

  it('does not call stop when nothing is running', async () => {
    await stopBackgroundTracking();
    expect(mockStopLocationUpdatesAsync).not.toHaveBeenCalled();
  });

  it('swallows a stop failure', async () => {
    mockHasStartedLocationUpdatesAsync.mockResolvedValue(true);
    mockStopLocationUpdatesAsync.mockRejectedValue(new Error('not registered'));
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(stopBackgroundTracking()).resolves.toBeUndefined();
  });
});

describe('isBackgroundTrackingActive', () => {
  it('reports false when the check itself throws', async () => {
    mockHasStartedLocationUpdatesAsync.mockRejectedValue(new Error('no task manager'));
    await expect(isBackgroundTrackingActive()).resolves.toBe(false);
  });
});
