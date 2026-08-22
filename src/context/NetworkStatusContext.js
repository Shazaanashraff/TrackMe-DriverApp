import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  getNetworkState,
  subscribeNetworkStatus,
  startNetworkMonitor,
  recheckBackendHealth,
  getBackendOnline
} from '../services/backendStatus';

const NetworkStatusContext = createContext(null);

export const NetworkStatusProvider = ({ children }) => {
  const [networkState, setNetworkState] = useState(() => getNetworkState());
  const [backendHealthy, setBackendHealthy] = useState(() => getBackendOnline());
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Memoized retry function
  const retry = useCallback(() => {
    recheckBackendHealth();
  }, []);

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = subscribeNetworkStatus(setNetworkState);

    // Start the network monitor
    const stopMonitor = startNetworkMonitor();
    setIsMonitoring(true);

    return () => {
      unsubscribe();
      stopMonitor();
      setIsMonitoring(false);
    };
  }, []);

  const value = {
    networkState,           // 'online' | 'degraded' | 'offline'
    backendHealthy,         // boolean (for backward compatibility)
    isOnline: networkState === 'online',
    isDegraded: networkState === 'degraded',
    isOffline: networkState === 'offline',
    retry,
    isMonitoring,
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
