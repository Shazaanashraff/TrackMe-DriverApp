import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import DriverProfileScreen from '../DriverProfileScreen';
import api from '../../services/api';

// Covers the logout action that now lives on the Profile screen (moved off the
// dashboard menu). Bus/custom-route loading is stubbed out — we only assert that
// tapping Logout opens the confirm modal and confirming fires the logout mutation.

const mockLogoutMutate = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  removeItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../components/CustomRouteRecorder', () => ({
  ONBOARDING_DONE_KEY: 'onboarding-done',
}));

jest.mock('../../services/api', () => ({
  getMyBus: jest.fn(() => Promise.resolve({ data: null })),
  getMyCustomRoute: jest.fn(() => Promise.resolve({ data: { isCustomRoute: false } })),
}));

jest.mock('../../hooks/auth', () => ({
  useLogout: () => ({ mutate: mockLogoutMutate, isPending: false }),
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Route Driver 001', email: 'route.driver.001@bus.com', role: 'driver' },
    authenticatedRequest: (fn, ...args) => fn('fake-token', ...args),
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

const navigation = { goBack: jest.fn(), navigate: jest.fn() };

describe('DriverProfileScreen — logout', () => {
  it('renders a logout button', async () => {
    const { getByTestId } = render(<DriverProfileScreen navigation={navigation} />);
    await waitFor(() => expect(api.getMyBus).toHaveBeenCalled());
    expect(getByTestId('logout-button')).toBeTruthy();
  });

  it('fires the logout mutation when the user confirms in the modal', async () => {
    const { getByTestId, getByText, getAllByText } = render(<DriverProfileScreen navigation={navigation} />);
    await waitFor(() => expect(api.getMyBus).toHaveBeenCalled());

    // Modal is hidden until the button is pressed.
    fireEvent.press(getByTestId('logout-button'));
    // The modal is now open; its title confirms it, and "Logout" now appears twice
    // (the profile button + the modal's confirm button) — press the confirm one.
    expect(getByText('Log out?')).toBeTruthy();
    fireEvent.press(getAllByText('Logout')[1]);

    expect(mockLogoutMutate).toHaveBeenCalledTimes(1);
  });
});
