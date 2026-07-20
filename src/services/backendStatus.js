import { AppState } from 'react-native';
import { API_URL } from '../config';

const listeners = new Set();
let backendOnline = true;
let healthMonitorStarted = false;
let healthTimer = null;
let appStateSubscription = null;

const CONNECTION_ERROR_PATTERNS = [
  'network request failed',
  'failed to fetch',
  'load failed',
  'network connection lost',
  'internet connection appears to be offline',
  'request to',
  'disconnected'
];

const notifyListeners = () => {
  listeners.forEach((listener) => listener(backendOnline));
};

const setBackendOnlineState = (nextOnline) => {
  if (backendOnline === nextOnline) {
    return;
  }

  backendOnline = nextOnline;
  notifyListeners();
};

export const isBackendConnectionError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return CONNECTION_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
};

export const markBackendOnline = () => {
  setBackendOnlineState(true);
};

export const markBackendOffline = () => {
  setBackendOnlineState(false);
};

export const getBackendOnline = () => backendOnline;

export const subscribeBackendStatus = (listener) => {
  listeners.add(listener);
  listener(backendOnline);

  return () => {
    listeners.delete(listener);
  };
};

const checkBackendHealth = async () => {
  try {
    await fetch(`${API_URL}/health`, { method: 'GET' });
    markBackendOnline();
  } catch (error) {
    if (isBackendConnectionError(error)) {
      markBackendOffline();
    }
  }
};

// Manual re-check, e.g. a "Try again" button on the offline screen. Same
// request the 30s poller already makes — just triggered on demand.
export const recheckBackendHealth = () => checkBackendHealth();

export const startBackendHealthMonitor = () => {
  if (healthMonitorStarted) {
    return () => {};
  }

  healthMonitorStarted = true;
  checkBackendHealth();
  healthTimer = setInterval(checkBackendHealth, 30000);

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

    appStateSubscription?.remove?.();
    appStateSubscription = null;
    healthMonitorStarted = false;
  };
};