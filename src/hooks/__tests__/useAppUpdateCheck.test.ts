import { renderHook, waitFor, act } from '@testing-library/react-native';
import { Platform } from 'react-native';

const mockGetLatestAppRelease = jest.fn();
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    getLatestAppRelease: (...args: unknown[]) => mockGetLatestAppRelease(...args),
  },
}));


const mockNativeBuildVersion: { value: string | null } = { value: '10' };
jest.mock('expo-application', () => ({
  get nativeBuildVersion() {
    return mockNativeBuildVersion.value;
  },
}));

const mockCreateDownloadResumable = jest.fn();
const mockGetContentUriAsync = jest.fn();
jest.mock(
  'expo-file-system/legacy',
  () => ({
    cacheDirectory: 'file:///cache/',
    createDownloadResumable: (...args: unknown[]) => mockCreateDownloadResumable(...args),
    getContentUriAsync: (...args: unknown[]) => mockGetContentUriAsync(...args),
  }),
  { virtual: true }
);

const mockStartActivityAsync = jest.fn();
jest.mock('expo-intent-launcher', () => ({
  startActivityAsync: (...args: unknown[]) => mockStartActivityAsync(...args),
}));

import { useAppUpdateCheck } from '../useAppUpdateCheck';

process.env.EXPO_PUBLIC_APK_UPDATER = '1';

