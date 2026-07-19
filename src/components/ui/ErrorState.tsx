import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { AppError, userMessage } from '../../lib/errors';

type Props = {
  error: AppError;
  onRetry?: () => void;
  variant?: 'full' | 'compact';
  // Overrides the derived AppError message — e.g. "Couldn't load. Pull down
  // to try again." on a pull-to-refresh list, per STYLEGUIDE §8.
  message?: string;
};

export default function ErrorState({ error, onRetry, variant = 'full', message: messageOverride }: Props) {
  const message = messageOverride ?? userMessage(error);
  const isCompact = variant === 'compact';

  return (
    <View style={[styles.container, isCompact && styles.compact]}>
      <Ionicons name="alert-circle" size={isCompact ? 32 : 48} color={theme.color.danger.main} />
      <Text style={[styles.title, isCompact && styles.titleCompact]}>Something went wrong</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry} accessibilityRole="button">
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
    padding: theme.space[6],
    gap: theme.space[2],
  },
  compact: {
    flex: 0,
    padding: theme.space[2],
  },
  title: {
    ...theme.textStyle('h2', { color: theme.color.text.primary }),
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: theme.font.size.label,
  },
  message: {
    ...theme.textStyle('label', { color: theme.color.text.secondary }),
    textAlign: 'center',
  },
  retryButton: {
    marginTop: theme.space[1],
    paddingVertical: theme.space[2],
    paddingHorizontal: theme.space[4],
    backgroundColor: theme.color.primary[500],
    borderRadius: theme.radius.control,
  },
  retryText: {
    ...theme.textStyle('label', { weight: 'medium', color: theme.color.white }),
  },
});
