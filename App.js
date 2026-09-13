import React, { useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { useFonts, Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { AuthProvider } from './src/context/AuthContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import AppNavigator from './src/navigation/AppNavigator';
import { CommunicationProvider } from './src/features/communications/provider';
const navigationRef = createNavigationContainerRef();
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NetworkStatusProvider } from './src/context/NetworkStatusContext';
import { queryClient, persistOptions } from './src/app/queryClient';
// Registers the background location task. Must be imported at app entry, not from
// a screen — the OS can launch this process headless, with no navigation mounted.
import './src/services/backgroundLocation';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <ErrorBoundary>
        <NavigationContainer
          ref={navigationRef}
          documentTitle={{
            formatter: () => 'TrackMe'
          }}
        >
          <StatusBar style="dark" />
          <CommunicationProvider><AppNavigator /></CommunicationProvider>
        </NavigationContainer>
      </ErrorBoundary>
    </View>
  );
}

export default function App() {
  return (
    // The build is edge-to-edge (android/gradle.properties `edgeToEdgeEnabled`), so screens
    // draw behind the status and navigation bars. SafeAreaProvider feeds the real insets to
    // the SafeAreaView/useSafeAreaInsets used by the screens; without it they get nothing and
    // headers slide under the status bar.
    <SafeAreaProvider>
      <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
        <AuthProvider>
          <NetworkStatusProvider>
            <AppContent />
          </NetworkStatusProvider>
        </AuthProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}
