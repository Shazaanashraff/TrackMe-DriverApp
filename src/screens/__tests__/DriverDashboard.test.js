import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DriverDashboard from '../DriverDashboard';
import api from '../../services/api';
import { AppError } from '../../lib/errors';
// Broadcast interactions have their own real QueryClient behavior suite.
jest.mock('../../features/communications/BroadcastPanel', () => () => null);

// Covers the quick-actions block; the rest of the screen (live tracking, logout, etc.)
// is covered by the feature-component tests + hook tests.

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../../services/api', () => ({
  getMyVehicle: jest.fn(),
}));

const mockUseMyVehicleQuery = jest.fn(() => ({
  data: { vehicleId: 'VEHICLE-1', vehicleName: 'Shuttle', seatCapacity: 20 },
  isLoading: false,
  error: null,
}));

jest.mock('../../hooks/vehicle', () => ({
  useMyVehicleQuery: () => mockUseMyVehicleQuery(),
}));

const mockUseTrackingSession = jest.fn(() => ({
  status: 'idle',
  error: undefined,
  isReconnecting: false,
  start: jest.fn(),
  stop: jest.fn(),
}));

jest.mock('../../hooks/useTrackingSession', () => ({
  useTrackingSession: () => mockUseTrackingSession(),
}));

const mockUseLocationBroadcast = jest.fn(() => ({
  permission: 'granted',
  bufferedCount: 0,
  lastFix: null,
  lostConnection: false,
}));

jest.mock('../../hooks/useLocationBroadcast', () => ({
  useLocationBroadcast: () => mockUseLocationBroadcast(),
}));

const mockUseBackgroundTracking = jest.fn(() => ({
  permission: 'granted',
  isActive: true,
  shouldOfferUpgrade: false,
  enableBackground: jest.fn(),
  dismissOffer: jest.fn(),
}));

jest.mock('../../hooks/useBackgroundTracking', () => ({
  useBackgroundTracking: () => mockUseBackgroundTracking(),
}));

jest.mock('../../hooks/auth', () => ({
  useLogout: () => ({ mutate: jest.fn(), isPending: false }),
}));

// The vehicle's route carries the manager's QR boarding switch (qrEnabled). Stubbed so
// the dashboard test needs no QueryClientProvider; each test sets the route it wants.
let mockRoute;
jest.mock('../../hooks/route', () => ({
  useRouteDetailsQuery: () => ({ data: mockRoute }),
}));

// A custom-route vehicle records its first rides. The recorder and its progress query are
// stubbed so this screen test needs no QueryClient or GPS; their own behaviour is covered in
// hooks/customRoute and services/routeRecorder.
let mockCustomRoute = null;
const mockRecorder = {
  isRecording: false,
  pointCount: 0,
  stopCount: 0,
  distanceMeters: 0,
  lastStopName: '',
  addStop: jest.fn(),
  nameStop: jest.fn(),
  finish: jest.fn(),
  discard: jest.fn(),
};
const mockUseRouteRecorder = jest.fn(() => mockRecorder);
jest.mock('../../hooks/customRoute', () => ({
  useCustomRouteQuery: () => ({ data: mockCustomRoute }),
  useRouteRecorder: (...args) => mockUseRouteRecorder(...args),
}));

const mockPeekInterrupted = jest.fn();
const mockDiscardRecording = jest.fn();
const mockRestoreRecording = jest.fn();
jest.mock('../../services/routeRecorder', () => ({
  MAX_STOP_NAME_LENGTH: 80,
  peekInterruptedRecording: (...args) => mockPeekInterrupted(...args),
  discardRecording: (...args) => mockDiscardRecording(...args),
  restoreRecording: (...args) => mockRestoreRecording(...args),
}));

jest.mock('../../features/dashboard/OnBoardCard', () => {
  const { View } = jest.requireActual('react-native');
  return function MockOnBoardCard() {
    return <View testID="on-board-card" />;
  };
});

