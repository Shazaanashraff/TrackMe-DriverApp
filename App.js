import React, { useEffect, useCallback, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import * as notificationService from './src/services/notificationService';
import { View } from 'react-native';
import { getBackendOnline, subscribeBackendStatus, startBackendHealthMonitor } from './src/services/backendStatus';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const [backendOnline, setBackendOnline] = useState(getBackendOnline());
  const [fontsLoaded] = useFonts({
    'UberMove-Bold': require('./assets/fonts/UberMoveBold.otf'),
    'UberMove-Medium': require('./assets/fonts/UberMoveMedium.otf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    const stopHealthMonitor = startBackendHealthMonitor();
    const unsubscribeBackendStatus = subscribeBackendStatus(setBackendOnline);

    // Initialize notifications once on app start
    notificationService.initializePushNotifications().catch(err => 
      console.warn('Notification initialization failed:', err)
    );

    // Setup notification response listener
    const notificationSubscription = notificationService.setupNotificationResponseListener((data) => {
      console.log('Notification tapped:', data);
    });

    return () => {
      stopHealthMonitor();
      unsubscribeBackendStatus();
      notificationSubscription?.remove();
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <NavigationContainer
        documentTitle={{
          formatter: () => 'TrackMe'
        }}
      >
        <StatusBar style="dark" />
        <AppNavigator backendOnline={backendOnline} />
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
