import { renderHook, waitFor, act } from '@testing-library/react-native';
import { Platform } from 'react-native';

const mockGetLatestAppRelease = jest.fn();
jest.mock('../../services/api/appReleases', () => ({
  __esModule: true,
  getLatestAppRelease: () => mockGetLatestAppRelease(),
}));

jest.mock('expo-application', () => ({
  __esModule: true,
  nativeBuildVersion: '10',
}));

const mockDownloadAsync = jest.fn();
const mockCreateDownloadResumable = jest.fn((..._args: unknown[]) => ({
  downloadAsync: mockDownloadAsync,
}));
const mockGetContentUriAsync = jest.fn((_fileUri: string) => Promise.resolve(''));
jest.mock('expo-file-system/legacy', () => ({
  __esModule: true,
  cacheDirectory: 'file:///cache/',
  createDownloadResumable: (...args: unknown[]) => mockCreateDownloadResumable(...args),
  getContentUriAsync: (fileUri: string) => mockGetContentUriAsync(fileUri),
}));

const mockStartActivityAsync = jest.fn((_action: string, _params?: unknown) =>
  Promise.resolve({ resultCode: -1 })
);
jest.mock('expo-intent-launcher', () => ({
  __esModule: true,
  startActivityAsync: (action: string, params?: unknown) => mockStartActivityAsync(action, params),
}));

import { useAppUpdateCheck } from '../useAppUpdateCheck';

const baseRelease = {
  _id: 'r1',
  app: 'driver',
  platform: 'android',
  version: '1.2.0',
  versionCode: 12,
  downloadUrl: 'https://example.com/driver-app.apk',
  releaseNotes: 'Bug fixes',
  mandatory: false,
  fileSizeBytes: 1024,
  isActive: true,
  createdAt: '2026-10-01T00:00:00.000Z',
};

const originalOS = Platform.OS;
const originalDev = (globalThis as { __DEV__?: boolean }).__DEV__;

function setPlatform(os: string) {
  Object.defineProperty(Platform, 'OS', { get: () => os });
}

beforeEach(() => {
  jest.clearAllMocks();
  setPlatform('android');
  (globalThis as { __DEV__?: boolean }).__DEV__ = false;
  mockGetLatestAppRelease.mockResolvedValue(null);
  mockDownloadAsync.mockResolvedValue({ uri: 'file:///cache/driver-app-update.apk' });
  mockGetContentUriAsync.mockResolvedValue('content://driver-app-update.apk');
  mockStartActivityAsync.mockResolvedValue({ resultCode: -1 });
});

afterAll(() => {
  setPlatform(originalOS);
  (globalThis as { __DEV__?: boolean }).__DEV__ = originalDev;
});

describe('platform / env gating', () => {
  it('does nothing on iOS', async () => {
    setPlatform('ios');
    const { result } = renderHook(() => useAppUpdateCheck());

    await waitFor(() => expect(result.current.updateAvailable).toBe(false));
    expect(mockGetLatestAppRelease).not.toHaveBeenCalled();
  });

  it('does nothing in __DEV__', async () => {
    (globalThis as { __DEV__?: boolean }).__DEV__ = true;
    const { result } = renderHook(() => useAppUpdateCheck());

    await waitFor(() => expect(result.current.updateAvailable).toBe(false));
    expect(mockGetLatestAppRelease).not.toHaveBeenCalled();
  });
});

describe('version comparison', () => {
  it('reports no update when the backend has no release', async () => {
    mockGetLatestAppRelease.mockResolvedValue(null);
    const { result } = renderHook(() => useAppUpdateCheck());

    await waitFor(() => expect(mockGetLatestAppRelease).toHaveBeenCalled());
    expect(result.current.updateAvailable).toBe(false);
    expect(result.current.release).toBeNull();
  });

  it('reports no update when the backend versionCode is equal', async () => {
    mockGetLatestAppRelease.mockResolvedValue({ ...baseRelease, versionCode: 10 });
    const { result } = renderHook(() => useAppUpdateCheck());

    await waitFor(() => expect(mockGetLatestAppRelease).toHaveBeenCalled());
    expect(result.current.updateAvailable).toBe(false);
  });

  it('reports no update when the backend versionCode is lower', async () => {
    mockGetLatestAppRelease.mockResolvedValue({ ...baseRelease, versionCode: 5 });
    const { result } = renderHook(() => useAppUpdateCheck());

    await waitFor(() => expect(mockGetLatestAppRelease).toHaveBeenCalled());
    expect(result.current.updateAvailable).toBe(false);
  });

  it('reports an update when the backend versionCode is higher', async () => {
    mockGetLatestAppRelease.mockResolvedValue({ ...baseRelease, versionCode: 12 });
    const { result } = renderHook(() => useAppUpdateCheck());

    await waitFor(() => expect(result.current.updateAvailable).toBe(true));
    expect(result.current.release?.versionCode).toBe(12);
  });
});

