import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useTrackingSession } from '../useTrackingSession';

const mockStartTracking = jest.fn();
const mockStopTracking = jest.fn();
const mockOnConnectionStateChange = jest.fn();

jest.mock('../../services/socket', () => ({
  __esModule: true,
  startTracking: (...args: unknown[]) => mockStartTracking(...args),
  stopTracking: (...args: unknown[]) => mockStopTracking(...args),
  onConnectionStateChange: (...args: unknown[]) => mockOnConnectionStateChange(...args),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockOnConnectionStateChange.mockReturnValue(() => {});
});

describe('useTrackingSession', () => {
  it('starts idle', () => {
    const { result } = renderHook(() => useTrackingSession());
    expect(result.current.status).toBe('idle');
  });

  it('transitions starting -> tracking on a successful ack', async () => {
    mockStartTracking.mockResolvedValueOnce({ success: true });
    const { result } = renderHook(() => useTrackingSession());

    act(() => {
      result.current.start('vehicle-1');
    });
    expect(result.current.status).toBe('starting');

    await waitFor(() => expect(result.current.status).toBe('tracking'));
    expect(mockStartTracking).toHaveBeenCalledWith('vehicle-1');
    expect(result.current.error).toBeUndefined();
  });

  it('transitions starting -> error on a failed ack', async () => {
    mockStartTracking.mockResolvedValueOnce({ success: false, error: 'Socket not connected' });
    const { result } = renderHook(() => useTrackingSession());

    act(() => {
      result.current.start('vehicle-1');
    });

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error?.kind).toBe('tracking');
    expect(result.current.error?.message).toBe('Socket not connected');
  });

  it('logs the specific failure reason so it is not silently lost (issue #20)', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockStartTracking.mockResolvedValueOnce({ success: false, error: 'This bus is already being tracked elsewhere' });
    const { result } = renderHook(() => useTrackingSession());

    act(() => {
      result.current.start('vehicle-1');
    });

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("start('vehicle-1')"),
      'This bus is already being tracked elsewhere'
    );
    errorSpy.mockRestore();
  });

  it('stop() awaits the server ack before resetting to idle (issue #12)', async () => {
    mockStartTracking.mockResolvedValueOnce({ success: true });
    mockStopTracking.mockResolvedValueOnce({ success: true });
    const { result } = renderHook(() => useTrackingSession());

    act(() => {
      result.current.start('vehicle-1');
    });
    await waitFor(() => expect(result.current.status).toBe('tracking'));

    act(() => {
      result.current.stop('vehicle-1');
    });
    expect(mockStopTracking).toHaveBeenCalledWith('vehicle-1');

    await waitFor(() => expect(result.current.status).toBe('idle'));
    expect(result.current.error).toBeUndefined();
  });

  it('stays in tracking and surfaces an error when the stop ack fails (issue #12)', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockStartTracking.mockResolvedValueOnce({ success: true });
    mockStopTracking.mockResolvedValueOnce({ success: false, error: 'No response from server' });
    const { result } = renderHook(() => useTrackingSession());

    act(() => {
      result.current.start('vehicle-1');
    });
    await waitFor(() => expect(result.current.status).toBe('tracking'));

    act(() => {
      result.current.stop('vehicle-1');
    });

    await waitFor(() => expect(result.current.error?.message).toBe('No response from server'));
    expect(result.current.status).toBe('tracking');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("stop('vehicle-1')"),
      'No response from server'
    );
    errorSpy.mockRestore();
  });

  it('stops the active session on unmount', async () => {
    mockStartTracking.mockResolvedValueOnce({ success: true });
    mockStopTracking.mockResolvedValue({ success: true });
    const { result, unmount } = renderHook(() => useTrackingSession());

    act(() => {
      result.current.start('vehicle-1');
    });
    await waitFor(() => expect(result.current.status).toBe('tracking'));

    unmount();
    expect(mockStopTracking).toHaveBeenCalledWith('vehicle-1');
  });

  it('reflects a connection drop as isReconnecting while tracking', async () => {
    mockStartTracking.mockResolvedValue({ success: true });
    let stateListener: (state: { status: string }) => void = () => {};
    mockOnConnectionStateChange.mockImplementation((cb) => {
      stateListener = cb;
      return () => {};
    });

    const { result } = renderHook(() => useTrackingSession());
    act(() => {
      result.current.start('vehicle-1');
    });
    await waitFor(() => expect(result.current.status).toBe('tracking'));

    act(() => {
      stateListener({ status: 'disconnected' });
    });
    expect(result.current.isReconnecting).toBe(true);

    act(() => {
      stateListener({ status: 'connected' });
    });
    await waitFor(() => expect(result.current.isReconnecting).toBe(false));
    expect(mockStartTracking).toHaveBeenCalledTimes(2);
    expect(mockStartTracking).toHaveBeenLastCalledWith('vehicle-1');
  });

  // ── Offline go-on-duty (Offline & Caching Audit, chunk 1) ──────────────────

  it('parks the shift as pending (not error) when GO is pressed with no connection', async () => {
    mockStartTracking.mockResolvedValueOnce({ success: false, error: 'Socket not connected', offline: true });
    const { result } = renderHook(() => useTrackingSession());

    act(() => {
      result.current.start('vehicle-1');
    });

    await waitFor(() => expect(result.current.status).toBe('pending'));
    expect(result.current.error).toBeUndefined();
    expect(result.current.isReconnecting).toBe(false);
  });

  it('announces a pending shift with the real press time on reconnect, then goes tracking', async () => {
    mockStartTracking
      .mockResolvedValueOnce({ success: false, error: 'Socket not connected', offline: true })
      .mockResolvedValueOnce({ success: true });
    let stateListener: (state: { status: string }) => void = () => {};
    mockOnConnectionStateChange.mockImplementation((cb) => {
      stateListener = cb;
      return () => {};
    });

    const { result } = renderHook(() => useTrackingSession());
    act(() => {
      result.current.start('vehicle-1');
    });
    await waitFor(() => expect(result.current.status).toBe('pending'));

    act(() => {
      stateListener({ status: 'connected' });
    });

    await waitFor(() => expect(result.current.status).toBe('tracking'));
    expect(mockStartTracking).toHaveBeenCalledTimes(2);
    const [vehicleArg, startedAtArg] = mockStartTracking.mock.calls[1];
    expect(vehicleArg).toBe('vehicle-1');
    expect(typeof startedAtArg).toBe('string');
    expect(Number.isNaN(Date.parse(startedAtArg))).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('keeps a pending shift pending when the reconnect attempt is still offline', async () => {
    mockStartTracking
      .mockResolvedValueOnce({ success: false, error: 'Socket not connected', offline: true })
      .mockResolvedValueOnce({ success: false, error: 'Socket not connected', offline: true });
    let stateListener: (state: { status: string }) => void = () => {};
    mockOnConnectionStateChange.mockImplementation((cb) => {
      stateListener = cb;
      return () => {};
    });

    const { result } = renderHook(() => useTrackingSession());
    act(() => {
      result.current.start('vehicle-1');
    });
    await waitFor(() => expect(result.current.status).toBe('pending'));

    act(() => {
      stateListener({ status: 'connected' });
    });

    await waitFor(() => expect(mockStartTracking).toHaveBeenCalledTimes(2));
    expect(result.current.status).toBe('pending');
    expect(result.current.error).toBeUndefined();
  });

  it('drops a pending shift to error if the server refuses it on reconnect', async () => {
    mockStartTracking
      .mockResolvedValueOnce({ success: false, error: 'Socket not connected', offline: true })
      .mockResolvedValueOnce({ success: false, error: 'Vehicle not found' });
    let stateListener: (state: { status: string }) => void = () => {};
    mockOnConnectionStateChange.mockImplementation((cb) => {
      stateListener = cb;
      return () => {};
    });

    const { result } = renderHook(() => useTrackingSession());
    act(() => {
      result.current.start('vehicle-1');
    });
    await waitFor(() => expect(result.current.status).toBe('pending'));

    act(() => {
      stateListener({ status: 'connected' });
    });

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error?.message).toBe('Vehicle not found');
  });

  it('ends a pending shift straight to idle without calling the server', async () => {
    mockStartTracking.mockResolvedValueOnce({ success: false, error: 'Socket not connected', offline: true });
    const { result } = renderHook(() => useTrackingSession());

    act(() => {
      result.current.start('vehicle-1');
    });
    await waitFor(() => expect(result.current.status).toBe('pending'));

    act(() => {
      result.current.stop('vehicle-1');
    });

    await waitFor(() => expect(result.current.status).toBe('idle'));
    expect(mockStopTracking).not.toHaveBeenCalled();
    expect(result.current.error).toBeUndefined();
  });

  it('keeps reconnecting visible when restoring the server-side session fails', async () => {
    mockStartTracking
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false, error: 'No response from server' });
    let stateListener: (state: { status: string }) => void = () => {};
    mockOnConnectionStateChange.mockImplementation((cb) => {
      stateListener = cb;
      return () => {};
    });

    const { result } = renderHook(() => useTrackingSession());
    act(() => {
      result.current.start('vehicle-1');
    });
    await waitFor(() => expect(result.current.status).toBe('tracking'));

    act(() => {
      stateListener({ status: 'disconnected' });
      stateListener({ status: 'connected' });
    });

    await waitFor(() => expect(result.current.error?.message).toBe('No response from server'));
    expect(result.current.isReconnecting).toBe(true);
    expect(result.current.status).toBe('tracking');
  });
});

