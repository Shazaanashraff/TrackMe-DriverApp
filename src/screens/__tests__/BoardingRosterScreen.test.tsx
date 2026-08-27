import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import BoardingRosterScreen from '../BoardingRosterScreen';
import { useBoardingRosterQuery } from '../../hooks/boarding';

const mockUseMyVehicleQuery = jest.fn<{ data: { data: { vehicleId: string } } | undefined; isLoading: boolean }, []>(
  () => ({ data: { data: { vehicleId: 'VEH-1' } }, isLoading: false })
);
jest.mock('../../hooks/vehicle', () => ({
  __esModule: true,
  useMyVehicleQuery: () => mockUseMyVehicleQuery(),
}));

jest.mock('../../hooks/boarding', () => ({
  __esModule: true,
  useBoardingRosterQuery: jest.fn(),
}));

const mockUseNetworkStatus = jest.fn(() => ({ isOnline: true, isOffline: false, isDegraded: false }));
jest.mock('../../context/NetworkStatusContext', () => ({
  __esModule: true,
  useNetworkStatus: () => mockUseNetworkStatus(),
}));

const mockUse = useBoardingRosterQuery as jest.Mock;

const nav = { goBack: jest.fn() };
const routeParams = { params: { vehicleId: 'VEH-1' } };

function fullRoster() {
  return {
    vehicleId: 'VEH-1', routeId: 'RT-1', tripId: 'VEH-1#2026-07-22',
    enrolledCount: 3, onBoardCount: 1,
    roster: [
      { studentId: 's1', studentName: 'Anna', status: 'ON', lastEventAt: '2026-07-22T08:00:00Z' },
      { studentId: 's2', studentName: 'Cara', status: 'NOT_BOARDED', lastEventAt: null },
      { studentId: 's3', studentName: 'Ben', status: 'OFF', lastEventAt: '2026-07-22T08:10:00Z' },
    ],
    guests: [{ studentId: 'g1', studentName: 'Zed', lastEventAt: '2026-07-22T08:05:00Z' }],
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUseMyVehicleQuery.mockReturnValue({ data: { data: { vehicleId: 'VEH-1' } }, isLoading: false });
  mockUseNetworkStatus.mockReturnValue({ isOnline: true, isOffline: false, isDegraded: false });
});

describe('BoardingRosterScreen', () => {
  it('renders the count summary, every rider with a status, and the guests section', () => {
    mockUse.mockReturnValue({ data: fullRoster(), isLoading: false, isError: false, refetch: jest.fn(), isRefetching: false });

    const { getByText, getByTestId } = render(
      <BoardingRosterScreen navigation={nav} route={routeParams} />
    );

    expect(getByText('1 / 3')).toBeTruthy();
    expect(getByText('Anna')).toBeTruthy();
    expect(getByTestId('roster-status-s1').props.children).toBeTruthy();
    expect(getByText('Cara')).toBeTruthy();
    expect(getByText('Ben')).toBeTruthy();
    // guest surfaced separately
    expect(getByText('Zed')).toBeTruthy();
    expect(getByTestId('roster-guest-g1')).toBeTruthy();
  });

  it('shows the empty state when there are no enrolled riders', () => {
    mockUse.mockReturnValue({
      data: { ...fullRoster(), enrolledCount: 0, onBoardCount: 0, roster: [], guests: [] },
      isLoading: false, isError: false, refetch: jest.fn(), isRefetching: false,
    });

    const { getByText } = render(<BoardingRosterScreen navigation={nav} route={routeParams} />);
    expect(getByText('No enrolled riders')).toBeTruthy();
  });

  it('shows an error empty state when the query fails', () => {
    mockUse.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch: jest.fn(), isRefetching: false });
    const { getByText } = render(<BoardingRosterScreen navigation={nav} route={routeParams} />);
    expect(getByText("Couldn't load the roster")).toBeTruthy();
  });

  it('calls goBack from the header', () => {
    mockUse.mockReturnValue({ data: fullRoster(), isLoading: false, isError: false, refetch: jest.fn(), isRefetching: false });
    const { getByLabelText } = render(<BoardingRosterScreen navigation={nav} route={routeParams} />);
    fireEvent.press(getByLabelText('Go back'));
    expect(nav.goBack).toHaveBeenCalledTimes(1);
  });

  // The roster query is `enabled: !!vehicleId` — offline, before the vehicle
  // has ever been cached, it never runs at all, so isLoading/isError both stay
  // false and the screen used to render a confident "0 / 0 enrolled riders."
  it("shows a can't-check-offline state instead of a false '0 / 0' when the vehicle was never cached offline", () => {
    mockUseMyVehicleQuery.mockReturnValue({ data: undefined, isLoading: false });
    mockUseNetworkStatus.mockReturnValue({ isOnline: false, isOffline: true, isDegraded: false });
    mockUse.mockReturnValue({ data: undefined, isLoading: false, isError: false, refetch: jest.fn(), isRefetching: false });

    const { getByText, queryByText } = render(
      <BoardingRosterScreen navigation={nav} route={{ params: {} }} />
    );

    expect(getByText("Can't check your roster offline")).toBeTruthy();
    expect(queryByText('0 / 0')).toBeNull();
    expect(queryByText('No enrolled riders')).toBeNull();
  });

  it('does not show the offline-vehicle state while the vehicle query is still loading', () => {
    mockUseMyVehicleQuery.mockReturnValue({ data: undefined, isLoading: true });
    mockUseNetworkStatus.mockReturnValue({ isOnline: false, isOffline: true, isDegraded: false });
    mockUse.mockReturnValue({ data: undefined, isLoading: true, isError: false, refetch: jest.fn(), isRefetching: false });

    const { queryByText } = render(<BoardingRosterScreen navigation={nav} route={{ params: {} }} />);

    expect(queryByText("Can't check your roster offline")).toBeNull();
  });
});
