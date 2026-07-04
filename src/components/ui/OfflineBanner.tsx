import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { subscribeBackendStatus, getBackendOnline } from '../../services/backendStatus';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

export default function OfflineBanner() {
  const [online, setOnline] = useState<boolean>(getBackendOnline());

  useEffect(() => {
    const unsubscribe = subscribeBackendStatus((isOnline: boolean) => setOnline(isOnline));
    return unsubscribe;
  }, []);

  if (online) return null;

  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-offline-outline" size={14} color={COLORS.white} />
      <Text style={styles.text}>No connection — showing cached data</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.textSecondary,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    gap: SPACING.xs,
  },
  text: {
    fontFamily: FONTS.medium,
    color: COLORS.white,
    fontSize: 12,
  },
});
