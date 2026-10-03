import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import AppText from './ui/AppText';
import PrimaryButton from './ui/PrimaryButton';
import { useAppUpdateCheck } from '../hooks/useAppUpdateCheck';

// Mounted once near the root so it can surface on every authenticated screen.
// Renders nothing on iOS, in __DEV__, or while no newer build has been found —
// see useAppUpdateCheck for why iOS has no equivalent UI at all.
export default function UpdateAvailableBanner() {
  const { updateAvailable, release, isDownloading, downloadProgress, error, downloadAndInstall } =
    useAppUpdateCheck();
  const [dismissed, setDismissed] = useState(false);

  if (!updateAvailable || !release || dismissed) return null;

  const mandatory = !!release.mandatory;

  return (
    <View style={styles.card} testID="update-available-banner">
      <View style={styles.header}>
        <Ionicons name="arrow-up-circle-outline" size={20} color={theme.color.primary[500]} />
        <AppText variant="h2" style={styles.title}>
          Update available — v{release.version}
        </AppText>
        {!mandatory ? (
          <PrimaryButton
            testID="update-banner-dismiss"
            title="✕"
            variant="secondary"
            onPress={() => setDismissed(true)}
            style={styles.dismissButton}
            textStyle={styles.dismissText}
          />
        ) : null}
      </View>

      {release.releaseNotes ? (
        <AppText variant="label" color={theme.color.text.secondary} style={styles.notes}>
          {release.releaseNotes}
        </AppText>
      ) : null}

      {mandatory ? (
        <AppText variant="caption" color={theme.color.danger.text} style={styles.mandatoryNote}>
          This update is required to keep using TrackMe.
        </AppText>
      ) : null}

      {isDownloading ? (
        <View style={styles.progressTrack} testID="update-banner-progress">
          <View style={[styles.progressFill, { width: `${Math.round(downloadProgress * 100)}%` }]} />
        </View>
      ) : null}

      {error ? (
        <AppText variant="caption" color={theme.color.danger.text} style={styles.error}>
          {error}
        </AppText>
      ) : null}

      <PrimaryButton
        testID="update-banner-download"
        title={isDownloading ? 'Downloading…' : 'Download & Install'}
        onPress={downloadAndInstall}
        loading={isDownloading}
        style={styles.downloadButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.color.surface.card,
    borderRadius: theme.radius.card,
    borderWidth: theme.borderWidth.hairline,
    borderColor: theme.color.border.hairline,
    padding: theme.space[4],
    margin: theme.space[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
  },
  title: {
    flex: 1,
  },
  dismissButton: {
    height: 28,
    width: 28,
    paddingHorizontal: 0,
  },
  dismissText: {
    fontSize: theme.font.size.caption,
  },
  notes: {
    marginTop: theme.space[2],
  },
  mandatoryNote: {
    marginTop: theme.space[2],
  },
  progressTrack: {
    height: 6,
    borderRadius: theme.radius.tag,
    backgroundColor: theme.color.surface.field,
    marginTop: theme.space[3],
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.color.primary[500],
  },
  error: {
    marginTop: theme.space[2],
  },
  downloadButton: {
    marginTop: theme.space[3],
  },
});
