import React from 'react';
import { render } from '@testing-library/react-native';
import StatChip from '../StatChip';

describe('StatChip', () => {
  it('renders the value and label', () => {
    const { getByText } = render(<StatChip value="12:34" label="time online" />);
    expect(getByText('12:34')).toBeTruthy();
    expect(getByText('time online')).toBeTruthy();
  });

  it('renders a GPS quality value', () => {
    const { getByText } = render(<StatChip value="Good" label="GPS" />);
    expect(getByText('Good')).toBeTruthy();
  });
});
