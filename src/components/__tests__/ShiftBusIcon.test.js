import React from 'react';
import { render } from '@testing-library/react-native';
import ShiftBusIcon from '../ShiftBusIcon';
import { theme } from '../../theme';

describe('ShiftBusIcon', () => {
  it('renders without crashing at the given size', () => {
    const { toJSON } = render(<ShiftBusIcon size={56} />);
    const tree = toJSON();
    expect(tree).toBeTruthy();
    expect(tree.props.width).toBe(56);
    expect(tree.props.height).toBe(56);
  });

  it('defaults to signal blue body / white detail colors', () => {
    const { toJSON } = render(<ShiftBusIcon />);
    const xml = toJSON().props.xml;
    expect(xml).toContain(theme.color.primary[500]);
    expect(xml).toContain(theme.color.white);
  });

  it('accepts custom body/detail colors', () => {
    const { toJSON } = render(<ShiftBusIcon bodyColor="#123456" detailColor="#abcdef" />);
    const xml = toJSON().props.xml;
    expect(xml).toContain('#123456');
    expect(xml).toContain('#abcdef');
  });
});
