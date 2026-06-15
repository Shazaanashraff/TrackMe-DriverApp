import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';
import * as notificationService from './notificationService';

let socket = null;
let notificationListeners = null;

// Connection state tracking for cold start handling
let connectionState = {
  status: 'disconnected', // 'connecting' | 'connected' | 'disconnected' | 'error'
  error: null,
  lastAttempt: null,
  connectedAt: null
};

let connectionStateListeners = [];

const updateConnectionState = (status, error = null) => {
  const previousState = connectionState.status;
  connectionState = {
    status,
    error,
    lastAttempt: new Date().toISOString(),
    connectedAt: status === 'connected' ? new Date().toISOString() : connectionState.connectedAt
  };

  console.log(`🔄 [Socket State] ${previousState} → ${status}${error ? ` (${error})` : ''}`);
  
  // Notify all listeners of state change
  connectionStateListeners.forEach(callback => {
    try {
      callback(connectionState);
    } catch (err) {
      console.error('Error in connection state listener:', err);
    }
  });
};

export const connectSocket = (token) => {
  if (!socket) {
    updateConnectionState('connecting');
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
      auth: {
        token: token
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      // Increase timeout to account for cold start + DB init
      timeout: 30000
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      updateConnectionState('connected');
      
      // Setup notification listeners on connection
      notificationListeners = notificationService.setupSocketNotificationListeners(
        socket,
        (bookingData) => console.log('New booking:', bookingData),
        (routeData) => console.log('Route update:', routeData),
        (earningsData) => console.log('Earnings:', earningsData)
      );
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      updateConnectionState('disconnected');
      if (notificationListeners?.cleanup) {
        notificationListeners.cleanup();
      }
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      updateConnectionState('error', error?.message || 'Unknown error');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      updateConnectionState('error', error.message);
    });
  }
  return socket;
};

export const getSocket = () => socket;

export const getConnectionState = () => connectionState;

export const onConnectionStateChange = (callback) => {
  connectionStateListeners.push(callback);
  return () => {
    connectionStateListeners = connectionStateListeners.filter(cb => cb !== callback);
  };
};

export const disconnectSocket = () => {
  if (socket) {
    if (notificationListeners?.cleanup) {
      notificationListeners.cleanup();
    }
    socket.disconnect();
    socket = null;
  }
};

export const emitLocation = (busId, routeId, lat, lng, callback) => {
  if (socket && socket.connected) {
    socket.emit('driver:location', { busId, routeId, lat, lng }, (response) => {
      callback?.(response);
    });
  }
};

export const startTracking = (busId) => {
  return new Promise((resolve) => {
    if (!socket || !socket.connected) {
      resolve({ success: false, error: 'Socket not connected' });
      return;
    }

    socket.emit('driver:start-tracking', { busId }, (response) => {
      resolve(response || { success: false, error: 'No response from server' });
    });
  });
};

export const stopTracking = (busId) => {
  if (socket && socket.connected) {
    socket.emit('driver:stop-tracking', { busId });
  }
};

export const getNotificationListeners = () => notificationListeners;
