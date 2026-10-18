import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { useAppUpdateCheck } from '../../hooks/useAppUpdateCheck';

// Native-APK version-check banner: offers a whole new APK download when the backend's
// app-releases registry has a higher versionCode than the installed build. A mandatory
// release cannot be dismissed. See `src/hooks/useAppUpdateCheck.ts`.
export default function UpdateAvailableBanner() {
  const { updateAvailable, release, isDownloading, downloadProgress, error, downloadAndInstall } =
    useAppUpdateCheck();
  const insets = useSafeAreaInsets();
  const [dismissed, setDismissed] = useState(false);

  if (!updateAvailable || !release || dismissed) return null;

  const mandatory = Boolean(release.mandatory);
  const progressPct = Math.round(downloadProgress * 100);

  return (
    <View style={[styles.wrapper, { top: insets.top + theme.space[2] }]} pointerEvents="box-none">
      <View style={styles.banner}>
        <View style={styles.header}>
          <Ionicons name="cloud-download-outline" size={20} color={theme.color.accent[500]} />
          <Text style={styles.title} numberOfLines={1}>
            Update available — v{release.version}
          </Text>
          {!mandatory ? (
            <TouchableOpacity
              onPress={() => setDismissed(true)}
              accessibilityRole="button"
              accessibilityLabel="Dismiss update"
              hitSlop={12}
            >
              <Ionicons name="close" size={18} color={theme.color.text.muted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {release.releaseNotes ? (
          <Text style={styles.notes} numberOfLines={3}>
            {release.releaseNotes}
          </Text>
        ) : null}

        {mandatory ? <Text style={styles.mandatory}>This update is required to continue</Text> : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {isDownloading ? (
          <View style={styles.progressTrack} accessibilityRole="progressbar" testID="update-download-progress">
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
        ) : (
          <TouchableOpacity
            style={styles.button}
            onPress={downloadAndInstall}
            accessibilityRole="button"
            accessibilityLabel="Download and install update"
          >
            <Text style={styles.buttonText}>Download & install</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: theme.space[2],
    right: theme.space[2],
    zIndex: 9998,
  },
  banner: {
    backgroundColor: theme.color.surface.card,
    borderRadius: theme.radius.card,
    padding: theme.space[3],
    gap: theme.space[1],
    ...theme.elevation.sheet,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: theme.space[1] },
  title: {
    flex: 1,
    ...theme.textStyle('body', { weight: 'medium', color: theme.color.text.primary }),
  },
  notes: { ...theme.textStyle('caption', { color: theme.color.text.secondary }) },
  mandatory: { ...theme.textStyle('caption', { weight: 'medium', color: theme.color.warning.text }) },
  error: { ...theme.textStyle('caption', { color: theme.color.danger.text }) },
  button: {
    marginTop: theme.space[1],
    minHeight: theme.minTapTarget,
    backgroundColor: theme.color.accent[500],
    borderRadius: theme.radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { ...theme.textStyle('label', { weight: 'medium', color: theme.color.text.onAccent }) },
  progressTrack: {
    marginTop: theme.space[1],
    height: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.surface.field,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: theme.color.accent[500], borderRadius: theme.radius.pill },
});
