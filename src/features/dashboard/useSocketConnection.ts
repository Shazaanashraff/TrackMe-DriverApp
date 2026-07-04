import { useEffect, useState } from 'react';
import {
  connectSocket,
  disconnectSocket,
  getConnectionState,
  onConnectionStateChange,
} from '../../services/socket';

// Owns the socket connection lifecycle (connect on mount, disconnect on unmount) and
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
    return () => disconnectSocket();
  }, [token]);

  return { connecting };
}
