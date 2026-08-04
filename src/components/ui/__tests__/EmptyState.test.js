import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import EmptyState from '../EmptyState';

describe('EmptyState', () => {
  it('renders title and subtitle', () => {
    const { getByText } = render(
      <EmptyState title="No vehicle yet" subtitle="Add your vehicle so riders can find it" />
    );
    expect(getByText('No vehicle yet')).toBeTruthy();
    expect(getByText('Add your vehicle so riders can find it')).toBeTruthy();
  });

  it('renders an action button and fires onAction when pressed', () => {
    const onAction = jest.fn();
    const { getByText } = render(
      <EmptyState title="No vehicle yet" actionLabel="Add my vehicle" onAction={onAction} />
    );
    fireEvent.press(getByText('Add my vehicle'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('omits the action button when no actionLabel/onAction is given', () => {
    const { queryByText } = render(<EmptyState title="No trips yet" />);
    expect(queryByText('Add my vehicle')).toBeNull();
  });
});
