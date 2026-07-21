import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBoardingScan } from '../useBoardingScan';
import { AppError } from '../../../lib/errors';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const mockAuthenticatedRequest = jest.fn();

jest.mock('../../../context/AuthContext', () => ({
  __esModule: true,
  useAuth: () => ({ authenticatedRequest: (...args: unknown[]) => mockAuthenticatedRequest(...args) }),
}));

let backendStatusListener: ((online: boolean) => void) | null = null;
const mockSubscribeBackendStatus = jest.fn((listener: (online: boolean) => void) => {
  backendStatusListener = listener;
  return () => {
    backendStatusListener = null;
  };
});

jest.mock('../../../services/backendStatus', () => ({
  __esModule: true,
  subscribeBackendStatus: (listener: (online: boolean) => void) => mockSubscribeBackendStatus(listener),
}));

const mockSubmitBoardingScan = jest.fn();

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    submitBoardingScan: (...args: unknown[]) => mockSubmitBoardingScan(...args),
  },
}));

const mockInvalidateQueries = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  __esModule: true,
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  backendStatusListener = null;
  mockAuthenticatedRequest.mockImplementation((fn: (...a: unknown[]) => unknown, ...args: unknown[]) =>
    fn('tok', ...args)
  );
});

describe('useBoardingScan', () => {
  it('starts idle with no pending scans', async () => {
    const { result } = renderHook(() => useBoardingScan('BUS-1'));
    await waitFor(() => expect(result.current.pendingCount).toBe(0));
    expect(result.current.status).toBe('idle');
    expect(result.current.lastResult).toBeNull();
  });

  it('sets status to success with the response data on a fresh scan', async () => {
    mockSubmitBoardingScan.mockResolvedValueOnce({
      success: true,
      debounced: false,
      data: { eventId: 'e1', studentName: 'Jane', type: 'BOARD', timestamp: '2026-07-18T10:00:00Z' },
    });

    const { result } = renderHook(() => useBoardingScan('BUS-1'));

    await act(async () => {
      await result.current.submitScan('qr-token-1');
    });

    expect(result.current.status).toBe('success');
    expect(result.current.lastResult).toEqual({
      eventId: 'e1',
      studentName: 'Jane',
      type: 'BOARD',
      timestamp: '2026-07-18T10:00:00Z',
    });
    expect(mockSubmitBoardingScan).toHaveBeenCalledWith('tok', {
      qrToken: 'qr-token-1',
      busId: 'BUS-1',
      type: undefined,
    });
  });

  it('invalidates the on-board roster query after a successful (non-debounced) scan', async () => {
    mockSubmitBoardingScan.mockResolvedValueOnce({
      success: true,
      debounced: false,
      data: { eventId: 'e1', type: 'BOARD' },
    });

    const { result } = renderHook(() => useBoardingScan('BUS-1'));

    await act(async () => {
      await result.current.submitScan('qr-token-1');
    });

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['boarding', 'roster', 'BUS-1'] });
  });

  it('does not invalidate the roster on a debounced (no-op) scan', async () => {
    mockSubmitBoardingScan.mockResolvedValueOnce({
      success: true,
      debounced: true,
      data: { eventId: 'e1', type: 'BOARD' },
    });

    const { result } = renderHook(() => useBoardingScan('BUS-1'));

    await act(async () => {
      await result.current.submitScan('qr-token-1');
    });

    expect(mockInvalidateQueries).not.toHaveBeenCalled();
  });

  it('sets status to debounced on a duplicate scan', async () => {
    mockSubmitBoardingScan.mockResolvedValueOnce({
      success: true,
      debounced: true,
      data: { eventId: 'e1', type: 'BOARD' },
    });

    const { result } = renderHook(() => useBoardingScan('BUS-1'));

    await act(async () => {
      await result.current.submitScan('qr-token-1');
    });

    expect(result.current.status).toBe('debounced');
  });

  it('maps a 401 invalid-token error to the friendly QR message', async () => {
    mockSubmitBoardingScan.mockRejectedValueOnce(
      new AppError('http', 'Invalid QR token: EXPIRED', { status: 401 })
    );

    const { result } = renderHook(() => useBoardingScan('BUS-1'));

    await act(async () => {
      await result.current.submitScan('qr-token-1');
    });

    expect(result.current.status).toBe('error');
    expect(result.current.errorMessage).toBe('This QR code is invalid or expired.');
  });

  it('maps a 403 qr-not-enabled error to the friendly route message', async () => {
    mockSubmitBoardingScan.mockRejectedValueOnce(
      new AppError('http', 'QR attendance is not enabled for this route', { status: 403 })
    );

    const { result } = renderHook(() => useBoardingScan('BUS-1'));

    await act(async () => {
      await result.current.submitScan('qr-token-1');
    });

    expect(result.current.status).toBe('error');
    expect(result.current.errorMessage).toBe(
      "QR attendance isn't enabled for this route yet — contact your manager."
    );
  });

  it('maps a 404 bus-not-found error to a generic message', async () => {
    mockSubmitBoardingScan.mockRejectedValueOnce(
      new AppError('http', 'Bus not found or not assigned to you', { status: 404 })
    );

    const { result } = renderHook(() => useBoardingScan('BUS-1'));

    await act(async () => {
      await result.current.submitScan('qr-token-1');
    });

    expect(result.current.status).toBe('error');
    expect(result.current.errorMessage).toBe('Something went wrong. Please try again.');
  });

  it('queues the scan in AsyncStorage and increments pendingCount on a network failure', async () => {
    mockSubmitBoardingScan.mockRejectedValueOnce(new AppError('offline', 'No network connection'));

    const { result } = renderHook(() => useBoardingScan('BUS-1'));

    await act(async () => {
      await result.current.submitScan('qr-token-offline');
    });

    expect(result.current.status).toBe('error');
    expect(result.current.pendingCount).toBe(1);

    const raw = await AsyncStorage.getItem('boarding_scan_queue');
    const queue = JSON.parse(raw as string);
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({ qrToken: 'qr-token-offline', busId: 'BUS-1' });
  });

  it('replayQueuedScans resubmits queued scans and clears the queue on success', async () => {
    await AsyncStorage.setItem(
      'boarding_scan_queue',
      JSON.stringify([
        { qrToken: 'queued-1', busId: 'BUS-1', timestamp: 1 },
        { qrToken: 'queued-2', busId: 'BUS-1', timestamp: 2 },
      ])
    );

    mockSubmitBoardingScan
      .mockResolvedValueOnce({ success: true, debounced: false, data: { eventId: 'e1' } })
      .mockResolvedValueOnce({ success: true, debounced: false, data: { eventId: 'e2' } });

    const { result } = renderHook(() => useBoardingScan('BUS-1'));
    await waitFor(() => expect(result.current.pendingCount).toBe(2));

    await act(async () => {
      await result.current.replayQueuedScans();
    });

    expect(mockSubmitBoardingScan).toHaveBeenCalledTimes(2);
    expect(result.current.pendingCount).toBe(0);
    const raw = await AsyncStorage.getItem('boarding_scan_queue');
    expect(JSON.parse(raw as string)).toEqual([]);
  });

  it('replays the queue automatically when the backend comes back online', async () => {
    await AsyncStorage.setItem(
      'boarding_scan_queue',
      JSON.stringify([{ qrToken: 'queued-1', busId: 'BUS-1', timestamp: 1 }])
    );
    mockSubmitBoardingScan.mockResolvedValueOnce({ success: true, debounced: false, data: { eventId: 'e1' } });

    const { result } = renderHook(() => useBoardingScan('BUS-1'));
    await waitFor(() => expect(result.current.pendingCount).toBe(1));

    await act(async () => {
      backendStatusListener?.(true);
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.pendingCount).toBe(0));
    expect(mockSubmitBoardingScan).toHaveBeenCalledWith('tok', { qrToken: 'queued-1', busId: 'BUS-1' });
  });

  it('ignores a second submitScan call during the cooldown window', async () => {
    mockSubmitBoardingScan.mockResolvedValue({
      success: true,
      debounced: false,
      data: { eventId: 'e1' },
    });

    const { result } = renderHook(() => useBoardingScan('BUS-1'));

    await act(async () => {
      await result.current.submitScan('qr-token-1');
    });
    await act(async () => {
      await result.current.submitScan('qr-token-2');
    });

    expect(mockSubmitBoardingScan).toHaveBeenCalledTimes(1);
  });
});
