import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomRouteRecorder, { bufferKeyFor, ONBOARDING_DONE_KEY } from '../CustomRouteRecorder';
import api from '../../services/api';
import { startTracking, stopTracking } from '../../services/socket';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../../services/socket', () => ({
  startTracking: jest.fn(() => Promise.resolve({ success: true })),
  stopTracking: jest.fn()
}));

jest.mock('../../services/api', () => ({
  recordCustomRoute: jest.fn(() => Promise.resolve({ success: true, data: { status: 'PENDING_NAMING' } })),
  recordRouteUpdate: jest.fn(() => Promise.resolve({ success: true, data: { changeRequestId: 'crq-1' } }))
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ authenticatedRequest: (fn, ...args) => fn('fake-token', ...args) })
}));

const mockCopilotStart = jest.fn();
jest.mock('react-native-copilot', () => ({
  CopilotProvider: ({ children }) => children,
  CopilotStep: ({ children }) => children,
  walkthroughable: (Component) => Component,
  useCopilot: () => ({ start: mockCopilotStart, copilotEvents: { on: () => () => {} } })
}));

let locationCallback = null;
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  watchPositionAsync: jest.fn((options, callback) => {
    locationCallback = callback;
    return Promise.resolve({ remove: jest.fn() });
  }),
  Accuracy: { High: 4 }
}));

const BUS = { busId: 'BUS-1' };

const emitFix = async (lat, lng) => {
  await act(async () => {
    locationCallback({ coords: { latitude: lat, longitude: lng } });
  });
};

beforeEach(async () => {
  jest.clearAllMocks();
  locationCallback = null;
  await AsyncStorage.clear();
  // Onboarding is done by default so unrelated tests never schedule a tour
  // timer (which would otherwise race with — and leak calls into — later
  // tests). Only the "coach-mark" and "update mode" tests below care about it.
  await AsyncStorage.setItem(ONBOARDING_DONE_KEY, 'true');
});

describe('coach-mark first-run gating', () => {
  it('starts the idle-stage tour when onboarding is not yet done', async () => {
    await AsyncStorage.removeItem(ONBOARDING_DONE_KEY);
    render(<CustomRouteRecorder bus={BUS} />);
    await waitFor(() => expect(mockCopilotStart).toHaveBeenCalledWith('trackRoute'));
  });

  it('does not start the tour once onboarding is marked done', async () => {
    render(<CustomRouteRecorder bus={BUS} />);
    await new Promise((r) => setTimeout(r, 500));
    expect(mockCopilotStart).not.toHaveBeenCalled();
  });
});

