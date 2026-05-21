import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { disconnectSocket } from '../services/socket';

const AuthContext = createContext({});

const hasBrowserStorage = () => typeof window !== 'undefined' && !!window.localStorage;

const clearBrowserAuthStorage = () => {
  if (!hasBrowserStorage()) return;
  window.localStorage.removeItem('token');
  window.localStorage.removeItem('refreshToken');
  window.localStorage.removeItem('user');
};

const saveBrowserAuthStorage = (userData, accessToken, newRefreshToken) => {
  if (!hasBrowserStorage()) return;
  window.localStorage.setItem('token', accessToken);
  window.localStorage.setItem('user', JSON.stringify(userData));
  if (newRefreshToken) {
    window.localStorage.setItem('refreshToken', newRefreshToken);
  } else {
    window.localStorage.removeItem('refreshToken');
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[AuthContext] Initializing auth store...');
    // Safety timeout: if loading still true after 5s, force it false
    const timer = setTimeout(() => {
      setLoading(currentLoading => {
        if (currentLoading) {
          console.warn('[AuthContext] ⚠️ Safety timeout fired! Forcing loading: false');
          return false;
        }
        return currentLoading;
      });
    }, 5000);

    loadStoredAuth();

    return () => clearTimeout(timer);
  }, []);

  const loadStoredAuth = async () => {
    try {
      let storedToken = await AsyncStorage.getItem('token');
      let storedRefreshToken = await AsyncStorage.getItem('refreshToken');
      let storedUser = await AsyncStorage.getItem('user');

      if (!storedToken && hasBrowserStorage()) {
        storedToken = window.localStorage.getItem('token');
        storedRefreshToken = window.localStorage.getItem('refreshToken');
        storedUser = window.localStorage.getItem('user');
      }
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setRefreshToken(storedRefreshToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveAuth = async (userData, accessToken, newRefreshToken = null) => {
    try {
      await AsyncStorage.setItem('token', accessToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      if (newRefreshToken) {
        await AsyncStorage.setItem('refreshToken', newRefreshToken);
      }
      saveBrowserAuthStorage(userData, accessToken, newRefreshToken);

      setToken(accessToken);
      setRefreshToken(newRefreshToken || null);
      setUser(userData);
    } catch (error) {
      console.error('Error saving auth:', error);
    }
  };

  const login = async (userData, authToken, newRefreshToken = null) => {
    await saveAuth(userData, authToken, newRefreshToken);
  };

  const refreshAccessToken = async () => {
    if (!refreshToken) return null;
    try {
      const response = await api.refreshToken(refreshToken);
      await saveAuth(response.user, response.accessToken, response.refreshToken);
      return response.accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return null;
    }
  };

  const logout = async () => {
    const currentToken = token;

    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
      clearBrowserAuthStorage();
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      disconnectSocket();

      if (currentToken) {
        api.logout(currentToken).catch(() => {
          // Best-effort server logout after local sign-out
        });
      }
    } catch (error) {
      // Ensure in-memory auth is still cleared even if storage fails
      clearBrowserAuthStorage();
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      disconnectSocket();
    }
  };

  const authenticatedRequest = async (apiMethod, ...args) => {
    try {
      return await apiMethod(token, ...args);
    } catch (error) {
      if (error.status === 401 && refreshToken) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          return await apiMethod(newToken, ...args);
        }
      }
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, refreshToken, loading, login, logout, authenticatedRequest }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
