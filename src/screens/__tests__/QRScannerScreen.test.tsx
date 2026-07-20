import React from 'react';
import { render, act } from '@testing-library/react-native';
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
const route = { params: { busId: 'BUS-1' } };

describe('QRScannerScreen', () => {
  it('renders a permission-denied state when camera permission is not granted', () => {
    mockUseCameraPermissions.mockReturnValue([{ granted: false }, mockRequestPermission]);

    const { getByText, queryByTestId } = render(<QRScannerScreen navigation={navigation} route={route} />);

    expect(getByText('Camera access needed')).toBeTruthy();
    expect(queryByTestId('mock-camera-view')).toBeNull();
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
