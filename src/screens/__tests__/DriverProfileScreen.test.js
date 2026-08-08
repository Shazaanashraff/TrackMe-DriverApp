import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import DriverProfileScreen from '../DriverProfileScreen';
import api from '../../services/api';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../../services/api', () => ({
  getMyVehicle: jest.fn(),
}));

const mockAuthenticatedRequest = jest.fn((fn, ...args) => fn(...args));
const mockLogoutMutate = jest.fn();
// The screen re-reads the account from the server; by default that read has not
// resolved, so these tests exercise the stored-account fallback.
const mockMeQuery = jest.fn(() => ({ data: undefined }));

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Nadia Perera', email: 'nadia@test.com' },
    authenticatedRequest: mockAuthenticatedRequest,
  }),
}));

jest.mock('../../hooks/auth', () => ({
  useLogout: () => ({ mutate: mockLogoutMutate, isPending: false }),
  useMeQuery: () => mockMeQuery(),
}));

const navigation = { navigate: jest.fn(), reset: jest.fn() };

beforeEach(() => {
  jest.clearAllMocks();
  mockMeQuery.mockReturnValue({ data: undefined });
  mockAuthenticatedRequest.mockImplementation((fn, ...args) => fn(...args));
  api.getMyVehicle.mockResolvedValue({
    vehicleName: 'Shuttle 1',
    registrationNumber: 'ABC-123',
    seatCapacity: 20,
  });
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

  it('shows the phone number the manager put on the account', async () => {
    // The row read `user.phone`, a field the account has never had, so every
    // driver saw "-" no matter what their manager had entered.
    mockMeQuery.mockReturnValue({
      data: { user: { name: 'Nadia Perera', email: 'nadia@test.com', phoneNumber: '0766518388' } },
    });

    const { getByText, findByText } = render(<DriverProfileScreen navigation={navigation} />);
    await findByText('Shuttle 1');
    expect(getByText('0766518388')).toBeTruthy();
  });

  it('prefers the server copy over the details stored at sign-in', async () => {
    // A manager changing the number is the whole reason the screen re-reads it.
    mockMeQuery.mockReturnValue({
      data: { user: { name: 'Nadia Perera', phoneNumber: '0771234567' } },
    });

    const { getByText, queryByText, findByText } = render(<DriverProfileScreen navigation={navigation} />);
    await findByText('Shuttle 1');
    expect(getByText('0771234567')).toBeTruthy();
    expect(queryByText('0766518388')).toBeNull();
  });

  it('shows an email the manager added after sign-in', async () => {
    mockMeQuery.mockReturnValue({
      data: { user: { name: 'Nadia Perera', email: 'nadia@ananda.lk' } },
    });

    const { getByText, queryByText, findByText } = render(<DriverProfileScreen navigation={navigation} />);
    await findByText('Shuttle 1');
    expect(getByText('nadia@ananda.lk')).toBeTruthy();
    expect(queryByText('nadia@test.com')).toBeNull();
  });

  it('drops an email the manager cleared, rather than keeping the stored one', async () => {
    // Removal is the case a merge gets wrong: the server sends an empty string
    // and the account stored at sign-in still holds the old address. Whichever
    // way round the merge goes decides whether a removed email lingers.
    mockMeQuery.mockReturnValue({
      // A phone is present so the only empty row is the email one.
      data: { user: { name: 'Nadia Perera', email: '', phoneNumber: '0766518388' } },
    });

    const { getAllByText, queryByText, findByText } = render(<DriverProfileScreen navigation={navigation} />);
    await findByText('Shuttle 1');
    expect(queryByText('nadia@test.com')).toBeNull();
    expect(getAllByText('-')).toHaveLength(1);
  });

  it('falls back to the stored account while the server read is in flight', async () => {
    const { getAllByText, findByText } = render(<DriverProfileScreen navigation={navigation} />);
    await findByText('Shuttle 1');
    // Still named, not blank, before /me resolves.
    expect(getAllByText('Nadia Perera').length).toBe(2);
  });

  it('no longer lists My routes', async () => {
    const { queryByText, findByText } = render(<DriverProfileScreen navigation={navigation} />);
    await findByText('Shuttle 1');
    expect(queryByText('My routes')).toBeNull();
  });

  it('navigates to Vehicle registration from the vehicle card CTA when there is no vehicle', async () => {
    api.getMyVehicle.mockRejectedValue(new Error('not found'));
    const { getByText, findByText } = render(<DriverProfileScreen navigation={navigation} />);
    fireEvent.press(await findByText('Add my vehicle'));
    expect(navigation.navigate).toHaveBeenCalledWith('VehicleRegistration');
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

  // The tutorial only ever reset the route-recording walkthrough, which is gone.
  it('no longer shows "Replay tutorial"', async () => {
    const { queryByText, findByText } = render(<DriverProfileScreen navigation={navigation} />);
    await findByText('Shuttle 1');
    expect(queryByText('Replay tutorial')).toBeNull();
  });
});
