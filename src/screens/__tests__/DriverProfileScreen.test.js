import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import DriverProfileScreen from '../DriverProfileScreen';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const mockLogoutMutate = jest.fn();
// The screen re-reads the account from the server; by default that read has not
// resolved, so these tests exercise the stored-account fallback.
const mockMeQuery = jest.fn(() => ({ data: undefined }));
const mockKeyQuery = jest.fn(() => ({
  data: { data: { enrollmentKey: 'TMD-QMCZ-9NL2-TJNQ', isPrivate: false } },
  isPending: false,
  isError: false,
  refetch: jest.fn(),
}));
// Same cached, persisted query the Dashboard uses (audit fix — this used to be
// a one-off uncached fetch that read "No vehicle yet" on any failure, offline
// included).
const mockVehicleQuery = jest.fn(() => ({
  data: { vehicleName: 'Shuttle 1', registrationNumber: 'ABC-123', seatCapacity: 20 },
  isLoading: false,
  isError: false,
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Nadia Perera', email: 'nadia@test.com' },
  }),
}));

jest.mock('../../hooks/auth', () => ({
  useLogout: () => ({ mutate: mockLogoutMutate, isPending: false }),
  useMeQuery: () => mockMeQuery(),
  useMyEnrollmentKeyQuery: () => mockKeyQuery(),
}));

jest.mock('../../hooks/vehicle', () => ({
  useMyVehicleQuery: () => mockVehicleQuery(),
}));

const navigation = { navigate: jest.fn(), reset: jest.fn() };

beforeEach(() => {
  jest.clearAllMocks();
  mockMeQuery.mockReturnValue({ data: undefined });
  mockKeyQuery.mockReturnValue({
    data: { data: { enrollmentKey: 'TMD-QMCZ-9NL2-TJNQ', isPrivate: false } },
    isPending: false,
    isError: false,
    refetch: jest.fn(),
  });
  mockVehicleQuery.mockReturnValue({
    data: { vehicleName: 'Shuttle 1', registrationNumber: 'ABC-123', seatCapacity: 20 },
    isLoading: false,
    isError: false,
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
    mockVehicleQuery.mockReturnValue({ data: null, isLoading: false, isError: false });
    const { findByText } = render(<DriverProfileScreen navigation={navigation} />);
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

  describe('offline / cached-data-beats-error (audit fixes)', () => {
    it('keeps the enrollment key readable when a background refetch fails but the key is cached', async () => {
      mockKeyQuery.mockReturnValue({
        data: { data: { enrollmentKey: 'TMD-QMCZ-9NL2-TJNQ', isPrivate: false } },
        isPending: false,
        isError: true, // e.g. a failed background refetch while offline
        refetch: jest.fn(),
      });

      const { getByTestId, queryByText, findByText } = render(<DriverProfileScreen navigation={navigation} />);
      await findByText('Shuttle 1');

      expect(getByTestId('toggle-enrollment-key')).toBeTruthy();
      expect(queryByText('Could not load your key.')).toBeNull();
    });

    it('shows the real error state only when there truly is no cached key', async () => {
      mockKeyQuery.mockReturnValue({
        data: undefined,
        isPending: false,
        isError: true,
        refetch: jest.fn(),
      });

      const { getByText, findByText } = render(<DriverProfileScreen navigation={navigation} />);
      await findByText('Shuttle 1');
      expect(getByText('Could not load your key.')).toBeTruthy();
    });

    it('keeps showing the cached vehicle when a background refetch fails', async () => {
      mockVehicleQuery.mockReturnValue({
        data: { vehicleName: 'Shuttle 1', registrationNumber: 'ABC-123', seatCapacity: 20 },
        isLoading: false,
        isError: true, // e.g. offline
      });

      const { getByText, queryByText } = render(<DriverProfileScreen navigation={navigation} />);
      expect(getByText('Shuttle 1')).toBeTruthy();
      expect(queryByText('Add my vehicle')).toBeNull();
    });
  });
});
