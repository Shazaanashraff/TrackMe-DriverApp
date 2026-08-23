import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  getNetworkState,
  subscribeNetworkStatus,
  startNetworkMonitor,
  recheckBackendHealth,
} from '../services/backendStatus';

const NetworkStatusContext = createContext(null);

export const NetworkStatusProvider = ({ children }) => {
  const [networkState, setNetworkState] = useState(() => getNetworkState());

  const retry = useCallback(() => {
    recheckBackendHealth();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeNetworkStatus(setNetworkState);
    const stopMonitor = startNetworkMonitor();

    return () => {
      unsubscribe();
      stopMonitor();
    };
  }, []);

  const value = {
    networkState,           // 'online' | 'degraded' | 'offline'
    isOnline: networkState === 'online',
    isDegraded: networkState === 'degraded',
    isOffline: networkState === 'offline',
    retry,
  };

  return (
    <NetworkStatusContext.Provider value={value}>
      {children}
    </NetworkStatusContext.Provider>
  );
};

export const useNetworkStatus = () => {
  const context = useContext(NetworkStatusContext);
  if (!context) {
    throw new Error('useNetworkStatus must be used within a NetworkStatusProvider');
  }
  return context;
};

export default NetworkStatusContext;
