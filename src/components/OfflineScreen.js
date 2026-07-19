import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import AppText from './ui/AppText';
import PrimaryButton from './ui/PrimaryButton';
import { recheckBackendHealth } from '../services/backendStatus';

const OfflineScreen = () => (
  <View style={styles.container}>
    <View style={styles.iconCircle}>
      <Ionicons name="cloud-offline-outline" size={40} color={theme.color.white} />
    </View>
    <AppText variant="h1" onInk style={styles.title}>No connection</AppText>
    <AppText variant="label" color={theme.color.primary[300]} style={styles.subtitle}>
      We&apos;ll reconnect automatically
    </AppText>
    <PrimaryButton title="Try again" onPress={recheckBackendHealth} style={styles.retryButton} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.color.ink.base,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.space[6],
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: theme.color.ink.raised,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.space[5],
  },
  title: {
    marginBottom: theme.space[2],
  },
  subtitle: {
    marginBottom: theme.space[6],
    textAlign: 'center',
  },
  retryButton: {
    minWidth: 160,
  },
});

export default OfflineScreen;
