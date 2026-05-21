import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import ScreenHeader from '../components/ui/ScreenHeader';
import InfoRow from '../components/ui/InfoRow';
import SectionCard from '../components/ui/SectionCard';

const DriverProfileScreen = ({ navigation }) => {
  const { user, authenticatedRequest } = useAuth();
  const [bus, setBus] = useState(null);
  const [loadingBus, setLoadingBus] = useState(true);

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

    loadBusInfo();
  }, [authenticatedRequest]);

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
  }
});

export default DriverProfileScreen;
