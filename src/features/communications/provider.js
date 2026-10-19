import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Platform, Pressable, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { NavigationContainerRefContext } from '@react-navigation/native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useNetworkStatus } from '../../context/NetworkStatusContext';
import { connectSocket, disconnectSocket, getSocket } from '../../services/socket';
import { useCommunicationTransport } from './transport';
import AppText from '../../components/ui/AppText';
import { theme } from '../../theme';
const Context = createContext(null);
export const useCommunication = () => useContext(Context);
// A broadcast reaches its driver as one event per rider, and each event used to
// reload every list, cancelling the reload before it while the server still ran
// it. Events inside this window share one reload.
export const RELOAD_COALESCE_MS = 400;
const ABSENCE_TITLES = { ABSENT: 'Absence reported', CANCELLED: 'Absence cancelled', RETIRED: 'Absence notice retired' };
// What the popup says about an event, or null when there is nothing to tell the
// driver: a read receipt, a copy of their own broadcast, or their own
// acknowledgment. `absence` makes a tap open the Absences list.
export function popupFor(event) {
  if (String(event?.eventId).startsWith('read:') || event?.sender === 'driver' || event?.absenceStatus === 'ACKNOWLEDGED') return null;
  return { title: ABSENCE_TITLES[event.absenceStatus] || 'New message', body: event.text || '', absence: Boolean(event.absenceStatus) };
}
export function CommunicationProvider({ children }) {
  const { user, token } = useAuth();
  const { isOffline } = useNetworkStatus();
  const request = useCommunicationTransport();
  const queryClient = useQueryClient();
  const navigation = useContext(NavigationContainerRefContext);
  const topInset = useContext(SafeAreaInsetsContext)?.top ?? 0;
  const accountId = user?._id || user?.id;
  const [banner, setBanner] = useState(null);
  const seen = useRef(new Set());
  const requestRef = useRef(request);
  useEffect(() => { requestRef.current = request; }, [request]);
  useEffect(() => {
    if (!accountId || !token) { disconnectSocket(); seen.current.clear(); return undefined; }
    const socket = connectSocket(token);
    let reloadTimer = null;
    const invalidate = () => {
      if (reloadTimer) return;
      reloadTimer = setTimeout(() => { reloadTimer = null; void queryClient.invalidateQueries({ queryKey: ['communications', accountId] }); }, RELOAD_COALESCE_MS);
    };
    const receive = data => {
      if (seen.current.has(data.eventId)) return;
      seen.current.add(data.eventId);
      if (seen.current.size > 500) seen.current.delete(seen.current.values().next().value);
      invalidate();
      const popup = popupFor(data);
      if (popup) setBanner(popup);
    };
    socket.on('communication:event', receive); socket.on('connect', invalidate);
    const foreground = AppState.addEventListener('change', state => {
      if (state === 'active') { if (!getSocket()?.connected) connectSocket(token).connect(); invalidate(); }
    });
    return () => { clearTimeout(reloadTimer); socket.off('communication:event', receive); socket.off('connect', invalidate); foreground.remove(); };
  }, [accountId, token, queryClient]);
  useEffect(() => () => disconnectSocket(), []);
  useEffect(() => { if (!banner) return undefined; const timer = setTimeout(() => setBanner(null), 5000); return () => clearTimeout(timer); }, [banner]);
  useEffect(() => {
    if (Platform.OS === 'web') return undefined;
    let notifications; let received; let rotation; let foreground; let stopped = false;
    // register() runs on mount, every minute and on every return to the foreground. On
    // Android, asking for a permission (even one already granted) opens the system's
    // permission screen, which backgrounds the app; coming back asked again, so the app
    // looped behind an invisible screen that swallowed taps, and every return reloaded the
    // dashboard lists until the backend rate limit refused all requests. Check first, and
    // show the prompt at most once per session (the passenger app's fix, e2d3690).
    let asked = false;
    const register = async () => {
      if (!accountId || stopped) return;
      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
        if (!projectId) return;
        if (Platform.OS === 'android') await notifications.setNotificationChannelAsync('communications', { name: 'Messages and absence changes', importance: notifications.AndroidImportance.HIGH });
        let permission = await notifications.getPermissionsAsync();
        if (permission.status !== 'granted' && permission.canAskAgain !== false && !asked) {
          asked = true;
          permission = await notifications.requestPermissionsAsync();
        }
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
        if (seen.current.has(data.eventId)) return;
        seen.current.add(data.eventId);
        const popup = popupFor(data);
        if (popup) setBanner({ ...popup, body: popup.body || n.request.content.body || '' });
      });
      rotation = notifications.addPushTokenListener(register);
      foreground = AppState.addEventListener('change', state => { if (state === 'active') void register(); });
      void register();
    } catch { return undefined; }
    const timer = setInterval(register, 60000);
    return () => { stopped = true; clearInterval(timer); received?.remove(); rotation?.remove(); foreground?.remove(); };
  }, [accountId, queryClient]);
  const openBanner = () => {
    if (banner?.absence && navigation?.isReady?.()) navigation.navigate('MainTabs', { screen: 'Riders', params: { tab: 'absences', openedAt: Date.now() } });
    setBanner(null);
  };
  return <Context.Provider value={{ request, accountId, online: !isOffline, role: user?.role }}>
    <View style={{ flex: 1 }}>{children}{banner && accountId ? <Pressable testID="communication-popup" accessibilityRole="button" accessibilityLabel={banner.absence ? `${banner.title}. Open absences` : `${banner.title}. Dismiss`} onPress={openBanner} style={{ position: 'absolute', top: topInset + 8, left: 16, right: 16, padding: 12, borderRadius: 12, backgroundColor: theme.color.primary[50], borderColor: theme.color.border.hairline, borderWidth: 1 }}>
      <AppText variant="label" numberOfLines={1}>{banner.title}</AppText>
      {banner.body ? <AppText variant="caption" numberOfLines={2} color={theme.color.text.secondary}>{banner.body}</AppText> : null}
    </Pressable> : null}</View>
  </Context.Provider>;
}
