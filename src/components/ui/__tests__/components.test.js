import React from 'react';
import { render } from '@testing-library/react-native';
import FormInput from '../FormInput';
import PrimaryButton from '../PrimaryButton';
import InfoRow from '../InfoRow';
import SectionCard from '../SectionCard';
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
});

describe('PrimaryButton', () => {
  it('renders the title', () => {
    const { getByText } = render(
      <PrimaryButton title="Sign In" onPress={() => {}} />
    );
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('hides title and shows spinner when loading', () => {
    const { queryByText } = render(
      <PrimaryButton title="Sign In" onPress={() => {}} loading />
    );
    expect(queryByText('Sign In')).toBeNull();
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

describe('SectionCard', () => {
  it('renders title and children', () => {
    const { getByText } = render(
      <SectionCard title="Personal Information">
        <InfoRow label="Email" value="test@test.com" />
      </SectionCard>
    );
    expect(getByText('Personal Information')).toBeTruthy();
    expect(getByText('Email')).toBeTruthy();
  });

  it('renders without a title', () => {
    const { getByText } = render(
      <SectionCard>
        <InfoRow label="Role" value="Driver" />
      </SectionCard>
    );
    expect(getByText('Role')).toBeTruthy();
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
});
