// Contract test for the tracking socket pipeline: start/location/stop message
// shapes, server ack confirmations, and post-reconnect replay behavior. Only
// `socket.io-client` is mocked (the actual wire boundary) — services/socket.ts
// and services/locationDispatch.ts are the real modules working together, which
// is the piece the existing unit tests don't cover: src/services/__tests__/
// socket.test.ts exercises socket.ts alone, and locationDispatch.test.ts mocks
// socket.ts away entirely. Here the two are wired together the way the app
// actually runs them, against a fake wire.
const mockSocket = {
  connected: false,
  on: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
};

const handlers: Record<string, (...args: unknown[]) => void> = {};
mockSocket.on.mockImplementation((event: string, cb: (...args: unknown[]) => void) => {
  handlers[event] = cb;
});

const mockIo = jest.fn(() => mockSocket);

jest.mock('socket.io-client', () => ({
  __esModule: true,
  io: (url: string, opts: unknown) => mockIo(url, opts),
}));

jest.mock('../src/services/notificationService', () => ({
  __esModule: true,
  setupSocketNotificationListeners: jest.fn(() => ({ cleanup: jest.fn() })),
}));

function fix(lat: number, lng: number, timestamp: number) {
  return { lat, lng, timestamp };
}

function simulateConnect() {
  mockSocket.connected = true;
  handlers['connect']?.();
}

function simulateDisconnect() {
  mockSocket.connected = false;
  handlers['disconnect']?.('transport close');
}

let current: { socket: typeof import('../src/services/socket'); dispatch: typeof import('../src/services/locationDispatch') } | null = null;

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  mockSocket.connected = false;
  for (const key of Object.keys(handlers)) delete handlers[key];
  current = null;
});

afterEach(async () => {
  // dispatchFix schedules a real 30s keepalive timer (MAX_INTERVAL_MS) — clear
  // it so it doesn't linger as an open handle past the end of the test file.
  await current?.dispatch.resetDispatch();
});

function loadModules() {
  // Re-imported fresh each test (resetModules) since both modules hold
  // module-level state (the singleton socket, the dispatch buffer/target).
  current = {
    socket: require('../src/services/socket'),
    dispatch: require('../src/services/locationDispatch'),
  };
  return current;
}

describe('start/stop tracking — message shapes + ack contract', () => {
  it('emits driver:start-tracking with {vehicleId} and resolves the server ack', async () => {
    const { socket } = loadModules();
    socket.connectSocket('tok');
    simulateConnect();

    mockSocket.emit.mockImplementationOnce(
      (_event: string, _payload: unknown, cb: (r: unknown) => void) => cb({ success: true })
    );

    const ack = await socket.startTracking('vehicle-1');

    expect(mockSocket.emit).toHaveBeenCalledWith(
      'driver:start-tracking',
      { vehicleId: 'vehicle-1' },
      expect.any(Function)
    );
    expect(ack).toEqual({ success: true });
  });

  it('resolves success:false with the server-refusal reason', async () => {
    const { socket } = loadModules();
    socket.connectSocket('tok');
    simulateConnect();

    mockSocket.emit.mockImplementationOnce(
      (_event: string, _payload: unknown, cb: (r: unknown) => void) =>
        cb({ success: false, error: 'This vehicle is already being tracked elsewhere' })
    );

    const ack = await socket.startTracking('vehicle-1');
    expect(ack).toEqual({
      success: false,
      error: 'This vehicle is already being tracked elsewhere',
    });
  });

  it('emits driver:stop-tracking with {vehicleId} and resolves the server ack', async () => {
    const { socket } = loadModules();
    socket.connectSocket('tok');
    simulateConnect();

    mockSocket.emit.mockImplementationOnce(
      (_event: string, _payload: unknown, cb: (r: unknown) => void) => cb({ success: true })
    );

    const ack = await socket.stopTracking('vehicle-1');

    expect(mockSocket.emit).toHaveBeenCalledWith(
      'driver:stop-tracking',
      { vehicleId: 'vehicle-1' },
      expect.any(Function)
    );
    expect(ack).toEqual({ success: true });
  });

  it('resolves success:false without emitting when the socket is not connected', async () => {
    const { socket } = loadModules();
    socket.connectSocket('tok');
    // never simulateConnect() — mockSocket.connected stays false

    const ack = await socket.stopTracking('vehicle-1');
    expect(ack).toEqual({ success: false, error: 'Socket not connected' });
    expect(mockSocket.emit).not.toHaveBeenCalled();
  });
});

