// Mock socket.io-client before importing the module
const mockSocket = {
  connected: true,
  auth: undefined as { token?: string } | undefined,
  on: jest.fn(),
  emit: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
};

const mockIo = jest.fn((_url: string, opts: unknown) => {
  mockSocket.auth = (opts as { auth?: { token?: string } })?.auth;
  return mockSocket;
});

jest.mock('socket.io-client', () => ({
  __esModule: true,
  io: (url: string, opts: unknown) => mockIo(url, opts),
}));

jest.mock('../notificationService', () => ({
  __esModule: true,
  setupSocketNotificationListeners: jest.fn(() => ({ cleanup: jest.fn() })),
}));

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  mockSocket.connected = true;
  mockSocket.auth = undefined;
});

function getModule() {
  return require('../socket');
}

describe('emitLocation', () => {
  it('emits driver:location and forwards the ack when connected', () => {
    const { connectSocket, emitLocation } = getModule();
    connectSocket('tok');

    mockSocket.emit.mockImplementationOnce(
      (_event: string, _payload: unknown, cb: (r: unknown) => void) => cb({ success: true })
    );
    const callback = jest.fn();
    emitLocation('vehicle-1', 'route-1', 6.9, 79.8, callback);

    expect(mockSocket.emit).toHaveBeenCalledWith(
      'driver:location',
      { vehicleId: 'vehicle-1', routeId: 'route-1', lat: 6.9, lng: 79.8 },
      expect.any(Function)
    );
    expect(callback).toHaveBeenCalledWith({ success: true });
  });

  it('sends the heading when one is given', () => {
    const { connectSocket, emitLocation } = getModule();
    connectSocket('tok');

    emitLocation('vehicle-1', 'route-1', 6.9, 79.8, jest.fn(), 135);

    expect(mockSocket.emit).toHaveBeenCalledWith(
      'driver:location',
      { vehicleId: 'vehicle-1', routeId: 'route-1', lat: 6.9, lng: 79.8, heading: 135 },
      expect.any(Function)
    );
  });

  it('leaves heading out of the payload when it is null', () => {
    const { connectSocket, emitLocation } = getModule();
    connectSocket('tok');

    emitLocation('vehicle-1', 'route-1', 6.9, 79.8, jest.fn(), null);

    const payload = mockSocket.emit.mock.calls[0][1];
    expect(payload).not.toHaveProperty('heading');
  });

  it('no-ops when the socket is not connected', () => {
    const { connectSocket, emitLocation } = getModule();
    connectSocket('tok');
    mockSocket.connected = false;

    emitLocation('vehicle-1', 'route-1', 6.9, 79.8, jest.fn());
    expect(mockSocket.emit).not.toHaveBeenCalled();
  });

  it('calls back with a NACK-shaped response if the ack never arrives (issue #13)', () => {
    jest.useFakeTimers();
    const { connectSocket, emitLocation } = getModule();
    connectSocket('tok');

    // No cb invocation — simulates a dropped ack on a spotty connection.
    mockSocket.emit.mockImplementationOnce(() => {});
    const callback = jest.fn();
    emitLocation('vehicle-1', 'route-1', 6.9, 79.8, callback);

    expect(callback).not.toHaveBeenCalled();
    jest.advanceTimersByTime(5000);

    expect(callback).toHaveBeenCalledWith({ success: false, error: 'Ack timeout' });
    jest.useRealTimers();
  });

  it('ignores a late ack that arrives after the timeout already fired', () => {
    jest.useFakeTimers();
    const { connectSocket, emitLocation } = getModule();
    connectSocket('tok');

    let ackCallback: ((r: unknown) => void) | undefined;
    mockSocket.emit.mockImplementationOnce((_event: string, _payload: unknown, cb: (r: unknown) => void) => {
      ackCallback = cb;
    });
    const callback = jest.fn();
    emitLocation('vehicle-1', 'route-1', 6.9, 79.8, callback);

    jest.advanceTimersByTime(5000);
    expect(callback).toHaveBeenCalledTimes(1);

    ackCallback?.({ success: true });
    expect(callback).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('does not fire the timeout once a timely ack has already resolved it', () => {
    jest.useFakeTimers();
    const { connectSocket, emitLocation } = getModule();
    connectSocket('tok');

    mockSocket.emit.mockImplementationOnce(
      (_event: string, _payload: unknown, cb: (r: unknown) => void) => cb({ success: true })
    );
    const callback = jest.fn();
    emitLocation('vehicle-1', 'route-1', 6.9, 79.8, callback);

    expect(callback).toHaveBeenCalledWith({ success: true });
    callback.mockClear();

    jest.advanceTimersByTime(5000);
    expect(callback).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});

describe('startTracking', () => {
  it('resolves the server ack when connected', async () => {
    const { connectSocket, startTracking } = getModule();
    connectSocket('tok');

    mockSocket.emit.mockImplementationOnce(
      (_event: string, _payload: unknown, cb: (r: unknown) => void) => cb({ success: true })
    );

    await expect(startTracking('vehicle-1')).resolves.toEqual({ success: true });
  });

  it('resolves success:false with offline:true, without emitting, when not connected', async () => {
    const { connectSocket, startTracking } = getModule();
    connectSocket('tok');
    mockSocket.connected = false;

    await expect(startTracking('vehicle-1')).resolves.toEqual({
      success: false,
      error: 'Socket not connected',
      offline: true,
    });
    expect(mockSocket.emit).not.toHaveBeenCalled();
  });

  it('emits only { vehicleId } for a normal start', () => {
    const { connectSocket, startTracking } = getModule();
    connectSocket('tok');
    mockSocket.emit.mockImplementationOnce(
      (_event: string, _payload: unknown, cb: (r: unknown) => void) => cb({ success: true })
    );

    startTracking('vehicle-1');

    expect(mockSocket.emit).toHaveBeenCalledWith(
      'driver:start-tracking',
      { vehicleId: 'vehicle-1' },
      expect.any(Function)
    );
  });

  it('includes startedAt in the payload when a pending shift reconnects', () => {
    const { connectSocket, startTracking } = getModule();
    connectSocket('tok');
    mockSocket.emit.mockImplementationOnce(
      (_event: string, _payload: unknown, cb: (r: unknown) => void) => cb({ success: true })
    );

    startTracking('vehicle-1', '2026-08-27T09:00:00.000Z');

    expect(mockSocket.emit).toHaveBeenCalledWith(
      'driver:start-tracking',
      { vehicleId: 'vehicle-1', startedAt: '2026-08-27T09:00:00.000Z' },
      expect.any(Function)
    );
  });

  it('resolves success:false when the ack never arrives, instead of hanging on GO', async () => {
    jest.useFakeTimers();
    const { connectSocket, startTracking } = getModule();
    connectSocket('tok');

    // No cb invocation — the pre-fix behaviour left this promise pending
    // forever, so the GO button spun with no way to retry.
    mockSocket.emit.mockImplementationOnce(() => {});

    const pending = startTracking('vehicle-1');
    jest.advanceTimersByTime(5000);

    await expect(pending).resolves.toEqual({
      success: false,
      error: 'No response from server',
    });
    jest.useRealTimers();
  });

  it('ignores a late ack that arrives after the timeout already resolved', async () => {
    jest.useFakeTimers();
    const { connectSocket, startTracking } = getModule();
    connectSocket('tok');

    const late: { ack?: (r: unknown) => void } = {};
    mockSocket.emit.mockImplementationOnce(
      (_event: string, _payload: unknown, cb: (r: unknown) => void) => {
        late.ack = cb;
      }
    );

    const pending = startTracking('vehicle-1');
    jest.advanceTimersByTime(5000);
    late.ack?.({ success: true });

    await expect(pending).resolves.toEqual({
      success: false,
      error: 'No response from server',
    });
    jest.useRealTimers();
  });
});

describe('stopTracking', () => {
  it('resolves the server ack when connected', async () => {
    const { connectSocket, stopTracking } = getModule();
    connectSocket('tok');

    mockSocket.emit.mockImplementationOnce(
      (_event: string, _payload: unknown, cb: (r: unknown) => void) => cb({ success: true })
    );

    await expect(stopTracking('vehicle-1')).resolves.toEqual({ success: true });
    expect(mockSocket.emit).toHaveBeenCalledWith(
      'driver:stop-tracking',
      { vehicleId: 'vehicle-1' },
      expect.any(Function)
    );
  });

  it('resolves success:false with offline:true, without emitting, when not connected', async () => {
    const { connectSocket, stopTracking } = getModule();
    connectSocket('tok');
    mockSocket.connected = false;

    await expect(stopTracking('vehicle-1')).resolves.toEqual({
      success: false,
      error: 'Socket not connected',
      offline: true,
    });
    expect(mockSocket.emit).not.toHaveBeenCalled();
  });

  it('resolves success:false when the ack never arrives within the timeout (issue #12)', async () => {
    jest.useFakeTimers();
    const { connectSocket, stopTracking } = getModule();
    connectSocket('tok');

    // No cb invocation — simulates a dropped ack on a bad connection.
    mockSocket.emit.mockImplementationOnce(() => {});

    const promise = stopTracking('vehicle-1');
    await jest.advanceTimersByTimeAsync(5000);

    await expect(promise).resolves.toEqual({ success: false, error: 'No response from server' });
    jest.useRealTimers();
  });

  it('ignores a late ack that arrives after the timeout already resolved', async () => {
    jest.useFakeTimers();
    const { connectSocket, stopTracking } = getModule();
    connectSocket('tok');

    let ackCallback: ((r: unknown) => void) | undefined;
    mockSocket.emit.mockImplementationOnce((_event: string, _payload: unknown, cb: (r: unknown) => void) => {
      ackCallback = cb;
    });

    const promise = stopTracking('vehicle-1');
    await jest.advanceTimersByTimeAsync(5000);
    await expect(promise).resolves.toEqual({ success: false, error: 'No response from server' });

    expect(() => ackCallback?.({ success: true })).not.toThrow();
    jest.useRealTimers();
  });
});

describe('onConnectionStateChange', () => {
  it('returns a working unsubscribe function', () => {
    const { onConnectionStateChange } = getModule();
    const cb = jest.fn();
    const unsubscribe = onConnectionStateChange(cb);
    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
  });
});

describe('disconnectSocket', () => {
  it('disconnects and nullifies the socket', () => {
    const { connectSocket, disconnectSocket, getSocket } = getModule();
    connectSocket('tok');
    disconnectSocket();
    expect(mockSocket.disconnect).toHaveBeenCalled();
    expect(getSocket()).toBeNull();
  });
});

describe('token refresh on a refused handshake', () => {
  const handler = (event: string) =>
    mockSocket.on.mock.calls.find((call: unknown[]) => call[0] === event)?.[1] as (
      ...args: unknown[]
    ) => void;
  const flush = async () => {
    for (let i = 0; i < 5; i += 1) await Promise.resolve();
  };

  function connectStale(refresher?: jest.Mock) {
    const { connectSocket, setSocketTokenRefresher } = getModule();
    if (refresher) setSocketTokenRefresher(refresher);
    connectSocket('stale');
    mockSocket.connected = false;
  }

  it('fetches a fresh token and reconnects when the server refuses an expired one', async () => {
    const refresher = jest.fn().mockResolvedValue('fresh');
    connectStale(refresher);

    handler('connect_error')(new Error('Invalid token: jwt expired'));
    await flush();

    expect(refresher).toHaveBeenCalledTimes(1);
    expect(mockSocket.auth).toEqual({ token: 'fresh' });
    expect(mockSocket.connect).toHaveBeenCalledTimes(1);
  });

  it("leaves network errors to socket.io's own reconnect", async () => {
    const refresher = jest.fn().mockResolvedValue('fresh');
    connectStale(refresher);

    handler('connect_error')(new Error('websocket error'));
    await flush();

    expect(refresher).not.toHaveBeenCalled();
    expect(mockSocket.connect).not.toHaveBeenCalled();
  });

  it('shares one refresh between back-to-back refusals', async () => {
    const refresher = jest.fn().mockResolvedValue('fresh');
    connectStale(refresher);

    handler('connect_error')(new Error('Invalid token: jwt expired'));
    handler('connect_error')(new Error('Invalid token: jwt expired'));
    await flush();

    expect(refresher).toHaveBeenCalledTimes(1);
  });

  it('tries a fresh token only once when it is refused for a reason other than expiry', async () => {
    const refresher = jest.fn().mockResolvedValue('fresh');
    connectStale(refresher);

    handler('connect_error')(new Error('Invalid token: account is deactivated'));
    await flush();
    handler('connect_error')(new Error('Invalid token: account is deactivated'));
    await flush();
    expect(refresher).toHaveBeenCalledTimes(1);

    // Expiry is always worth a refresh: the refreshed token can itself run out
    // while the phone stays offline.
    handler('connect_error')(new Error('Invalid token: jwt expired'));
    await flush();
    expect(refresher).toHaveBeenCalledTimes(2);
  });

  it('allows another refresh after a successful connect', async () => {
    const refresher = jest.fn().mockResolvedValue('fresh');
    connectStale(refresher);

    handler('connect_error')(new Error('Invalid token: invalid signature'));
    await flush();
    handler('connect')();
    handler('connect_error')(new Error('Invalid token: invalid signature'));
    await flush();

    expect(refresher).toHaveBeenCalledTimes(2);
  });

  it('stays put when the refresh comes back empty or none is registered', async () => {
    const refresher = jest.fn().mockResolvedValue(null);
    connectStale(refresher);

    handler('connect_error')(new Error('Invalid token: jwt expired'));
    await flush();
    expect(mockSocket.auth).toEqual({ token: 'stale' });
    expect(mockSocket.connect).not.toHaveBeenCalled();

    jest.resetModules();
    mockSocket.on.mockClear();
    connectStale();
    expect(() => handler('connect_error')(new Error('Invalid token: jwt expired'))).not.toThrow();
    await flush();
    expect(mockSocket.connect).not.toHaveBeenCalled();
  });
});