describe('Track / Add Stop / Complete state machine', () => {
  it('moves from idle to recording when Track Route is pressed', async () => {
    const { getByTestId, queryByTestId } = render(<CustomRouteRecorder bus={BUS} />);
    expect(getByTestId('track-route-button')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByTestId('track-route-button'));
    });

    await waitFor(() => expect(getByTestId('add-stop-button')).toBeTruthy());
    expect(queryByTestId('track-route-button')).toBeNull();
    expect(startTracking).toHaveBeenCalledWith('BUS-1');
  });

  it('accumulates breadcrumb points and persists them to AsyncStorage', async () => {
    const { getByTestId } = render(<CustomRouteRecorder bus={BUS} />);
    await act(async () => fireEvent.press(getByTestId('track-route-button')));
    await waitFor(() => expect(getByTestId('add-stop-button')).toBeTruthy());

    await emitFix(6.9271, 79.8612);
    await emitFix(6.9371, 79.8612);

    await waitFor(async () => {
      const raw = await AsyncStorage.getItem(bufferKeyFor('BUS-1'));
      expect(raw).toBeTruthy();
      const buffer = JSON.parse(raw);
      expect(buffer.breadcrumb).toHaveLength(2);
      expect(buffer.breadcrumb[0]).toMatchObject({ lat: 6.9271, lng: 79.8612 });
    });
  });

  it('submits the recorded breadcrumb + stops with the expected payload shape on Complete', async () => {
    const { getByTestId } = render(<CustomRouteRecorder bus={BUS} />);
    await act(async () => fireEvent.press(getByTestId('track-route-button')));
    await waitFor(() => expect(getByTestId('add-stop-button')).toBeTruthy());

    await emitFix(6.9271, 79.8612);
    await emitFix(6.9371, 79.8612);

    await act(async () => fireEvent.press(getByTestId('add-stop-button')));
    await act(async () => fireEvent.press(getByTestId('stop-name-confirm')));

    await act(async () => fireEvent.press(getByTestId('complete-button')));

    await waitFor(() => expect(api.recordCustomRoute).toHaveBeenCalledTimes(1));
    const payload = api.recordCustomRoute.mock.calls[0][1];
    expect(payload.busId).toBe('BUS-1');
    expect(payload.breadcrumb).toEqual([
      { lat: 6.9271, lng: 79.8612, t: expect.any(Number) },
      { lat: 6.9371, lng: 79.8612, t: expect.any(Number) }
    ]);
    expect(payload.stops).toEqual([{ lat: 6.9371, lng: 79.8612, stopName: 'Stop 1' }]);
    expect(stopTracking).toHaveBeenCalledWith('BUS-1');
  });

  it('clears the AsyncStorage buffer after a successful submit', async () => {
    const { getByTestId } = render(<CustomRouteRecorder bus={BUS} />);
    await act(async () => fireEvent.press(getByTestId('track-route-button')));
    await waitFor(() => expect(getByTestId('add-stop-button')).toBeTruthy());
    await emitFix(6.9271, 79.8612);
    await emitFix(6.9371, 79.8612);

    await act(async () => fireEvent.press(getByTestId('complete-button')));
    await waitFor(() => expect(api.recordCustomRoute).toHaveBeenCalledTimes(1));

    const raw = await AsyncStorage.getItem(bufferKeyFor('BUS-1'));
    expect(raw).toBeNull();
  });
});

describe('Add Stop guards', () => {
  it('rejects adding a stop before any GPS fix is available', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByTestId, queryByTestId } = render(<CustomRouteRecorder bus={BUS} />);
    await act(async () => fireEvent.press(getByTestId('track-route-button')));
    await waitFor(() => expect(getByTestId('add-stop-button')).toBeTruthy());

    await act(async () => fireEvent.press(getByTestId('add-stop-button')));

    expect(alertSpy).toHaveBeenCalledWith('No GPS fix yet', expect.any(String));
    expect(queryByTestId('stop-name-input')).toBeNull();
    alertSpy.mockRestore();
  });

  it('rejects a stop too close to the previously added stop', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByTestId, queryByTestId } = render(<CustomRouteRecorder bus={BUS} />);
    await act(async () => fireEvent.press(getByTestId('track-route-button')));
    await waitFor(() => expect(getByTestId('add-stop-button')).toBeTruthy());

    await emitFix(6.9271, 79.8612);
    await act(async () => fireEvent.press(getByTestId('add-stop-button')));
    await act(async () => fireEvent.press(getByTestId('stop-name-confirm')));

    // Same coordinate again — well under the 15m minimum stop spacing.
    await emitFix(6.9271, 79.8612);
    await act(async () => fireEvent.press(getByTestId('add-stop-button')));

    expect(alertSpy).toHaveBeenCalledWith('Too close', expect.any(String));
    expect(queryByTestId('stop-name-input')).toBeNull();
    alertSpy.mockRestore();
  });
});

