import React, { useEffect, useState } from 'react';
import { View, SafeAreaView, StatusBar, ScrollView, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { ONBOARDING_DONE_KEY } from '../components/CustomRouteRecorder';

const DriverProfileScreen = ({ navigation }) => {
  const { user, authenticatedRequest } = useAuth();
  const logout = useLogout();
  const [bus, setBus] = useState(null);
  const [loadingBus, setLoadingBus] = useState(true);
  const [isCustomRoute, setIsCustomRoute] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const loadBusInfo = async () => {
      try {
        const busData = await authenticatedRequest(api.getMyBus);
        setBus(busData.data || busData);
      } catch (error) {
        setBus(null);
      } finally {
        setLoadingBus(false);
      }
    };

    const loadCustomRouteInfo = async () => {
      try {
        const res = await authenticatedRequest(api.getMyCustomRoute);
        setIsCustomRoute(Boolean((res.data || res)?.isCustomRoute));
      } catch (error) {
        setIsCustomRoute(false);
      }
    };

    loadBusInfo();
    loadCustomRouteInfo();
  }, [authenticatedRequest]);

  const handleReplayTutorial = async () => {
    await AsyncStorage.removeItem(ONBOARDING_DONE_KEY);
    Alert.alert('Tutorial reset', 'The route-recording tutorial will show again next time you open your dashboard.');
  };

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

        <AppText variant="h2" style={styles.sectionTitle}>Your bus</AppText>
        {loadingBus ? (
          <Skeleton height={80} radius={theme.radius.card} style={styles.card} />
        ) : (
          <View style={styles.card}>
            <VehicleCard bus={bus} onRegisterPress={() => navigation.navigate('BusRegistration')} />
          </View>
        )}

        <Card style={styles.card}>
          {isCustomRoute ? (
            <ListRow
              icon="play-circle-outline"
              title="Replay tutorial"
              onPress={handleReplayTutorial}
              divider
              testID="replay-tutorial-row"
            />
          ) : null}
          <ListRow
            icon="map-outline"
            title="My routes"
            onPress={() => navigation.navigate('RouteManagement')}
            divider
          />
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
