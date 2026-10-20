import { useCallback, useEffect, useState } from 'react';
import { Linking, Platform } from 'react-native';
import api from '../services/api';
import type { AppRelease } from '../services/api/appReleases';

// Tracks the *native app's own version* (the installed APK) against the backend's
// app-releases registry. A new native build cannot be delivered as a JS patch — the driver
// has to download and install a whole new binary, which is what this hook drives.
//
// Android only. See UpdateMode below for the two delivery modes. Mirrors user-app's hook of
// the same name.

const APK_FILENAME = 'driver-app-update.apk';

// Two delivery modes, chosen at build time:
//  - 'apk'  (EXPO_PUBLIC_APK_UPDATER=1, the direct-APK `apk` EAS profile): compares versionCode and
//           downloads + installs the APK itself.
//  - 'play' (every other build, i.e. the Play .aab): Google Play forbids self-installing APKs, so the
//           banner only *links to the Play listing*. It compares the semver `version` string, because the
//           APK and the .aab of one release get different versionCodes from EAS and would otherwise
//           look permanently out of date.
export type UpdateMode = 'apk' | 'play';

export function isNewerVersion(latest: string, installed: string): boolean {
  const toParts = (v: string) => v.split('.').map((n) => parseInt(n, 10) || 0);
  const a = toParts(latest);
  const b = toParts(installed);
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) return diff > 0;
  }
  return false;
}

export interface UseAppUpdateCheckResult {
  mode: UpdateMode;
  openStore: () => Promise<void>;
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
    if (__DEV__ || Platform.OS !== 'android') return;
    const apkMode = process.env.EXPO_PUBLIC_APK_UPDATER === '1';

    let cancelled = false;

    (async () => {
      try {
        const Application: typeof import('expo-application') = require('expo-application');

        const latest = await api.getLatestAppRelease('android');
        if (!latest || cancelled) return;

        const installedVersionCode = parseInt(Application.nativeBuildVersion ?? '0', 10);
        const newer = apkMode
          ? !Number.isNaN(installedVersionCode) && latest.versionCode > installedVersionCode
          : isNewerVersion(latest.version, Application.nativeApplicationVersion ?? '0');

        if (newer) {
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

  const openStore = useCallback(async () => {
    setError(null);
    try {
      const Application: typeof import('expo-application') = require('expo-application');
      const id = Application.applicationId;
      if (!id) throw new Error('No application id');
      try {
        await Linking.openURL(`market://details?id=${id}`);
      } catch {
        await Linking.openURL(`https://play.google.com/store/apps/details?id=${id}`);
      }
    } catch {
      setError('Could not open Google Play. Open the Play Store and update Pingo from there.');
    }
  }, []);

  const mode: UpdateMode = process.env.EXPO_PUBLIC_APK_UPDATER === '1' ? 'apk' : 'play';

  return {
    mode,
    openStore,
    updateAvailable,
    release,
    isDownloading,
    downloadProgress,
    error,
    downloadAndInstall,
  };
}
