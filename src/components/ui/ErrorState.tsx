import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { AppError, userMessage } from '../../lib/errors';

type Props = {
  error: AppError;
  onRetry?: () => void;
  variant?: 'full' | 'compact';
};

export default function ErrorState({ error, onRetry, variant = 'full' }: Props) {
  const message = userMessage(error);
  const isCompact = variant === 'compact';

  return (
    <View style={[styles.container, isCompact && styles.compact]}>
      <Ionicons name="alert-circle" size={isCompact ? 32 : 48} color={COLORS.error} />
      <Text style={[styles.title, isCompact && styles.titleCompact]}>Something went wrong</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      )}
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
  compact: {
    flex: 0,
    padding: SPACING.sm,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.secondary,
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: 15,
  },
  message: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.md,
  },
  retryText: {
    fontFamily: FONTS.bold,
    color: COLORS.white,
    fontSize: 14,
  },
});
