import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import DriverDashboard from '../screens/DriverDashboard';
import BusRegistrationScreen from '../screens/BusRegistrationScreen';
import DriverEarningsScreen from '../screens/DriverEarningsScreen';
import TripHistoryScreen from '../screens/TripHistoryScreen';
import DriverProfileScreen from '../screens/DriverProfileScreen';
import RouteManagementScreen from '../screens/RouteManagementScreen';
import QRScannerScreen from '../screens/QRScannerScreen';
import OfflineScreen from '../components/OfflineScreen';
import LoadingScreen from '../components/ui/LoadingScreen';
import { theme } from '../theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Dashboard: { outline: 'home-outline', filled: 'home' },
  DriverEarnings: { outline: 'wallet-outline', filled: 'wallet' },
  TripHistory: { outline: 'time-outline', filled: 'time' },
  DriverProfile: { outline: 'person-outline', filled: 'person' },
};

const TAB_LABELS = {
  Dashboard: 'Home',
  DriverEarnings: 'Earnings',
  TripHistory: 'Trips',
  DriverProfile: 'Profile',
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.color.primary[500],
        tabBarInactiveTintColor: theme.color.text.muted,
        tabBarLabel: TAB_LABELS[route.name],
        tabBarStyle: {
          backgroundColor: theme.color.surface.card,
          borderTopWidth: theme.borderWidth.hairline,
          borderTopColor: theme.color.border.hairline,
          height: 64,
        },
        tabBarLabelStyle: {
          fontFamily: theme.fontFamily('medium'),
          fontSize: theme.font.size.caption,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          return <Ionicons name={focused ? icons.filled : icons.outline} size={size ?? 24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DriverDashboard} />
      <Tab.Screen name="DriverEarnings" component={DriverEarningsScreen} />
      <Tab.Screen name="TripHistory" component={TripHistoryScreen} />
      <Tab.Screen name="DriverProfile" component={DriverProfileScreen} />
    </Tab.Navigator>
  );
}

const AppNavigator = ({ backendOnline }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!backendOnline) {
    return <OfflineScreen />;
  }

  return (
    <Stack.Navigator
      key={user ? 'app-stack' : 'auth-stack'}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="BusRegistration" component={BusRegistrationScreen} />
          <Stack.Screen name="RouteManagement" component={RouteManagementScreen} />
          <Stack.Screen name="QRScanner" component={QRScannerScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