const baseRelease = {
  _id: 'rel1',
  app: 'driver',
  platform: 'android',
  version: '2.0.0',
  versionCode: 20,
  downloadUrl: 'https://example.com/app.apk',
  releaseNotes: 'Bug fixes',
  mandatory: false,
  fileSizeBytes: 1000,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const globalAny = globalThis as unknown as { __DEV__: boolean };
const originalDev = globalAny.__DEV__;

beforeEach(() => {
  jest.clearAllMocks();
  Platform.OS = 'android';
  mockNativeBuildVersion.value = '10';
  // jest-expo runs with __DEV__ === true by default; this hook explicitly
  // no-ops in __DEV__, so force it false here and flip it back per-test for
  // the dedicated __DEV__ case below.
  globalAny.__DEV__ = false;
});

afterEach(() => {
  globalAny.__DEV__ = originalDev;
});

describe('useAppUpdateCheck', () => {
  it('skips entirely on iOS', async () => {
    Platform.OS = 'ios';

    renderHook(() => useAppUpdateCheck());
    await Promise.resolve();

    expect(mockGetLatestAppRelease).not.toHaveBeenCalled();
  });

  it('skips entirely in __DEV__', async () => {
    globalAny.__DEV__ = true;

    renderHook(() => useAppUpdateCheck());
    await Promise.resolve();

    expect(mockGetLatestAppRelease).not.toHaveBeenCalled();
  });

  it('reports no update when the backend versionCode equals the installed version', async () => {
    mockNativeBuildVersion.value = '20';
    mockGetLatestAppRelease.mockResolvedValueOnce({ ...baseRelease, versionCode: 20 });

    const { result } = renderHook(() => useAppUpdateCheck());

    await waitFor(() => expect(mockGetLatestAppRelease).toHaveBeenCalledWith('android'));
    expect(result.current.updateAvailable).toBe(false);
    expect(result.current.release).toBeNull();
  });

  it('reports no update when the backend versionCode is lower than installed', async () => {
    mockNativeBuildVersion.value = '25';
    mockGetLatestAppRelease.mockResolvedValueOnce({ ...baseRelease, versionCode: 20 });

    const { result } = renderHook(() => useAppUpdateCheck());

    await waitFor(() => expect(mockGetLatestAppRelease).toHaveBeenCalled());
    expect(result.current.updateAvailable).toBe(false);
  });

  it('reports updateAvailable: true when the backend versionCode is higher', async () => {
    mockNativeBuildVersion.value = '10';
    mockGetLatestAppRelease.mockResolvedValueOnce({ ...baseRelease, versionCode: 20 });

    const { result } = renderHook(() => useAppUpdateCheck());

    await waitFor(() => expect(result.current.updateAvailable).toBe(true));
    expect(result.current.release).toEqual(expect.objectContaining({ versionCode: 20 }));
  });

  it('does nothing when the backend returns no release', async () => {
    mockGetLatestAppRelease.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useAppUpdateCheck());

    await waitFor(() => expect(mockGetLatestAppRelease).toHaveBeenCalled());
    expect(result.current.updateAvailable).toBe(false);
  });

  it('does not throw when the API call rejects', async () => {
    mockGetLatestAppRelease.mockRejectedValueOnce(new Error('network error'));

    expect(() => renderHook(() => useAppUpdateCheck())).not.toThrow();
    await waitFor(() => expect(mockGetLatestAppRelease).toHaveBeenCalled());
  });

  describe('downloadAndInstall', () => {
    async function renderWithUpdate() {
      mockNativeBuildVersion.value = '10';
      mockGetLatestAppRelease.mockResolvedValueOnce({ ...baseRelease, versionCode: 20 });
      const hook = renderHook(() => useAppUpdateCheck());
      await waitFor(() => expect(hook.result.current.updateAvailable).toBe(true));
      return hook;
    }

    it('downloads, resolves content URI, then launches the install intent in order', async () => {
      const downloadAsync = jest.fn().mockResolvedValue({ uri: 'file:///cache/driver-app-update.apk' });
      mockCreateDownloadResumable.mockReturnValue({ downloadAsync });
      mockGetContentUriAsync.mockResolvedValue('content://downloads/app.apk');
      mockStartActivityAsync.mockResolvedValue({ resultCode: -1 });

      const { result } = await renderWithUpdate();

      await act(async () => {
        await result.current.downloadAndInstall();
      });

      expect(mockCreateDownloadResumable).toHaveBeenCalledWith(
        'https://example.com/app.apk',
        'file:///cache/driver-app-update.apk',
        {},
        expect.any(Function)
      );
      expect(downloadAsync).toHaveBeenCalled();
      expect(mockGetContentUriAsync).toHaveBeenCalledWith('file:///cache/driver-app-update.apk');
      expect(mockStartActivityAsync).toHaveBeenCalledWith('android.intent.action.VIEW', {
        data: 'content://downloads/app.apk',
        flags: 1,
        type: 'application/vnd.android.package-archive',
      });

      const getContentUriOrder = mockGetContentUriAsync.mock.invocationCallOrder[0];
      const startActivityOrder = mockStartActivityAsync.mock.invocationCallOrder[0];
      const downloadOrder = downloadAsync.mock.invocationCallOrder[0];
      expect(downloadOrder).toBeLessThan(getContentUriOrder);
      expect(getContentUriOrder).toBeLessThan(startActivityOrder);

      expect(result.current.isDownloading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('updates downloadProgress from the resumable progress callback', async () => {
      let progressCallback: ((data: { totalBytesWritten: number; totalBytesExpectedToWrite: number }) => void) | undefined;
      const downloadAsync = jest.fn().mockResolvedValue({ uri: 'file:///cache/driver-app-update.apk' });
      mockCreateDownloadResumable.mockImplementation((_url, _fileUri, _opts, callback) => {
        progressCallback = callback;
        return { downloadAsync };
      });
      mockGetContentUriAsync.mockResolvedValue('content://downloads/app.apk');
      mockStartActivityAsync.mockResolvedValue({ resultCode: -1 });

      const { result } = await renderWithUpdate();

      await act(async () => {
        const promise = result.current.downloadAndInstall();
        progressCallback?.({ totalBytesWritten: 50, totalBytesExpectedToWrite: 100 });
        await promise;
      });

      expect(result.current.downloadProgress).toBe(0.5);
    });

    it('surfaces a download failure via error and never throws', async () => {
      mockCreateDownloadResumable.mockReturnValue({
        downloadAsync: jest.fn().mockRejectedValue(new Error('disk full')),
      });

      const { result } = await renderWithUpdate();

      await act(async () => {
        await result.current.downloadAndInstall();
      });

      expect(result.current.error).toBe('disk full');
      expect(result.current.isDownloading).toBe(false);
      expect(mockStartActivityAsync).not.toHaveBeenCalled();
    });

    it('surfaces an install-intent failure via error', async () => {
      const downloadAsync = jest.fn().mockResolvedValue({ uri: 'file:///cache/driver-app-update.apk' });
      mockCreateDownloadResumable.mockReturnValue({ downloadAsync });
      mockGetContentUriAsync.mockResolvedValue('content://downloads/app.apk');
      mockStartActivityAsync.mockRejectedValue(new Error('no activity found'));

      const { result } = await renderWithUpdate();

      await act(async () => {
        await result.current.downloadAndInstall();
      });

      expect(result.current.error).toBe('no activity found');
    });

    it('does nothing if called with no release available', async () => {
      Platform.OS = 'ios';
      const { result } = renderHook(() => useAppUpdateCheck());

      await act(async () => {
        await result.current.downloadAndInstall();
      });

      expect(mockCreateDownloadResumable).not.toHaveBeenCalled();
    });
  });
});

describe('useAppUpdateCheck — Play build gate', () => {
  it('does not check for APK updates when EXPO_PUBLIC_APK_UPDATER is not 1', async () => {
    const prev = process.env.EXPO_PUBLIC_APK_UPDATER;
    process.env.EXPO_PUBLIC_APK_UPDATER = '0';
    mockGetLatestAppRelease.mockClear();
    const { result } = renderHook(() => useAppUpdateCheck());
    await new Promise<void>((r) => setTimeout(() => r(), 20));
    expect(mockGetLatestAppRelease).not.toHaveBeenCalled();
    expect(result.current.updateAvailable).toBe(false);
    process.env.EXPO_PUBLIC_APK_UPDATER = prev;
  });
});
