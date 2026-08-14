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
const mockGetForegroundPermissionsAsync = jest.fn();
const mockWatchPositionAsync = jest.fn();
const mockRemove = jest.fn();

jest.mock('expo-location', () => ({
  __esModule: true,
  requestForegroundPermissionsAsync: (...args: unknown[]) =>
    mockRequestForegroundPermissionsAsync(...args),
  getForegroundPermissionsAsync: (...args: unknown[]) =>
    mockGetForegroundPermissionsAsync(...args),
  watchPositionAsync: (...args: unknown[]) => mockWatchPositionAsync(...args),
  Accuracy: { High: 4 },
}));

// RN's own AppState jest mock never invokes registered listeners, so the
// AppState-driven foreground re-check (issue #26) can't be exercised through
// it. Mock the native module directly and capture the listener ourselves.
let appStateListener: ((state: string) => void) | null = null;
const mockAppStateRemove = jest.fn();

jest.mock('react-native/Libraries/AppState/AppState', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn((_event: string, cb: (state: string) => void) => {
      appStateListener = cb;
      return { remove: mockAppStateRemove };
    }),
    currentState: 'active',
  },
}));

function fireAppStateChange(state: string) {
  appStateListener?.(state);
}

let watchCallback:
  | ((location: { coords: { latitude: number; longitude: number; accuracy?: number | null } }) => void)
  | null;

beforeEach(() => {
  jest.clearAllMocks();
  watchCallback = null;
  appStateListener = null;
  mockGetConnectionState.mockReturnValue({ status: 'connected' });
  mockOnConnectionStateChange.mockReturnValue(() => {});
  mockRequestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
  mockGetForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
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
    renderHook(() => useLocationBroadcast({ active: true, vehicleId: 'b1', routeId: 'r1' }));
    await waitFor(() => expect(mockWatchPositionAsync).toHaveBeenCalled());
  });

  it('exposes denied and does not watch when permission is denied', async () => {
    mockRequestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });
    const { result } = renderHook(() =>
      useLocationBroadcast({ active: true, vehicleId: 'b1', routeId: 'r1' })
    );

    await waitFor(() => expect(result.current.permission).toBe('denied'));
    expect(mockWatchPositionAsync).not.toHaveBeenCalled();
  });

  it('does not request permission or watch while inactive', () => {
    renderHook(() => useLocationBroadcast({ active: false, vehicleId: 'b1', routeId: 'r1' }));
    expect(mockRequestForegroundPermissionsAsync).not.toHaveBeenCalled();
    expect(mockWatchPositionAsync).not.toHaveBeenCalled();
  });
});

describe('throttle', () => {
  it('emits the first fix immediately', async () => {
    renderHook(() => useLocationBroadcast({ active: true, vehicleId: 'b1', routeId: 'r1' }));
    await waitFor(() => expect(mockWatchPositionAsync).toHaveBeenCalled());

    act(() => fireFix(6.9271, 79.8612));
    expect(mockEmitLocation).toHaveBeenCalledWith('b1', 'r1', 6.9271, 79.8612, expect.any(Function));
  });

  it('skips a fix that arrives too soon and too close', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(0);

    renderHook(() => useLocationBroadcast({ active: true, vehicleId: 'b1', routeId: 'r1' }));
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

    renderHook(() => useLocationBroadcast({ active: true, vehicleId: 'b1', routeId: 'r1' }));
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
      useLocationBroadcast({ active: true, vehicleId: 'b1', routeId: 'r1' })
    );
    await waitFor(() => expect(mockWatchPositionAsync).toHaveBeenCalled());

    act(() => fireFix(6.9271, 79.8612, 12));
    expect(result.current.lastFix?.accuracy).toBe(12);
  });

  it('leaves accuracy undefined when the platform does not report one', async () => {
    const { result } = renderHook(() =>
      useLocationBroadcast({ active: true, vehicleId: 'b1', routeId: 'r1' })
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
      useLocationBroadcast({ active: true, vehicleId: 'b1', routeId: 'r1' })
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
      useLocationBroadcast({ active: true, vehicleId: 'b1', routeId: 'r1' })
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

  it('caps the offline buffer at 50 and drops the oldest fix once exceeded', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
    mockGetConnectionState.mockReturnValue({ status: 'disconnected' });

    const { result } = renderHook(() =>
      useLocationBroadcast({ active: true, vehicleId: 'b1', routeId: 'r1' })
    );
    await waitFor(() => expect(mockWatchPositionAsync).toHaveBeenCalled());

    // Each fix moves comfortably past MIN_DISTANCE_METERS/MIN_INTERVAL_MS so every
    // one is accepted by shouldEmit and pushed to the buffer.
    for (let i = 0; i < 55; i += 1) {
      jest.setSystemTime(i * 5000);
      act(() => fireFix(6.9 + i * 0.01, 79.8 + i * 0.01));
    }

    expect(result.current.bufferedCount).toBe(50);
    jest.useRealTimers();
  });

  it('re-buffers a fix whose ack times out even though the socket believed it was connected (issue #13)', async () => {
    // Connected per getConnectionState, but the real emitLocation (services/socket.ts)
    // resolves a dropped ack with a NACK-shaped response after its own timeout — simulate
    // that here since this hook mocks services/socket entirely.
    mockGetConnectionState.mockReturnValue({ status: 'connected' });
    mockEmitLocation.mockImplementation(
      (_vehicleId: string, _routeId: string, _lat: number, _lng: number, cb: (r: unknown) => void) => {
        cb({ success: false, error: 'Ack timeout' });
      }
    );

    const { result } = renderHook(() =>
      useLocationBroadcast({ active: true, vehicleId: 'b1', routeId: 'r1' })
    );
    await waitFor(() => expect(mockWatchPositionAsync).toHaveBeenCalled());

    act(() => fireFix(6.9271, 79.8612));

    expect(result.current.bufferedCount).toBe(1);
  });
});

