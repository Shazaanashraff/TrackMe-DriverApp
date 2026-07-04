import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import ScreenHeader from '../components/ui/ScreenHeader';
import InfoRow from '../components/ui/InfoRow';
import SectionCard from '../components/ui/SectionCard';
import { ONBOARDING_DONE_KEY } from '../components/CustomRouteRecorder';

const DriverProfileScreen = ({ navigation }) => {
  const { user, authenticatedRequest } = useAuth();
  const [bus, setBus] = useState(null);
  const [loadingBus, setLoadingBus] = useState(true);
  const [isCustomRoute, setIsCustomRoute] = useState(false);

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScreenHeader title="Driver Profile" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarWrap}>
          <Ionicons name="person-circle" size={88} color={COLORS.secondary} />
          <Text style={styles.nameText}>{user?.name || 'Driver'}</Text>
          <Text style={styles.roleText}>Driver Account</Text>
        </View>

        <SectionCard title="Personal Information">
          <InfoRow label="Full Name" value={user?.name || '-'} />
          <InfoRow label="Email" value={user?.email || '-'} />
          <InfoRow label="Role" value={user?.role || 'driver'} />
        </SectionCard>

        <SectionCard title="Assigned Vehicle">
          {loadingBus ? (
            <ActivityIndicator color={COLORS.primary} style={styles.loader} />
          ) : (
            <>
              <InfoRow label="Vehicle Name" value={bus?.busName || '-'} />
              <InfoRow label="Vehicle ID" value={bus?.busId || bus?._id || '-'} />
              <InfoRow label="Registration" value={bus?.registrationNumber || '-'} />
              <InfoRow
                label="Seats"
                value={typeof bus?.seatCapacity === 'number' ? `${bus.seatCapacity}` : '-'}
              />
            </>
          )}
        </SectionCard>

        {isCustomRoute && (
          <SectionCard title="Custom Route">
            <TouchableOpacity style={styles.replayRow} onPress={handleReplayTutorial} testID="replay-tutorial-button">
              <Ionicons name="play-circle-outline" size={20} color={COLORS.primary} />
              <Text style={styles.replayText}>Replay route-recording tutorial</Text>
            </TouchableOpacity>
          </SectionCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  content: {
    padding: SPACING.md,
    paddingBottom: 40
  },
  avatarWrap: {
    alignItems: 'center',
    marginVertical: SPACING.md
  },
  nameText: {
    marginTop: 8,
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.secondary
  },
  roleText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginTop: 4
  },
  loader: {
    paddingVertical: 16
  },
  replayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8
  },
  replayText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.secondary
  }
});

export default DriverProfileScreen;
