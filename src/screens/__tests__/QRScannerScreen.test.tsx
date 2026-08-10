import React from 'react';
import { StyleSheet } from 'react-native';
import { render, act, fireEvent, cleanup } from '@testing-library/react-native';
import { theme } from '../../theme';
import QRScannerScreen from '../QRScannerScreen';

let capturedOnBarcodeScanned: ((event: { data: string }) => void) | undefined;

jest.mock('expo-camera', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    CameraView: (props: { onBarcodeScanned?: (event: { data: string }) => void; testID?: string }) => {
      capturedOnBarcodeScanned = props.onBarcodeScanned;
      return <View testID="mock-camera-view" />;
    },
    useCameraPermissions: () => mockUseCameraPermissions(),
  };
});

const mockRequestPermission = jest.fn();
const mockUseCameraPermissions = jest.fn();

const mockSubmitScan = jest.fn();
let mockHookState: {
  status: string;
  lastResult: Record<string, unknown> | null;
  errorMessage: string | null;
  pendingCount: number;
  submitScan: typeof mockSubmitScan;
};

jest.mock('../../features/boarding/useBoardingScan', () => ({
  __esModule: true,
  useBoardingScan: (...args: unknown[]) => mockUseBoardingScan(...args),
}));

const mockUseBoardingScan = jest.fn((..._args: unknown[]) => mockHookState);

beforeEach(() => {
  jest.clearAllMocks();
  capturedOnBarcodeScanned = undefined;
  mockHookState = {
    status: 'idle',
    lastResult: null,
    errorMessage: null,
    pendingCount: 0,
    submitScan: mockSubmitScan,
  };
  mockUseCameraPermissions.mockReturnValue([{ granted: true }, mockRequestPermission]);
});

const navigation = { goBack: jest.fn() };
const route = { params: { vehicleId: 'VEHICLE-1' } };

describe('QRScannerScreen', () => {
  it('renders a permission-denied state when camera permission is not granted', () => {
    mockUseCameraPermissions.mockReturnValue([{ granted: false }, mockRequestPermission]);

    const { getByText, queryByTestId } = render(<QRScannerScreen navigation={navigation} route={route} />);

    expect(getByText('Camera access needed')).toBeTruthy();
    expect(queryByTestId('mock-camera-view')).toBeNull();
  });

  // The header back control must stay legible against the dark ink background, since
  // it is the escape hatch when the driver cannot grant camera access.
  it('leaves a working, visible back control on the permission-denied state', () => {
    mockUseCameraPermissions.mockReturnValue([{ granted: false }, mockRequestPermission]);

    const { getByText, getByLabelText } = render(
      <QRScannerScreen navigation={navigation} route={route} />
    );

    fireEvent.press(getByLabelText('Go back'));
    expect(navigation.goBack).toHaveBeenCalled();

    expect(StyleSheet.flatten(getByText('Scan rider QR').props.style).color)
      .toBe(theme.color.white);
  });

  it('offers an in-app retry when the OS will still prompt', () => {
    mockUseCameraPermissions.mockReturnValue([
      { granted: false, canAskAgain: true },
      mockRequestPermission,
    ]);

    const { getByText, queryByTestId } = render(
      <QRScannerScreen navigation={navigation} route={route} />
    );

    fireEvent.press(getByText('Allow camera'));
    expect(mockRequestPermission).toHaveBeenCalled();
    // The settings walkthrough is noise while the OS prompt is still available.
    expect(queryByTestId('permission-steps')).toBeNull();
  });

  it('falls back to settings guidance once the OS will no longer prompt', () => {
    mockUseCameraPermissions.mockReturnValue([
      { granted: false, canAskAgain: false },
      mockRequestPermission,
    ]);

    const { getByText, getByTestId } = render(
      <QRScannerScreen navigation={navigation} route={route} />
    );

    expect(getByTestId('permission-steps')).toBeTruthy();
    expect(getByText('Turn on Camera')).toBeTruthy();

    fireEvent.press(getByText('Go back'));
    expect(navigation.goBack).toHaveBeenCalled();
  });

  it('shows a resolving state instead of flashing "access needed" before permission loads', () => {
    mockUseCameraPermissions.mockReturnValue([null, mockRequestPermission]);

    const { queryByText, getByTestId } = render(
      <QRScannerScreen navigation={navigation} route={route} />
    );

    expect(getByTestId('permission-resolving')).toBeTruthy();
    expect(queryByText('Camera access needed')).toBeNull();
  });

  it('keeps the permission copy legible on the ink background', () => {
    mockUseCameraPermissions.mockReturnValue([
      { granted: false, canAskAgain: true },
      mockRequestPermission,
    ]);

    const { getByText } = render(<QRScannerScreen navigation={navigation} route={route} />);

    // text.secondary is the old value here and is near-invisible on ink.base.
    const subtitleColor = StyleSheet.flatten(
      getByText('TrackMe uses the camera to read rider QR passes. Nothing is recorded.').props.style
    ).color;
    expect(subtitleColor).toBe(theme.color.primary[300]);
    expect(subtitleColor).not.toBe(theme.color.text.secondary);

    expect(StyleSheet.flatten(getByText('Camera access needed').props.style).color)
      .toBe(theme.color.white);
  });

  it('renders the camera view when permission is granted', () => {
    const { getByTestId } = render(<QRScannerScreen navigation={navigation} route={route} />);
    expect(getByTestId('mock-camera-view')).toBeTruthy();
  });

  it('calls submitScan with the scanned QR data', () => {
    render(<QRScannerScreen navigation={navigation} route={route} />);

    act(() => {
      capturedOnBarcodeScanned?.({ data: 'qr-token-abc' });
    });

    expect(mockSubmitScan).toHaveBeenCalledWith('qr-token-abc');
  });

  it('renders success feedback with the student name, type, and time', () => {
    mockHookState = {
      ...mockHookState,
      status: 'success',
      lastResult: { studentName: 'Jane Doe', type: 'BOARD', timestamp: '2026-07-18T10:00:00Z' },
    };

    const { getByTestId } = render(<QRScannerScreen navigation={navigation} route={route} />);
    expect(getByTestId('scan-feedback')).toBeTruthy();
  });

  it('renders debounced feedback as "Already recorded"', () => {
    mockHookState = { ...mockHookState, status: 'debounced' };

    const { getByText } = render(<QRScannerScreen navigation={navigation} route={route} />);
    expect(getByText('Already recorded')).toBeTruthy();
  });

  it('renders the friendly error message from the hook', () => {
    mockHookState = {
      ...mockHookState,
      status: 'error',
      errorMessage: "QR attendance isn't enabled for this route yet — contact your manager.",
    };

    const { getByText } = render(<QRScannerScreen navigation={navigation} route={route} />);
    expect(getByText("QR attendance isn't enabled for this route yet — contact your manager.")).toBeTruthy();
  });
});

