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
      result.current.start('bus-1');
    });
    expect(result.current.status).toBe('starting');

    await waitFor(() => expect(result.current.status).toBe('tracking'));
    expect(mockStartTracking).toHaveBeenCalledWith('bus-1');
    expect(result.current.error).toBeUndefined();
  });

  it('transitions starting -> error on a failed ack', async () => {
    mockStartTracking.mockResolvedValueOnce({ success: false, error: 'Socket not connected' });
    const { result } = renderHook(() => useTrackingSession());

    act(() => {
      result.current.start('bus-1');
    });

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error?.kind).toBe('tracking');
    expect(result.current.error?.message).toBe('Socket not connected');
  });

  it('stop() calls stopTracking and resets to idle', async () => {
    mockStartTracking.mockResolvedValueOnce({ success: true });
    const { result } = renderHook(() => useTrackingSession());

    act(() => {
      result.current.start('bus-1');
    });
    await waitFor(() => expect(result.current.status).toBe('tracking'));

    act(() => {
      result.current.stop('bus-1');
    });

    expect(mockStopTracking).toHaveBeenCalledWith('bus-1');
    expect(result.current.status).toBe('idle');
  });

  it('stops the active session on unmount', async () => {
    mockStartTracking.mockResolvedValueOnce({ success: true });
    const { result, unmount } = renderHook(() => useTrackingSession());

    act(() => {
      result.current.start('bus-1');
    });
    await waitFor(() => expect(result.current.status).toBe('tracking'));

    unmount();
    expect(mockStopTracking).toHaveBeenCalledWith('bus-1');
  });

  it('reflects a connection drop as isReconnecting while tracking', async () => {
    mockStartTracking.mockResolvedValueOnce({ success: true });
    let stateListener: (state: { status: string }) => void = () => {};
    mockOnConnectionStateChange.mockImplementation((cb) => {
      stateListener = cb;
      return () => {};
    });

    const { result } = renderHook(() => useTrackingSession());
    act(() => {
      result.current.start('bus-1');
    });
    await waitFor(() => expect(result.current.status).toBe('tracking'));

    act(() => {
      stateListener({ status: 'disconnected' });
    });
    expect(result.current.isReconnecting).toBe(true);

    act(() => {
      stateListener({ status: 'connected' });
    });
    expect(result.current.isReconnecting).toBe(false);
  });
});