describe('lost connection warning (issue #30)', () => {
  function mockNack() {
    mockEmitLocation.mockImplementation(
      (_vehicleId: string, _routeId: string, _lat: number, _lng: number, cb: (r: unknown) => void) => {
        cb({ success: false, error: 'Ack timeout' });
      }
    );
  }

  function mockAck() {
    mockEmitLocation.mockImplementation(
      (_vehicleId: string, _routeId: string, _lat: number, _lng: number, cb: (r: unknown) => void) => {
        cb({ success: true });
      }
    );
  }

  it('stays false below the rejection-streak threshold', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
    mockGetConnectionState.mockReturnValue({ status: 'connected' });
    mockNack();

    const { result } = renderHook(() =>
      useLocationBroadcast({ active: true, vehicleId: 'b1', routeId: 'r1' })
    );
    await waitFor(() => expect(mockWatchPositionAsync).toHaveBeenCalled());

    for (let i = 0; i < 4; i += 1) {
      jest.setSystemTime(i * 5000);
      act(() => fireFix(6.9 + i * 0.01, 79.8 + i * 0.01));
    }

    expect(result.current.lostConnection).toBe(false);
    jest.useRealTimers();
  });

  it('flips to true once the server rejects several updates in a row', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
    mockGetConnectionState.mockReturnValue({ status: 'connected' });
    mockNack();

    const { result } = renderHook(() =>
      useLocationBroadcast({ active: true, vehicleId: 'b1', routeId: 'r1' })
    );
    await waitFor(() => expect(mockWatchPositionAsync).toHaveBeenCalled());

    for (let i = 0; i < 5; i += 1) {
      jest.setSystemTime(i * 5000);
      act(() => fireFix(6.9 + i * 0.01, 79.8 + i * 0.01));
    }

    expect(result.current.lostConnection).toBe(true);
    jest.useRealTimers();
  });

  it('clears once an update is acknowledged again', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
    mockGetConnectionState.mockReturnValue({ status: 'connected' });
    mockNack();

    const { result } = renderHook(() =>
      useLocationBroadcast({ active: true, vehicleId: 'b1', routeId: 'r1' })
    );
    await waitFor(() => expect(mockWatchPositionAsync).toHaveBeenCalled());

    for (let i = 0; i < 5; i += 1) {
      jest.setSystemTime(i * 5000);
      act(() => fireFix(6.9 + i * 0.01, 79.8 + i * 0.01));
    }
    expect(result.current.lostConnection).toBe(true);

    mockAck();
    jest.setSystemTime(5 * 5000);
    act(() => fireFix(6.95, 79.85));

    expect(result.current.lostConnection).toBe(false);
    jest.useRealTimers();
  });

  it('resets the streak and warning when tracking stops', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
    mockGetConnectionState.mockReturnValue({ status: 'connected' });
    mockNack();

    const { result, rerender } = renderHook(
      ({ active }) => useLocationBroadcast({ active, vehicleId: 'b1', routeId: 'r1' }),
      { initialProps: { active: true } }
    );
    await waitFor(() => expect(mockWatchPositionAsync).toHaveBeenCalled());

    for (let i = 0; i < 5; i += 1) {
      jest.setSystemTime(i * 5000);
      act(() => fireFix(6.9 + i * 0.01, 79.8 + i * 0.01));
    }
    expect(result.current.lostConnection).toBe(true);

    rerender({ active: false });
    expect(result.current.lostConnection).toBe(false);
    jest.useRealTimers();
  });
});

