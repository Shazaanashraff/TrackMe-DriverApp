import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import OnBoardCard from '../OnBoardCard';
import { useBoardingRosterQuery } from '../../../hooks/boarding';

jest.mock('../../../hooks/boarding', () => ({
  __esModule: true,
  useBoardingRosterQuery: jest.fn(),
}));

const mockUse = useBoardingRosterQuery as jest.Mock;

function roster(over: Partial<Record<string, unknown>> = {}) {
  return {
    busId: 'BUS-1', routeId: 'RT-1', tripId: 'BUS-1#2026-07-22',
    enrolledCount: 20, onBoardCount: 17, roster: [], guests: [], ...over,
  };
}

beforeEach(() => jest.clearAllMocks());

describe('OnBoardCard', () => {
  it('renders the X / Y count and navigates on press when there are enrolled riders', () => {
    mockUse.mockReturnValue({ data: roster(), isLoading: false, isError: false });
    const onPress = jest.fn();

    const { getByText, getByTestId } = render(<OnBoardCard busId="BUS-1" onPress={onPress} />);

    expect(getByText('17 / 20')).toBeTruthy();
    fireEvent.press(getByTestId('on-board-card-pressable'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows a non-pressable empty state when no riders are enrolled', () => {
    mockUse.mockReturnValue({ data: roster({ enrolledCount: 0, onBoardCount: 0 }), isLoading: false, isError: false });
    const onPress = jest.fn();

    const { getByText, queryByTestId } = render(<OnBoardCard busId="BUS-1" onPress={onPress} />);

    expect(getByText('No enrolled riders yet')).toBeTruthy();
    expect(queryByTestId('on-board-card-pressable')).toBeNull();
  });

  it('renders a skeleton while loading', () => {
    mockUse.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    const { getByTestId } = render(<OnBoardCard busId="BUS-1" onPress={jest.fn()} />);
    expect(getByTestId('on-board-skeleton')).toBeTruthy();
  });

  it('renders nothing when the roster query errors (route not QR-enabled)', () => {
    mockUse.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    const { queryByTestId } = render(<OnBoardCard busId="BUS-1" onPress={jest.fn()} />);
    expect(queryByTestId('on-board-card')).toBeNull();
  });
});
