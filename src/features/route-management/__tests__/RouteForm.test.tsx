import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RouteForm from '../RouteForm';

const baseProps = {
  isSubmitting: false,
  error: null,
  onSubmit: jest.fn(),
};

function fillValidForm(getByPlaceholderText: ReturnType<typeof render>['getByPlaceholderText'], getAllByPlaceholderText: ReturnType<typeof render>['getAllByPlaceholderText']) {
  fireEvent.changeText(getByPlaceholderText('e.g. R101'), ' r101 ');
  fireEvent.changeText(getByPlaceholderText('Express Way'), ' Express Way ');
  fireEvent.changeText(getByPlaceholderText('Starting point'), ' Colombo ');
  fireEvent.changeText(getByPlaceholderText('Endpoint'), ' Galle ');

  const [distanceInput, timeInput, fareInput] = getAllByPlaceholderText('0');
  fireEvent.changeText(distanceInput, '10');
  fireEvent.changeText(timeInput, '30');
  fireEvent.changeText(fareInput, '150');
}

describe('RouteForm', () => {
  it('shows field errors and does not submit when required fields are blank', () => {
    const onSubmit = jest.fn();
    const { getByText } = render(<RouteForm {...baseProps} onSubmit={onSubmit} />);

    fireEvent.press(getByText('Register Route'));

    expect(getByText('Route ID is required')).toBeTruthy();
    expect(getByText('Route name is required')).toBeTruthy();
    expect(getByText('Source location is required')).toBeTruthy();
    expect(getByText('Destination is required')).toBeTruthy();
    expect(getByText('Distance must be greater than 0')).toBeTruthy();
    expect(getByText('Estimated time must be greater than 0')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a normalized payload when all fields are valid', () => {
    const onSubmit = jest.fn();
    const { getByPlaceholderText, getAllByPlaceholderText, getByText } = render(
      <RouteForm {...baseProps} onSubmit={onSubmit} />
    );

    fillValidForm(getByPlaceholderText, getAllByPlaceholderText);
    fireEvent.press(getByText('Register Route'));

    expect(onSubmit).toHaveBeenCalledWith({
      routeId: 'R101',
      routeName: 'Express Way',
      source: 'Colombo',
      destination: 'Galle',
      distance: 10,
      estimatedTime: 30,
      fare: 150,
      stopsCount: 0,
      stops: [],
    });
  });

  it('clears the form after a successful submit', () => {
    const onSubmit = jest.fn();
    const { getByPlaceholderText, getAllByPlaceholderText, getByText } = render(
      <RouteForm {...baseProps} onSubmit={onSubmit} />
    );

    fillValidForm(getByPlaceholderText, getAllByPlaceholderText);
    fireEvent.press(getByText('Register Route'));

    expect(getByPlaceholderText('e.g. R101').props.value).toBe('');
  });

  it('shows a mutation error message when provided', () => {
    const { AppError } = jest.requireActual('../../../lib/errors');
    const { getByText } = render(<RouteForm {...baseProps} error={new AppError('http', 'Route already exists')} />);
    expect(getByText('Something went wrong. Please try again.')).toBeTruthy();
  });
});
