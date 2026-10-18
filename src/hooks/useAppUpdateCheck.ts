import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import api from '../services/api';
import type { AppRelease } from '../services/api/appReleases';

// Tracks the *native app's own version* (the installed APK) against the backend's
// app-releases registry. A new native build cannot be delivered as a JS patch — the driver
// has to download and install a whole new binary, which is what this hook drives.
//
// Android + direct-APK builds only. Google Play forbids self-installing APKs (and Play
// updates its own installs), so the Play (.aab) build leaves this off: only the `apk` EAS
// profile sets EXPO_PUBLIC_APK_UPDATER=1 (see eas.json). Mirrors user-app's hook of the
// same name.

const APK_FILENAME = 'driver-app-update.apk';

export interface UseAppUpdateCheckResult {
  updateAvailable: boolean;
  release: AppRelease | null;
  isDownloading: boolean;
  downloadProgress: number;
  error: string | null;
  downloadAndInstall: () => Promise<void>;
}

export function useAppUpdateCheck(): UseAppUpdateCheckResult {
  const [release, setRelease] = useState<AppRelease | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (process.env.EXPO_PUBLIC_APK_UPDATER !== '1') return;
    if (__DEV__ || Platform.OS !== 'android') return;

    let cancelled = false;

    (async () => {
      try {
        const Application: typeof import('expo-application') = require('expo-application');

        const latest = await api.getLatestAppRelease('android');
        if (!latest || cancelled) return;

        const installedVersionCode = parseInt(Application.nativeBuildVersion ?? '0', 10);

        if (!Number.isNaN(installedVersionCode) && latest.versionCode > installedVersionCode) {
          setRelease(latest);
          setUpdateAvailable(true);
        }
      } catch {
        // A failed check must never disturb the driver mid-shift; it retries next launch.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const downloadAndInstall = useCallback(async () => {
    if (!release) return;

    setError(null);
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      // Resumable downloads with progress live under the legacy API surface in SDK 54.
      const FileSystem: typeof import('expo-file-system/legacy') = require('expo-file-system/legacy');
      const IntentLauncher: typeof import('expo-intent-launcher') = require('expo-intent-launcher');

      const localUri = FileSystem.cacheDirectory + APK_FILENAME;

      const downloadResumable = FileSystem.createDownloadResumable(
        release.downloadUrl,
        localUri,
        {},
        (progress) => {
          if (progress.totalBytesExpectedToWrite > 0) {
            setDownloadProgress(progress.totalBytesWritten / progress.totalBytesExpectedToWrite);
          }
        }
      );

      const result = await downloadResumable.downloadAsync();
      if (!result?.uri) {
        throw new Error('Download did not complete');
      }

      const contentUri = await FileSystem.getContentUriAsync(result.uri);

      // Android still shows its own "Install this app?" confirmation after this call; it
      // cannot be skipped without a device-owner/MDM profile.
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        type: 'application/vnd.android.package-archive',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  }, [release]);

  return { updateAvailable, release, isDownloading, downloadProgress, error, downloadAndInstall };
}
