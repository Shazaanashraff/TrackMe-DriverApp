import React, { useEffect, useState } from 'react';
import { ScrollView, SafeAreaView, StatusBar, View, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useMyBusQuery } from '../hooks/bus';
import { useTrackingSession } from '../hooks/useTrackingSession';
import { useLocationBroadcast } from '../hooks/useLocationBroadcast';
import { theme } from '../theme';
import AppText from '../components/ui/AppText';
import Card from '../components/ui/Card';
import ListRow from '../components/ui/ListRow';
import ConfirmSheet from '../components/ui/ConfirmSheet';
import DutyHero from '../features/dashboard/DutyHero';
import VehicleCard from '../features/dashboard/VehicleCard';
import OnBoardCard from '../features/dashboard/OnBoardCard';
import CustomRouteSection from '../features/dashboard/CustomRouteSection';
import { useCustomRouteJourney } from '../features/dashboard/useCustomRouteJourney';
import { useSocketConnection } from '../features/dashboard/useSocketConnection';

type Bus = {
  busId?: string;
  _id?: string;
  routeId?: string;
  assignedRoute?: string;
  busName?: string;
  registrationNumber?: string;
  seatCapacity?: number;
};

function unwrap<T>(response: unknown): T {
  return ((response as { data?: T })?.data ?? response) as T;
}

type Props = {
  navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void };
};

const DriverDashboard = ({ navigation }: Props) => {
  const { user, token } = useAuth() as { user: { name?: string } | null; token: string | null };

  const myBusQuery = useMyBusQuery();
  const bus = unwrap<Bus>(myBusQuery.data) as Bus | null;
  const busId = bus?.busId || bus?._id || '';
  const routeId = bus?.routeId || bus?.assignedRoute || '';

  const session = useTrackingSession();
  const broadcast = useLocationBroadcast({ active: session.status === 'tracking', busId, routeId });
  const { connecting } = useSocketConnection(token);
  const journey = useCustomRouteJourney(busId);

  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // Record every broadcast fix as a breadcrumb point while on an active custom route.
  useEffect(() => {
    if (broadcast.lastFix) journey.recordFix(broadcast.lastFix);
  }, [broadcast.lastFix, journey]);

  const handleStart = () => session.start(busId);

  const handleStop = () => {
    session.stop(busId);
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
          busName={bus?.busName}
          status={session.status}
          isReconnecting={session.isReconnecting}
          connecting={connecting}
          permission={broadcast.permission}
          lastFix={session.status === 'tracking' ? broadcast.lastFix : null}
          hasBus={!!bus}
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
        <VehicleCard bus={bus} onRegisterPress={() => navigation.navigate('BusRegistration')} />

        <Card style={styles.scanCard} padding={0}>
          <ListRow
            testID="scan-rider-qr-row"
            icon="qr-code-outline"
            title="Scan rider QR"
            subtitle={bus ? 'Record boarding or alighting' : 'Register a bus to enable scanning'}
            onPress={bus ? () => navigation.navigate('QRScanner', { busId }) : undefined}
          />
        </Card>

        {bus ? (
          <OnBoardCard busId={busId} onPress={() => navigation.navigate('BoardingRoster', { busId })} />
        ) : null}

        <CustomRouteSection
          bus={bus}
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
        message="Riders will stop seeing your bus."
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
  scanCard: {
    marginTop: theme.space[4],
    paddingHorizontal: theme.space[4],
  },
});

export default DriverDashboard;
