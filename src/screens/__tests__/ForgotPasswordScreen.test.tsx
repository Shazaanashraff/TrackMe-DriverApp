import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AppError } from '../../lib/errors';

const mutate = jest.fn();

jest.mock('../../hooks/auth', () => ({
  __esModule: true,
  useRequestPasswordResetOtp: jest.fn(),
}));

import { useRequestPasswordResetOtp } from '../../hooks/auth';
import ForgotPasswordScreen from '../ForgotPasswordScreen';

const mockUseRequestPasswordResetOtp = useRequestPasswordResetOtp as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockUseRequestPasswordResetOtp.mockReturnValue({ mutate, isPending: false, isError: false, error: undefined });
});

describe('ForgotPasswordScreen', () => {
  it('blocks submit and shows an inline error when the email is empty', () => {
    const { getByText } = render(<ForgotPasswordScreen navigation={{ navigate: jest.fn(), goBack: jest.fn() }} />);
    fireEvent.press(getByText('Send code'));

    expect(mutate).not.toHaveBeenCalled();
    expect(getByText('Email is required')).toBeTruthy();
  });

  it('blocks submit with an inline error for a malformed email', () => {
    const { getByPlaceholderText, getByText } = render(
      <ForgotPasswordScreen navigation={{ navigate: jest.fn(), goBack: jest.fn() }} />
    );
    fireEvent.changeText(getByPlaceholderText('driver@company.com'), 'not-an-email');
    fireEvent.press(getByText('Send code'));

    expect(mutate).not.toHaveBeenCalled();
    expect(getByText('Enter a valid email address')).toBeTruthy();
  });

  it('requests an OTP and navigates to ForgotPasswordOtp on success', () => {
    const navigate = jest.fn();
    mutate.mockImplementation((_vars, { onSuccess }) => onSuccess());
    const { getByPlaceholderText, getByText } = render(
      <ForgotPasswordScreen navigation={{ navigate, goBack: jest.fn() }} />
    );
    fireEvent.changeText(getByPlaceholderText('driver@company.com'), 'Driver@Company.com');
    fireEvent.press(getByText('Send code'));

    expect(mutate).toHaveBeenCalledWith(
      { email: 'driver@company.com' },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
    expect(navigate).toHaveBeenCalledWith('ForgotPasswordOtp', { email: 'driver@company.com' });
  });

  it('shows a form-level error on failure', async () => {
    mutate.mockImplementation((_vars, { onError }) =>
      onError(new AppError('http', 'No account found with that email', { status: 404 }))
    );
    const { getByPlaceholderText, getByText } = render(
      <ForgotPasswordScreen navigation={{ navigate: jest.fn(), goBack: jest.fn() }} />
    );
    fireEvent.changeText(getByPlaceholderText('driver@company.com'), 'driver@company.com');
    fireEvent.press(getByText('Send code'));

    await waitFor(() => expect(getByText('No account found with that email')).toBeTruthy());
  });
});
