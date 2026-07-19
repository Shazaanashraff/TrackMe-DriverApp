import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '../../theme';

const VARIANTS = {
  primary: {
    bg: theme.color.primary[500],
    pressedBg: theme.color.primary[600],
    text: theme.color.white,
  },
  secondary: {
    bg: theme.color.surface.field,
    pressedBg: theme.color.surface.field,
    text: theme.color.text.primary,
  },
  danger: {
    bg: theme.color.danger.main,
    pressedBg: theme.color.danger.main,
    text: theme.color.white,
  },
};

const PrimaryButton = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  testID,
}) => {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const isDisabled = loading || disabled;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: pressed && !isDisabled ? v.pressedBg : v.bg },
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator testID="button-loading-indicator" color={v.text} />
      ) : (
        <Text style={[styles.text, { color: v.text }, textStyle]}>{title}</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: theme.radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    ...theme.textStyle('body', { weight: 'medium' }),
  },
});

export default PrimaryButton;
