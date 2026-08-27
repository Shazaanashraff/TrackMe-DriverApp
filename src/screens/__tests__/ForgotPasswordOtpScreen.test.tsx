import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AppError } from '../../lib/errors';

const verifyMutate = jest.fn();
const resendMutate = jest.fn();

jest.mock('../../hooks/auth', () => ({
  __esModule: true,
  useVerifyPasswordResetOtp: jest.fn(),
  useRequestPasswordResetOtp: jest.fn(),
}));

jest.mock('../../context/NetworkStatusContext', () => ({
  __esModule: true,
  useNetworkStatus: jest.fn(),
}));

import { useVerifyPasswordResetOtp, useRequestPasswordResetOtp } from '../../hooks/auth';
import { useNetworkStatus } from '../../context/NetworkStatusContext';
import ForgotPasswordOtpScreen from '../ForgotPasswordOtpScreen';

const mockUseVerify = useVerifyPasswordResetOtp as jest.Mock;
const mockUseResend = useRequestPasswordResetOtp as jest.Mock;
const mockUseNetworkStatus = useNetworkStatus as unknown as jest.Mock;

function renderScreen(navigation = { navigate: jest.fn(), goBack: jest.fn() }) {
  return render(
    <ForgotPasswordOtpScreen
      navigation={navigation}
      route={{ params: { email: 'driver@company.com' } }}
    />
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUseVerify.mockReturnValue({ mutate: verifyMutate, isPending: false });
  mockUseResend.mockReturnValue({ mutate: resendMutate, isPending: false });
  mockUseNetworkStatus.mockReturnValue({ isOnline: true, isOffline: false, isDegraded: false });
});

describe('ForgotPasswordOtpScreen', () => {
  it('blocks submit with an inline error when the code is empty', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Verify code'));

    expect(verifyMutate).not.toHaveBeenCalled();
    expect(getByText('Enter the 6-digit code')).toBeTruthy();
  });

  it('blocks submit with an inline error for a code that is not 6 digits', () => {
    const { getByPlaceholderText, getByText } = renderScreen();
    fireEvent.changeText(getByPlaceholderText('123456'), '123');
    fireEvent.press(getByText('Verify code'));

    expect(verifyMutate).not.toHaveBeenCalled();
    expect(getByText('Code must be exactly 6 digits')).toBeTruthy();
  });

  it('verifies the code and navigates to ResetPassword with the returned token', () => {
    const navigate = jest.fn();
    verifyMutate.mockImplementation((_vars, { onSuccess }) => onSuccess({ resetToken: 'reset-tok' }));
    const { getByPlaceholderText, getByText } = renderScreen({ navigate, goBack: jest.fn() });

    fireEvent.changeText(getByPlaceholderText('123456'), '654321');
    fireEvent.press(getByText('Verify code'));

    expect(verifyMutate).toHaveBeenCalledWith(
      { email: 'driver@company.com', otp: '654321' },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
    expect(navigate).toHaveBeenCalledWith('ResetPassword', {
      email: 'driver@company.com',
      resetToken: 'reset-tok',
    });
  });

  it('shows a form-level error when verification fails', async () => {
    verifyMutate.mockImplementation((_vars, { onError }) =>
      onError(new AppError('http', 'Invalid or expired code', { status: 400 }))
    );
    const { getByPlaceholderText, getByText } = renderScreen();
    fireEvent.changeText(getByPlaceholderText('123456'), '111111');
    fireEvent.press(getByText('Verify code'));

    await waitFor(() => expect(getByText('Invalid or expired code')).toBeTruthy());
  });

  it('resends the code on request', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Resend code'));
    expect(resendMutate).toHaveBeenCalledWith(
      { email: 'driver@company.com' },
      expect.objectContaining({ onError: expect.any(Function) })
    );
  });

  it('disables Verify code and Resend code, with an offline note, when offline', () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: false, isOffline: true, isDegraded: false });

    const { getByText } = renderScreen();

    expect(getByText('Verify code').parent?.parent?.props.accessibilityState?.disabled).toBe(true);
    expect(getByText('Resend code').parent?.parent?.props.accessibilityState?.disabled).toBe(true);
    expect(getByText('You need a connection to verify this code.')).toBeTruthy();

    fireEvent.press(getByText('Resend code'));
    expect(resendMutate).not.toHaveBeenCalled();
  });
});
