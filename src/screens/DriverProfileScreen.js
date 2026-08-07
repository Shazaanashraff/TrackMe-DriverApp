import React, { useEffect, useState } from 'react';
import { View, SafeAreaView, StatusBar, ScrollView, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLogout } from '../hooks/auth';
import api from '../services/api';
import { theme } from '../theme';
import AppText from '../components/ui/AppText';
import Card from '../components/ui/Card';
import InfoRow from '../components/ui/InfoRow';
import ListRow from '../components/ui/ListRow';
import ConfirmSheet from '../components/ui/ConfirmSheet';
import Skeleton from '../components/ui/Skeleton';
import VehicleCard from '../features/dashboard/VehicleCard';

const DriverProfileScreen = ({ navigation }) => {
  const { user, authenticatedRequest } = useAuth();
  const logout = useLogout();
  const [vehicle, setVehicle] = useState(null);
  const [loadingVehicle, setLoadingVehicle] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const loadVehicleInfo = async () => {
      try {
        const vehicleData = await authenticatedRequest(api.getMyVehicle);
        setVehicle(vehicleData.data || vehicleData);
      } catch (error) {
        setVehicle(null);
      } finally {
        setLoadingVehicle(false);
      }
    };

    loadVehicleInfo();
  }, [authenticatedRequest]);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => {
        setShowLogoutConfirm(false);
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      },
    });
  };

  const initial = (user?.name || 'Driver').trim().charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppText variant="h1">Profile</AppText>

        <View style={styles.identityBlock}>
          <View style={styles.avatarCircle}>
            <AppText variant="h1" color={theme.color.primary[600]}>{initial}</AppText>
          </View>
          <AppText variant="h2" style={styles.nameText}>{user?.name || 'Driver'}</AppText>
          <AppText variant="label" color={theme.color.text.muted}>Driver</AppText>
        </View>

        <Card title="Your details" style={styles.card}>
          <InfoRow label="Name" value={user?.name || '-'} />
          <InfoRow label="Email" value={user?.email || '-'} />
          <InfoRow label="Phone" value={user?.phone || '-'} last />
        </Card>

        <AppText variant="h2" style={styles.sectionTitle}>Your vehicle</AppText>
        {loadingVehicle ? (
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
