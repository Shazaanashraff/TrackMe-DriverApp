import React, { useState } from 'react';
import { View, StatusBar, ScrollView, StyleSheet, Pressable } from 'react-native';
// react-native's own SafeAreaView is a no-op on Android; only this one applies insets there.
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useLogout, useMeQuery, useMyEnrollmentKeyQuery } from '../hooks/auth';
import { useMyVehicleQuery } from '../hooks/vehicle';
import EnrollmentKeyCard from '../features/profile/EnrollmentKeyCard';
import { theme } from '../theme';
import AppText from '../components/ui/AppText';
import Card from '../components/ui/Card';
import ListRow from '../components/ui/ListRow';
import ConfirmSheet from '../components/ui/ConfirmSheet';
import Skeleton from '../components/ui/Skeleton';
import VehicleCard from '../features/dashboard/VehicleCard';

const DetailItem = ({ icon, label, value, last }) => (
  <View style={[styles.detailRow, !last && styles.detailRowBorder]}>
    <View style={styles.detailIconBadge}>
      <Ionicons name={icon} size={18} color={theme.color.primary[600]} />
    </View>
    <View style={styles.detailContent}>
      <AppText variant="label" color={theme.color.text.muted}>{label}</AppText>
      <AppText variant="body" color={theme.color.text.primary} style={styles.detailValue}>
        {value && value !== '-' ? value : 'Not provided'}
      </AppText>
    </View>
  </View>
);

const DriverProfileScreen = ({ navigation }) => {
  const { user } = useAuth();
  const logout = useLogout();
  const meQuery = useMeQuery();
  const profile = { ...(user || {}), ...(meQuery.data?.user || {}) };
  const keyQuery = useMyEnrollmentKeyQuery();
  const keyData = keyQuery.data?.data;
  const vehicleQuery = useMyVehicleQuery();
  const vehicle = vehicleQuery.data?.data || vehicleQuery.data || null;
  const loadingVehicle = vehicleQuery.isPending;
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
        <View style={styles.heroCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <AppText variant="h1" color={theme.color.ink.base} style={styles.avatarText}>{initial}</AppText>
            </View>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={12} color={theme.color.white} />
            </View>
          </View>
          <AppText variant="h2" style={styles.heroName}>{profile.name || 'Driver'}</AppText>
          <View style={styles.rolePill}>
            <View style={styles.roleDot} />
            <AppText variant="caption" style={styles.roleText}>Active Driver</AppText>
          </View>
        </View>

        <Card title="Personal details" style={styles.card}>
          <DetailItem icon="person-outline" label="Full Name" value={profile.name} />
          <DetailItem icon="call-outline" label="Phone Number" value={profile.phoneNumber} />
          <DetailItem icon="mail-outline" label="Email Address" value={profile.email} last />
        </Card>

        <View style={styles.card}>
          <EnrollmentKeyCard
            enrollmentKey={keyData?.enrollmentKey}
            driverName={profile.name}
            loading={keyQuery.isPending}
            // A cached key beats a failed background refetch: showing "could
            // not load" over a key that's sitting right there in cache would
            // hide it at the exact moment a driver needs to read it out.
            error={keyQuery.isError && !keyData?.enrollmentKey}
            onRetry={keyQuery.refetch}
          />
        </View>

        <View style={styles.sectionHeader}>
          <AppText variant="overline" color={theme.color.text.muted}>YOUR VEHICLE</AppText>
        </View>
        {loadingVehicle ? (
          <Skeleton height={80} radius={theme.radius.card} style={styles.card} />
        ) : (
          <View style={styles.card}>
            <VehicleCard vehicle={vehicle} onRegisterPress={() => navigation.navigate('VehicleRegistration')} />
          </View>
        )}

        <Pressable 
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.logoutButtonPressed
          ]} 
          onPress={() => setShowLogoutConfirm(true)}
          testID="logout-row"
        >
          <View style={styles.logoutIconBadge}>
            <Ionicons name="log-out-outline" size={18} color={theme.color.danger.main} />
          </View>
          <AppText variant="body" color={theme.color.danger.main} weight="medium" style={styles.logoutText}>
            Log out
          </AppText>
        </Pressable>
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
    padding: theme.space[3],
    paddingBottom: theme.space[6],
  },
  heroCard: {
    backgroundColor: theme.color.ink.base,
    borderRadius: theme.radius.card,
    padding: theme.space[5],
    alignItems: 'center',
    marginBottom: theme.space[3],
    ...theme.elevation.card,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: theme.space[2],
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.color.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.color.ink.raised,
  },
  avatarText: {
    fontSize: 28,
    lineHeight: 34,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: theme.color.duty.on,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.color.ink.base,
  },
  heroName: {
    color: theme.color.white,
    marginBottom: theme.space[1],
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.color.ink.raised,
    paddingHorizontal: theme.space[3],
    paddingVertical: theme.space[1],
    borderRadius: theme.radius.pill,
    gap: theme.space[2],
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.color.duty.on,
  },
  roleText: {
    color: theme.color.primary[100],
    fontWeight: '500',
  },
  sectionHeader: {
    marginBottom: theme.space[2],
    marginTop: theme.space[1],
    paddingHorizontal: theme.space[1],
  },
  card: {
    marginBottom: theme.space[3],
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.space[2],
    gap: theme.space[3],
  },
  detailRowBorder: {
    borderBottomWidth: theme.borderWidth.hairline,
    borderBottomColor: theme.color.border.hairline,
  },
  detailIconBadge: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.control,
    backgroundColor: theme.color.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailValue: {
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.color.surface.card,
    borderRadius: theme.radius.card,
    padding: theme.space[3],
    marginBottom: theme.space[6],
    borderWidth: 1,
    borderColor: theme.color.danger.bg,
    ...theme.elevation.card,
  },
  logoutButtonPressed: {
    backgroundColor: theme.color.danger.bg,
  },
  logoutIconBadge: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.control,
    backgroundColor: theme.color.danger.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.space[3],
  },
  logoutText: {
    flex: 1,
    fontSize: 16,
  },
});
export default DriverProfileScreen;
