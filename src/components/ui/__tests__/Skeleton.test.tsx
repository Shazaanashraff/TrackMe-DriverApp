import React from 'react';
import { render } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import Skeleton from '../Skeleton';

describe('Skeleton', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<Skeleton testID="sk" />);
    expect(toJSON()).toBeTruthy();
  });

  it('applies the requested width, height, and radius', () => {
    const { getByTestId } = render(<Skeleton testID="sk" width={120} height={24} radius={8} />);
    const flat = Object.assign({}, ...[getByTestId('sk').props.style].flat());
    expect(flat.width).toBe(120);
    expect(flat.height).toBe(24);
    expect(flat.borderRadius).toBe(8);
  });

  it('does not start the pulse loop when reduce-motion is enabled', async () => {
    const spy = jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockResolvedValue(true);
    render(<Skeleton testID="sk" />);
    await Promise.resolve();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