jest.mock('../../features/dashboard/useSocketConnection', () => ({
  useSocketConnection: () => ({ connecting: false }),
}));

let mockBufferedCount = 0;
const mockGetBufferedCount = jest.fn(() => mockBufferedCount);
const mockSubscribeToBufferCount = jest.fn((cb) => {
  cb(mockBufferedCount);
  return () => {};
});
jest.mock('../../services/locationDispatch', () => ({
  getBufferedCount: (...args) => mockGetBufferedCount(...args),
  subscribeToBufferCount: (...args) => mockSubscribeToBufferCount(...args),
}));

// OnBoardCard (Home "X / Y on board") owns its own roster query; stub it so this
// banner-focused test needs no QueryClient. Its own behaviour is covered in OnBoardCard.test.tsx.
jest.mock('../../hooks/boarding', () => ({
  useBoardingRosterQuery: () => ({ data: undefined, isLoading: false, isError: true }),
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Test Driver' },
    token: 'fake-token',
    logout: jest.fn(),
    authenticatedRequest: (fn, ...args) => fn('fake-token', ...args),
  }),
}));


beforeEach(async () => {
  jest.clearAllMocks();
  mockBufferedCount = 0;
  mockRoute = undefined;
  mockCustomRoute = null;
  Object.assign(mockRecorder, { isRecording: false, pointCount: 0, stopCount: 0, distanceMeters: 0 });
  mockRecorder.addStop.mockReset();
  mockRecorder.finish.mockReset().mockResolvedValue({ kind: 'nothing' });
  mockRecorder.discard.mockReset().mockResolvedValue(undefined);
  mockUseRouteRecorder.mockClear();
  mockPeekInterrupted.mockReset().mockResolvedValue(null);
  mockDiscardRecording.mockReset().mockResolvedValue(undefined);
  mockRestoreRecording.mockReset().mockResolvedValue(undefined);
  await AsyncStorage.clear();
  mockUseTrackingSession.mockReturnValue({
    status: 'idle',
    error: undefined,
    isReconnecting: false,
    start: jest.fn(),
    stop: jest.fn(),
  });
  mockUseMyVehicleQuery.mockReturnValue({
    data: { vehicleId: 'VEHICLE-1', vehicleName: 'Shuttle', seatCapacity: 20 },
    isLoading: false,
    error: null,
  });
  mockUseLocationBroadcast.mockReturnValue({
    permission: 'granted',
    bufferedCount: 0,
    lastFix: null,
    lostConnection: false,
  });
});

describe('DriverDashboard — lost connection warning (issue #30)', () => {
  it('surfaces the warning on the hero while tracking with a rejection streak', () => {
    mockUseTrackingSession.mockReturnValue({
      status: 'tracking',
      error: undefined,
      isReconnecting: false,
      start: jest.fn(),
      stop: jest.fn(),
    });
    mockUseLocationBroadcast.mockReturnValue({
      permission: 'granted',
      bufferedCount: 5,
      lastFix: null,
      lostConnection: true,
    });

    const { getByText } = render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);

    expect(
      getByText('Connection unstable')
    ).toBeTruthy();
  });

  it('does not surface the warning while off duty even if the hook reports a stale streak', () => {
    mockUseLocationBroadcast.mockReturnValue({
      permission: 'granted',
      bufferedCount: 0,
      lastFix: null,
      lostConnection: true,
    });

    const { queryByText } = render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);

    expect(
      queryByText('Connection unstable')
    ).toBeNull();
  });
});

