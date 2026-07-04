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
    emitLocation('bus-1', 'route-1', 6.9, 79.8, callback);

    expect(mockSocket.emit).toHaveBeenCalledWith(
      'driver:location',
      { busId: 'bus-1', routeId: 'route-1', lat: 6.9, lng: 79.8 },
      expect.any(Function)
    );
    expect(callback).toHaveBeenCalledWith({ success: true });
  });

  it('no-ops when the socket is not connected', () => {
    const { connectSocket, emitLocation } = getModule();
    connectSocket('tok');
    mockSocket.connected = false;

    emitLocation('bus-1', 'route-1', 6.9, 79.8, jest.fn());
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

    await expect(startTracking('bus-1')).resolves.toEqual({ success: true });
  });

  it('resolves success:false without emitting when not connected', async () => {
    const { connectSocket, startTracking } = getModule();
    connectSocket('tok');
    mockSocket.connected = false;

    await expect(startTracking('bus-1')).resolves.toEqual({
      success: false,
      error: 'Socket not connected',
    });
    expect(mockSocket.emit).not.toHaveBeenCalled();
  });
});

describe('stopTracking', () => {
  it('emits driver:stop-tracking when connected', () => {
    const { connectSocket, stopTracking } = getModule();
    connectSocket('tok');
    stopTracking('bus-1');
    expect(mockSocket.emit).toHaveBeenCalledWith('driver:stop-tracking', { busId: 'bus-1' });
  });

  it('no-ops when not connected', () => {
    const { connectSocket, stopTracking } = getModule();
    connectSocket('tok');
    mockSocket.connected = false;
    stopTracking('bus-1');
    expect(mockSocket.emit).not.toHaveBeenCalled();
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
