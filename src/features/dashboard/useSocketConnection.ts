import { useEffect, useState } from 'react';
import {
  connectSocket,
  getConnectionState,
  onConnectionStateChange,
} from '../../services/socket';

// Observes the socket owned by the authenticated application shell and
// exposes whether it's mid-handshake — separate from useTrackingSession, which owns
// the start/stop tracking session on top of an already-connected socket.
export function useSocketConnection(token: string | null) {
  const [connecting, setConnecting] = useState(getConnectionState().status === 'connecting');

  useEffect(() => {
    const unsubscribe = onConnectionStateChange((state) => setConnecting(state.status === 'connecting'));
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (token) connectSocket(token);
  }, [token]);

  return { connecting };
}
