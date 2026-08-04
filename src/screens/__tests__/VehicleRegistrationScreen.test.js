import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import VehicleRegistrationScreen from '../VehicleRegistrationScreen';
import api from '../../services/api';

jest.mock('../../services/api', () => ({
  registerVehicle: jest.fn(),
}));

const mockAuthenticatedRequest = jest.fn((fn, ...args) => fn(...args));

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ authenticatedRequest: mockAuthenticatedRequest }),
}));

const goBack = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  mockAuthenticatedRequest.mockImplementation((fn, ...args) => fn(...args));
});

afterEach(() => {
  jest.useRealTimers();
});

describe('VehicleRegistrationScreen', () => {
  it('shows the "Your vehicle" header', () => {
    const { getByText } = render(<VehicleRegistrationScreen navigation={{ goBack }} />);
    expect(getByText('Your vehicle')).toBeTruthy();
  });

  it('blocks submit and shows inline field errors when the form is empty', () => {
    const { getByText } = render(<VehicleRegistrationScreen navigation={{ goBack }} />);
    fireEvent.press(getByText('Save vehicle'));

    expect(getByText('Vehicle ID is required')).toBeTruthy();
    expect(getByText('Vehicle name is required')).toBeTruthy();
    expect(api.registerVehicle).not.toHaveBeenCalled();
  });

  it('submits, shows Saved, and navigates back after a successful save', async () => {
    api.registerVehicle.mockResolvedValue({ success: true });
    const { getByText, getByPlaceholderText } = render(<VehicleRegistrationScreen navigation={{ goBack }} />);

    fireEvent.changeText(getByPlaceholderText('e.g. VEHICLE-102'), 'vehicle-1');
    fireEvent.changeText(getByPlaceholderText('e.g. Silver Express'), 'Silver Express');
    fireEvent.changeText(getByPlaceholderText('e.g. ABC-1234'), 'abc-1234');
    fireEvent.changeText(getByPlaceholderText('50'), '40');

    await act(async () => {
      fireEvent.press(getByText('Save vehicle'));
    });

    expect(api.registerVehicle).toHaveBeenCalledWith(
      expect.objectContaining({ vehicleId: 'VEHICLE-1', vehicleName: 'Silver Express', registrationNumber: 'ABC-1234', seatCapacity: 40 }),
    );
    expect(getByText('Saved')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(700);
    });
    expect(goBack).toHaveBeenCalledTimes(1);
  });

  it('shows an inline error when the save fails', async () => {
    api.registerVehicle.mockResolvedValue({ success: false, message: 'Vehicle ID already exists' });
    const { getByText, getByPlaceholderText } = render(<VehicleRegistrationScreen navigation={{ goBack }} />);

    fireEvent.changeText(getByPlaceholderText('e.g. VEHICLE-102'), 'VEHICLE-1');
    fireEvent.changeText(getByPlaceholderText('e.g. Silver Express'), 'Silver Express');
    fireEvent.changeText(getByPlaceholderText('e.g. ABC-1234'), 'ABC-1234');
    fireEvent.changeText(getByPlaceholderText('50'), '40');

    await act(async () => {
      fireEvent.press(getByText('Save vehicle'));
    });

    await waitFor(() => expect(getByText('Vehicle ID already exists')).toBeTruthy());
    expect(goBack).not.toHaveBeenCalled();
  });

  it('toggles booking enabled', () => {
    const { getByRole } = render(<VehicleRegistrationScreen navigation={{ goBack }} />);
    const toggle = getByRole('switch');
    expect(toggle.props.accessibilityState.checked).toBe(true);
    fireEvent.press(toggle);
    expect(toggle.props.accessibilityState.checked).toBe(false);
  });
});
