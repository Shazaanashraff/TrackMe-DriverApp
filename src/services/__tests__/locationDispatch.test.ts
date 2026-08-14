import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  dispatchFix,
  getBufferedCount,
  getTrackingTarget,
  replayBuffer,
  resetDispatch,
  restoreDispatchState,
  setTrackingTarget,
  startReplayOnReconnect,
  stopReplayOnReconnect,
  subscribeToBufferCount,
  subscribeToFixes,
  MAX_BUFFER_SIZE,
} from '../locationDispatch';

const mockEmitLocation = jest.fn();
const mockGetConnectionState = jest.fn();
let connectionListener: ((state: { status: string }) => void) | null = null;

jest.mock('../socket', () => ({
  __esModule: true,
  emitLocation: (...args: unknown[]) => mockEmitLocation(...args),
  getConnectionState: () => mockGetConnectionState(),
  onConnectionStateChange: (cb: (state: { status: string }) => void) => {
    connectionListener = cb;
    return () => {
      connectionListener = null;
    };
  },
}));

const fix = (lat: number, lng: number, timestamp: number) => ({ lat, lng, timestamp });

beforeEach(async () => {
  jest.clearAllMocks();
  connectionListener = null;
  mockGetConnectionState.mockReturnValue({ status: 'connected' });
  await resetDispatch();
  await AsyncStorage.clear();
  await setTrackingTarget({ vehicleId: 'VH-1', routeId: 'R-1' });
});

describe('throttle', () => {
  it('emits the first fix', () => {
    expect(dispatchFix(fix(6.9271, 79.8612, 1000))).toBe(true);
    expect(mockEmitLocation).toHaveBeenCalledWith(
      'VH-1',
      'R-1',
      6.9271,
      79.8612,
      expect.any(Function)
    );
  });

  it('drops a fix that is too soon and too close', () => {
    dispatchFix(fix(6.9271, 79.8612, 1000));
    expect(dispatchFix(fix(6.92711, 79.86121, 1500))).toBe(false);
    expect(mockEmitLocation).toHaveBeenCalledTimes(1);
  });

  it('emits again once far enough away and late enough', () => {
    dispatchFix(fix(6.9271, 79.8612, 1000));
    expect(dispatchFix(fix(6.94, 79.88, 5000))).toBe(true);
    expect(mockEmitLocation).toHaveBeenCalledTimes(2);
  });
});

describe('offline buffer', () => {
  it('buffers instead of emitting while the socket is down', () => {
    mockGetConnectionState.mockReturnValue({ status: 'disconnected' });
    dispatchFix(fix(6.9271, 79.8612, 1000));

    expect(mockEmitLocation).not.toHaveBeenCalled();
    expect(getBufferedCount()).toBe(1);
  });

  it('re-buffers a fix the server NACKed', () => {
    mockEmitLocation.mockImplementationOnce(
      (_v: string, _r: string, _lat: number, _lng: number, cb: (r: unknown) => void) =>
        cb({ success: false, error: 'Ack timeout' })
    );
    dispatchFix(fix(6.9271, 79.8612, 1000));

    expect(getBufferedCount()).toBe(1);
  });

  it('does not re-buffer a fix the server accepted as stale', () => {
    // The backend ACKs an out-of-order replayed fix as success:true/stale so the
    // client cannot livelock replaying the same batch — see REALTIME.md §6.
    mockEmitLocation.mockImplementationOnce(
      (_v: string, _r: string, _lat: number, _lng: number, cb: (r: unknown) => void) =>
        cb({ success: true, data: { stale: true } })
    );
    dispatchFix(fix(6.9271, 79.8612, 1000));

    expect(getBufferedCount()).toBe(0);
  });

  it('drops the oldest fix once the buffer is full', () => {
    mockGetConnectionState.mockReturnValue({ status: 'disconnected' });
    for (let i = 0; i < MAX_BUFFER_SIZE + 10; i += 1) {
      dispatchFix(fix(6.9 + i * 0.01, 79.8 + i * 0.01, 1000 + i * 3000));
    }
    expect(getBufferedCount()).toBe(MAX_BUFFER_SIZE);
  });

  it('replays buffered fixes oldest-first on reconnect', () => {
    mockGetConnectionState.mockReturnValue({ status: 'disconnected' });
    dispatchFix(fix(6.90, 79.80, 1000));
    dispatchFix(fix(6.91, 79.81, 5000));
    expect(getBufferedCount()).toBe(2);

    mockGetConnectionState.mockReturnValue({ status: 'connected' });
    startReplayOnReconnect();
    connectionListener?.({ status: 'connected' });

    expect(mockEmitLocation.mock.calls.map((call) => call[2])).toEqual([6.9, 6.91]);
    expect(getBufferedCount()).toBe(0);
    stopReplayOnReconnect();
  });

  it('replays nothing when the buffer is empty', () => {
    replayBuffer();
    expect(mockEmitLocation).not.toHaveBeenCalled();
  });
});

