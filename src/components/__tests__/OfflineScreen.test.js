import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import OfflineScreen from '../OfflineScreen';
import { recheckBackendHealth } from '../../services/backendStatus';

jest.mock('../../services/backendStatus', () => ({
  recheckBackendHealth: jest.fn(),
}));

describe('OfflineScreen', () => {
  it('shows the STYLEGUIDE §5 offline copy', () => {
    const { getByText } = render(<OfflineScreen />);
    expect(getByText('No connection')).toBeTruthy();
    expect(getByText("We'll reconnect automatically")).toBeTruthy();
  });

  it('triggers a manual health re-check when Try again is pressed', () => {
    const { getByText } = render(<OfflineScreen />);
    fireEvent.press(getByText('Try again'));
    expect(recheckBackendHealth).toHaveBeenCalledTimes(1);
  });
});