describe('foreground permission re-check (issues #26, #14)', () => {
  it('starts watching once permission is granted via Settings and the app returns to foreground', async () => {
    mockRequestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });
    const { result } = renderHook(() =>
      useLocationBroadcast({ active: true, vehicleId: 'b1', routeId: 'r1' })
    );

    await waitFor(() => expect(result.current.permission).toBe('denied'));
    expect(mockWatchPositionAsync).not.toHaveBeenCalled();

    mockGetForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    await act(async () => {
      fireAppStateChange('active');
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.permission).toBe('granted'));
    expect(mockWatchPositionAsync).toHaveBeenCalledTimes(1);
  });

  it('does not restart the watcher if already watching and still granted', async () => {
    renderHook(() => useLocationBroadcast({ active: true, vehicleId: 'b1', routeId: 'r1' }));
    await waitFor(() => expect(mockWatchPositionAsync).toHaveBeenCalledTimes(1));

    await act(async () => {
      fireAppStateChange('active');
      await Promise.resolve();
    });

    expect(mockGetForegroundPermissionsAsync).toHaveBeenCalled();
    expect(mockWatchPositionAsync).toHaveBeenCalledTimes(1);
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it('does nothing on a foreground transition while inactive', async () => {
    mockRequestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });
    renderHook(() => useLocationBroadcast({ active: false, vehicleId: 'b1', routeId: 'r1' }));

    await act(async () => {
      fireAppStateChange('active');
      await Promise.resolve();
    });

    expect(mockGetForegroundPermissionsAsync).not.toHaveBeenCalled();
    expect(mockWatchPositionAsync).not.toHaveBeenCalled();
  });

  it('stays denied and does not watch if permission is still denied on recheck', async () => {
    mockRequestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });
    const { result } = renderHook(() =>
      useLocationBroadcast({ active: true, vehicleId: 'b1', routeId: 'r1' })
    );
    await waitFor(() => expect(result.current.permission).toBe('denied'));

    mockGetForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });
    await act(async () => {
      fireAppStateChange('active');
      await Promise.resolve();
    });

    expect(result.current.permission).toBe('denied');
    expect(mockWatchPositionAsync).not.toHaveBeenCalled();
  });

  it('stops the watcher and flips to denied when permission is revoked mid-shift (issue #14)', async () => {
    const { result } = renderHook(() =>
      useLocationBroadcast({ active: true, vehicleId: 'b1', routeId: 'r1' })
    );
    await waitFor(() => expect(mockWatchPositionAsync).toHaveBeenCalledTimes(1));
    expect(result.current.permission).toBe('granted');

    mockGetForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });
    await act(async () => {
      fireAppStateChange('active');
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.permission).toBe('denied'));
    expect(mockRemove).toHaveBeenCalledTimes(1);
  });

  it('resumes watching if permission is granted again after a mid-shift revocation', async () => {
    const { result } = renderHook(() =>
      useLocationBroadcast({ active: true, vehicleId: 'b1', routeId: 'r1' })
    );
    await waitFor(() => expect(mockWatchPositionAsync).toHaveBeenCalledTimes(1));

    mockGetForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });
    await act(async () => {
      fireAppStateChange('active');
      await Promise.resolve();
    });
    await waitFor(() => expect(result.current.permission).toBe('denied'));

    mockGetForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    await act(async () => {
      fireAppStateChange('active');
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.permission).toBe('granted'));
    expect(mockWatchPositionAsync).toHaveBeenCalledTimes(2);
  });

  it('removes the AppState listener on unmount', async () => {
    const { unmount } = renderHook(() =>
      useLocationBroadcast({ active: true, vehicleId: 'b1', routeId: 'r1' })
    );
    await waitFor(() => expect(mockWatchPositionAsync).toHaveBeenCalled());

    unmount();
    expect(mockAppStateRemove).toHaveBeenCalled();
  });
});

describe('cleanup', () => {
  it('removes the watcher when active becomes false', async () => {
    const { rerender } = renderHook(
      ({ active }) => useLocationBroadcast({ active, vehicleId: 'b1', routeId: 'r1' }),
      { initialProps: { active: true } }
    );
    await waitFor(() => expect(mockWatchPositionAsync).toHaveBeenCalled());

    rerender({ active: false });
    expect(mockRemove).toHaveBeenCalled();
  });

  it('removes the watcher on unmount', async () => {
    const { unmount } = renderHook(() =>
      useLocationBroadcast({ active: true, vehicleId: 'b1', routeId: 'r1' })
    );
    await waitFor(() => expect(mockWatchPositionAsync).toHaveBeenCalled());

    unmount();
    expect(mockRemove).toHaveBeenCalled();
  });
});
