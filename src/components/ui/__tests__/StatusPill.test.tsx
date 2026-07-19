import React from 'react';
import { render } from '@testing-library/react-native';
import StatusPill from '../StatusPill';
import { theme } from '../../../theme';

describe('StatusPill', () => {
  it('renders the label', () => {
    const { getByText } = render(<StatusPill label="Paid" variant="live" />);
    expect(getByText('Paid')).toBeTruthy();
  });

  it.each([
    ['neutral', theme.color.surface.field, theme.color.text.secondary],
    ['live', theme.color.success.bg, theme.color.success.text],
    ['warn', theme.color.warning.bg, theme.color.warning.text],
    ['danger', theme.color.danger.bg, theme.color.danger.text],
  ] as const)('applies %s variant colors', (variant, bg, text) => {
    const { getByTestId, getByText } = render(
      <StatusPill label="Status" variant={variant} testID="pill" />
    );
    const flatContainer = Object.assign({}, ...[getByTestId('pill').props.style].flat());
    const flatText = Object.assign({}, ...[getByText('Status').props.style].flat());
    expect(flatContainer.backgroundColor).toBe(bg);
    expect(flatText.color).toBe(text);
  });

  it('defaults to the neutral variant', () => {
    const { getByTestId } = render(<StatusPill label="Idle" testID="pill" />);
    const flat = Object.assign({}, ...[getByTestId('pill').props.style].flat());
    expect(flat.backgroundColor).toBe(theme.color.surface.field);
  });
});
