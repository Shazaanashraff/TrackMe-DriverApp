import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useLocationBroadcast } from '../useLocationBroadcast';

const mockEmitLocation = jest.fn();
const mockGetConnectionState = jest.fn();
const mockOnConnectionStateChange = jest.fn();

jest.mock('../../services/socket', () => ({
  __esModule: true,
  emitLocation: (...args: unknown[]) => mockEmitLocation(...args),
  getConnectionState: () => mockGetConnectionState(),
  onConnectionStateChange: (...args: unknown[]) => mockOnConnectionStateChange(...args),
}));

const mockRequestForegroundPermissionsAsync = jest.fn();
const mockWatchPositionAsync = jest.fn();
const mockRemove = jest.fn();

jest.mock('expo-location', () => ({
  __esModule: true,
  requestForegroundPermissionsAsync: (...args: unknown[]) =>
    mockRequestForegroundPermissionsAsync(...args),
  watchPositionAsync: (...args: unknown[]) => mockWatchPositionAsync(...args),
  Accuracy: { High: 4 },
}));

let watchCallback:
  | ((location: { coords: { latitude: number; longitude: number; accuracy?: number | null } }) => void)
  | null;

beforeEach(() => {
  jest.clearAllMocks();
  watchCallback = null;
  mockGetConnectionState.mockReturnValue({ status: 'connected' });
  mockOnConnectionStateChange.mockReturnValue(() => {});
  mockRequestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
  mockWatchPositionAsync.mockImplementation(async (_opts: unknown, cb: typeof watchCallback) => {
    watchCallback = cb;
    return { remove: mockRemove };
  });
});

function fireFix(lat: number, lng: number, accuracy?: number) {
  watchCallback?.({ coords: { latitude: lat, longitude: lng, accuracy } });
}

describe('permission', () => {
  it('starts the watcher when permission is granted', async () => {
    renderHook(() => useLocationBroadcast({ active: true, busId: 'b1', routeId: 'r1' }));
    await waitFor(() => expect(mockWatchPositionAsync).toHaveBeenCalled());
  });

  it('exposes denied and does not watch when permission is denied', async () => {
    mockRequestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });
    const { result } = renderHook(() =>
      useLocationBroadcast({ active: true, busId: 'b1', routeId: 'r1' })
    );

    await waitFor(() => expect(result.current.permission).toBe('denied'));
    expect(mockWatchPositionAsync).not.toHaveBeenCalled();
  });

  it('does not request permission or watch while inactive', () => {
    renderHook(() => useLocationBroadcast({ active: false, busId: 'b1', routeId: 'r1' }));
    expect(mockRequestForegroundPermissionsAsync).not.toHaveBeenCalled();
    expect(mockWatchPositionAsync).not.toHaveBeenCalled();
  });
});

describe('throttle', () => {
  it('emits the first fix immediately', async () => {
    renderHook(() => useLocationBroadcast({ active: true, busId: 'b1', routeId: 'r1' }));
    await waitFor(() => expect(mockWatchPositionAsync).toHaveBeenCalled());

    act(() => fireFix(6.9271, 79.8612));
    expect(mockEmitLocation).toHaveBeenCalledWith('b1', 'r1', 6.9271, 79.8612, expect.any(Function));
  });

  it('skips a fix that arrives too soon and too close', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(0);

    renderHook(() => useLocationBroadcast({ active: true, busId: 'b1', routeId: 'r1' }));
    await waitFor(() => expect(mockWatchPositionAsync).toHaveBeenCalled());

    act(() => fireFix(6.9271, 79.8612));
    mockEmitLocation.mockClear();

    jest.setSystemTime(500); // well under MIN_INTERVAL_MS
    act(() => fireFix(6.92711, 79.86121)); // negligible movement

    expect(mockEmitLocation).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('emits again once enough time and distance have passed', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(0);

    renderHook(() => useLocationBroadcast({ active: true, busId: 'b1', routeId: 'r1' }));
    await waitFor(() => expect(mockWatchPositionAsync).toHaveBeenCalled());

    act(() => fireFix(6.9271, 79.8612));
    mockEmitLocation.mockClear();

    jest.setSystemTime(5000);
    act(() => fireFix(6.93, 79.87)); // several km away — comfortably over the min distance

    expect(mockEmitLocation).toHaveBeenCalledWith('b1', 'r1', 6.93, 79.87, expect.any(Function));
    jest.useRealTimers();
  });
});

describe('accuracy', () => {
  it('carries the reported accuracy through to lastFix', async () => {
    const { result } = renderHook(() =>
      useLocationBroadcast({ active: true, busId: 'b1', routeId: 'r1' })
    );
    await waitFor(() => expect(mockWatchPositionAsync).toHaveBeenCalled());

    act(() => fireFix(6.9271, 79.8612, 12));
    expect(result.current.lastFix?.accuracy).toBe(12);
  });

  it('leaves accuracy undefined when the platform does not report one', async () => {
    const { result } = renderHook(() =>
      useLocationBroadcast({ active: true, busId: 'b1', routeId: 'r1' })
    );
    await waitFor(() => expect(mockWatchPositionAsync).toHaveBeenCalled());

    act(() => fireFix(6.9271, 79.8612));
    expect(result.current.lastFix?.accuracy).toBeUndefined();
  });
});

describe('offline buffer', () => {
  it('buffers a fix when the socket is disconnected and reports bufferedCount', async () => {
    mockGetConnectionState.mockReturnValue({ status: 'disconnected' });
    const { result } = renderHook(() =>
      useLocationBroadcast({ active: true, busId: 'b1', routeId: 'r1' })
    );
    await waitFor(() => expect(mockWatchPositionAsync).toHaveBeenCalled());

    act(() => fireFix(6.9271, 79.8612));

    expect(mockEmitLocation).not.toHaveBeenCalled();
    expect(result.current.bufferedCount).toBe(1);
  });

  it('replays buffered fixes in order on reconnect', async () => {
    mockGetConnectionState.mockReturnValue({ status: 'disconnected' });
    let stateListener: (state: { status: string }) => void = () => {};
    mockOnConnectionStateChange.mockImplementation((cb) => {
      stateListener = cb;
      return () => {};
    });

    const { result } = renderHook(() =>
      useLocationBroadcast({ active: true, busId: 'b1', routeId: 'r1' })
    );
    await waitFor(() => expect(mockWatchPositionAsync).toHaveBeenCalled());

    act(() => fireFix(6.9271, 79.8612));
    expect(result.current.bufferedCount).toBe(1);

    act(() => {
      stateListener({ status: 'connected' });
    });

    expect(mockEmitLocation).toHaveBeenCalledWith('b1', 'r1', 6.9271, 79.8612, expect.any(Function));
    expect(result.current.bufferedCount).toBe(0);
  });
});

describe('cleanup', () => {
  it('removes the watcher when active becomes false', async () => {
    const { rerender } = renderHook(
      ({ active }) => useLocationBroadcast({ active, busId: 'b1', routeId: 'r1' }),
      { initialProps: { active: true } }
    );
    await waitFor(() => expect(mockWatchPositionAsync).toHaveBeenCalled());

    rerender({ active: false });
    expect(mockRemove).toHaveBeenCalled();
  });

  it('removes the watcher on unmount', async () => {
    const { unmount } = renderHook(() =>
      useLocationBroadcast({ active: true, busId: 'b1', routeId: 'r1' })
    );
    await waitFor(() => expect(mockWatchPositionAsync).toHaveBeenCalled());

    unmount();
    expect(mockRemove).toHaveBeenCalled();
  });
});
