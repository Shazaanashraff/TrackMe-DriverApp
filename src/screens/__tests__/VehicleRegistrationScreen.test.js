import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import VehicleRegistrationScreen from '../VehicleRegistrationScreen';
import api from '../../services/api';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    registerVehicle: jest.fn(),
  },
}));

jest.mock('../../context/AuthContext', () => ({
  __esModule: true,
  useAuth: () => ({ token: 'tok' }),
}));

const goBack = jest.fn();

function renderScreen() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const invalidateSpy = jest.spyOn(qc, 'invalidateQueries');
  const utils = render(
    <QueryClientProvider client={qc}>
      <VehicleRegistrationScreen navigation={{ goBack }} />
    </QueryClientProvider>
  );
  return { ...utils, invalidateSpy };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('VehicleRegistrationScreen', () => {
  it('shows the "Your vehicle" header', () => {
    const { getByText } = renderScreen();
    expect(getByText('Your vehicle')).toBeTruthy();
  });

  it('blocks submit and shows inline field errors when the form is empty', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Save vehicle'));

    expect(getByText('Vehicle ID is required')).toBeTruthy();
    expect(getByText('Vehicle name is required')).toBeTruthy();
    expect(api.registerVehicle).not.toHaveBeenCalled();
  });

  it('submits, shows Saved, navigates back, and refreshes the Dashboard\'s myVehicle data (issue #19)', async () => {
    api.registerVehicle.mockResolvedValue({ success: true });
    const { getByText, getByPlaceholderText, invalidateSpy } = renderScreen();

    fireEvent.changeText(getByPlaceholderText('e.g. VEHICLE-102'), 'vehicle-1');
    fireEvent.changeText(getByPlaceholderText('e.g. Silver Express'), 'Silver Express');
    fireEvent.changeText(getByPlaceholderText('e.g. ABC-1234'), 'abc-1234');

    await act(async () => {
      fireEvent.press(getByText('Save vehicle'));
    });

    // Correct argument order matters: registerVehicle(vehicleData, token) — the screen used to
    // call it via authenticatedRequest, which passes (token, ...args) and silently swapped them.
    expect(api.registerVehicle).toHaveBeenCalledWith(
      expect.objectContaining({ vehicleId: 'VEHICLE-1', vehicleName: 'Silver Express', registrationNumber: 'ABC-1234' }),
      'tok',
    );
    // Drivers are no longer asked for a seat count, so none is sent.
    expect(api.registerVehicle.mock.calls[0][0]).not.toHaveProperty('seatCapacity');
    expect(getByText('Saved')).toBeTruthy();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['vehicle', 'mine'] });

    act(() => {
      jest.advanceTimersByTime(700);
    });
    expect(goBack).toHaveBeenCalledTimes(1);
  });

  it('shows an inline error when the save fails', async () => {
    api.registerVehicle.mockResolvedValue({ success: false, message: 'Vehicle ID already exists' });
    const { getByText, getByPlaceholderText } = renderScreen();

    fireEvent.changeText(getByPlaceholderText('e.g. VEHICLE-102'), 'VEHICLE-1');
    fireEvent.changeText(getByPlaceholderText('e.g. Silver Express'), 'Silver Express');
    fireEvent.changeText(getByPlaceholderText('e.g. ABC-1234'), 'ABC-1234');

    await act(async () => {
      fireEvent.press(getByText('Save vehicle'));
    });

    await waitFor(() => expect(getByText('Vehicle ID already exists')).toBeTruthy());
    expect(goBack).not.toHaveBeenCalled();
  });

  it('toggles booking enabled', () => {
    const { getByRole } = renderScreen();
    const toggle = getByRole('switch');
    expect(toggle.props.accessibilityState.checked).toBe(true);
    fireEvent.press(toggle);
    expect(toggle.props.accessibilityState.checked).toBe(false);
  });
});