describe('DriverDashboard — quick actions', () => {
  it('offers the QR scanner and nothing else when the route uses QR boarding', () => {
    mockRoute = { routeId: 'GVC-MORNING', qrEnabled: true };
    const { getByTestId, queryByTestId, queryByText } = render(
      <DriverDashboard navigation={{ navigate: jest.fn() }} />
    );

    expect(getByTestId('scan-rider-qr-row')).toBeTruthy();
    expect(getByTestId('on-board-card')).toBeTruthy();

    // My Routes and custom-route recording were both removed from this screen.
    expect(queryByTestId('my-routes-row')).toBeNull();
    expect(queryByText('My routes')).toBeNull();
    expect(queryByTestId('update-route-banner')).toBeNull();
    expect(queryByTestId('mock-recorder')).toBeNull();
  });

  // Not every shuttle scans passes: QR boarding is the manager's per-route switch.
  it('hides the scanner and On board when the route has QR boarding off', () => {
    mockRoute = { routeId: 'HBT-EAST', qrEnabled: false };
    const { queryByTestId, queryByText } = render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);
    expect(queryByTestId('scan-rider-qr-row')).toBeNull();
    expect(queryByText('Scan rider QR')).toBeNull();
    expect(queryByTestId('on-board-card')).toBeNull();
  });

  it('hides the scanner and On board until the route has loaded', () => {
    mockRoute = undefined;
    const { queryByTestId } = render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);
    expect(queryByTestId('scan-rider-qr-row')).toBeNull();
    expect(queryByTestId('on-board-card')).toBeNull();
  });

  it('hides them without a vehicle, even on a QR route', () => {
    mockRoute = { routeId: 'GVC-MORNING', qrEnabled: true };
    mockUseMyVehicleQuery.mockReturnValue({ data: null, isLoading: false, error: null });
    const { queryByTestId } = render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);
    expect(queryByTestId('scan-rider-qr-row')).toBeNull();
    expect(queryByTestId('on-board-card')).toBeNull();
  });

  it('does not call the deleted custom-route endpoints', () => {
    render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);
    expect(api.getMyCustomRoute).toBeUndefined();
  });
});

describe('DriverDashboard — Go on duty failure surfaced (issue #20)', () => {
  it('shows the specific server-refusal reason to the driver', async () => {
    mockUseTrackingSession.mockReturnValue({
      status: 'error',
      error: new AppError('tracking', 'This bus is already being tracked elsewhere'),
      isReconnecting: false,
      start: jest.fn(),
      stop: jest.fn(),
    });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        "Couldn't go on duty",
        'This bus is already being tracked elsewhere'
      )
    );
  });

  it('does not alert while idle (no false positives)', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { findByText } = render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);
    // Wait for the screen to settle instead: the custom-route call this used to
    // wait on was removed with the feature, so any alert effect has run by the
    // time the dashboard has painted.
    await findByText('YOUR VEHICLE');

    expect(alertSpy).not.toHaveBeenCalled();
  });
});

describe('DriverDashboard — stop-tracking ack failure surfaced (issue #12)', () => {
  it('alerts and stays on "You\'re live" when the server never confirms the stop', async () => {
    mockUseTrackingSession.mockReturnValue({
      status: 'tracking',
      error: new AppError('tracking', 'No response from server'),
      isReconnecting: false,
      start: jest.fn(),
      stop: jest.fn(),
    });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith("Couldn't confirm you're off duty", 'No response from server')
    );
  });

  it('does not alert while tracking cleanly with no error', async () => {
    mockUseTrackingSession.mockReturnValue({
      status: 'tracking',
      error: undefined,
      isReconnecting: false,
      start: jest.fn(),
      stop: jest.fn(),
    });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { findByText } = render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);
    await findByText('YOUR VEHICLE');

    expect(alertSpy).not.toHaveBeenCalled();
  });
});

