import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { API_URL } from '../config';

/**
 * Network Status Service - Three-Way State Model
 *
 * States:
 * - 'online': Device connected AND backend healthy
 * - 'degraded': Device connected BUT backend unreachable
 * - 'offline': Device has no connectivity
 *
 * This replaces the old boolean backendOnline with richer state
 * so screens can show cached data with appropriate indicators.
 */

const listeners = new Set();

// Internal state
let deviceOnline = true;
let backendHealthy = true;
let healthMonitorStarted = false;
let healthTimer = null;
let appStateSubscription = null;
let netInfoSubscription = null;

const CONNECTION_ERROR_PATTERNS = [
  'network request failed',
  'failed to fetch',
  'load failed',
  'network connection lost',
  'internet connection appears to be offline',
  'request to',
  'disconnected'
];

/**
 * Compute the three-way network state from device and backend status
 * @returns {'online' | 'degraded' | 'offline'}
 */
const computeNetworkState = () => {
  if (!deviceOnline) return 'offline';
  if (!backendHealthy) return 'degraded';
  return 'online';
};

const notifyListeners = () => {
  const state = computeNetworkState();
  listeners.forEach((listener) => listener(state));
};

const setDeviceOnline = (nextOnline) => {
  if (deviceOnline === nextOnline) return;
  deviceOnline = nextOnline;
  notifyListeners();
};

const setBackendHealthy = (nextHealthy) => {
  if (backendHealthy === nextHealthy) return;
  backendHealthy = nextHealthy;
  notifyListeners();
};

/**
 * Check if an error is a connection-related error
 */
export const isBackendConnectionError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return CONNECTION_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
};

/**
 * Mark backend as healthy (called on successful health check or API response)
 */
export const markBackendHealthy = () => {
  setBackendHealthy(true);
};

/**
 * Mark backend as unhealthy (called on failed health check)
 */
export const markBackendUnhealthy = () => {
  setBackendHealthy(false);
};

/**
 * Get the current network state
 * @returns {'online' | 'degraded' | 'offline'}
 */
export const getNetworkState = () => computeNetworkState();

/**
 * Get backend health status (for backward compatibility)
 * @returns {boolean}
 */
export const getBackendOnline = () => backendHealthy;

/**
 * Subscribe to network state changes
 * @param {(state: 'online' | 'degraded' | 'offline') => void} listener
 * @returns {() => void} Unsubscribe function
 */
export const subscribeNetworkStatus = (listener) => {
  listeners.add(listener);
  listener(computeNetworkState());

  return () => {
    listeners.delete(listener);
  };
};

/**
 * Legacy subscription for backward compatibility
 * @deprecated Use subscribeNetworkStatus instead
 */
export const subscribeBackendStatus = (listener) => {
  const wrappedListener = (state) => {
    // Map three-way state back to boolean for legacy consumers
    listener(state === 'online');
  };
  listeners.add(wrappedListener);
  wrappedListener(computeNetworkState());

  return () => {
    listeners.delete(wrappedListener);
  };
};

const checkBackendHealth = async () => {
  try {
    const response = await fetch(`${API_URL}/health`, { method: 'GET' });
    if (response.ok) {
      markBackendHealthy();
    } else {
      markBackendUnhealthy();
    }
  } catch (error) {
    if (isBackendConnectionError(error)) {
      markBackendUnhealthy();
    }
  }
};

/**
 * Manual re-check, e.g. a "Try again" button on the offline screen
 */
export const recheckBackendHealth = () => checkBackendHealth();

/**
 * Start monitoring network and backend health
 *
 * - NetInfo provides instant device connectivity detection
 * - Health poll checks backend every 30 seconds
 * - AppState listener rechecks on app foreground
 *
 * @returns {() => void} Cleanup function
 */
export const startNetworkMonitor = () => {
  if (healthMonitorStarted) {
    return () => {};
  }

  healthMonitorStarted = true;

  // Subscribe to device connectivity (instant detection)
  netInfoSubscription = NetInfo.addEventListener((state) => {
    setDeviceOnline(state.isConnected ?? true);
  });

  // Initial health check
  checkBackendHealth();

  // Periodic backend health check (every 30 seconds)
  healthTimer = setInterval(checkBackendHealth, 30000);

  // Recheck on app foreground
  appStateSubscription = AppState.addEventListener('change', (nextState) => {
    if (nextState === 'active') {
      checkBackendHealth();
    }
  });

  return () => {
    if (healthTimer) {
      clearInterval(healthTimer);
      healthTimer = null;
    }

    if (netInfoSubscription) {
      netInfoSubscription();
      netInfoSubscription = null;
    }

    appStateSubscription?.remove?.();
    appStateSubscription = null;
    healthMonitorStarted = false;
  };
};

/**
 * Legacy function for backward compatibility
 * @deprecated Use startNetworkMonitor instead
 */
export const startBackendHealthMonitor = startNetworkMonitor;

// Legacy exports for backward compatibility
export { markBackendHealthy as markBackendOnline };
export { markBackendUnhealthy as markBackendOffline };
