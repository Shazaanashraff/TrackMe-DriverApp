import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config';
import * as notificationService from './notificationService';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface ConnectionState {
  status: ConnectionStatus;
  error: string | null;
  lastAttempt: string | null;
  connectedAt: string | null;
}

export interface TrackingAck {
  success: boolean;
  error?: string;
  // The backend's ack error code (REALTIME.md "Ack error codes"), when it sent one.
  code?: string;
  // Set only when the emit never left the device because the socket was down.
  // Lets useTrackingSession tell "can't reach the server right now" (park the
  // shift as pending, retry on reconnect) apart from a real server refusal.
  offline?: boolean;
}

type ConnectionStateListener = (state: ConnectionState) => void;

let socket: Socket | null = null;
let notificationListeners: { cleanup?: () => void } | null = null;

// Connection state tracking for cold start handling
let connectionState: ConnectionState = {
  status: 'disconnected',
  error: null,
  lastAttempt: null,
  connectedAt: null,
};

let connectionStateListeners: ConnectionStateListener[] = [];

type TokenRefresher = () => Promise<string | null>;

// Access tokens expire after 15 minutes and the server checks the token only
// when a connection opens. After a drop (screen lock, network switch) the
// reconnect used to offer the same expired token, the server refused it, and a
// shift sat on "Offline, will sync later" for good. AuthContext registers its
// refresh here so a refused handshake fetches a fresh token and tries again.
let tokenRefresher: TokenRefresher | null = null;
let refreshInFlight: Promise<void> | null = null;
// Set once a refresh has been tried and cleared on the next successful connect.
// A fresh token refused for anything other than expiry (deactivated account,
// bad signature) is not fixed by refreshing again, so it is tried only once.
let refreshedSinceConnect = false;

export const setSocketTokenRefresher = (refresher: TokenRefresher | null): void => {
  tokenRefresher = refresher;
};

// socket.io stops retrying once the server's auth middleware refuses a
// handshake (`socket.active` goes false), and nothing else retried while the
// app stayed open: a refused reconnect, or a token refresh that came back
// empty, left the driver on "Reconnecting…" for good. Retry on a backoff until
// the socket connects or is closed.
export const RECONNECT_BASE_MS = 2000;
export const RECONNECT_MAX_MS = 30_000;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectDelayMs = RECONNECT_BASE_MS;

const cancelReconnect = (): void => {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = null;
};

const scheduleReconnect = (): void => {
  if (reconnectTimer || !socket || socket.connected) return;
  const delay = reconnectDelayMs;
  reconnectDelayMs = Math.min(reconnectDelayMs * 2, RECONNECT_MAX_MS);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (socket && !socket.connected && !socket.active) socket.connect();
  }, delay);
};

const isTokenRejection = (message: string): boolean =>
  message.includes('jwt expired') || message.startsWith('Invalid token');

const retryWithFreshToken = (message: string): void => {
  if (!tokenRefresher || refreshInFlight) return;
  if (refreshedSinceConnect && !message.includes('jwt expired')) return;
  refreshedSinceConnect = true;
  const refresher = tokenRefresher;
  refreshInFlight = (async () => {
    try {
      const fresh = await refresher();
      if (!fresh || !socket || !socket.auth || typeof socket.auth === 'function') return;
      socket.auth.token = fresh;
      // A refusal from the server's auth middleware stops socket.io's own
      // reconnect loop, so the retry has to be started here.
      if (!socket.connected) socket.connect();
    } catch (err) {
      if (__DEV__) console.error('Socket token refresh failed:', err);
    } finally {
      refreshInFlight = null;
    }
  })();
};

const updateConnectionState = (status: ConnectionStatus, error: string | null = null) => {
  const previousState = connectionState.status;
  connectionState = {
    status,
    error,
    lastAttempt: new Date().toISOString(),
    connectedAt: status === 'connected' ? new Date().toISOString() : connectionState.connectedAt,
  };

  if (__DEV__) {
    console.log(`🔄 [Socket State] ${previousState} → ${status}${error ? ` (${error})` : ''}`);
  }

  connectionStateListeners.forEach((callback) => {
    try {
      callback(connectionState);
    } catch (err) {
      if (__DEV__) console.error('Error in connection state listener:', err);
    }
  });
};

