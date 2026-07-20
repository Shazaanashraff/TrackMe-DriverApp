import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AppError } from '../../lib/errors';

jest.mock('../../hooks/auth', () => ({
  __esModule: true,
  useLogin: jest.fn(),
}));

type FormInputMockProps = {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  label?: string;
};

jest.mock('../../components/ui/FormInput', () => {
  const { TextInput } = require('react-native');
  return ({ value, onChangeText, placeholder, label }: FormInputMockProps) => (
    <TextInput
      testID={`input-${label}`}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
    />
  );
});

type PrimaryButtonMockProps = {
  title?: string;
  onPress?: () => void;
  loading?: boolean;
};

jest.mock('../../components/ui/PrimaryButton', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return ({ title, onPress, loading }: PrimaryButtonMockProps) => (
    <TouchableOpacity testID="primary-btn" onPress={onPress} disabled={loading}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
});

jest.mock('../../components/ShiftBusIcon', () => () => null);

import { useLogin } from '../../hooks/auth';
import LoginScreen from '../LoginScreen';

const mockUseLogin = useLogin as jest.Mock;
const mutate = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockUseLogin.mockReturnValue({ mutate, isPending: false, isError: false, error: undefined });
});

describe('LoginScreen', () => {
  it('renders the email and password inputs', () => {
    const { getByTestId } = render(<LoginScreen />);
    expect(getByTestId('input-Email')).toBeTruthy();
    expect(getByTestId('input-Password')).toBeTruthy();
  });

  it('blocks submit and shows inline errors when fields are empty', () => {
    const { getByText, getByTestId } = render(<LoginScreen />);
    fireEvent.press(getByTestId('primary-btn'));

    expect(mutate).not.toHaveBeenCalled();
    expect(getByText('Email is required')).toBeTruthy();
    expect(getByText('Password is required')).toBeTruthy();
  });

  it('blocks submit with an inline error when the password is too short', () => {
    const { getByTestId, getByText } = render(<LoginScreen />);
    fireEvent.changeText(getByTestId('input-Email'), 'a@b.com');
    fireEvent.changeText(getByTestId('input-Password'), '123');
    fireEvent.press(getByTestId('primary-btn'));

    expect(mutate).not.toHaveBeenCalled();
    expect(getByText('Password must be at least 6 characters')).toBeTruthy();
  });

  it('calls useLogin.mutate with valid credentials', () => {
    const { getByTestId } = render(<LoginScreen />);
    fireEvent.changeText(getByTestId('input-Email'), 'driver@test.com');
    fireEvent.changeText(getByTestId('input-Password'), 'password123');
    fireEvent.press(getByTestId('primary-btn'));

    expect(mutate).toHaveBeenCalledWith({ email: 'driver@test.com', password: 'password123' });
  });

  it('shows the role-gate error message when a non-driver account is rejected', () => {
    mockUseLogin.mockReturnValue({
      mutate,
      isPending: false,
      isError: true,
      error: new AppError('http', 'This app is for drivers only', {
        status: 403,
        code: 'NOT_A_DRIVER',
      }),
    });
    const { getByText } = render(<LoginScreen />);
    expect(getByText(/registered as a driver/i)).toBeTruthy();
  });

  it('shows the loading state on the submit button while pending', () => {
    mockUseLogin.mockReturnValue({ mutate, isPending: true, isError: false, error: undefined });
    const { getByTestId } = render(<LoginScreen />);
    expect(getByTestId('primary-btn').props.accessibilityState?.disabled).toBe(true);
  });
});
