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
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
};

// How long the button stays on "Copied" before naming its action again.
const COPIED_FOR_MS = 2000;
// A revealed key re-hides itself. The driver is holding the phone in public
// half the time, and a key left on screen is a credential left on screen.
const REVEALED_FOR_MS = 20000;

// Keeps the dashes so it still reads as a key, and gives away nothing else.
// The character count is fixed by the key format, so it leaks no length either.
// Asterisks rather than the round dot most password fields use. Note the glyph
// rides high in this typeface, so the row sits above the centre line the dashes
// sit on; that was seen and chosen, so do not "fix" the alignment casually.
export function maskKey(value: string) {
  return value.replace(/[^-]/g, '*');
}

export default function EnrollmentKeyCard({
  enrollmentKey,
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
        message: `Use my TrackMe enrollment key to join my shuttle: ${enrollmentKey}`,
      });
    } catch {
      // Share is unavailable on some platforms and a dismissed sheet rejects on
      // others. Neither is worth an error in front of the driver, who can copy
      // the key instead.
    }
  }, [enrollmentKey]);

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
          <View style={styles.keyBox}>
            {/* One token, so it is never broken across lines: a key read aloud
                or typed by eye has to survive the trip. */}
            <AppText
              testID="enrollment-key-value"
              variant="h2"
              style={[styles.keyText, revealed ? styles.keyRevealed : styles.keyMasked]}
              selectable={revealed}
              // A key is one token. On a narrow phone let it shrink to fit
              // rather than break across two lines.
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {revealed ? enrollmentKey : maskKey(enrollmentKey || '')}
            </AppText>
            <Pressable
              testID="toggle-enrollment-key"
              onPress={() => setRevealed((r) => !r)}
              accessibilityRole="button"
              accessibilityLabel={revealed ? 'Hide enrollment key' : 'Show enrollment key'}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.eye}
            >
              <Ionicons
                name={revealed ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={theme.color.primary[600]}
              />
            </Pressable>
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
  keyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    // The masked state is the resting state, so the box sits quiet on the card
    // and only the revealed key is asked to stand out.
    backgroundColor: theme.color.surface.field,
    borderRadius: theme.radius.control,
    borderWidth: theme.borderWidth.hairline,
    borderColor: theme.color.border.hairline,
    paddingVertical: theme.space[3],
    paddingHorizontal: theme.space[4],
    minHeight: 52,
  },
  keyText: {
    flex: 1,
  },
  // Dots in the brand accent read as a row of loading pips. Muted, they read as
  // what they are: something deliberately withheld.
  keyMasked: {
    // Solid enough to read as a filled password field rather than a dotted
    // rule, without the brand accent that made it look like loading pips.
    color: theme.color.text.secondary,
    // Sized to the largest that still keeps all 18 characters on one line next
    // to the eye; past this the mask wraps and the field grows a second row.
    letterSpacing: 1,
    fontSize: 20,
  },
  keyRevealed: {
    color: theme.color.text.primary,
    letterSpacing: 1.5,
  },
  eye: {
    paddingLeft: theme.space[3],
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