describe('DriverDashboard — buffered GPS fixes surfaced (offline audit)', () => {
  it('shows the buffered-fix count on the hero once fixes start piling up', () => {
    mockUseTrackingSession.mockReturnValue({
      status: 'tracking',
      error: undefined,
      isReconnecting: false,
      start: jest.fn(),
      stop: jest.fn(),
    });
    mockBufferedCount = 12;

    const { getByText, getByTestId } = render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);

    expect(getByTestId('buffered-count-chip')).toBeTruthy();
    expect(getByText('12')).toBeTruthy();
    expect(getByText('UNSENT')).toBeTruthy();
  });

  it('shows the normal "updates sent" chip when nothing is buffered', () => {
    mockUseTrackingSession.mockReturnValue({
      status: 'tracking',
      error: undefined,
      isReconnecting: false,
      start: jest.fn(),
      stop: jest.fn(),
    });
    mockBufferedCount = 0;

    const { getByText, queryByText } = render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);

    expect(getByText('UPDATES')).toBeTruthy();
    expect(queryByText('UNSENT')).toBeNull();
  });
});

describe('DriverDashboard — unassigned-vehicle messaging (issue #21)', () => {
  it('shows the generic register-vehicle message for a driver who never had one', async () => {
    mockUseMyVehicleQuery.mockReturnValue({ data: null, isLoading: false, error: null });

    const { findByText, queryByText } = render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);

    expect(await findByText('No vehicle assigned yet')).toBeTruthy();
    expect(queryByText('Vehicle assignment removed')).toBeNull();
  });

  it('shows the removed-assignment message once a previously-seen vehicle disappears', async () => {
    await AsyncStorage.setItem('driver_had_vehicle_before', 'true');
    mockUseMyVehicleQuery.mockReturnValue({ data: null, isLoading: false, error: null });

    const { findByText, queryByText } = render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);

    expect(await findByText('Vehicle assignment removed')).toBeTruthy();
    expect(queryByText('No vehicle assigned yet')).toBeNull();
  });

  it('persists that this driver has had a vehicle once one is seen', async () => {

    render(<DriverDashboard navigation={{ navigate: jest.fn() }} />);

    await waitFor(async () => {
      expect(await AsyncStorage.getItem('driver_had_vehicle_before')).toBe('true');
    });
  });
});


