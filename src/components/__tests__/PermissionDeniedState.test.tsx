import React from 'react';
import { Linking } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import PermissionDeniedState from '../PermissionDeniedState';

describe('PermissionDeniedState', () => {
  it('explains why location is needed', () => {
    const { getByText } = render(<PermissionDeniedState />);
    expect(getByText(/location access needed/i)).toBeTruthy();
  });

  it('opens settings when the button is pressed', () => {
    const openSettingsSpy = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
    const { getByText } = render(<PermissionDeniedState />);
    fireEvent.press(getByText('Open Settings'));
    expect(openSettingsSpy).toHaveBeenCalledTimes(1);
  });
});
