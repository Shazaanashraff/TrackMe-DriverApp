import React from 'react';
import { render } from '@testing-library/react-native';
import AppText from '../AppText';
import { theme } from '../../../theme';

describe('AppText', () => {
  it('renders children', () => {
    const { getByText } = render(<AppText>Hello</AppText>);
    expect(getByText('Hello')).toBeTruthy();
  });

  it('defaults to text.primary color', () => {
    const { getByText } = render(<AppText>Hello</AppText>);
    const flat = Array.isArray(getByText('Hello').props.style)
      ? Object.assign({}, ...getByText('Hello').props.style)
      : getByText('Hello').props.style;
    expect(flat.color).toBe(theme.color.text.primary);
  });

  it('renders white when onInk is set', () => {
    const { getByText } = render(<AppText onInk>Hi</AppText>);
    const flat = Object.assign({}, ...getByText('Hi').props.style);
    expect(flat.color).toBe(theme.color.white);
  });

  it('lets an explicit color prop override onInk', () => {
    const { getByText } = render(<AppText onInk color={theme.color.primary[300]}>Hi</AppText>);
    const flat = Object.assign({}, ...getByText('Hi').props.style);
    expect(flat.color).toBe(theme.color.primary[300]);
  });

  it('uppercases and letter-spaces the overline variant', () => {
    const { getByText } = render(<AppText variant="overline">kicker</AppText>);
    const flat = Object.assign({}, ...getByText('kicker').props.style);
    expect(flat.textTransform).toBe('uppercase');
    expect(flat.letterSpacing).toBe(1.5);
  });

  it('lets a weight prop override the variant default', () => {
    const { getByText } = render(<AppText variant="body" weight="medium">Save bus</AppText>);
    const flat = Object.assign({}, ...getByText('Save bus').props.style);
    expect(flat.fontFamily).toBe('Inter_500Medium');
  });

  it('sizes the display variant per the type scale', () => {
    const { getByText } = render(<AppText variant="display">34</AppText>);
    const flat = Object.assign({}, ...getByText('34').props.style);
    expect(flat.fontSize).toBe(34);
  });
});
