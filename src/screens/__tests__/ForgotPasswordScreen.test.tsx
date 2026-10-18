import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ForgotPasswordScreen from '../ForgotPasswordScreen';

// Drivers sign in with a manager-issued Driver ID and mostly have no email, so the
// screen sends them to their manager rather than to an emailed code.
describe('ForgotPasswordScreen', () => {
  it('tells the driver their transport manager resets the password', () => {
    const { getByText } = render(<ForgotPasswordScreen navigation={{ goBack: jest.fn() }} />);
    expect(getByText('Forgot your password?')).toBeTruthy();
    expect(getByText('Your transport manager can reset it for you. Contact them for a new password.')).toBeTruthy();
  });

  it('asks for no email and sends no code', () => {
    const { queryByText, queryByPlaceholderText } = render(
      <ForgotPasswordScreen navigation={{ goBack: jest.fn() }} />
    );
    expect(queryByPlaceholderText('driver@company.com')).toBeNull();
    expect(queryByText('Send code')).toBeNull();
  });

  it('goes back to sign in', () => {
    const goBack = jest.fn();
    const { getByText } = render(<ForgotPasswordScreen navigation={{ goBack }} />);
    fireEvent.press(getByText('Back to sign in'));
    expect(goBack).toHaveBeenCalledTimes(1);
  });
});
