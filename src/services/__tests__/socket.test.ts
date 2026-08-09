// Mock socket.io-client before importing the module
const mockSocket = {
  connected: true,
  on: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
};

const mockIo = jest.fn((_url: string, _opts: unknown) => mockSocket);

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

  it('no-ops when the socket is not connected', () => {
    const { connectSocket, emitLocation } = getModule();
    connectSocket('tok');
    mockSocket.connected = false;

    emitLocation('vehicle-1', 'route-1', 6.9, 79.8, jest.fn());
    expect(mockSocket.emit).not.toHaveBeenCalled();
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

  it('resolves success:false without emitting when not connected', async () => {
    const { connectSocket, startTracking } = getModule();
    connectSocket('tok');
    mockSocket.connected = false;

    await expect(startTracking('vehicle-1')).resolves.toEqual({
      success: false,
      error: 'Socket not connected',
    });
    expect(mockSocket.emit).not.toHaveBeenCalled();
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

  it('resolves success:false without emitting when not connected', async () => {
    const { connectSocket, stopTracking } = getModule();
    connectSocket('tok');
    mockSocket.connected = false;

    await expect(stopTracking('vehicle-1')).resolves.toEqual({
      success: false,
      error: 'Socket not connected',
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
