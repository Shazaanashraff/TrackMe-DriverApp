// Full-flow test for issue #29 item 3: scan a pass while offline → confirm saved →
// reconnect → confirm it goes through → confirm the on-board roster updates. Walked
// through the real QRScannerScreen (camera mocked at the wire boundary, capturing
// its onBarcodeScanned callback) and the real BoardingRosterScreen, sharing one
// AuthProvider + QueryClient the way navigating between the two screens in the app
// would. Real modules: QRScannerScreen, useBoardingScan (offline queue + replay),
// BoardingRosterScreen, useBoardingRosterQuery, useMyVehicleQuery, AuthContext, and
// the real services/backendStatus module (not mocked) — "reconnect" is simulated
// the same way the app's own health poll would signal it, by calling
// markBackendHealthy() directly, mirroring how tracking.int.test.tsx simulates a
// socket reconnect via the mocked socket's own 'connect' handler rather than
// re-implementing NetInfo/setInterval machinery.
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AuthProvider, useAuth } from '../src/context/AuthContext';
import QRScannerScreen from '../src/screens/QRScannerScreen';
import BoardingRosterScreen from '../src/screens/BoardingRosterScreen';
import { markBackendHealthy } from '../src/services/backendStatus';

let capturedOnBarcodeScanned: ((event: { data: string }) => void) | undefined;

jest.mock('expo-camera', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    CameraView: (props: { onBarcodeScanned?: (event: { data: string }) => void }) => {
      capturedOnBarcodeScanned = props.onBarcodeScanned;
      return <View testID="mock-camera-view" />;
    },
    useCameraPermissions: () => [{ granted: true }, jest.fn()],
  };
});

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    text: async () => JSON.stringify(body),
  };
}

function networkFailure() {
  return Promise.reject(new TypeError('Network request failed'));
}

// Bootstraps an already-authenticated driver directly through AuthContext.login,
// the same shortcut __integration__/auth.int.test.tsx uses to reach an
// authenticated state without re-driving the LoginScreen UI (covered end to end by
// login-rolegate-flow.int.test.tsx instead).
function AuthBootstrap({ onReady, children }: { onReady: () => void; children: React.ReactNode }) {
  const { login, loading } = useAuth() as { login: (u: unknown, t: string, r?: string) => Promise<void>; loading: boolean };
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    if (loading || ready) return;
    login({ _id: 'd1', name: 'Nadia Perera', role: 'driver' }, 'access-driver', 'refresh-driver').then(() => {
      setReady(true);
      onReady();
    });
  }, [loading, ready, login, onReady]);
  if (!ready) return null;
  return <>{children}</>;
}

function renderScreen(qc: QueryClient, ui: React.ReactElement, onReady: () => void) {
  return render(
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <AuthBootstrap onReady={onReady}>{ui}</AuthBootstrap>
      </AuthProvider>
    </QueryClientProvider>
  );
}

const originalFetch = global.fetch;
const VEHICLE_ID = 'VEHICLE-1';

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  capturedOnBarcodeScanned = undefined;
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe('offline scan end to end: scan offline → saved → reconnect → replays → roster updates', () => {
  it('queues a scan made while offline, replays it once the backend is healthy again, and the roster reflects it', async () => {
    let scanDelivered = false;

    const fetchMock = jest.fn((url: string) => {
      if (url.includes('/api/driver/boarding/scan')) {
        if (!scanDelivered) return networkFailure();
        scanDelivered = true; // idempotent-ish guard; only the first delivered call matters
        return Promise.resolve(
          jsonResponse(200, {
            success: true,
            debounced: false,
            data: { eventId: 'e1', studentName: 'Aria Fernando', type: 'BOARD', timestamp: '2026-08-23T09:00:00Z' },
          })
        );
      }
      if (url.includes('/api/driver/boarding/roster')) {
        const body = scanDelivered
          ? { vehicleId: VEHICLE_ID, routeId: 'r1', tripId: 't1', enrolledCount: 3, onBoardCount: 1, roster: [
              { studentId: 's1', studentName: 'Aria Fernando', status: 'ON', lastEventAt: '2026-08-23T09:00:00Z' },
            ], guests: [] }
          : { vehicleId: VEHICLE_ID, routeId: 'r1', tripId: 't1', enrolledCount: 3, onBoardCount: 0, roster: [], guests: [] };
        return Promise.resolve(jsonResponse(200, { data: body }));
      }
      return Promise.reject(new Error(`Unexpected fetch in test: ${url}`));
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    let authReady = false;
    const scanner = renderScreen(
      qc,
      <QRScannerScreen navigation={{ goBack: jest.fn() }} route={{ params: { vehicleId: VEHICLE_ID } }} />,
      () => {
        authReady = true;
      }
    );
    await waitFor(() => expect(authReady).toBe(true));
    await waitFor(() => expect(capturedOnBarcodeScanned).toBeDefined());

    // 1) Scan a pass while offline — the scan endpoint fails with a network error.
    await act(async () => {
      capturedOnBarcodeScanned!({ data: 'qr-token-1' });
    });

    // 2) Confirm saved: the offline banner shows and the scan is persisted to the
    // AsyncStorage replay queue rather than lost.
    await scanner.findByText('Saved — will confirm when back online.');
    await waitFor(async () => {
      const raw = await AsyncStorage.getItem('boarding_scan_queue');
      expect(JSON.parse(raw as string)).toHaveLength(1);
    });

    // 3) Reconnect — the same signal the app's own health poll sends on recovery.
    scanDelivered = true; // scan endpoint now succeeds on the replay
    act(() => {
      markBackendHealthy();
    });

    // 4) Confirm it goes through: the queue drains once the replay succeeds.
    await waitFor(async () => {
      const raw = await AsyncStorage.getItem('boarding_scan_queue');
      expect(JSON.parse(raw as string)).toEqual([]);
    });
    expect(
      fetchMock.mock.calls.filter(([url]) => String(url).includes('/api/driver/boarding/scan'))
    ).toHaveLength(2); // the failed offline attempt + the successful replay

    scanner.unmount();

    // 5) Confirm the on-board roster updates — navigating to the roster screen
    // (a fresh mount, as the app would do) fetches the now-current count.
    const roster = renderScreen(
      qc,
      <BoardingRosterScreen navigation={{ goBack: jest.fn() }} route={{ params: { vehicleId: VEHICLE_ID } }} />,
      () => {}
    );
    expect(await roster.findByText('1 / 3')).toBeTruthy();
    expect(roster.getByText('Aria Fernando')).toBeTruthy();
    expect(roster.getByText('On board')).toBeTruthy();
  });
});
