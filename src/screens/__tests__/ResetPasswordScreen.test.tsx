import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AppError } from '../../lib/errors';

const mutate = jest.fn();

jest.mock('../../hooks/auth', () => ({
  __esModule: true,
  useResetPassword: jest.fn(),
}));

import { useResetPassword } from '../../hooks/auth';
import ResetPasswordScreen from '../ResetPasswordScreen';

const mockUseResetPassword = useResetPassword as jest.Mock;

const VALID_ROUTE = { params: { email: 'driver@company.com', resetToken: 'reset-tok' } };

beforeEach(() => {
  jest.clearAllMocks();
  mockUseResetPassword.mockReturnValue({ mutate, isPending: false });
});

describe('ResetPasswordScreen', () => {
  it('shows an invalid-link state when email or resetToken is missing', () => {
    const { getByText } = render(
      <ResetPasswordScreen navigation={{ navigate: jest.fn(), goBack: jest.fn() }} route={{ params: {} }} />
    );
    expect(getByText('Invalid reset link')).toBeTruthy();
  });

  it('navigates back to ForgotPassword from the invalid-link state', () => {
    const navigate = jest.fn();
    const { getByText } = render(
      <ResetPasswordScreen navigation={{ navigate, goBack: jest.fn() }} route={{ params: {} }} />
    );
    fireEvent.press(getByText('Request a new code'));
    expect(navigate).toHaveBeenCalledWith('ForgotPassword');
  });

  it('renders masked password fields with a show/hide toggle', () => {
    const { getAllByLabelText } = render(
      <ResetPasswordScreen navigation={{ navigate: jest.fn(), goBack: jest.fn() }} route={VALID_ROUTE} />
    );
    expect(getAllByLabelText('Show password').length).toBe(2);
  });

  it('blocks submit with an inline error when the password is too short', () => {
    const { getAllByPlaceholderText, getByText } = render(
      <ResetPasswordScreen navigation={{ navigate: jest.fn(), goBack: jest.fn() }} route={VALID_ROUTE} />
    );
    const [password] = getAllByPlaceholderText('••••••••');
    fireEvent.changeText(password, '123');
    fireEvent.press(getByText('Update password'));

    expect(mutate).not.toHaveBeenCalled();
    expect(getByText('Password must be at least 6 characters')).toBeTruthy();
  });

  it('blocks submit with an inline error when the passwords do not match', () => {
    const { getAllByPlaceholderText, getByText } = render(
      <ResetPasswordScreen navigation={{ navigate: jest.fn(), goBack: jest.fn() }} route={VALID_ROUTE} />
    );
    const [password, confirm] = getAllByPlaceholderText('••••••••');
    fireEvent.changeText(password, 'newpass1');
    fireEvent.changeText(confirm, 'newpass2');
    fireEvent.press(getByText('Update password'));

    expect(mutate).not.toHaveBeenCalled();
    expect(getByText('Passwords do not match')).toBeTruthy();
  });

  it('resets the password and navigates to Login on success', () => {
    const navigate = jest.fn();
    mutate.mockImplementation((_vars, { onSuccess }) => onSuccess());
    const { getAllByPlaceholderText, getByText } = render(
      <ResetPasswordScreen navigation={{ navigate, goBack: jest.fn() }} route={VALID_ROUTE} />
    );
    const [password, confirm] = getAllByPlaceholderText('••••••••');
    fireEvent.changeText(password, 'newpass1');
    fireEvent.changeText(confirm, 'newpass1');
    fireEvent.press(getByText('Update password'));

    expect(mutate).toHaveBeenCalledWith(
      { email: 'driver@company.com', resetToken: 'reset-tok', password: 'newpass1' },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
    expect(navigate).toHaveBeenCalledWith('Login', { email: 'driver@company.com' });
  });

  it('shows a form-level error on failure', async () => {
    mutate.mockImplementation((_vars, { onError }) =>
      onError(new AppError('http', 'Reset link expired', { status: 400 }))
    );
    const { getAllByPlaceholderText, getByText } = render(
      <ResetPasswordScreen navigation={{ navigate: jest.fn(), goBack: jest.fn() }} route={VALID_ROUTE} />
    );
    const [password, confirm] = getAllByPlaceholderText('••••••••');
    fireEvent.changeText(password, 'newpass1');
    fireEvent.changeText(confirm, 'newpass1');
    fireEvent.press(getByText('Update password'));

    await waitFor(() => expect(getByText('Reset link expired')).toBeTruthy());
  });
});
