import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { subscribeBackendStatus, getBackendOnline } from '../../services/backendStatus';
import { theme } from '../../theme';

export default function OfflineBanner() {
  const [online, setOnline] = useState<boolean>(getBackendOnline());

  useEffect(() => {
    const unsubscribe = subscribeBackendStatus((isOnline: boolean) => setOnline(isOnline));
    return unsubscribe;
  }, []);

  if (online) return null;

  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-offline-outline" size={14} color={theme.color.warning.text} />
      <Text style={styles.text}>No connection — showing cached data</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.warning.bg,
    paddingVertical: theme.space[1],
    paddingHorizontal: theme.space[2],
    gap: theme.space[1],
  },
  text: {
    ...theme.textStyle('caption', { weight: 'medium', color: theme.color.warning.text }),
  },
});
