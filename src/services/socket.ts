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
      reconnectionAttempts: 5,
      // Increase timeout to account for cold start + DB init
      timeout: 30000,
    });

    socket.on('connect', () => {
      if (__DEV__) console.log('Socket connected:', socket?.id);
      updateConnectionState('connected');

      // Setup notification listeners on connection
      notificationListeners = notificationService.setupSocketNotificationListeners(
        socket,
        (bookingData: unknown) => {
          if (__DEV__) console.log('New booking:', bookingData);
        },
        (routeData: unknown) => {
          if (__DEV__) console.log('Route update:', routeData);
        },
        (earningsData: unknown) => {
          if (__DEV__) console.log('Earnings:', earningsData);
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
};

export const emitLocation = (
  busId: string,
  routeId: string,
  lat: number,
  lng: number,
  callback?: (response: unknown) => void
): void => {
  if (socket && socket.connected) {
    socket.emit('driver:location', { busId, routeId, lat, lng }, (response: unknown) => {
      callback?.(response);
    });
  }
};

export const startTracking = (busId: string): Promise<TrackingAck> => {
  return new Promise((resolve) => {
    if (!socket || !socket.connected) {
      resolve({ success: false, error: 'Socket not connected' });
      return;
    }

    socket.emit('driver:start-tracking', { busId }, (response: TrackingAck) => {
      resolve(response || { success: false, error: 'No response from server' });
    });
  });
};

export const stopTracking = (busId: string): void => {
  if (socket && socket.connected) {
    socket.emit('driver:stop-tracking', { busId });
  }
};

export const getNotificationListeners = () => notificationListeners;
