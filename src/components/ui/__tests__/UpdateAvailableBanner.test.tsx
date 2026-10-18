import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import UpdateAvailableBanner from '../UpdateAvailableBanner';

const mockDownloadAndInstall = jest.fn();
let mockState: Record<string, unknown>;

jest.mock('../../../hooks/useAppUpdateCheck', () => ({
  useAppUpdateCheck: () => mockState,
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 24, bottom: 0, left: 0, right: 0 }),
}));

const release = {
  _id: 'r1',
  app: 'driver',
  platform: 'android',
  version: '1.0.3',
  versionCode: 6,
  downloadUrl: 'https://example.com/pingo-driver-1.0.3.apk',
  releaseNotes: 'Smaller download',
  mandatory: false,
  isActive: true,
  createdAt: '2026-10-18T00:00:00.000Z',
};

beforeEach(() => {
  mockDownloadAndInstall.mockClear();
  mockState = {
    updateAvailable: true,
    release,
    isDownloading: false,
    downloadProgress: 0,
    error: null,
    downloadAndInstall: mockDownloadAndInstall,
  };
});

describe('UpdateAvailableBanner', () => {
  it('renders nothing when no update is available', () => {
    mockState = { ...mockState, updateAvailable: false, release: null };
    const { toJSON } = render(<UpdateAvailableBanner />);
    expect(toJSON()).toBeNull();
  });

  it('shows the new version and release notes, and starts the install on tap', () => {
    const { getByText, getByLabelText } = render(<UpdateAvailableBanner />);
    expect(getByText(/v1\.0\.3/)).toBeTruthy();
    expect(getByText('Smaller download')).toBeTruthy();
    fireEvent.press(getByLabelText('Download and install update'));
    expect(mockDownloadAndInstall).toHaveBeenCalledTimes(1);
  });

  it('can be dismissed when the update is optional', () => {
    const { getByLabelText, toJSON } = render(<UpdateAvailableBanner />);
    fireEvent.press(getByLabelText('Dismiss update'));
    expect(toJSON()).toBeNull();
  });

  it('cannot be dismissed when the update is mandatory', () => {
    mockState = { ...mockState, release: { ...release, mandatory: true } };
    const { queryByLabelText, getByText } = render(<UpdateAvailableBanner />);
    expect(queryByLabelText('Dismiss update')).toBeNull();
    expect(getByText(/required to continue/i)).toBeTruthy();
  });

  it('shows a progress bar instead of the button while downloading', () => {
    mockState = { ...mockState, isDownloading: true, downloadProgress: 0.4 };
    const { getByTestId, queryByLabelText } = render(<UpdateAvailableBanner />);
    expect(getByTestId('update-download-progress')).toBeTruthy();
    expect(queryByLabelText('Download and install update')).toBeNull();
  });

  it('surfaces a download error', () => {
    mockState = { ...mockState, error: 'disk full' };
    const { getByText } = render(<UpdateAvailableBanner />);
    expect(getByText('disk full')).toBeTruthy();
  });
});
