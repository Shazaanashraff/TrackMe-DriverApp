import React from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import AppText from './ui/AppText';
import PrimaryButton from './ui/PrimaryButton';

export default function PermissionDeniedState() {
  return (
    <View style={styles.container}>
      <Ionicons name="location-outline" size={20} color={theme.color.primary[300]} style={styles.icon} />
      <AppText variant="label" color={theme.color.primary[300]} style={styles.message}>
        Allow location so riders can see your bus
      </AppText>
      <PrimaryButton title="Allow location" variant="secondary" onPress={() => Linking.openSettings()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: theme.space[2],
  },
  icon: {
    marginBottom: theme.space[1],
  },
  message: {
    marginBottom: theme.space[3],
  },
});