describe('subscribers', () => {
  it('notifies fix and buffer listeners, and stops after unsubscribe', () => {
    const onFix = jest.fn();
    const onBuffer = jest.fn();
    const unsubscribeFix = subscribeToFixes(onFix);
    const unsubscribeBuffer = subscribeToBufferCount(onBuffer);

    mockGetConnectionState.mockReturnValue({ status: 'disconnected' });
    dispatchFix(fix(6.9271, 79.8612, 1000));

    expect(onFix).toHaveBeenCalledWith(expect.objectContaining({ lat: 6.9271 }));
    expect(onBuffer).toHaveBeenCalledWith(1);

    unsubscribeFix();
    unsubscribeBuffer();
    dispatchFix(fix(6.95, 79.9, 9000));
    expect(onFix).toHaveBeenCalledTimes(1);
  });

  it('keeps pumping when a listener throws', () => {
    subscribeToFixes(() => {
      throw new Error('listener blew up');
    });
    expect(() => dispatchFix(fix(6.9271, 79.8612, 1000))).not.toThrow();
    expect(mockEmitLocation).toHaveBeenCalled();
  });
});

describe('headless restore', () => {
  it('rehydrates the target and buffer a background launch starts without', async () => {
    mockGetConnectionState.mockReturnValue({ status: 'disconnected' });
    dispatchFix(fix(6.9271, 79.8612, 1000));

    // Simulate the process restarting: memory gone, AsyncStorage intact.
    const storedTarget = await AsyncStorage.getItem('driver_tracking_target');
    const storedBuffer = await AsyncStorage.getItem('driver_location_buffer');
    await resetDispatch();
    await AsyncStorage.setItem('driver_tracking_target', storedTarget as string);
    await AsyncStorage.setItem('driver_location_buffer', storedBuffer as string);

    expect(getTrackingTarget()).toBeNull();
    await restoreDispatchState();

    expect(getTrackingTarget()).toEqual({ vehicleId: 'VH-1', routeId: 'R-1' });
    expect(getBufferedCount()).toBe(1);
  });

  it('survives corrupt stored state rather than blocking the shift', async () => {
    await resetDispatch();
    await AsyncStorage.setItem('driver_tracking_target', 'not-json');

    await expect(restoreDispatchState()).resolves.toBeUndefined();
  });
});

describe('resetDispatch', () => {
  it('clears the target, buffer, and throttle at end of shift', async () => {
    mockGetConnectionState.mockReturnValue({ status: 'disconnected' });
    dispatchFix(fix(6.9271, 79.8612, 1000));

    await resetDispatch();

    expect(getBufferedCount()).toBe(0);
    expect(getTrackingTarget()).toBeNull();
    expect(await AsyncStorage.getItem('driver_location_buffer')).toBeNull();
  });

  it('drops fixes once the target is cleared', async () => {
    await resetDispatch();
    dispatchFix(fix(6.9271, 79.8612, 1000));
    expect(mockEmitLocation).not.toHaveBeenCalled();
  });
});
