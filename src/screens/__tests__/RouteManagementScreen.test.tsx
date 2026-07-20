import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RouteManagementScreen from '../RouteManagementScreen';

const mockRefetch = jest.fn().mockResolvedValue(undefined);
const mockMutate = jest.fn();

jest.mock('../../hooks/routes', () => ({
  useRoutesManagementQuery: () => ({
    data: [
      { routeId: 'R1', routeName: 'Campus Loop', source: 'A', destination: 'B', distance: 5, estimatedTime: 20, fare: 50, isActive: true },
    ],
    isLoading: false,
    isError: false,
    error: null,
    refetch: mockRefetch,
  }),
  useCreateRoute: () => ({
    mutate: mockMutate,
    isPending: false,
    isError: false,
    error: null,
  }),
}));

const goBack = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

describe('RouteManagementScreen', () => {
  it('shows the "My routes" header', () => {
    const { getByText } = render(<RouteManagementScreen navigation={{ goBack }} />);
    expect(getByText('My routes')).toBeTruthy();
  });

  it('renders the existing routes list', () => {
    const { getByText } = render(<RouteManagementScreen navigation={{ goBack }} />);
    expect(getByText('Campus Loop')).toBeTruthy();
  });

  it('shows a "{name} added." banner after a successful create', async () => {
    mockMutate.mockImplementation((payload, { onSuccess }) => onSuccess());
    const { getByPlaceholderText, getAllByPlaceholderText, getByText } = render(
      <RouteManagementScreen navigation={{ goBack }} />
    );

    fireEvent.changeText(getByPlaceholderText('e.g. R101'), 'R2');
    fireEvent.changeText(getByPlaceholderText('Express Way'), 'Night Loop');
    fireEvent.changeText(getByPlaceholderText('Starting point'), 'A');
    fireEvent.changeText(getByPlaceholderText('Endpoint'), 'B');
    const [distanceInput, timeInput, fareInput] = getAllByPlaceholderText('0');
    fireEvent.changeText(distanceInput, '10');
    fireEvent.changeText(timeInput, '30');
    fireEvent.changeText(fareInput, '150');
    fireEvent.press(getByText('Add route'));

    await waitFor(() => expect(getByText('Night Loop added.')).toBeTruthy());
  });
});
