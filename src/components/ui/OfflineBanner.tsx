import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '../../context/NetworkStatusContext';
import { theme } from '../../theme';

// Device offline and backend-unreachable are different situations for a
// driver mid-shift: one means "get signal", the other means "wait, it's not
// you." Both still show cached data, so both still show a banner — worded apart.
export default function OfflineBanner() {
  const { isOffline, isDegraded } = useNetworkStatus();

  if (!isOffline && !isDegraded) return null;

  const message = isOffline
    ? 'No connection — showing cached data'
    : "Can't reach the server — showing saved data";

  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-offline-outline" size={14} color={theme.color.warning.text} />
      <Text style={styles.text}>{message}</Text>
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
