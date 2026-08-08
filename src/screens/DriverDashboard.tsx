import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, SafeAreaView, StatusBar, View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useMyVehicleQuery } from '../hooks/vehicle';
import { useTrackingSession } from '../hooks/useTrackingSession';
import { useLocationBroadcast } from '../hooks/useLocationBroadcast';
import { theme } from '../theme';
import AppText from '../components/ui/AppText';
import Card from '../components/ui/Card';
import ListRow from '../components/ui/ListRow';
import ConfirmSheet from '../components/ui/ConfirmSheet';
import DutyHero from '../features/dashboard/DutyHero';
import VehicleCard from '../features/dashboard/VehicleCard';
import CustomRouteSection from '../features/dashboard/CustomRouteSection';
import TripProgressCard from '../features/dashboard/TripProgressCard';
import { useCustomRouteJourney } from '../features/dashboard/useCustomRouteJourney';
import { useSocketConnection } from '../features/dashboard/useSocketConnection';

type Vehicle = {
  vehicleId?: string;
  _id?: string;
  routeId?: string;
  assignedRoute?: string;
  vehicleName?: string;
  registrationNumber?: string;
};

function unwrap<T>(response: unknown): T {
  return ((response as { data?: T })?.data ?? response) as T;
}

// Persisted so a driver whose vehicle was unassigned while the app was closed
// still sees the distinct "removed" message (not "never registered") on
// reopen, rather than only within the session that saw it happen — issue #21.
const HAD_VEHICLE_KEY = 'driver_had_vehicle_before';

type Props = {
  navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void };
};

const DriverDashboard = ({ navigation }: Props) => {
  const { user, token } = useAuth() as { user: { name?: string } | null; token: string | null };

  const myVehicleQuery = useMyVehicleQuery();
  const vehicle = unwrap<Vehicle>(myVehicleQuery.data) as Vehicle | null;
  const vehicleId = vehicle?.vehicleId || vehicle?._id || '';
  const routeId = vehicle?.routeId || vehicle?.assignedRoute || '';
  const hasVehicle = !!vehicle;

  const [hadVehicleBefore, setHadVehicleBefore] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(HAD_VEHICLE_KEY).then((v) => {
      if (v === 'true') setHadVehicleBefore(true);
    });
  }, []);
  useEffect(() => {
    if (hasVehicle) {
      setHadVehicleBefore(true);
      AsyncStorage.setItem(HAD_VEHICLE_KEY, 'true').catch(() => {});
    }
  }, [hasVehicle]);

  const session = useTrackingSession();
  const broadcast = useLocationBroadcast({ active: session.status === 'tracking', vehicleId, routeId });
  const { connecting } = useSocketConnection(token);
  const journey = useCustomRouteJourney(vehicleId);

  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // Record every broadcast fix as a breadcrumb point while on an active custom route.
  useEffect(() => {
    if (broadcast.lastFix) journey.recordFix(broadcast.lastFix);
  }, [broadcast.lastFix, journey]);

  // "Go on duty" failing server-side (e.g. bus already tracked elsewhere) was captured
  // in session.error but never shown to the driver — see issue #20. Fires once per new
  // error instance (a fresh AppError object each failed start() call).
  useEffect(() => {
    if (session.status === 'error' && session.error) {
      Alert.alert("Couldn't go on duty", session.error.message);
    }
  }, [session.status, session.error]);

  const handleStart = () => session.start(vehicleId);

  const handleStop = () => {
    session.stop(vehicleId);
    journey.reportCompletedJourney();
    setShowEndConfirm(false);
  };

  const firstName = user?.name?.split(' ')[0];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.heroSafeArea}>
        <DutyHero
          firstName={firstName}
          vehicleName={vehicle?.vehicleName}
          status={session.status}
          isReconnecting={session.isReconnecting}
          connecting={connecting}
          permission={broadcast.permission}
          lastFix={session.status === 'tracking' ? broadcast.lastFix : null}
          hasVehicle={hasVehicle}
          hadVehicleBefore={hadVehicleBefore}
          onGoPress={handleStart}
          onEndPress={() => setShowEndConfirm(true)}
        />
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <AppText variant="h2" style={styles.sectionTitle}>Your vehicle</AppText>
        <VehicleCard
          vehicle={vehicle}
          isLive={session.status === 'tracking'}
          onRegisterPress={() => navigation.navigate('VehicleRegistration')}
        />

        <TripProgressCard
          routeId={routeId}
          fix={session.status === 'tracking' ? broadcast.lastFix : null}
          isTracking={session.status === 'tracking'}
        />

        <AppText variant="h2" style={styles.sectionTitleSpaced}>Quick actions</AppText>
        <Card style={styles.scanCard} padding={0}>
          <ListRow
            testID="scan-rider-qr-row"
            icon="qr-code-outline"
            title="Scan rider QR"
            subtitle={vehicle ? 'Record boarding or alighting' : 'Register a vehicle to enable scanning'}
            divider
            onPress={vehicle ? () => navigation.navigate('QRScanner', { vehicleId }) : undefined}
          />
          {/* Drivers need their route list before a shift, not buried under Profile. */}
          <ListRow
            testID="my-routes-row"
            icon="map-outline"
            title="My routes"
            subtitle="View and record your routes"
            onPress={() => navigation.navigate('RouteManagement')}
          />
        </Card>

        <CustomRouteSection
          vehicle={vehicle}
          customRoute={journey.customRoute}
          showUpdateRecorder={journey.showUpdateRecorder}
          onShowUpdateRecorder={() => journey.setShowUpdateRecorder(true)}
          onRecorderSubmitted={() => {
            journey.setShowUpdateRecorder(false);
            journey.reload();
          }}
        />
      </ScrollView>

      <ConfirmSheet
        visible={showEndConfirm}
        title="End this journey?"
        message="Riders will stop seeing your vehicle."
        confirmLabel="End journey"
        onConfirm={handleStop}
        onCancel={() => setShowEndConfirm(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.color.surface.page,
  },
  heroSafeArea: {
    backgroundColor: theme.color.ink.base,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.space[5],
    paddingBottom: theme.space[8],
  },
  sectionTitle: {
    marginBottom: theme.space[3],
  },
  sectionTitleSpaced: {
    marginTop: theme.space[6],
    marginBottom: theme.space[3],
  },
  scanCard: {
    paddingHorizontal: theme.space[4],
  },
});

export default DriverDashboard;
