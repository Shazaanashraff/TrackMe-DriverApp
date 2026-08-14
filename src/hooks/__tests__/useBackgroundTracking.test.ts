import { renderHook, act, waitFor } from '@testing-library/react-native';

const mockGetBackgroundPermissionsAsync = jest.fn();
const mockRequestBackgroundPermissionsAsync = jest.fn();

jest.mock('expo-location', () => ({
  __esModule: true,
  getBackgroundPermissionsAsync: () => mockGetBackgroundPermissionsAsync(),
  requestBackgroundPermissionsAsync: () => mockRequestBackgroundPermissionsAsync(),
}));

const mockStartBackgroundTracking = jest.fn();
const mockStopBackgroundTracking = jest.fn();
const mockIsBackgroundTrackingActive = jest.fn();

jest.mock('../../services/backgroundLocation', () => ({
  __esModule: true,
  startBackgroundTracking: () => mockStartBackgroundTracking(),
  stopBackgroundTracking: () => mockStopBackgroundTracking(),
  isBackgroundTrackingActive: () => mockIsBackgroundTrackingActive(),
}));

import { useBackgroundTracking } from '../useBackgroundTracking';

beforeEach(() => {
  jest.clearAllMocks();
  mockGetBackgroundPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
  mockRequestBackgroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
  mockStartBackgroundTracking.mockResolvedValue(true);
  mockStopBackgroundTracking.mockResolvedValue(undefined);
  mockIsBackgroundTrackingActive.mockResolvedValue(false);
});

describe('the upgrade offer', () => {
  it('offers the upgrade once a shift starts without background permission', async () => {
    const { result } = renderHook(() => useBackgroundTracking(true));

    await waitFor(() => expect(result.current.shouldOfferUpgrade).toBe(true));
  });

  it('does not offer while the driver is off duty', async () => {
    const { result } = renderHook(() => useBackgroundTracking(false));

    await waitFor(() => expect(result.current.permission).toBe('undetermined'));
    expect(result.current.shouldOfferUpgrade).toBe(false);
  });

  it('stops offering once dismissed', async () => {
    const { result } = renderHook(() => useBackgroundTracking(true));
    await waitFor(() => expect(result.current.shouldOfferUpgrade).toBe(true));

    act(() => result.current.dismissOffer());

    expect(result.current.shouldOfferUpgrade).toBe(false);
  });

  it('does not offer when permission was already granted', async () => {
    mockGetBackgroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    const { result } = renderHook(() => useBackgroundTracking(true));

    await waitFor(() => expect(result.current.permission).toBe('granted'));
    expect(result.current.shouldOfferUpgrade).toBe(false);
  });
});

describe('enableBackground', () => {
  it('starts OS updates after the driver grants permission', async () => {
    const { result } = renderHook(() => useBackgroundTracking(true));
    await waitFor(() => expect(result.current.shouldOfferUpgrade).toBe(true));

    await act(async () => {
      await result.current.enableBackground();
    });

    expect(mockRequestBackgroundPermissionsAsync).toHaveBeenCalled();
    expect(mockStartBackgroundTracking).toHaveBeenCalled();
    expect(result.current.isActive).toBe(true);
    expect(result.current.permission).toBe('granted');
  });

  it('records a denial and does not start updates', async () => {
    mockRequestBackgroundPermissionsAsync.mockResolvedValue({ status: 'denied' });
    const { result } = renderHook(() => useBackgroundTracking(true));
    await waitFor(() => expect(result.current.shouldOfferUpgrade).toBe(true));

    let granted: boolean | undefined;
    await act(async () => {
      granted = await result.current.enableBackground();
    });

    expect(granted).toBe(false);
    expect(mockStartBackgroundTracking).not.toHaveBeenCalled();
    expect(result.current.permission).toBe('denied');
  });

  it('reports inactive when permission is granted but the OS refuses to start', async () => {
    mockStartBackgroundTracking.mockResolvedValue(false);
    const { result } = renderHook(() => useBackgroundTracking(true));
    await waitFor(() => expect(result.current.shouldOfferUpgrade).toBe(true));

    await act(async () => {
      await result.current.enableBackground();
    });

    expect(result.current.isActive).toBe(false);
  });
});

describe('shift lifecycle', () => {
  it('auto-starts background updates on a later shift, without re-prompting', async () => {
    mockGetBackgroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    const { result } = renderHook(() => useBackgroundTracking(true));

    await waitFor(() => expect(mockStartBackgroundTracking).toHaveBeenCalled());
    expect(mockRequestBackgroundPermissionsAsync).not.toHaveBeenCalled();
    expect(result.current.isActive).toBe(true);
  });

  it('stops OS updates when the shift ends', async () => {
    mockGetBackgroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    const { rerender } = renderHook(
      ({ tracking }) => useBackgroundTracking(tracking),
      { initialProps: { tracking: true } }
    );
    await waitFor(() => expect(mockStartBackgroundTracking).toHaveBeenCalled());

    rerender({ tracking: false });

    await waitFor(() => expect(mockStopBackgroundTracking).toHaveBeenCalled());
  });

  it('stops OS updates on unmount, so logout cannot leave a service running', async () => {
    mockGetBackgroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    const { unmount } = renderHook(() => useBackgroundTracking(true));
    await waitFor(() => expect(mockStartBackgroundTracking).toHaveBeenCalled());

    unmount();

    await waitFor(() => expect(mockStopBackgroundTracking).toHaveBeenCalled());
  });
});
