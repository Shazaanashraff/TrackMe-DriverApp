import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { connectSocket, getConnectionState } from './socket';
import {
  dispatchFix,
  restoreDispatchState,
  startReplayOnReconnect,
  getTrackingTarget,
} from './locationDispatch';

export const LOCATION_TASK_NAME = 'trackme-driver-location';

type TaskLocation = {
  coords: { latitude: number; longitude: number; accuracy?: number | null };
  timestamp?: number;
};

/**
 * Handles a batch of fixes delivered by the OS. Exported for tests — the OS
 * entry point is the defineTask registration below.
 *
 * The OS can launch this headless (no React tree, no socket), so it rehydrates
 * the session target and reconnects before dispatching. Anything it can't send
 * lands in the persisted buffer and replays on reconnect.
 */
export async function handleBackgroundLocations(locations: TaskLocation[]): Promise<void> {
  if (!locations?.length) return;

  await restoreDispatchState();
  if (!getTrackingTarget()) return;

  if (getConnectionState().status !== 'connected') {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      connectSocket(token);
      startReplayOnReconnect();
    }
  }

  locations.forEach((location) => {
    dispatchFix({
      lat: location.coords.latitude,
      lng: location.coords.longitude,
      timestamp: location.timestamp ?? Date.now(),
      accuracy: location.coords.accuracy,
    });
  });
}

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('[backgroundLocation] task error:', error.message);
    return;
  }
  const locations = (data as { locations?: TaskLocation[] })?.locations;
  if (locations) await handleBackgroundLocations(locations);
});

export async function isBackgroundTrackingActive(): Promise<boolean> {
  try {
    return await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  } catch {
    return false;
  }
}

/**
 * Promotes the shift to OS-managed background updates. Caller must already hold
 * background permission. Safe to call twice.
 */
export async function startBackgroundTracking(): Promise<boolean> {
  try {
    if (await isBackgroundTrackingActive()) return true;

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      timeInterval: 3000,
      distanceInterval: 3,
      pausesUpdatesAutomatically: false,
      // Android kills a background location process within minutes without a
      // foreground service; this notification is what keeps the shift alive.
      foregroundService: {
        notificationTitle: 'TrackMe is sharing your location',
        notificationBody: 'Your passengers and manager can see this vehicle.',
        notificationColor: '#2563eb',
        killServiceOnDestroy: false,
      },
      // iOS-only: keeps the blue status bar indicator honest while on duty.
      showsBackgroundLocationIndicator: true,
      activityType: Location.ActivityType.AutomotiveNavigation,
    });
    return true;
  } catch (err) {
    console.error('[backgroundLocation] failed to start:', err);
    return false;
  }
}

export async function stopBackgroundTracking(): Promise<void> {
  try {
    if (await isBackgroundTrackingActive()) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
  } catch (err) {
    console.error('[backgroundLocation] failed to stop:', err);
  }
}
