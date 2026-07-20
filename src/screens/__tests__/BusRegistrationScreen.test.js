import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import BusRegistrationScreen from '../BusRegistrationScreen';
import api from '../../services/api';

jest.mock('../../services/api', () => ({
  registerBus: jest.fn(),
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

describe('BusRegistrationScreen', () => {
  it('shows the "Your bus" header', () => {
    const { getByText } = render(<BusRegistrationScreen navigation={{ goBack }} />);
    expect(getByText('Your bus')).toBeTruthy();
  });

  it('blocks submit and shows inline field errors when the form is empty', () => {
    const { getByText } = render(<BusRegistrationScreen navigation={{ goBack }} />);
    fireEvent.press(getByText('Save bus'));

    expect(getByText('Bus ID is required')).toBeTruthy();
    expect(getByText('Bus name is required')).toBeTruthy();
    expect(api.registerBus).not.toHaveBeenCalled();
  });

  it('submits, shows Saved, and navigates back after a successful save', async () => {
    api.registerBus.mockResolvedValue({ success: true });
    const { getByText, getByPlaceholderText } = render(<BusRegistrationScreen navigation={{ goBack }} />);

    fireEvent.changeText(getByPlaceholderText('e.g. BUS-102'), 'bus-1');
    fireEvent.changeText(getByPlaceholderText('e.g. Silver Express'), 'Silver Express');
    fireEvent.changeText(getByPlaceholderText('e.g. ABC-1234'), 'abc-1234');
    fireEvent.changeText(getByPlaceholderText('50'), '40');

    await act(async () => {
      fireEvent.press(getByText('Save bus'));
    });

    expect(api.registerBus).toHaveBeenCalledWith(
      expect.objectContaining({ busId: 'BUS-1', busName: 'Silver Express', registrationNumber: 'ABC-1234', seatCapacity: 40 }),
    );
    expect(getByText('Saved')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(700);
    });
    expect(goBack).toHaveBeenCalledTimes(1);
  });

  it('shows an inline error when the save fails', async () => {
    api.registerBus.mockResolvedValue({ success: false, message: 'Bus ID already exists' });
    const { getByText, getByPlaceholderText } = render(<BusRegistrationScreen navigation={{ goBack }} />);

    fireEvent.changeText(getByPlaceholderText('e.g. BUS-102'), 'BUS-1');
    fireEvent.changeText(getByPlaceholderText('e.g. Silver Express'), 'Silver Express');
    fireEvent.changeText(getByPlaceholderText('e.g. ABC-1234'), 'ABC-1234');
    fireEvent.changeText(getByPlaceholderText('50'), '40');

    await act(async () => {
      fireEvent.press(getByText('Save bus'));
    });

    await waitFor(() => expect(getByText('Bus ID already exists')).toBeTruthy());
    expect(goBack).not.toHaveBeenCalled();
  });

  it('toggles booking enabled', () => {
    const { getByRole } = render(<BusRegistrationScreen navigation={{ goBack }} />);
    const toggle = getByRole('switch');
    expect(toggle.props.accessibilityState.checked).toBe(true);
    fireEvent.press(toggle);
    expect(toggle.props.accessibilityState.checked).toBe(false);
  });
});
