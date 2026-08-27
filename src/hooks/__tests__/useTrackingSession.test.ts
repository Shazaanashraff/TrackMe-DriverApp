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
