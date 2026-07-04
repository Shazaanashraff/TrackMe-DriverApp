import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';

export default function PermissionDeniedState() {
  return (
    <View style={styles.container}>
      <Ionicons name="location-outline" size={48} color={COLORS.warning} />
      <Text style={styles.title}>Location access needed</Text>
      <Text style={styles.message}>
        TrackMe needs your location to broadcast your bus's position to passengers. Please
        enable location access in Settings to start tracking.
      </Text>
      <TouchableOpacity style={styles.button} onPress={() => Linking.openSettings()}>
        <Text style={styles.buttonText}>Open Settings</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.secondary,
    textAlign: 'center',
  },
  message: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  button: {
    marginTop: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.md,
  },
  buttonText: {
    fontFamily: FONTS.bold,
    color: COLORS.white,
    fontSize: 14,
  },
});
