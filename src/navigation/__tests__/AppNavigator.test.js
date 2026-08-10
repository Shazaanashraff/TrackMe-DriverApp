import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));
// eslint-disable-next-line import/first
import { useAuth } from '../../context/AuthContext';

jest.mock('../../screens/DriverDashboard', () => {
  const { Text, TouchableOpacity } = require('react-native');
  return function MockDashboard({ navigation }) {
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('VehicleRegistration')}
        testID="go-to-vehicle-registration"
      >
        <Text>Dashboard Screen</Text>
      </TouchableOpacity>
    );
  };
});
jest.mock('../../screens/TripHistoryScreen', () => {
  const { Text } = require('react-native');
  return function MockTrips() {
    return <Text>Trips Screen</Text>;
  };
});
jest.mock('../../screens/DriverProfileScreen', () => {
  const { Text } = require('react-native');
  return function MockProfile() {
    return <Text>Profile Screen</Text>;
  };
});
jest.mock('../../screens/VehicleRegistrationScreen', () => {
  const { Text } = require('react-native');
  return function MockVehicleRegistration() {
    return <Text>Vehicle Registration Screen</Text>;
  };
});
jest.mock('../../screens/LoginScreen', () => {
  const { Text } = require('react-native');
  return function MockLogin() {
    return <Text>Login Screen</Text>;
  };
});
jest.mock('../../screens/QRScannerScreen', () => {
  const { Text } = require('react-native');
  return function MockQRScanner() {
    return <Text>QR Scanner Screen</Text>;
  };
});

// eslint-disable-next-line import/first
import AppNavigator from '../AppNavigator';

function renderNav() {
  return render(
    <NavigationContainer>
      <AppNavigator backendOnline />
    </NavigationContainer>
  );
}

describe('AppNavigator', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ user: { name: 'Driver' }, loading: false });
  });

  it('renders all three tab labels with Home active by default', () => {
    const { getByText, queryByText } = renderNav();
    expect(getByText('Dashboard Screen')).toBeTruthy();
    expect(getByText('Home')).toBeTruthy();
    expect(getByText('Trips')).toBeTruthy();
    expect(getByText('Profile')).toBeTruthy();
    expect(queryByText('Earnings')).toBeNull();
  });

  it('switches tabs on tap', () => {
    const { getByText, queryByText } = renderNav();
    fireEvent.press(getByText('Trips'));
    expect(getByText('Trips Screen')).toBeTruthy();
    expect(queryByText('Dashboard Screen')).toBeNull();
  });

  it('pushes VehicleRegistration above the tabs', async () => {
    const { getByTestId, findByText } = renderNav();
    fireEvent.press(getByTestId('go-to-vehicle-registration'));
    expect(await findByText('Vehicle Registration Screen')).toBeTruthy();
  });

  it('shows the login screen when logged out', () => {
    useAuth.mockReturnValue({ user: null, loading: false });
    const { getByText } = renderNav();
    expect(getByText('Login Screen')).toBeTruthy();
  });

  it('shows a loading screen (no login/dashboard content) while auth is resolving', () => {
    useAuth.mockReturnValue({ user: null, loading: true });
    const { queryByText } = renderNav();
    expect(queryByText('Login Screen')).toBeNull();
    expect(queryByText('Dashboard Screen')).toBeNull();
  });
});