describe('crash / background recovery', () => {
  it('offers resume/submit/discard when a buffer exists for this bus on mount', async () => {
    await AsyncStorage.setItem(
      bufferKeyFor('BUS-1'),
      JSON.stringify({ busId: 'BUS-1', breadcrumb: [{ lat: 1, lng: 1, t: 1 }, { lat: 2, lng: 2, t: 2 }], stops: [], startedAt: Date.now() })
    );
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    render(<CustomRouteRecorder bus={BUS} />);

    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith(
      'Resume recording?',
      expect.stringContaining('2 GPS points'),
      expect.any(Array)
    ));
    const buttons = alertSpy.mock.calls[0][2];
    expect(buttons.map((b) => b.text)).toEqual(['Discard', 'Submit now', 'Resume']);
    alertSpy.mockRestore();
  });

  it('discard clears the persisted buffer', async () => {
    await AsyncStorage.setItem(
      bufferKeyFor('BUS-1'),
      JSON.stringify({ busId: 'BUS-1', breadcrumb: [{ lat: 1, lng: 1, t: 1 }, { lat: 2, lng: 2, t: 2 }], stops: [], startedAt: Date.now() })
    );
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title, msg, buttons) => {
      buttons.find((b) => b.text === 'Discard')?.onPress?.();
    });

    render(<CustomRouteRecorder bus={BUS} />);

    await waitFor(async () => {
      const raw = await AsyncStorage.getItem(bufferKeyFor('BUS-1'));
      expect(raw).toBeNull();
    });
    alertSpy.mockRestore();
  });

  it('ignores an empty/degenerate buffer and clears it silently', async () => {
    await AsyncStorage.setItem(bufferKeyFor('BUS-1'), JSON.stringify({ busId: 'BUS-1', breadcrumb: [], stops: [] }));
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    render(<CustomRouteRecorder bus={BUS} />);

    await waitFor(async () => {
      const raw = await AsyncStorage.getItem(bufferKeyFor('BUS-1'));
      expect(raw).toBeNull();
    });
    expect(alertSpy).not.toHaveBeenCalledWith('Resume recording?', expect.any(String), expect.any(Array));
    alertSpy.mockRestore();
  });
});

describe('update mode (Phase 2: Update Route after an off-route flag)', () => {
  it('shows update-specific copy instead of the initial-recording copy', () => {
    const { getByText } = render(<CustomRouteRecorder bus={BUS} routeId="ROUTE-1" mode="update" />);
    expect(getByText('Update Your Route')).toBeTruthy();
  });

  it('does not start the onboarding tour in update mode, even if onboarding was never completed', async () => {
    await AsyncStorage.removeItem(ONBOARDING_DONE_KEY);
    render(<CustomRouteRecorder bus={BUS} routeId="ROUTE-1" mode="update" />);
    await new Promise((r) => setTimeout(r, 500));
    expect(mockCopilotStart).not.toHaveBeenCalled();
  });

  it('submits via recordRouteUpdate with the routeId instead of recordCustomRoute', async () => {
    const onSubmitted = jest.fn();
    const { getByTestId } = render(<CustomRouteRecorder bus={BUS} routeId="ROUTE-1" mode="update" onSubmitted={onSubmitted} />);

    await act(async () => fireEvent.press(getByTestId('track-route-button')));
    await waitFor(() => expect(getByTestId('complete-button')).toBeTruthy());

    await emitFix(6.9271, 79.8612);
    await emitFix(6.9371, 79.8612);

    await act(async () => fireEvent.press(getByTestId('complete-button')));

    await waitFor(() => expect(api.recordRouteUpdate).toHaveBeenCalledTimes(1));
    expect(api.recordCustomRoute).not.toHaveBeenCalled();
    const payload = api.recordRouteUpdate.mock.calls[0][1];
    expect(payload.routeId).toBe('ROUTE-1');
    expect(payload.busId).toBe('BUS-1');
    expect(onSubmitted).toHaveBeenCalled();
  });

  it('persists its recording buffer under a mode-specific key', async () => {
    const { getByTestId } = render(<CustomRouteRecorder bus={BUS} routeId="ROUTE-1" mode="update" />);
    await act(async () => fireEvent.press(getByTestId('track-route-button')));
    await waitFor(() => expect(getByTestId('complete-button')).toBeTruthy());
    await emitFix(6.9271, 79.8612);

    await waitFor(async () => {
      const raw = await AsyncStorage.getItem(bufferKeyFor('BUS-1', 'update'));
      expect(raw).toBeTruthy();
    });
    const initialModeRaw = await AsyncStorage.getItem(bufferKeyFor('BUS-1'));
    expect(initialModeRaw).toBeNull();
  });
});