export const connectSocket = (token: string): Socket => {
  if (socket && socket.auth && typeof socket.auth !== 'function' && socket.auth.token !== token) {
    socket.auth.token = token;
    socket.disconnect().connect();
  }
  if (!socket) {
    updateConnectionState('connecting');
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
      auth: {
        token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      // Increase timeout to account for cold start + DB init
      timeout: 30000,
    });

    socket.on('connect', () => {
      if (__DEV__) console.log('Socket connected:', socket?.id);
      refreshedSinceConnect = false;
      cancelReconnect();
      reconnectDelayMs = RECONNECT_BASE_MS;
      updateConnectionState('connected');

      // Setup notification listeners on connection
      notificationListeners = notificationService.setupSocketNotificationListeners(
        socket,
        (bookingData: unknown) => {
          if (__DEV__) console.log('New booking:', bookingData);
        },
        (routeData: unknown) => {
          if (__DEV__) console.log('Route update:', routeData);
        }
      );
    });

    socket.on('disconnect', (reason: string) => {
      if (__DEV__) console.log('Socket disconnected:', reason);
      updateConnectionState('disconnected');
      if (notificationListeners?.cleanup) {
        notificationListeners.cleanup();
      }
    });

    socket.on('error', (error: { message?: string }) => {
      if (__DEV__) console.error('Socket error:', error);
      updateConnectionState('error', error?.message || 'Unknown error');
    });

    socket.on('connect_error', (error: Error) => {
      if (__DEV__) console.error('Socket connection error:', error.message);
      updateConnectionState('error', error.message);
      if (isTokenRejection(error?.message || '')) retryWithFreshToken(error.message);
      // A transport failure leaves socket.io retrying on its own (active stays
      // true); only a middleware refusal needs the backoff.
      if (socket && !socket.active) scheduleReconnect();
    });
  }
  return socket;
};

export const getSocket = (): Socket | null => socket;

export const getConnectionState = (): ConnectionState => connectionState;

export const onConnectionStateChange = (callback: ConnectionStateListener): (() => void) => {
  connectionStateListeners.push(callback);
  return () => {
    connectionStateListeners = connectionStateListeners.filter((cb) => cb !== callback);
  };
};

export const disconnectSocket = (): void => {
  if (socket) {
    if (notificationListeners?.cleanup) {
      notificationListeners.cleanup();
    }
    socket.disconnect();
    socket = null;
  }
  refreshedSinceConnect = false;
  cancelReconnect();
  reconnectDelayMs = RECONNECT_BASE_MS;
};

const LOCATION_ACK_TIMEOUT_MS = 5000;

export const emitLocation = (
  vehicleId: string,
  routeId: string,
  lat: number,
  lng: number,
  callback?: (response: unknown) => void,
  heading?: number | null,
  timestamp?: number | null
): void => {
  if (socket && socket.connected) {
    // A dropped ack (common on a spotty connection) used to leave the fix
    // silently treated as delivered — it never came back as a NACK, so it was
    // never re-buffered for retry, leaving a silent gap in the route (issue
    // #13). Resolve with a NACK-shaped response on timeout so the caller's
    // existing isNackResponse() check re-buffers it the same as a real NACK.
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      callback?.({ success: false, error: 'Ack timeout' });
    }, LOCATION_ACK_TIMEOUT_MS);

    // heading and timestamp are optional in the backend contract; leave them
    // off rather than send null. The timestamp (epoch ms, when the fix was
    // taken) is what lets the backend drop a re-sent older fix instead of
    // broadcasting it as new, which walked riders' vans backwards
    // (REALTIME.md §6).
    const payload: Record<string, unknown> = { vehicleId, routeId, lat, lng };
    if (typeof heading === 'number' && Number.isFinite(heading)) payload.heading = heading;
    if (typeof timestamp === 'number' && Number.isFinite(timestamp)) payload.timestamp = timestamp;
    socket.emit('driver:location', payload, (response: unknown) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      callback?.(response);
    });
  } else {
    callback?.({ success: false, error: 'Socket not connected' });
  }
};

const START_ACK_TIMEOUT_MS = 5000;

export const startTracking = (vehicleId: string, startedAt?: string): Promise<TrackingAck> => {
  return new Promise((resolve) => {
    if (!socket || !socket.connected) {
      resolve({ success: false, error: 'Socket not connected', offline: true });
      return;
    }

    // Without a timeout this promise never settles if the ack is lost, leaving
    // the driver on a GO button that spins forever with no way to retry.
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve({ success: false, error: 'No response from server' });
    }, START_ACK_TIMEOUT_MS);

    // `startedAt` is only sent for a shift that was started offline and is now
    // reconnecting — it carries the real GO-press time so the backend records an
    // honest duration. A normal start omits it and the server stamps `now`.
    const payload = startedAt ? { vehicleId, startedAt } : { vehicleId };
    socket.emit('driver:start-tracking', payload, (response: TrackingAck) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(response || { success: false, error: 'No response from server' });
    });
  });
};

const STOP_ACK_TIMEOUT_MS = 5000;

export const stopTracking = (vehicleId: string): Promise<TrackingAck> => {
  return new Promise((resolve) => {
    if (!socket || !socket.connected) {
      resolve({ success: false, error: 'Socket not connected', offline: true });
      return;
    }

    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve({ success: false, error: 'No response from server' });
    }, STOP_ACK_TIMEOUT_MS);

    socket.emit('driver:stop-tracking', { vehicleId }, (response: TrackingAck) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(response || { success: false, error: 'No response from server' });
    });
  });
};

export const getNotificationListeners = () => notificationListeners;
