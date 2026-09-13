import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Platform, Pressable, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useAuth } from '../../context/AuthContext';
import { useNetworkStatus } from '../../context/NetworkStatusContext';
import { connectSocket, disconnectSocket, getSocket } from '../../services/socket';
import { useCommunicationTransport } from './transport';
import { theme } from '../../theme';
const Context = createContext(null);
export const useCommunication = () => useContext(Context);
export function CommunicationProvider({ children }) {
  const { user, token } = useAuth();
  const { isOffline } = useNetworkStatus();
  const request = useCommunicationTransport();
  const queryClient = useQueryClient();
  const accountId = user?._id || user?.id;
  const [banner, setBanner] = useState(null);
  const seen = useRef(new Set());
  const requestRef = useRef(request);
  useEffect(() => { requestRef.current = request; }, [request]);
  useEffect(() => {
    if (!accountId || !token) { disconnectSocket(); seen.current.clear(); return undefined; }
    const socket = connectSocket(token);
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['communications', accountId] });
    const receive = data => {
      if (seen.current.has(data.eventId)) return;
      seen.current.add(data.eventId);
      if (seen.current.size > 500) seen.current.delete(seen.current.values().next().value);
      void invalidate();
      if (!String(data.eventId).startsWith('read:')) setBanner({ ...data, title: 'New message or absence change' });
    };
    socket.on('communication:event', receive); socket.on('connect', invalidate);
    const foreground = AppState.addEventListener('change', state => {
      if (state === 'active') { if (!getSocket()?.connected) connectSocket(token).connect(); void invalidate(); }
    });
    return () => { socket.off('communication:event', receive); socket.off('connect', invalidate); foreground.remove(); };
  }, [accountId, token, queryClient]);
  useEffect(() => () => disconnectSocket(), []);
  useEffect(() => { if (!banner) return undefined; const timer = setTimeout(() => setBanner(null), 5000); return () => clearTimeout(timer); }, [banner]);
  useEffect(() => {
    if (Platform.OS === 'web') return undefined;
    let notifications; let received; let rotation; let foreground; let stopped = false;
    const register = async () => {
      if (!accountId || stopped) return;
      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
        if (!projectId) return;
        if (Platform.OS === 'android') await notifications.setNotificationChannelAsync('communications', { name: 'Messages and absence changes', importance: notifications.AndroidImportance.HIGH });
        const permission = await notifications.requestPermissionsAsync();
        if (permission.status !== 'granted' || stopped) return;
        const result = await notifications.getExpoPushTokenAsync({ projectId });
        if (stopped) return;
        await requestRef.current('/notifications/device-token', 'POST', { token: result.data });
        await AsyncStorage.setItem('communication-push-token', result.data);
      } catch { /* Registration retries on foreground and every minute while signed in. */ }
    };
    try {
      notifications = require('expo-notifications');
      notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: false, shouldShowList: false, shouldPlaySound: false, shouldSetBadge: false }) });
      received = notifications.addNotificationReceivedListener(n => {
        const data = n.request.content.data;
        if (data?.type !== 'COMMUNICATION') return;
        void queryClient.invalidateQueries({ queryKey: ['communications', accountId] });
        if (!seen.current.has(data.eventId)) { seen.current.add(data.eventId); setBanner({ ...data, title: n.request.content.title }); }
      });
      rotation = notifications.addPushTokenListener(register);
      foreground = AppState.addEventListener('change', state => { if (state === 'active') void register(); });
      void register();
    } catch { return undefined; }
    const timer = setInterval(register, 60000);
    return () => { stopped = true; clearInterval(timer); received?.remove(); rotation?.remove(); foreground?.remove(); };
  }, [accountId, queryClient]);
  return <Context.Provider value={{ request, accountId, online: !isOffline, role: user?.role }}>
    <View style={{ flex: 1 }}>{children}{banner && accountId ? <Pressable accessibilityRole="button" accessibilityLabel="Dismiss notice" onPress={() => setBanner(null)} style={{ position: 'absolute', top: 48, left: 16, right: 16, padding: 12, borderRadius: 12, backgroundColor: theme.color.primary[50], borderColor: theme.color.border.hairline, borderWidth: 1 }}><Text numberOfLines={2} style={{ color: theme.color.text.primary }}>{banner.title || 'New message'}</Text></Pressable> : null}</View>
  </Context.Provider>;
}