describe('driver:location — message shape + ack contract', () => {
  it('emits {vehicleId, routeId, lat, lng} and forwards a success ack', async () => {
    const { socket, dispatch } = loadModules();
    socket.connectSocket('tok');
    simulateConnect();
    await dispatch.setTrackingTarget({ vehicleId: 'vehicle-1', routeId: 'route-1' });

    mockSocket.emit.mockImplementationOnce(
      (_event: string, _payload: unknown, cb: (r: unknown) => void) => cb({ success: true })
    );

    const emitted = dispatch.dispatchFix(fix(6.9, 79.8, 1000));

    expect(emitted).toBe(true);
    expect(mockSocket.emit).toHaveBeenCalledWith(
      'driver:location',
      { vehicleId: 'vehicle-1', routeId: 'route-1', lat: 6.9, lng: 79.8 },
      expect.any(Function)
    );
    expect(dispatch.getBufferedCount()).toBe(0);
  });

  it('buffers a fix instead of emitting while disconnected', async () => {
    const { socket, dispatch } = loadModules();
    socket.connectSocket('tok');
    // stays disconnected
    await dispatch.setTrackingTarget({ vehicleId: 'vehicle-1', routeId: 'route-1' });

    const emitted = dispatch.dispatchFix(fix(6.9, 79.8, 1000));

    expect(emitted).toBe(true);
    expect(mockSocket.emit).not.toHaveBeenCalled();
    expect(dispatch.getBufferedCount()).toBe(1);
  });
});

describe('post-reconnect replay', () => {
  it('replays buffered fixes oldest-first as driver:location once the socket reconnects', async () => {
    const { socket, dispatch } = loadModules();
    socket.connectSocket('tok');
    dispatch.startReplayOnReconnect();
    await dispatch.setTrackingTarget({ vehicleId: 'vehicle-1', routeId: 'route-1' });

    // Two fixes arrive while offline — both get buffered, not emitted.
    dispatch.dispatchFix(fix(1, 1, 1000));
    dispatch.dispatchFix(fix(2, 2, 5000));
    expect(dispatch.getBufferedCount()).toBe(2);
    expect(mockSocket.emit).not.toHaveBeenCalled();

    // Reconnecting fires socket.ts's 'connect' handler, which flips connection
    // state to 'connected' — locationDispatch's onConnectionStateChange
    // subscriber (wired by startReplayOnReconnect) reacts to that and replays.
    mockSocket.emit.mockImplementation(
      (_event: string, _payload: unknown, cb: (r: unknown) => void) => cb({ success: true })
    );
    simulateConnect();

    expect(dispatch.getBufferedCount()).toBe(0);
    expect(mockSocket.emit).toHaveBeenCalledTimes(2);
    expect(mockSocket.emit.mock.calls[0][1]).toEqual({
      vehicleId: 'vehicle-1',
      routeId: 'route-1',
      lat: 1,
      lng: 1,
    });
    expect(mockSocket.emit.mock.calls[1][1]).toEqual({
      vehicleId: 'vehicle-1',
      routeId: 'route-1',
      lat: 2,
      lng: 2,
    });
  });

  it('re-buffers a fix that NACKs during replay instead of dropping it', async () => {
    const { socket, dispatch } = loadModules();
    socket.connectSocket('tok');
    dispatch.startReplayOnReconnect();
    await dispatch.setTrackingTarget({ vehicleId: 'vehicle-1', routeId: 'route-1' });

    dispatch.dispatchFix(fix(1, 1, 1000));
    expect(dispatch.getBufferedCount()).toBe(1);

    mockSocket.emit.mockImplementation(
      (_event: string, _payload: unknown, cb: (r: unknown) => void) =>
        cb({ success: false, error: 'stale' })
    );
    simulateConnect();

    // The NACKed replay goes right back into the buffer rather than being lost.
    expect(dispatch.getBufferedCount()).toBe(1);
    expect(mockSocket.emit).toHaveBeenCalledTimes(1);
  });

  it('does not replay on a disconnect notification, only on connect', async () => {
    const { socket, dispatch } = loadModules();
    socket.connectSocket('tok');
    dispatch.startReplayOnReconnect();
    await dispatch.setTrackingTarget({ vehicleId: 'vehicle-1', routeId: 'route-1' });

    dispatch.dispatchFix(fix(1, 1, 1000));
    expect(dispatch.getBufferedCount()).toBe(1);

    simulateDisconnect();

    expect(dispatch.getBufferedCount()).toBe(1);
    expect(mockSocket.emit).not.toHaveBeenCalled();
  });
});
