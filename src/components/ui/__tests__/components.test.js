import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { theme } from '../../../theme';
import FormInput from '../FormInput';
import PrimaryButton from '../PrimaryButton';
import InfoRow from '../InfoRow';
import LoadingScreen from '../LoadingScreen';
import ScreenHeader from '../ScreenHeader';

describe('FormInput', () => {
  it('renders label and placeholder', () => {
    const { getByText, getByPlaceholderText } = render(
      <FormInput label="Email" placeholder="Enter email" value="" onChangeText={() => {}} />
    );
    expect(getByText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Enter email')).toBeTruthy();
  });

  it('renders an error message below the field', () => {
    const { getByText } = render(
      <FormInput label="Email" value="" onChangeText={() => {}} error="Email is required" />
    );
    expect(getByText('Email is required')).toBeTruthy();
  });

  it('renders no error text when none is given', () => {
    const { queryByText } = render(
      <FormInput label="Email" value="" onChangeText={() => {}} />
    );
    expect(queryByText(/required/i)).toBeNull();
  });

  it('exposes an accessibilityLabel derived from the label', () => {
    const { getByLabelText } = render(
      <FormInput label="Email" value="" onChangeText={() => {}} />
    );
    expect(getByLabelText('Email')).toBeTruthy();
  });
});

describe('PrimaryButton', () => {
  it('renders the title', () => {
    const { getByText } = render(
      <PrimaryButton title="Sign In" onPress={() => {}} />
    );
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('hides title and shows spinner when loading', () => {
    const { queryByText, getByTestId } = render(
      <PrimaryButton title="Sign In" onPress={() => {}} loading />
    );
    expect(queryByText('Sign In')).toBeNull();
    expect(getByTestId('button-loading-indicator')).toBeTruthy();
  });

  it('does not fire onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <PrimaryButton title="Save vehicle" onPress={onPress} disabled />
    );
    fireEvent.press(getByText('Save vehicle'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it.each(['primary', 'secondary', 'danger'])('renders the %s variant', (variant) => {
    const { getByText } = render(
      <PrimaryButton title="Action" onPress={() => {}} variant={variant} />
    );
    expect(getByText('Action')).toBeTruthy();
  });
});

describe('InfoRow', () => {
  it('renders label and value', () => {
    const { getByText } = render(
      <InfoRow label="Full Name" value="Mohammed" />
    );
    expect(getByText('Full Name')).toBeTruthy();
    expect(getByText('Mohammed')).toBeTruthy();
  });
});

describe('LoadingScreen', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<LoadingScreen />);
    expect(toJSON()).toBeTruthy();
  });
});

describe('ScreenHeader', () => {
  it('renders the title', () => {
    const { getByText } = render(
      <ScreenHeader title="Trip History" onBack={() => {}} />
    );
    expect(getByText('Trip History')).toBeTruthy();
  });

  it('exposes a back control that calls onBack', () => {
    const onBack = jest.fn();
    const { getByLabelText } = render(
      <ScreenHeader title="Trip History" onBack={onBack} />
    );
    fireEvent.press(getByLabelText('Go back'));
    expect(onBack).toHaveBeenCalled();
  });

  it('renders the title in white on ink so it is legible on the dark background', () => {
    const { getByText } = render(
      <ScreenHeader title="Scan rider QR" onBack={() => {}} onInk />
    );
    expect(StyleSheet.flatten(getByText('Scan rider QR').props.style).color)
      .toBe(theme.color.white);
  });

  it('renders the title in ink navy by default (light screens)', () => {
    const { getByText } = render(
      <ScreenHeader title="Your vehicle" onBack={() => {}} />
    );
    expect(StyleSheet.flatten(getByText('Your vehicle').props.style).color)
      .toBe(theme.color.text.primary);
  });
});
