import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import DriverProfileScreen from '../DriverProfileScreen';
import api from '../../services/api';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../../services/api', () => ({
  getMyBus: jest.fn(),
  getMyCustomRoute: jest.fn(),
}));

const mockAuthenticatedRequest = jest.fn((fn, ...args) => fn(...args));
const mockLogoutMutate = jest.fn();

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Nadia Perera', email: 'nadia@test.com' },
    authenticatedRequest: mockAuthenticatedRequest,
  }),
}));

jest.mock('../../hooks/auth', () => ({
  useLogout: () => ({ mutate: mockLogoutMutate, isPending: false }),
}));

const navigation = { navigate: jest.fn(), reset: jest.fn() };

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthenticatedRequest.mockImplementation((fn, ...args) => fn(...args));
  api.getMyBus.mockResolvedValue({
    busName: 'Shuttle 1',
    registrationNumber: 'ABC-123',
    seatCapacity: 20,
  });
  api.getMyCustomRoute.mockResolvedValue({ isCustomRoute: false });
});

describe('DriverProfileScreen', () => {
  it('shows the header, avatar initial, and identity details', async () => {
    const { getByText, getAllByText, findByText } = render(<DriverProfileScreen navigation={navigation} />);
    expect(getByText('Profile')).toBeTruthy();
    expect(getByText('N')).toBeTruthy();
    // Appears twice: the identity block heading and the "Your details" InfoRow.
    expect(getAllByText('Nadia Perera').length).toBe(2);
    expect(getByText('nadia@test.com')).toBeTruthy();
    expect(await findByText('Shuttle 1')).toBeTruthy();
  });

  it('navigates to My routes', async () => {
    const { getByText, findByText } = render(<DriverProfileScreen navigation={navigation} />);
    await findByText('Shuttle 1');
    fireEvent.press(getByText('My routes'));
    expect(navigation.navigate).toHaveBeenCalledWith('RouteManagement');
  });

  it('navigates to Bus registration from the vehicle card CTA when there is no bus', async () => {
    api.getMyBus.mockRejectedValue(new Error('not found'));
    const { getByText, findByText } = render(<DriverProfileScreen navigation={navigation} />);
    fireEvent.press(await findByText('Add my bus'));
    expect(navigation.navigate).toHaveBeenCalledWith('BusRegistration');
  });

  it('opens a ConfirmSheet before logging out, and confirming calls the mutation', async () => {
    const { getByText, findByText, getAllByText } = render(<DriverProfileScreen navigation={navigation} />);
    await findByText('Shuttle 1');

    fireEvent.press(getByText('Log out'));
    expect(getByText("You'll stop broadcasting and need to sign in again.")).toBeTruthy();

    // "Log out" now appears twice: the row and the sheet's confirm button.
    const logOutButtons = getAllByText('Log out');
    fireEvent.press(logOutButtons[logOutButtons.length - 1]);
    expect(mockLogoutMutate).toHaveBeenCalledTimes(1);
  });

  it('does not show "Replay tutorial" when the driver has no custom route', async () => {
    const { queryByText, findByText } = render(<DriverProfileScreen navigation={navigation} />);
    await findByText('Shuttle 1');
    expect(queryByText('Replay tutorial')).toBeNull();
  });

  it('shows "Replay tutorial" when the driver has a custom route', async () => {
    api.getMyCustomRoute.mockResolvedValue({ isCustomRoute: true });
    const { findByText } = render(<DriverProfileScreen navigation={navigation} />);
    expect(await findByText('Replay tutorial')).toBeTruthy();
  });
});