// One failed re-announce used to leave "Reconnecting…" up until the socket
// dropped again, though the connection itself was back.
describe('re-announce retry after a reconnect', () => {
  const flush = () =>
    act(async () => {
      for (let i = 0; i < 5; i += 1) await Promise.resolve();
    });
  const advance = async (ms: number) => {
    act(() => {
      jest.advanceTimersByTime(ms);
    });
    await flush();
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  async function liveShift() {
    let stateListener: (state: { status: string }) => void = () => {};
    mockOnConnectionStateChange.mockImplementation((cb) => {
      stateListener = cb;
      return () => {};
    });
    const hook = renderHook(() => useTrackingSession());
    await act(async () => {
      await hook.result.current.start('vehicle-1');
    });
    expect(hook.result.current.status).toBe('tracking');
    const connection = async (status: string) => {
      act(() => stateListener({ status }));
      await flush();
    };
    return { ...hook, connection };
  }

  it('retries on a 2 s then 4 s backoff until the server takes it, then clears reconnecting', async () => {
    mockStartTracking
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false, error: 'No response from server' })
      .mockResolvedValueOnce({ success: false, error: 'Slow down', code: 'RATE_LIMITED' })
      .mockResolvedValueOnce({ success: true });
    const { result, connection } = await liveShift();

    await connection('disconnected');
    await connection('connected');
    expect(mockStartTracking).toHaveBeenCalledTimes(2);
    expect(result.current.isReconnecting).toBe(true);

    await advance(1999);
    expect(mockStartTracking).toHaveBeenCalledTimes(2);
    await advance(1);
    expect(mockStartTracking).toHaveBeenCalledTimes(3);

    await advance(3999);
    expect(mockStartTracking).toHaveBeenCalledTimes(3);
    await advance(1);
    expect(mockStartTracking).toHaveBeenCalledTimes(4);
    expect(mockStartTracking).toHaveBeenLastCalledWith('vehicle-1');
    expect(result.current.isReconnecting).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('does not retry a refusal a retry cannot fix', async () => {
    mockStartTracking
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false, error: 'Vehicle not found', code: 'VEHICLE_NOT_FOUND' });
    const { result, connection } = await liveShift();

    await connection('connected');
    await advance(60_000);

    expect(mockStartTracking).toHaveBeenCalledTimes(2);
    expect(result.current.isReconnecting).toBe(true);
    expect(result.current.error?.message).toBe('Vehicle not found');
  });

  it('leaves an offline ack to the next reconnect', async () => {
    mockStartTracking
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false, error: 'Socket not connected', offline: true });
    const { connection } = await liveShift();

    await connection('connected');
    await advance(60_000);

    expect(mockStartTracking).toHaveBeenCalledTimes(2);
  });

  it('cancels the retry when the socket drops, and a fresh reconnect starts back at 2 s', async () => {
    mockStartTracking
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false, error: 'No response from server' })
      .mockResolvedValueOnce({ success: false, error: 'No response from server' })
      .mockResolvedValueOnce({ success: true });
    const { result, connection } = await liveShift();

    await connection('connected');
    await connection('disconnected');
    await advance(60_000);
    expect(mockStartTracking).toHaveBeenCalledTimes(2);

    await connection('connected');
    expect(mockStartTracking).toHaveBeenCalledTimes(3);
    await advance(2000);
    expect(mockStartTracking).toHaveBeenCalledTimes(4);
    expect(result.current.isReconnecting).toBe(false);
  });

  it('cancels the retry when the driver ends the shift', async () => {
    mockStartTracking
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false, error: 'No response from server' });
    mockStopTracking.mockResolvedValueOnce({ success: true });
    const { result, connection } = await liveShift();

    await connection('connected');
    await act(async () => {
      await result.current.stop('vehicle-1');
    });
    await advance(60_000);

    expect(result.current.status).toBe('idle');
    expect(mockStartTracking).toHaveBeenCalledTimes(2);
  });

  it('cancels the retry on unmount', async () => {
    mockStartTracking
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false, error: 'No response from server' });
    mockStopTracking.mockResolvedValue({ success: true });
    const { connection, unmount } = await liveShift();

    await connection('connected');
    unmount();
    await advance(60_000);

    expect(mockStartTracking).toHaveBeenCalledTimes(2);
  });
});
