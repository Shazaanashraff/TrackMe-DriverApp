import React, { useState } from 'react';
import { View, SafeAreaView, StatusBar, ScrollView, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLogout, useMeQuery, useMyEnrollmentKeyQuery } from '../hooks/auth';
import { useMyVehicleQuery } from '../hooks/vehicle';
import EnrollmentKeyCard from '../features/profile/EnrollmentKeyCard';
import { theme } from '../theme';
import AppText from '../components/ui/AppText';
import Card from '../components/ui/Card';
import InfoRow from '../components/ui/InfoRow';
import ListRow from '../components/ui/ListRow';
import ConfirmSheet from '../components/ui/ConfirmSheet';
import Skeleton from '../components/ui/Skeleton';
import VehicleCard from '../features/dashboard/VehicleCard';

function unwrap(response) {
  return response?.data ?? response;
}

const DriverProfileScreen = ({ navigation }) => {
  const { user } = useAuth();
  const logout = useLogout();
  // The server's copy wins where it has loaded; the one stored at sign-in keeps
  // the screen populated on a cold or offline start rather than blanking it.
  const meQuery = useMeQuery();
  const profile = { ...(user || {}), ...(meQuery.data?.user || {}) };
  const keyQuery = useMyEnrollmentKeyQuery();
  const keyData = keyQuery.data?.data;
  // Same cached, persisted query the Dashboard uses — replaces a one-off,
  // uncached fetch that used to read as "No vehicle yet" on any failure,
  // offline included, even for a driver who has one (issue found this pass).
  const vehicleQuery = useMyVehicleQuery();
  const vehicle = unwrap(vehicleQuery.data) || null;
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => {
        setShowLogoutConfirm(false);
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      },
    });
  };

  const initial = (profile.name || 'Driver').trim().charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppText variant="h1">Profile</AppText>

        <View style={styles.identityBlock}>
          <View style={styles.avatarCircle}>
            <AppText variant="h1" color={theme.color.primary[600]}>{initial}</AppText>
          </View>
          <AppText variant="h2" style={styles.nameText}>{profile.name || 'Driver'}</AppText>
          <AppText variant="label" color={theme.color.text.muted}>Driver</AppText>
        </View>

        <Card title="Your details" style={styles.card}>
          <InfoRow label="Name" value={profile.name || '-'} />
          <InfoRow label="Email" value={profile.email || '-'} />
          {/* The account field is phoneNumber; `phone` never existed on it, so
              this row read "-" for every driver no matter what was on file. */}
          <InfoRow label="Phone" value={profile.phoneNumber || '-'} last />
        </Card>

        <View style={styles.card}>
          <EnrollmentKeyCard
            enrollmentKey={keyData?.enrollmentKey}
            driverName={profile.name}
            loading={keyQuery.isPending}
            // A cached key beats a failed background refetch — showing "could
            // not load" over a key that's sitting right there in cache would
            // hide it at the exact moment a driver needs to read it out.
            error={keyQuery.isError && !keyData?.enrollmentKey}
            onRetry={keyQuery.refetch}
          />
        </View>

        <AppText variant="h2" style={styles.sectionTitle}>Your vehicle</AppText>
        {vehicleQuery.isLoading ? (
          <Skeleton height={80} radius={theme.radius.card} style={styles.card} />
        ) : (
          <View style={styles.card}>
            <VehicleCard vehicle={vehicle} onRegisterPress={() => navigation.navigate('VehicleRegistration')} />
          </View>
        )}

        <Card style={styles.card}>
          <ListRow
            icon="log-out-outline"
            title="Log out"
            destructive
            onPress={() => setShowLogoutConfirm(true)}
            testID="logout-row"
          />
        </Card>
      </ScrollView>

      <ConfirmSheet
        visible={showLogoutConfirm}
        title="Log out?"
        message="You'll stop broadcasting and need to sign in again."
        confirmLabel="Log out"
        loading={logout.isPending}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.color.surface.page,
  },
  content: {
    padding: theme.space[5],
    paddingBottom: theme.space[8],
  },
  identityBlock: {
    alignItems: 'center',
    marginVertical: theme.space[5],
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.color.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameText: {
    marginTop: theme.space[3],
  },
  card: {
    marginBottom: theme.space[4],
  },
  sectionTitle: {
    marginBottom: theme.space[3],
  },
});

export default DriverProfileScreen;