describe('DriverDashboard — custom route recording', () => {
  const nav = { navigate: jest.fn() };
  const recordingRoute = { routeId: 'CUST-1', status: 'RECORDING', requiredRuns: 5, acceptedRuns: 2 };
  let mockStop;
  const tracking = () => mockUseTrackingSession.mockReturnValue({
    status: 'tracking', error: undefined, isReconnecting: false, start: jest.fn(), stop: mockStop,
  });
  beforeEach(() => { mockStop = jest.fn(); });

  const endJourney = ({ getByLabelText, getByText }) => {
    fireEvent.press(getByLabelText('End journey'));
    fireEvent.press(getByText('End journey'));
  };

  it('shows no recording card to a driver whose route is not a custom one', async () => {
    const { findByText, queryByTestId } = render(<DriverDashboard navigation={nav} />);
    await findByText('YOUR VEHICLE');
    expect(queryByTestId('custom-route-card')).toBeNull();
  });

  it('shows which ride a custom-route driver is on', async () => {
    mockCustomRoute = recordingRoute;
    const { findByTestId } = render(<DriverDashboard navigation={nav} />);
    const progress = await findByTestId('custom-route-progress');
    expect(progress.props.children.join('')).toBe('Ride 3 of 5');
  });

  it('hides the card once the route is live', async () => {
    mockCustomRoute = { ...recordingRoute, status: 'ACTIVE', acceptedRuns: 5 };
    const { findByText, queryByTestId } = render(<DriverDashboard navigation={nav} />);
    await findByText('YOUR VEHICLE');
    expect(queryByTestId('custom-route-card')).toBeNull();
  });

  it('records only while the route is collecting rides, and tells the recorder the shift state', () => {
    mockCustomRoute = recordingRoute;
    tracking();
    render(<DriverDashboard navigation={nav} />);
    expect(mockUseRouteRecorder).toHaveBeenLastCalledWith({ enabled: true, onDuty: true, vehicleId: 'VEHICLE-1' });
  });

  it('does not enable the recorder for a route that is waiting on the manager', () => {
    mockCustomRoute = { ...recordingRoute, status: 'PENDING_REVIEW', acceptedRuns: 5 };
    render(<DriverDashboard navigation={nav} />);
    expect(mockUseRouteRecorder).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: false }));
  });

  it('adds a stop and tells the driver what happened', async () => {
    mockCustomRoute = recordingRoute;
    tracking();
    mockRecorder.addStop.mockReturnValue({ ok: false, reason: 'NO_FIX' });
    const { findByTestId } = render(<DriverDashboard navigation={nav} />);
    fireEvent.press(await findByTestId('add-stop-button'));
    expect(mockRecorder.addStop).toHaveBeenCalledTimes(1);
    expect((await findByTestId('custom-route-notice')).props.children).toMatch(/waiting for gps/i);
  });

  it('asks for a name right after a stop is marked and saves it on that stop', async () => {
    mockCustomRoute = recordingRoute;
    tracking();
    mockRecorder.addStop.mockReturnValue({ ok: true, stop: { lat: 6.9, lng: 79.85, t: 1234, name: '' } });
    mockRecorder.nameStop.mockReturnValue(true);
    const { findByTestId, getByTestId, queryByTestId } = render(<DriverDashboard navigation={nav} />);
    expect(queryByTestId('stop-name-sheet')).toBeNull();

    fireEvent.press(await findByTestId('add-stop-button'));
    fireEvent.changeText(await findByTestId('stop-name-input'), "Nimal's house");
    fireEvent.press(getByTestId('stop-name-save'));

    expect(mockRecorder.nameStop).toHaveBeenCalledWith(1234, "Nimal's house");
    await waitFor(() => expect(queryByTestId('stop-name-sheet')).toBeNull());
    expect((await findByTestId('custom-route-notice')).props.children).toMatch(/Nimal's house/);
  });

  it('lets the driver skip naming; the stop stays marked without a name', async () => {
    mockCustomRoute = recordingRoute;
    tracking();
    mockRecorder.addStop.mockReturnValue({ ok: true, stop: { lat: 6.9, lng: 79.85, t: 99, name: '' } });
    const { findByTestId, getByTestId, queryByTestId } = render(<DriverDashboard navigation={nav} />);

    fireEvent.press(await findByTestId('add-stop-button'));
    fireEvent.press(await findByTestId('stop-name-skip'));

    expect(mockRecorder.nameStop).not.toHaveBeenCalled();
    await waitFor(() => expect(queryByTestId('stop-name-sheet')).toBeNull());
    expect(getByTestId('custom-route-notice').props.children).toBe('Stop added');
  });

  it('does not ask for a name when the stop was refused', async () => {
    mockCustomRoute = recordingRoute;
    tracking();
    mockRecorder.addStop.mockReturnValue({ ok: false, reason: 'TOO_CLOSE' });
    const { findByTestId, queryByTestId } = render(<DriverDashboard navigation={nav} />);
    fireEvent.press(await findByTestId('add-stop-button'));
    expect(queryByTestId('stop-name-sheet')).toBeNull();
  });

  it('has no Add stop button once the route is live (no more stops after it is confirmed)', async () => {
    mockCustomRoute = { ...recordingRoute, status: 'ACTIVE', acceptedRuns: 5 };
    tracking();
    const { findByText, queryByTestId } = render(<DriverDashboard navigation={nav} />);
    await findByText('YOUR VEHICLE');
    expect(queryByTestId('add-stop-button')).toBeNull();
  });

  it('ending the journey sends the ride first, then goes off duty, then reports the result', async () => {
    mockCustomRoute = recordingRoute;
    tracking();
    mockRecorder.isRecording = true;
    const order = [];
    mockRecorder.finish.mockImplementation(async () => {
      order.push('finish');
      return { kind: 'sent', runStatus: 'ACCEPTED', acceptedRuns: 3, requiredRuns: 5, routeStatus: 'RECORDING' };
    });
    mockStop.mockImplementation(() => order.push('stop'));
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    endJourney(render(<DriverDashboard navigation={nav} />));

    await waitFor(() => expect(mockStop).toHaveBeenCalledWith('VEHICLE-1'));
    expect(order).toEqual(['finish', 'stop']);
    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Ride 3 of 5 saved', expect.stringMatching(/2 more rides/)));
  });

  it('still goes off duty when the ride could not be sent', async () => {
    mockCustomRoute = recordingRoute;
    tracking();
    mockRecorder.isRecording = true;
    mockRecorder.finish.mockResolvedValue({ kind: 'queued' });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    endJourney(render(<DriverDashboard navigation={nav} />));

    await waitFor(() => expect(mockStop).toHaveBeenCalledWith('VEHICLE-1'));
    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Ride saved on your phone', expect.any(String)));
  });

  it('ending a journey off a custom route is exactly what it always was', async () => {
    tracking();
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    endJourney(render(<DriverDashboard navigation={nav} />));
    await waitFor(() => expect(mockStop).toHaveBeenCalledWith('VEHICLE-1'));
    expect(mockRecorder.finish).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('asks before discarding a ride, and only discards when confirmed', async () => {
    mockCustomRoute = recordingRoute;
    tracking();
    mockRecorder.isRecording = true;
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { findByTestId } = render(<DriverDashboard navigation={nav} />);
    fireEvent.press(await findByTestId('discard-ride-button'));
    expect(mockRecorder.discard).not.toHaveBeenCalled();

    const call = alertSpy.mock.calls.find((c) => c[0] === 'Discard this ride?');
    call[2].find((b) => b.text === 'Discard').onPress();
    expect(mockRecorder.discard).toHaveBeenCalledTimes(1);
  });

  it('offers an unfinished ride back once, and sends it if the driver agrees', async () => {
    mockCustomRoute = recordingRoute;
    mockPeekInterrupted.mockResolvedValue({ clientRunId: 'run-x', points: [{}] });
    mockRecorder.finish.mockResolvedValue({ kind: 'sent', runStatus: 'ACCEPTED', acceptedRuns: 3, requiredRuns: 5 });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    render(<DriverDashboard navigation={nav} />);

    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Unfinished ride', expect.any(String), expect.any(Array)));
    const buttons = alertSpy.mock.calls.find((c) => c[0] === 'Unfinished ride')[2];
    buttons.find((b) => b.text === 'Send it').onPress();
    await waitFor(() => expect(mockRecorder.finish).toHaveBeenCalledTimes(1));
    expect(mockRestoreRecording).toHaveBeenCalled();
  });

  it('throws the unfinished ride away when the driver says so', async () => {
    mockCustomRoute = recordingRoute;
    mockPeekInterrupted.mockResolvedValue({ clientRunId: 'run-x', points: [{}] });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    render(<DriverDashboard navigation={nav} />);
    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Unfinished ride', expect.any(String), expect.any(Array)));
    alertSpy.mock.calls.find((c) => c[0] === 'Unfinished ride')[2].find((b) => b.text === 'Throw away').onPress();
    expect(mockDiscardRecording).toHaveBeenCalledTimes(1);
    expect(mockRecorder.finish).not.toHaveBeenCalled();
  });

  it('does not look for an unfinished ride off a custom route, or mid-shift', async () => {
    const first = render(<DriverDashboard navigation={nav} />);
    await first.findByText('YOUR VEHICLE');
    expect(mockPeekInterrupted).not.toHaveBeenCalled();
    first.unmount();

    mockCustomRoute = recordingRoute;
    tracking();
    const second = render(<DriverDashboard navigation={nav} />);
    await second.findByText('YOUR VEHICLE');
    expect(mockPeekInterrupted).not.toHaveBeenCalled();
  });
});
