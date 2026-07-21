import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import BoardingRosterScreen from '../BoardingRosterScreen';
import { useBoardingRosterQuery } from '../../hooks/boarding';

jest.mock('../../hooks/bus', () => ({
  __esModule: true,
  useMyBusQuery: () => ({ data: { data: { busId: 'BUS-1' } } }),
}));

jest.mock('../../hooks/boarding', () => ({
  __esModule: true,
  useBoardingRosterQuery: jest.fn(),
}));

const mockUse = useBoardingRosterQuery as jest.Mock;

const nav = { goBack: jest.fn() };
const routeParams = { params: { busId: 'BUS-1' } };

function fullRoster() {
  return {
    busId: 'BUS-1', routeId: 'RT-1', tripId: 'BUS-1#2026-07-22',
    enrolledCount: 3, onBoardCount: 1,
    roster: [
      { studentId: 's1', studentName: 'Anna', status: 'ON', lastEventAt: '2026-07-22T08:00:00Z' },
      { studentId: 's2', studentName: 'Cara', status: 'NOT_BOARDED', lastEventAt: null },
      { studentId: 's3', studentName: 'Ben', status: 'OFF', lastEventAt: '2026-07-22T08:10:00Z' },
    ],
    guests: [{ studentId: 'g1', studentName: 'Zed', lastEventAt: '2026-07-22T08:05:00Z' }],
  };
}

beforeEach(() => jest.clearAllMocks());

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
});
