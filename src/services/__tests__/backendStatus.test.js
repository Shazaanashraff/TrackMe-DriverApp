import {
  getBackendOnline,
  subscribeBackendStatus,
  markBackendOnline,
  markBackendOffline,
  isBackendConnectionError,
  recheckBackendHealth,
} from '../backendStatus';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  markBackendOnline();
});

describe('backendStatus', () => {
  it('starts online and notifies subscribers of changes', () => {
    expect(getBackendOnline()).toBe(true);

    const listener = jest.fn();
    const unsubscribe = subscribeBackendStatus(listener);
    expect(listener).toHaveBeenCalledWith(true);

    markBackendOffline();
    expect(getBackendOnline()).toBe(false);
    expect(listener).toHaveBeenCalledWith(false);

    markBackendOnline();
    expect(getBackendOnline()).toBe(true);

    unsubscribe();
  });

  it('does not notify when the state does not change', () => {
    const listener = jest.fn();
    subscribeBackendStatus(listener);
    listener.mockClear();

    markBackendOnline(); // already online
    expect(listener).not.toHaveBeenCalled();
  });

  it('recognizes connection-error message patterns', () => {
    expect(isBackendConnectionError(new Error('Network request failed'))).toBe(true);
    expect(isBackendConnectionError(new Error('Validation failed'))).toBe(false);
  });

  it('recheckBackendHealth marks online on a successful health check', async () => {
    markBackendOffline();
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    await recheckBackendHealth();

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/health'), expect.any(Object));
    expect(getBackendOnline()).toBe(true);
  });

  it('recheckBackendHealth marks offline on a connection error', async () => {
    markBackendOnline();
    global.fetch = jest.fn().mockRejectedValue(new Error('Network request failed'));

    await recheckBackendHealth();

    expect(getBackendOnline()).toBe(false);
  });

  it('survives several rapid online/offline cycles, notifying once per actual change', () => {
    const listener = jest.fn();
    subscribeBackendStatus(listener);
    listener.mockClear();

    for (let i = 0; i < 5; i += 1) {
      markBackendOffline();
      markBackendOnline();
    }

    expect(getBackendOnline()).toBe(true);
    expect(listener).toHaveBeenCalledTimes(10);
    // Every call in the alternating sequence toggles the value — no dropped or
    // duplicated notifications from the rapid flips.
    expect(listener.mock.calls.map((call) => call[0])).toEqual([
      false, true, false, true, false, true, false, true, false, true,
    ]);
  });

  it('collapses redundant rapid calls of the same state into a single notification', () => {
    const listener = jest.fn();
    subscribeBackendStatus(listener);
    listener.mockClear();

    markBackendOffline();
    markBackendOffline();
    markBackendOffline();
    markBackendOnline();
    markBackendOnline();

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener.mock.calls.map((call) => call[0])).toEqual([false, true]);
  });
});
