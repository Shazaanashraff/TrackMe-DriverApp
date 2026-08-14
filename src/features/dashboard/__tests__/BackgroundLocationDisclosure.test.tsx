import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import BackgroundLocationDisclosure from '../BackgroundLocationDisclosure';

const setup = (props = {}) =>
  render(
    <BackgroundLocationDisclosure
      visible
      onAllow={jest.fn()}
      onDismiss={jest.fn()}
      {...props}
    />
  );

describe('BackgroundLocationDisclosure', () => {
  // Google Play requires the disclosure to name the background collection and
  // its purpose before the system prompt appears.
  it('states that location is collected while the app is not in use', () => {
    const { getByText } = setup();

    expect(
      getByText(/including while the app is closed or\s+not in use/)
    ).toBeTruthy();
  });

  it('states when collection stops', () => {
    const { getByText } = setup();

    expect(getByText(/only collected while you are on duty/)).toBeTruthy();
  });

  it('calls onAllow when the driver continues to the system prompt', () => {
    const onAllow = jest.fn();
    const { getByTestId } = setup({ onAllow });

    fireEvent.press(getByTestId('background-disclosure-allow'));

    expect(onAllow).toHaveBeenCalled();
  });

  it('calls onDismiss when the driver declines', () => {
    const onDismiss = jest.fn();
    const { getByTestId } = setup({ onDismiss });

    fireEvent.press(getByTestId('background-disclosure-dismiss'));

    expect(onDismiss).toHaveBeenCalled();
  });

  it('renders nothing when not visible', () => {
    const { queryByTestId } = setup({ visible: false });

    expect(queryByTestId('background-disclosure-allow')).toBeNull();
  });
});
