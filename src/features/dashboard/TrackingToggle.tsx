import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

type Props = {
  isTracking: boolean;
  disabled: boolean;
  onStart: () => void;
  onStop: () => void;
};

export default function TrackingToggle({ isTracking, disabled, onStart, onStop }: Props) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        isTracking ? styles.stopButton : styles.startButton,
        disabled && !isTracking && styles.disabledButton,
      ]}
      onPress={isTracking ? onStop : onStart}
      disabled={disabled && !isTracking}
      activeOpacity={0.9}
      testID="tracking-toggle"
    >
      <Ionicons
        name={isTracking ? 'stop-circle' : 'play-circle'}
        size={24}
        color={COLORS.white}
        style={styles.icon}
      />
      <Text style={styles.text}>{isTracking ? 'End Journey' : 'Start Journey'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  startButton: {
    backgroundColor: COLORS.secondary,
  },
  stopButton: {
    backgroundColor: COLORS.error,
  },
  disabledButton: {
    backgroundColor: COLORS.border,
  },
  icon: {
    marginRight: 10,
  },
  text: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
});
