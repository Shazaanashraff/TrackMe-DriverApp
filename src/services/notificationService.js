// Push notifications have been temporarily removed

export async function initializePushNotifications() {
  console.log('[NotificationService] Push notifications are currently disabled.');
  return null;
}

export function showLocalNotification(title, body, data = {}, priority = 'default') {
  // console.log(`[Notification] ${title}: ${body}`);
}

export function setupSocketNotificationListeners(socket, onBookingUpdate, onRouteUpdate, onEarnings) {
  // New booking notification
  socket.on('booking:new', (data) => {
    onBookingUpdate?.(data);
  });

  // Route assignment notification
  socket.on('route:assigned', (data) => {
    onRouteUpdate?.(data);
  });

  // Earnings update notification
  socket.on('earnings:update', (data) => {
    onEarnings?.(data);
  });

  // Route cancelled notification
  socket.on('route:cancelled', (data) => {
    onRouteUpdate?.(data);
  });

  // Maintenance alert
  socket.on('maintenance:alert', (data) => {});

  // Payment processed notification
  socket.on('payment:processed', (data) => {});

  return {
    cleanup: () => {
      socket.off('booking:new');
      socket.off('route:assigned');
      socket.off('earnings:update');
      socket.off('route:cancelled');
      socket.off('maintenance:alert');
      socket.off('payment:processed');
    }
  };
}

export function setupNotificationResponseListener(onNotificationPress) {
  return { remove: () => {} };
}

export default {
  initializePushNotifications,
  showLocalNotification,
  setupSocketNotificationListeners,
  setupNotificationResponseListener,
};
