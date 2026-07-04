import React, { useEffect, useState } from 'react';
import { Text, ScrollView, StatusBar, SafeAreaView, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useMyBusQuery } from '../hooks/bus';
import { useTrackingSession } from '../hooks/useTrackingSession';
import { useLocationBroadcast } from '../hooks/useLocationBroadcast';
import { useLogout } from '../hooks/auth';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import DashboardHeader from '../features/dashboard/DashboardHeader';
import TrackingStatusCard from '../features/dashboard/TrackingStatusCard';
import TrackingToggle from '../features/dashboard/TrackingToggle';
import AssignedBusCard from '../features/dashboard/AssignedBusCard';
import CustomRouteSection from '../features/dashboard/CustomRouteSection';
import DashboardMenu from '../features/dashboard/DashboardMenu';
import LogoutModal from '../features/dashboard/LogoutModal';
import PermissionDeniedState from '../components/PermissionDeniedState';
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
  navigation: { navigate: (screen: string) => void; reset: (state: unknown) => void };
};

const DriverDashboard = ({ navigation }: Props) => {
  const { user, token } = useAuth() as { user: { name?: string } | null; token: string | null };

  const myBusQuery = useMyBusQuery();
  const bus = unwrap<Bus>(myBusQuery.data) as Bus | null;
  const busId = bus?.busId || bus?._id || '';
  const routeId = bus?.routeId || bus?.assignedRoute || '';

  const session = useTrackingSession();
  const broadcast = useLocationBroadcast({ active: session.status === 'tracking', busId, routeId });
  const logout = useLogout();
  const { connecting } = useSocketConnection(token);
  const journey = useCustomRouteJourney(busId);

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Record every broadcast fix as a breadcrumb point while on an active custom route.
  useEffect(() => {
    if (broadcast.lastFix) journey.recordFix(broadcast.lastFix);
  }, [broadcast.lastFix, journey]);

  const handleStart = () => session.start(busId);

  const handleStop = () => {
    session.stop(busId);
    journey.reportCompletedJourney();
  };

  const executeLogout = () => {
    if (session.status === 'tracking') handleStop();
    logout.mutate(undefined, {
      onSettled: () => {
        setShowLogoutModal(false);
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <DashboardHeader driverName={user?.name} onProfilePress={() => navigation.navigate('DriverProfile')} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        <CustomRouteSection
          bus={bus}
          customRoute={journey.customRoute}
          showUpdateRecorder={journey.showUpdateRecorder}
          onShowUpdateRecorder={() => journey.setShowUpdateRecorder(true)}
          onRecorderSubmitted={() => {
            journey.setShowUpdateRecorder(false);
            journey.reload();
          }}
        >
          <TrackingStatusCard
            status={session.status}
            isReconnecting={session.isReconnecting}
            connecting={connecting}
            lastFix={session.status === 'tracking' ? broadcast.lastFix : null}
          >
            {session.status === 'tracking' && broadcast.permission === 'denied' ? (
              <PermissionDeniedState />
            ) : (
              <TrackingToggle
                isTracking={session.status === 'tracking'}
                disabled={!bus}
                onStart={handleStart}
                onStop={handleStop}
              />
            )}
          </TrackingStatusCard>
        </CustomRouteSection>

        <Text style={styles.sectionTitle}>Assigned Vehicle</Text>
        <AssignedBusCard bus={bus} onRegisterPress={() => navigation.navigate('BusRegistration')} />

        <Text style={styles.sectionTitle}>Dashboard Menu</Text>
        <DashboardMenu
          onEarningsPress={() => navigation.navigate('DriverEarnings')}
          onHistoryPress={() => navigation.navigate('TripHistory')}
          onLogoutPress={() => setShowLogoutModal(true)}
        />
      </ScrollView>

      <LogoutModal
        visible={showLogoutModal}
        isLoggingOut={logout.isPending}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={executeLogout}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  scrollPadding: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
});

export default DriverDashboard;
