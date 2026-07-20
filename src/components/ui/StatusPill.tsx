import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';

export type StatusPillVariant = 'neutral' | 'live' | 'warn' | 'danger';

const VARIANTS: Record<StatusPillVariant, { bg: string; text: string }> = {
  neutral: { bg: theme.color.surface.field, text: theme.color.text.secondary },
  live: { bg: theme.color.success.bg, text: theme.color.success.text },
  warn: { bg: theme.color.warning.bg, text: theme.color.warning.text },
  danger: { bg: theme.color.danger.bg, text: theme.color.danger.text },
};

type Props = {
  label: string;
  variant?: StatusPillVariant;
  testID?: string;
};

export default function StatusPill({ label, variant = 'neutral', testID }: Props) {
  const v = VARIANTS[variant] || VARIANTS.neutral;
  return (
    <View testID={testID} style={[styles.pill, { backgroundColor: v.bg }]}>
      <Text style={[styles.label, { color: v.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: theme.radius.pill,
    paddingVertical: theme.space[1],
    paddingHorizontal: theme.space[3],
    alignSelf: 'flex-start',
  },
  label: {
    ...theme.textStyle('caption', { weight: 'medium' }),
  },
});