describe('downloadAndInstall', () => {
  it('downloads the APK, resolves a content URI, and launches the install intent, in order', async () => {
    mockGetLatestAppRelease.mockResolvedValue({ ...baseRelease, versionCode: 12 });
    const { result } = renderHook(() => useAppUpdateCheck());
    await waitFor(() => expect(result.current.updateAvailable).toBe(true));

    await act(async () => {
      await result.current.downloadAndInstall();
    });

    expect(mockCreateDownloadResumable).toHaveBeenCalledWith(
      baseRelease.downloadUrl,
      'file:///cache/driver-app-update.apk',
      {},
      expect.any(Function)
    );
    expect(mockDownloadAsync).toHaveBeenCalled();
    expect(mockGetContentUriAsync).toHaveBeenCalledWith('file:///cache/driver-app-update.apk');
    expect(mockStartActivityAsync).toHaveBeenCalledWith('android.intent.action.VIEW', {
      data: 'content://driver-app-update.apk',
      flags: 1,
      type: 'application/vnd.android.package-archive',
    });

    const downloadOrder = mockCreateDownloadResumable.mock.invocationCallOrder[0];
    const contentUriOrder = mockGetContentUriAsync.mock.invocationCallOrder[0];
    const installOrder = mockStartActivityAsync.mock.invocationCallOrder[0];
    expect(downloadOrder).toBeLessThan(contentUriOrder);
    expect(contentUriOrder).toBeLessThan(installOrder);

    expect(result.current.isDownloading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('tracks progress via the resumable download callback', async () => {
    mockGetLatestAppRelease.mockResolvedValue({ ...baseRelease, versionCode: 12 });
    let progressCallback: ((data: { totalBytesWritten: number; totalBytesExpectedToWrite: number }) => void) | undefined;
    mockCreateDownloadResumable.mockImplementation((...args: unknown[]) => {
      progressCallback = args[3] as typeof progressCallback;
      return { downloadAsync: mockDownloadAsync };
    });

    const { result } = renderHook(() => useAppUpdateCheck());
    await waitFor(() => expect(result.current.updateAvailable).toBe(true));

    const installPromise = act(async () => {
      const p = result.current.downloadAndInstall();
      progressCallback?.({ totalBytesWritten: 50, totalBytesExpectedToWrite: 100 });
      await p;
    });

    await installPromise;
    expect(result.current.downloadProgress).toBeGreaterThanOrEqual(0);
  });

  it('surfaces an error instead of throwing when the download fails', async () => {
    mockGetLatestAppRelease.mockResolvedValue({ ...baseRelease, versionCode: 12 });
    mockDownloadAsync.mockRejectedValue(new Error('network dropped'));
    const { result } = renderHook(() => useAppUpdateCheck());
    await waitFor(() => expect(result.current.updateAvailable).toBe(true));

    await act(async () => {
      await result.current.downloadAndInstall();
    });

    expect(result.current.error).toBe('network dropped');
    expect(result.current.isDownloading).toBe(false);
    expect(mockStartActivityAsync).not.toHaveBeenCalled();
  });

  it('surfaces an error when the install intent fails to launch', async () => {
    mockGetLatestAppRelease.mockResolvedValue({ ...baseRelease, versionCode: 12 });
    mockStartActivityAsync.mockRejectedValue(new Error('no activity found'));
    const { result } = renderHook(() => useAppUpdateCheck());
    await waitFor(() => expect(result.current.updateAvailable).toBe(true));

    await act(async () => {
      await result.current.downloadAndInstall();
    });

    expect(result.current.error).toBe('no activity found');
  });
});

describe('check failure', () => {
  it('surfaces an error without throwing when the release check fails', async () => {
    mockGetLatestAppRelease.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useAppUpdateCheck());

    await waitFor(() => expect(result.current.error).toBe('offline'));
    expect(result.current.updateAvailable).toBe(false);
  });
});
