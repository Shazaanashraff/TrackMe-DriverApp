import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View, StatusBar } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import DriverDashboard from '../screens/DriverDashboard';
import BusRegistrationScreen from '../screens/BusRegistrationScreen';
import DriverEarningsScreen from '../screens/DriverEarningsScreen';
import TripHistoryScreen from '../screens/TripHistoryScreen';
import DriverProfileScreen from '../screens/DriverProfileScreen';
import { COLORS } from '../constants/theme';
import OfflineScreen from '../components/OfflineScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = ({ backendOnline }) => {
  const { user, loading } = useAuth();
  console.log('[AppNavigator] State:', { hasUser: !!user, loading });

  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: COLORS.secondary, 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!backendOnline) {
    return <OfflineScreen />;
  }

  return (
    <Stack.Navigator
      key={user ? 'app-stack' : 'auth-stack'}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right'
      }}
    >
      {!user ? (
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
        />
      ) : (
        <>
          <Stack.Screen 
            name="Dashboard" 
            component={DriverDashboard}
          />
          <Stack.Screen 
            name="BusRegistration" 
            component={BusRegistrationScreen}
          />
          <Stack.Screen 
            name="DriverEarnings" 
            component={DriverEarningsScreen}
          />
          <Stack.Screen 
            name="TripHistory" 
            component={TripHistoryScreen}
          />
          <Stack.Screen
            name="DriverProfile"
            component={DriverProfileScreen}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
