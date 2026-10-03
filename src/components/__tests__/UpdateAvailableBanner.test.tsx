import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

const mockUseAppUpdateCheck = jest.fn();
jest.mock('../../hooks/useAppUpdateCheck', () => ({
  __esModule: true,
  useAppUpdateCheck: () => mockUseAppUpdateCheck(),
}));

import UpdateAvailableBanner from '../UpdateAvailableBanner';

const release = {
  _id: 'r1',
  app: 'driver',
  platform: 'android',
  version: '1.2.0',
  versionCode: 12,
  downloadUrl: 'https://example.com/driver-app.apk',
  releaseNotes: 'Fixes GPS drift',
  mandatory: false,
  fileSizeBytes: 1024,
  isActive: true,
  createdAt: '2026-10-01T00:00:00.000Z',
};

const baseState = {
  updateAvailable: false,
  release: null,
  isDownloading: false,
  downloadProgress: 0,
  error: null,
  downloadAndInstall: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('UpdateAvailableBanner', () => {
  it('renders nothing when no update is available', () => {
    mockUseAppUpdateCheck.mockReturnValue(baseState);
    const { queryByTestId } = render(<UpdateAvailableBanner />);

    expect(queryByTestId('update-available-banner')).toBeNull();
  });

  it('renders the version, release notes, and a download button when available', () => {
    mockUseAppUpdateCheck.mockReturnValue({ ...baseState, updateAvailable: true, release });
    const { getByTestId, getByText } = render(<UpdateAvailableBanner />);

    expect(getByTestId('update-available-banner')).toBeTruthy();
    expect(getByText(/v1\.2\.0/)).toBeTruthy();
    expect(getByText('Fixes GPS drift')).toBeTruthy();
    expect(getByTestId('update-banner-download')).toBeTruthy();
  });

  it('calls downloadAndInstall when the download button is pressed', () => {
    const downloadAndInstall = jest.fn();
    mockUseAppUpdateCheck.mockReturnValue({
      ...baseState,
      updateAvailable: true,
      release,
      downloadAndInstall,
    });
    const { getByTestId } = render(<UpdateAvailableBanner />);

    fireEvent.press(getByTestId('update-banner-download'));

    expect(downloadAndInstall).toHaveBeenCalled();
  });

  it('shows a progress indicator while downloading', () => {
    mockUseAppUpdateCheck.mockReturnValue({
      ...baseState,
      updateAvailable: true,
      release,
      isDownloading: true,
      downloadProgress: 0.4,
    });
    const { getByTestId } = render(<UpdateAvailableBanner />);

    expect(getByTestId('update-banner-progress')).toBeTruthy();
  });

  it('is dismissible when the release is not mandatory', () => {
    mockUseAppUpdateCheck.mockReturnValue({
      ...baseState,
      updateAvailable: true,
      release: { ...release, mandatory: false },
    });
    const { getByTestId, queryByTestId } = render(<UpdateAvailableBanner />);

    fireEvent.press(getByTestId('update-banner-dismiss'));

    expect(queryByTestId('update-available-banner')).toBeNull();
  });

  it('is not dismissible when the release is mandatory', () => {
    mockUseAppUpdateCheck.mockReturnValue({
      ...baseState,
      updateAvailable: true,
      release: { ...release, mandatory: true },
    });
    const { queryByTestId, getByText } = render(<UpdateAvailableBanner />);

    expect(queryByTestId('update-banner-dismiss')).toBeNull();
    expect(getByText(/required to keep using TrackMe/)).toBeTruthy();
  });

  it('surfaces a download error', () => {
    mockUseAppUpdateCheck.mockReturnValue({
      ...baseState,
      updateAvailable: true,
      release,
      error: 'Failed to download update',
    });
    const { getByText } = render(<UpdateAvailableBanner />);

    expect(getByText('Failed to download update')).toBeTruthy();
  });
});
