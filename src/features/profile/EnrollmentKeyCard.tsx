import React, { useCallback, useEffect, useState } from 'react';
import { View, Pressable, Share, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { theme } from '../../theme';
import AppText from '../../components/ui/AppText';
import Card from '../../components/ui/Card';
import PrimaryButton from '../../components/ui/PrimaryButton';
import Skeleton from '../../components/ui/Skeleton';
import InlineError from '../../components/ui/InlineError';

type Props = {
  enrollmentKey?: string;
  driverName?: string;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
};

export function buildShareMessage(
  enrollmentKey: string,
  { driverName }: { driverName?: string } = {}
) {
  const opener = driverName
    ? `Join ${driverName}'s shuttle on TrackMe.`
    : 'Join my shuttle on TrackMe.';
  return [opener, '', 'Enrollment key:', enrollmentKey].join('\n');
}

const COPIED_FOR_MS = 2000;
const REVEALED_FOR_MS = 20000;

export default function EnrollmentKeyCard({
  enrollmentKey,
  driverName,
  loading = false,
  error = false,
  onRetry,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setCopied(false);
    setRevealed(false);
  }, [enrollmentKey]);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), COPIED_FOR_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    if (!revealed) return undefined;
    const timer = setTimeout(() => setRevealed(false), REVEALED_FOR_MS);
    return () => clearTimeout(timer);
  }, [revealed]);

  const handleCopy = useCallback(async () => {
    if (!enrollmentKey) return;
    await Clipboard.setStringAsync(enrollmentKey);
    setCopied(true);
  }, [enrollmentKey]);

  const handleShare = useCallback(async () => {
    if (!enrollmentKey) return;
    try {
      await Share.share({
        message: buildShareMessage(enrollmentKey, { driverName }),
        title: 'Shuttle enrollment key',
      });
    } catch {}
  }, [enrollmentKey, driverName]);

  return (
    <View style={styles.container}>
      <View style={styles.cardHeader}>
        <View style={styles.headerTitleContainer}>
          <Ionicons name="key" size={20} color={theme.color.primary[500]} />
          <AppText variant="h2" style={styles.headerTitle}>Enrollment Key</AppText>
        </View>
        <AppText variant="caption" color={theme.color.text.muted}>
          Share to let riders join
        </AppText>
      </View>

      {loading ? (
        <Skeleton height={64} radius={theme.radius.card} style={styles.skeleton} />
      ) : error ? (
        <View style={styles.errorContainer}>
          <InlineError message="Could not load your key." />
          {onRetry ? (
            <PrimaryButton title="Try again" variant="secondary" onPress={onRetry} />
          ) : null}
        </View>
      ) : (
        <View style={styles.keyContainer}>
          <Pressable
            testID="toggle-enrollment-key"
            onPress={() => setRevealed((r) => !r)}
            accessibilityRole="button"
            accessibilityState={{ expanded: revealed }}
            accessibilityLabel={revealed ? 'Hide enrollment key' : 'Show enrollment key'}
            style={[styles.keyBox, revealed && styles.keyBoxRevealed]}
          >
            {revealed ? (
              <AppText
                testID="enrollment-key-value"
                variant="h2"
                style={styles.keyRevealed}
                selectable
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {enrollmentKey}
              </AppText>
            ) : (
              <View testID="enrollment-key-mask" style={styles.hiddenRow}>
                <Ionicons name="lock-closed" size={18} color={theme.color.text.muted} />
                <AppText variant="body" color={theme.color.text.secondary} weight="medium">
                  Tap to reveal key
                </AppText>
              </View>
            )}

            <Ionicons
              name={revealed ? 'eye-off' : 'eye'}
              size={22}
              color={revealed ? theme.color.primary[600] : theme.color.text.muted}
            />
          </Pressable>

          <View style={styles.actions}>
            <Pressable 
              style={[styles.actionButton, copied && styles.actionButtonSuccess]} 
              onPress={handleCopy}
            >
              <Ionicons 
                name={copied ? "checkmark" : "copy-outline"} 
                size={18} 
                color={copied ? theme.color.success.main : theme.color.primary[600]} 
              />
              <AppText 
                variant="label" 
                color={copied ? theme.color.success.main : theme.color.primary[600]}
                weight="medium"
              >
                {copied ? 'Copied!' : 'Copy Key'}
              </AppText>
            </Pressable>
            
            <View style={styles.actionDivider} />

            <Pressable style={styles.actionButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={18} color={theme.color.primary[600]} />
              <AppText variant="label" color={theme.color.primary[600]} weight="medium">
                Share Link
              </AppText>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.surface.card,
    borderRadius: theme.radius.card,
    ...theme.elevation.card,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: theme.space[3],
    borderBottomWidth: theme.borderWidth.hairline,
    borderBottomColor: theme.color.border.hairline,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
    marginBottom: theme.space[1],
  },
  headerTitle: {
    color: theme.color.text.primary,
  },
  keyContainer: {
    padding: theme.space[3],
  },
  keyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.color.surface.field,
    borderRadius: theme.radius.card,
    paddingVertical: theme.space[2],
    paddingHorizontal: theme.space[3],
    minHeight: 56,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  keyBoxRevealed: {
    backgroundColor: theme.color.primary[50],
    borderColor: theme.color.primary[100],
  },
  hiddenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
  },
  keyRevealed: {
    flex: 1,
    color: theme.color.primary[600],
    letterSpacing: 0.5,
    fontWeight: '700',
    marginRight: theme.space[2],
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.space[3],
    backgroundColor: theme.color.surface.page,
    borderRadius: theme.radius.pill,
    padding: theme.space[1],
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space[2],
    paddingVertical: theme.space[2],
    borderRadius: theme.radius.pill,
  },
  actionButtonSuccess: {
    backgroundColor: theme.color.success.bg,
  },
  actionDivider: {
    width: 1,
    height: 16,
    backgroundColor: theme.color.border.hairline,
  },
  skeleton: {
    margin: theme.space[3],
  },
  errorContainer: {
    padding: theme.space[3],
    gap: theme.space[2],
  },
});