describe('QRScannerScreen — cooldown feedback + queueing (issue #11)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    // Unmount while fake timers are still active so the cleanup effect's
    // clearTimeout(cooldownTimerRef.current) clears a real pending fake timer,
    // instead of leaking a still-armed cooldown timer into the next test.
    cleanup();
    jest.useRealTimers();
  });

  it('shows explicit feedback instead of silently dropping a second scan during the cooldown window', () => {
    const { getByText } = render(<QRScannerScreen navigation={navigation} route={route} />);

    act(() => {
      capturedOnBarcodeScanned?.({ data: 'rider-1-token' });
    });
    expect(mockSubmitScan).toHaveBeenCalledTimes(1);

    act(() => {
      capturedOnBarcodeScanned?.({ data: 'rider-2-token' });
    });

    // Not silently dropped — an explicit "wait" message is shown, and the second
    // rider's scan is not submitted yet (still queued).
    expect(getByText('Please wait a moment — recording the last scan')).toBeTruthy();
    expect(mockSubmitScan).toHaveBeenCalledTimes(1);
  });

  it('fires the queued scan automatically once the cooldown clears, without a manual re-scan', () => {
    render(<QRScannerScreen navigation={navigation} route={route} />);

    act(() => {
      capturedOnBarcodeScanned?.({ data: 'rider-1-token' });
    });
    act(() => {
      capturedOnBarcodeScanned?.({ data: 'rider-2-token' });
    });
    expect(mockSubmitScan).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(mockSubmitScan).toHaveBeenCalledTimes(2);
    expect(mockSubmitScan).toHaveBeenNthCalledWith(2, 'rider-2-token');
  });

  it('clears the cooldown lock with nothing queued when only one scan happened', () => {
    const { queryByText } = render(<QRScannerScreen navigation={navigation} route={route} />);

    act(() => {
      capturedOnBarcodeScanned?.({ data: 'rider-1-token' });
    });

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(mockSubmitScan).toHaveBeenCalledTimes(1);
    expect(queryByText('Please wait a moment — recording the last scan')).toBeNull();

    // The lock is released — a genuinely new scan now goes straight through.
    act(() => {
      capturedOnBarcodeScanned?.({ data: 'rider-3-token' });
    });
    expect(mockSubmitScan).toHaveBeenCalledTimes(2);
  });

  it('a later scan during the cooldown replaces an earlier queued one — only the latest fires', () => {
    render(<QRScannerScreen navigation={navigation} route={route} />);

    act(() => {
      capturedOnBarcodeScanned?.({ data: 'rider-1-token' });
    });
    act(() => {
      capturedOnBarcodeScanned?.({ data: 'rider-2-token' });
    });
    act(() => {
      capturedOnBarcodeScanned?.({ data: 'rider-3-token' });
    });
    expect(mockSubmitScan).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(mockSubmitScan).toHaveBeenCalledTimes(2);
    expect(mockSubmitScan).toHaveBeenNthCalledWith(2, 'rider-3-token');
  });
});
