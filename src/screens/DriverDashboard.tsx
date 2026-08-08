import React, { useState } from 'react';
import { ScrollView, SafeAreaView, StatusBar, View, StyleSheet } from 'react-native';
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
import TripProgressCard from '../features/dashboard/TripProgressCard';
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

type Props = {
  navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void };
};

const DriverDashboard = ({ navigation }: Props) => {
  const { user, token } = useAuth() as { user: { name?: string } | null; token: string | null };

  const myVehicleQuery = useMyVehicleQuery();
  const vehicle = unwrap<Vehicle>(myVehicleQuery.data) as Vehicle | null;
  const vehicleId = vehicle?.vehicleId || vehicle?._id || '';
  const routeId = vehicle?.routeId || vehicle?.assignedRoute || '';

  const session = useTrackingSession();
  const broadcast = useLocationBroadcast({ active: session.status === 'tracking', vehicleId, routeId });
  const { connecting } = useSocketConnection(token);

  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const handleStart = () => session.start(vehicleId);

  const handleStop = () => {
    session.stop(vehicleId);
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
          hasVehicle={!!vehicle}
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
            onPress={vehicle ? () => navigation.navigate('QRScanner', { vehicleId }) : undefined}
          />
        </Card>
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
