import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Application from 'expo-application';
import * as IntentLauncher from 'expo-intent-launcher';
import { cacheDirectory, createDownloadResumable, getContentUriAsync } from 'expo-file-system/legacy';
import { getLatestAppRelease, type AppRelease } from '../services/api/appReleases';

const APK_FILENAME = 'driver-app-update.apk';
const FLAG_GRANT_READ_URI_PERMISSION = 1;

export interface UseAppUpdateCheckResult {
  updateAvailable: boolean;
  release: AppRelease | null;
  isDownloading: boolean;
  downloadProgress: number;
  error: string | null;
  downloadAndInstall: () => Promise<void>;
}

/**
 * Checks once per mount for a newer native Android build than the one installed,
 * and — if the driver taps through — downloads the APK and hands it to the OS
 * installer.
 *
 * Android-only and dev-build-only-when-not-__DEV__: there is deliberately no iOS
 * path here. Apple's sandboxing blocks silent sideload installs, so iOS updates
 * are handled entirely by a server/app-store-side push notification instead —
 * nothing for this hook to do there. This is also unrelated to `expo-updates`
 * (not installed in this app): that mechanism patches the JS bundle in place;
 * this one replaces the whole native binary via a normal APK install.
 *
 * IMPORTANT LIMITATION: even after this hook downloads the APK, Android still
 * shows its own native "Install this app?" confirmation dialog — there is no way
 * to make the install itself silent without the app being a device-owner/MDM
 * profile, which this app is not. The best this hook can do is get the driver to
 * that one unavoidable confirmation tap as fast as possible (auto-detect +
 * auto-download); it cannot skip it.
 */
export function useAppUpdateCheck(): UseAppUpdateCheckResult {
  const supported = !__DEV__ && Platform.OS === 'android';

  const [release, setRelease] = useState<AppRelease | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supported) return;
    let cancelled = false;

    (async () => {
      try {
        const latest = await getLatestAppRelease();
        if (cancelled || !latest) return;

        const installedVersionCode = parseInt(Application.nativeBuildVersion ?? '0', 10);
        if (Number.isNaN(installedVersionCode)) return;

        if (latest.versionCode > installedVersionCode) {
          setRelease(latest);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to check for updates');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [supported]);

  const downloadAndInstall = useCallback(async () => {
    if (!release) return;

    setError(null);
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const localUri = `${cacheDirectory}${APK_FILENAME}`;
      const downloadResumable = createDownloadResumable(
        release.downloadUrl,
        localUri,
        {},
        ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
          if (totalBytesExpectedToWrite > 0) {
            setDownloadProgress(totalBytesWritten / totalBytesExpectedToWrite);
          }
        }
      );

      const result = await downloadResumable.downloadAsync();
      if (!result?.uri) {
        throw new Error('Download did not produce a file');
      }

      const contentUri = await getContentUriAsync(result.uri);

      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        flags: FLAG_GRANT_READ_URI_PERMISSION,
        type: 'application/vnd.android.package-archive',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download update');
    } finally {
      setIsDownloading(false);
    }
  }, [release]);

  return {
    updateAvailable: !!release,
    release,
    isDownloading,
    downloadProgress,
    error,
    downloadAndInstall,
  };
}
