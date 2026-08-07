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

  // `fill` is what stops an empty list stranding its message at the top of a blank
  // screen; without flex:1 the container only ever wraps its own content.
  it('claims the remaining space only when fill is set', () => {
    const flatten = (s) =>
      Array.isArray(s) ? Object.assign({}, ...s.flat(Infinity).filter(Boolean)) : s || {};

    const plain = render(<EmptyState testID="es" title="No trips yet" />);
    expect(flatten(plain.getByTestId('es').props.style).flex).toBeUndefined();

    const filled = render(<EmptyState testID="es" fill title="No trips yet" />);
    expect(flatten(filled.getByTestId('es').props.style).flex).toBe(1);
  });
});
