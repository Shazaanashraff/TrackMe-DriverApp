import React from 'react';
import { Linking } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import PermissionDeniedState from '../PermissionDeniedState';

describe('PermissionDeniedState', () => {
  it('shows the STYLEGUIDE §8 copy', () => {
    const { getByText } = render(<PermissionDeniedState />);
    expect(getByText('Allow location so riders can see your bus')).toBeTruthy();
    expect(getByText('Allow location')).toBeTruthy();
  });

  it('opens settings when the button is pressed', () => {
    const openSettingsSpy = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
    const { getByText } = render(<PermissionDeniedState />);
    fireEvent.press(getByText('Allow location'));
    expect(openSettingsSpy).toHaveBeenCalledTimes(1);
  });
});
