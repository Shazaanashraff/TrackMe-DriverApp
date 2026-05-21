import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';
import * as notificationService from './notificationService';

let socket = null;
let notificationListeners = null;

export const connectSocket = (token) => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
      auth: {
        token: token
      }
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      
      // Setup notification listeners on connection
      notificationListeners = notificationService.setupSocketNotificationListeners(
        socket,
        (bookingData) => console.log('New booking:', bookingData),
        (routeData) => console.log('Route update:', routeData),
        (earningsData) => console.log('Earnings:', earningsData)
      );
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      if (notificationListeners?.cleanup) {
        notificationListeners.cleanup();
      }
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }
  return socket;
};

export const getSocket = () => socket;

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
