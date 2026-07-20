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
        onPress={() => navigation.navigate('BusRegistration')}
        testID="go-to-bus-registration"
      >
        <Text>Dashboard Screen</Text>
      </TouchableOpacity>
    );
  };
});
jest.mock('../../screens/DriverEarningsScreen', () => {
  const { Text } = require('react-native');
  return function MockEarnings() {
    return <Text>Earnings Screen</Text>;
  };
});
jest.mock('../../screens/TripHistoryScreen', () => {
  const { Text } = require('react-native');
  return function MockTrips() {
    return <Text>Trips Screen</Text>;
  };
});
jest.mock('../../screens/DriverProfileScreen', () => {
  const { Text, TouchableOpacity } = require('react-native');
  return function MockProfile({ navigation }) {
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('RouteManagement')}
        testID="go-to-route-management"
      >
        <Text>Profile Screen</Text>
      </TouchableOpacity>
    );
  };
});
jest.mock('../../screens/BusRegistrationScreen', () => {
  const { Text } = require('react-native');
  return function MockBusRegistration() {
    return <Text>Bus Registration Screen</Text>;
  };
});
jest.mock('../../screens/RouteManagementScreen', () => {
  const { Text } = require('react-native');
  return function MockRouteManagement() {
    return <Text>Route Management Screen</Text>;
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

  it('renders all four tab labels with Home active by default', () => {
    const { getByText } = renderNav();
    expect(getByText('Dashboard Screen')).toBeTruthy();
    expect(getByText('Home')).toBeTruthy();
    expect(getByText('Earnings')).toBeTruthy();
    expect(getByText('Trips')).toBeTruthy();
    expect(getByText('Profile')).toBeTruthy();
  });

  it('switches tabs on tap', () => {
    const { getByText, queryByText } = renderNav();
    fireEvent.press(getByText('Earnings'));
    expect(getByText('Earnings Screen')).toBeTruthy();
    expect(queryByText('Dashboard Screen')).toBeNull();
  });

  it('pushes BusRegistration above the tabs', async () => {
    const { getByTestId, findByText } = renderNav();
    fireEvent.press(getByTestId('go-to-bus-registration'));
    expect(await findByText('Bus Registration Screen')).toBeTruthy();
  });

  it('pushes RouteManagement above the tabs', async () => {
    const { getByText, getByTestId, findByText } = renderNav();
    fireEvent.press(getByText('Profile'));
    fireEvent.press(getByTestId('go-to-route-management'));
    expect(await findByText('Route Management Screen')).toBeTruthy();
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
