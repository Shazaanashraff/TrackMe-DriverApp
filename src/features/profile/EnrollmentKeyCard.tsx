import React, { useCallback, useEffect, useState } from 'react';
import { View, Share, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { theme } from '../../theme';
import AppText from '../../components/ui/AppText';
import Card from '../../components/ui/Card';
import PrimaryButton from '../../components/ui/PrimaryButton';
import Skeleton from '../../components/ui/Skeleton';
import InlineError from '../../components/ui/InlineError';

type Props = {
  enrollmentKey?: string;
  isPrivate?: boolean;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
};

// How long the button stays on "Copied" before naming its action again.
const COPIED_FOR_MS = 2000;

export default function EnrollmentKeyCard({
  enrollmentKey,
  isPrivate = false,
  loading = false,
  error = false,
  onRetry,
}: Props) {
  const [copied, setCopied] = useState(false);

  // A rotated key must not leave the button claiming the old one was copied.
  useEffect(() => {
    setCopied(false);
  }, [enrollmentKey]);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), COPIED_FOR_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = useCallback(async () => {
    if (!enrollmentKey) return;
    await Clipboard.setStringAsync(enrollmentKey);
    setCopied(true);
  }, [enrollmentKey]);

  const handleShare = useCallback(async () => {
    if (!enrollmentKey) return;
    try {
      await Share.share({
        message: `Use my TrackMe enrollment key to join my shuttle: ${enrollmentKey}`,
      });
    } catch {
      // Share is unavailable on some platforms and a dismissed sheet rejects on
      // others. Neither is worth an error in front of the driver, whose key is
      // on screen and copyable regardless.
    }
  }, [enrollmentKey]);

  return (
    <Card title="Your enrollment key" style={styles.card}>
      <AppText variant="label" color={theme.color.text.muted} style={styles.blurb}>
        {isPrivate
          ? 'Share this with passengers joining your shuttle. You approve each request before they are enrolled.'
          : 'Share this with passengers joining your shuttle. Anyone with the key is enrolled straight away.'}
      </AppText>

      {loading ? (
        <Skeleton height={52} radius={theme.radius.control} />
      ) : error ? (
        <View>
          <InlineError message="Could not load your key." />
          {onRetry ? (
            <PrimaryButton title="Try again" variant="secondary" onPress={onRetry} />
          ) : null}
        </View>
      ) : (
        <>
          {/* One token, so it is never broken across lines: a key read aloud or
              copied by eye has to survive the trip. */}
          <View style={styles.keyBox}>
            <AppText
              testID="enrollment-key-value"
              variant="h2"
              style={styles.keyText}
              selectable
            >
              {enrollmentKey}
            </AppText>
          </View>

          <View style={styles.actions}>
            <PrimaryButton
              testID="copy-enrollment-key"
              title={copied ? 'Copied' : 'Copy'}
              variant="secondary"
              onPress={handleCopy}
              style={styles.action}
            />
            <PrimaryButton
              testID="share-enrollment-key"
              title="Share"
              onPress={handleShare}
              style={styles.action}
            />
          </View>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: theme.space[4],
  },
  blurb: {
    marginBottom: theme.space[3],
  },
  keyBox: {
    backgroundColor: theme.color.primary[50],
    borderRadius: theme.radius.control,
    paddingVertical: theme.space[3],
    paddingHorizontal: theme.space[4],
    alignItems: 'center',
  },
  keyText: {
    color: theme.color.primary[600],
    letterSpacing: 1.5,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.space[3],
    marginTop: theme.space[3],
  },
  action: {
    flex: 1,
  },
});
