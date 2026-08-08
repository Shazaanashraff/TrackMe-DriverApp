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
  isPrivate?: boolean;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
};

// The message lands in someone else's chat app, where it has to stand on its
// own: the passenger may not have TrackMe yet and has no idea what a key is.
//
// The key goes on its own line rather than trailing a sentence. Chat apps wrap
// mid-token and tap-to-select grabs the whole line, so a key sitting after a
// colon is the one part of the message that arrives broken.
export function buildShareMessage(
  enrollmentKey: string,
  { driverName, isPrivate }: { driverName?: string; isPrivate?: boolean } = {}
) {
  const opener = driverName
    ? `Join ${driverName}'s shuttle on TrackMe.`
    : 'Join my shuttle on TrackMe.';

  return [
    opener,
    '',
    'Enrollment key:',
    enrollmentKey,
    '',
    // Named exactly as the passenger app labels them, so the instruction can be
    // followed literally rather than interpreted.
    'Open TrackMe, go to My shuttle, then tap "Enter a key".',
    // Worth saying up front: otherwise a correct key looks like it failed.
    ...(isPrivate ? ['', "I'll approve your request before you're added."] : []),
  ].join('\n');
}

// How long the button stays on "Copied" before naming its action again.
const COPIED_FOR_MS = 2000;
// A revealed key re-hides itself. The driver is holding the phone in public
// half the time, and a key left on screen is a credential left on screen.
const REVEALED_FOR_MS = 20000;

export default function EnrollmentKeyCard({
  enrollmentKey,
  driverName,
  isPrivate = false,
  loading = false,
  error = false,
  onRetry,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);

  // A rotated key must not inherit the previous one's revealed state, nor leave
  // the button claiming the old key was copied.
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
    // Copying does not reveal: the driver can hand the key over without it ever
    // being on screen.
    await Clipboard.setStringAsync(enrollmentKey);
    setCopied(true);
  }, [enrollmentKey]);

  const handleShare = useCallback(async () => {
    if (!enrollmentKey) return;
    try {
      await Share.share({
        message: buildShareMessage(enrollmentKey, { driverName, isPrivate }),
        // Android's chooser shows this above the targets; iOS ignores it.
        title: 'Shuttle enrollment key',
      });
    } catch {
      // Share is unavailable on some platforms and a dismissed sheet rejects on
      // others. Neither is worth an error in front of the driver, who can copy
      // the key instead.
    }
  }, [enrollmentKey, driverName, isPrivate]);

  return (
    <Card title="Your enrollment key" style={styles.card}>
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
          {/* Covered, the field says what it is and what to do; every attempt to
              draw a stand-in key (dots, asterisks, bars) read as an empty input
              rather than a withheld value. Revealed, the key is set in the
              groups it is issued in, which is how it gets read down a phone. */}
          <Pressable
            testID="toggle-enrollment-key"
            onPress={() => setRevealed((r) => !r)}
            accessibilityRole="button"
            accessibilityState={{ expanded: revealed }}
            accessibilityLabel={revealed ? 'Hide enrollment key' : 'Show enrollment key'}
            style={styles.keyBox}
          >
            {revealed ? (
              <AppText
                testID="enrollment-key-value"
                variant="h2"
                style={styles.keyRevealed}
                selectable
                // A key is one token. On a narrow phone let it shrink to fit
                // rather than break across two lines.
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {enrollmentKey}
              </AppText>
            ) : (
              <View testID="enrollment-key-mask" style={styles.hiddenRow}>
                <Ionicons
                  name="lock-closed"
                  size={15}
                  color={theme.color.text.muted}
                />
                <AppText variant="label" color={theme.color.text.secondary}>
                  Tap to reveal
                </AppText>
              </View>
            )}

            <Ionicons
              name={revealed ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={theme.color.primary[600]}
            />
          </Pressable>

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
  keyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.color.surface.field,
    borderRadius: theme.radius.control,
    borderWidth: theme.borderWidth.hairline,
    borderColor: theme.color.border.hairline,
    paddingVertical: theme.space[3],
    paddingHorizontal: theme.space[4],
    // Fixed so revealing does not make the card jump.
    minHeight: 56,
  },
  hiddenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
  },
  keyRevealed: {
    flex: 1,
    color: theme.color.text.primary,
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
