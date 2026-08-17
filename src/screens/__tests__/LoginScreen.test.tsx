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

jest.mock('../../components/ShiftVehicleIcon', () => () => null);

import { useLogin } from '../../hooks/auth';
import LoginScreen from '../LoginScreen';

const mockUseLogin = useLogin as jest.Mock;
const mutate = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockUseLogin.mockReturnValue({ mutate, isPending: false, isError: false, error: undefined });
});

const ID_INPUT = 'input-Driver ID or email';

describe('LoginScreen', () => {
  it('renders the identifier and password inputs', () => {
    const { getByTestId } = render(<LoginScreen />);
    expect(getByTestId(ID_INPUT)).toBeTruthy();
    expect(getByTestId('input-Password')).toBeTruthy();
  });

  it('blocks submit and shows inline errors when fields are empty', () => {
    const { getByText, getByTestId } = render(<LoginScreen />);
    fireEvent.press(getByTestId('primary-btn'));

    expect(mutate).not.toHaveBeenCalled();
    expect(getByText('Driver ID or email is required')).toBeTruthy();
    expect(getByText('Password is required')).toBeTruthy();
  });

  it('blocks submit with an inline error when the password is too short', () => {
    const { getByTestId, getByText } = render(<LoginScreen />);
    fireEvent.changeText(getByTestId(ID_INPUT), 'a@b.com');
    fireEvent.changeText(getByTestId('input-Password'), '123');
    fireEvent.press(getByTestId('primary-btn'));

    expect(mutate).not.toHaveBeenCalled();
    expect(getByText('Password must be at least 6 characters')).toBeTruthy();
  });

  it('signs in with an email', () => {
    const { getByTestId } = render(<LoginScreen />);
    fireEvent.changeText(getByTestId(ID_INPUT), 'driver@test.com');
    fireEvent.changeText(getByTestId('input-Password'), 'password123');
    fireEvent.press(getByTestId('primary-btn'));

    expect(mutate).toHaveBeenCalledWith({
      identifier: 'driver@test.com',
      password: 'password123',
    });
  });

  it('signs in with a driver ID', () => {
    const { getByTestId } = render(<LoginScreen />);
    fireEvent.changeText(getByTestId(ID_INPUT), 'DRV-4K7P-9XQ2');
    fireEvent.changeText(getByTestId('input-Password'), 'password123');
    fireEvent.press(getByTestId('primary-btn'));

    expect(mutate).toHaveBeenCalledWith({
      identifier: 'DRV-4K7P-9XQ2',
      password: 'password123',
    });
  });

  it('trims stray whitespace off the identifier', () => {
    const { getByTestId } = render(<LoginScreen />);
    fireEvent.changeText(getByTestId(ID_INPUT), '  DRV-4K7P-9XQ2  ');
    fireEvent.changeText(getByTestId('input-Password'), 'password123');
    fireEvent.press(getByTestId('primary-btn'));

    expect(mutate).toHaveBeenCalledWith({
      identifier: 'DRV-4K7P-9XQ2',
      password: 'password123',
    });
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

  it('navigates to ForgotPassword when the forgot-password link is pressed', () => {
    const navigate = jest.fn();
    const { getByText } = render(<LoginScreen navigation={{ navigate }} />);
    fireEvent.press(getByText('Forgot password?'));
    expect(navigate).toHaveBeenCalledWith('ForgotPassword');
  });
});
