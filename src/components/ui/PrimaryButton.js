import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, FONTS, BORDER_RADIUS } from '../../constants/theme';

const PrimaryButton = ({ title, onPress, loading = false, disabled = false, style, textStyle }) => (
  <TouchableOpacity
    style={[styles.button, (loading || disabled) && styles.disabled, style]}
    onPress={onPress}
    disabled={loading || disabled}
    activeOpacity={0.8}
  >
    {loading ? (
      <ActivityIndicator color={COLORS.white} />
    ) : (
      <Text style={[styles.text, textStyle]}>{title}</Text>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.7,
  },
  text: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
});

export default PrimaryButton;
