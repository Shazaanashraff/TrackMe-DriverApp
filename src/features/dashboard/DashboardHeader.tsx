import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, SHADOWS } from '../../constants/theme';
import ShiftBusIcon from '../../components/ShiftBusIcon';

type Props = {
  driverName?: string;
  onProfilePress: () => void;
};

export default function DashboardHeader({ driverName, onProfilePress }: Props) {
  return (
    <View style={styles.header}>
      <View>
        <View style={styles.logoWordmark}>
          <ShiftBusIcon size={30} style={styles.logoWordmarkIcon} />
          <Text style={styles.logoText}>TrackMe</Text>
        </View>
        <Text style={styles.greetingText}>Welcome back, {driverName || 'Driver'}</Text>
      </View>
      <TouchableOpacity style={styles.profileBadge} onPress={onProfilePress}>
        <Ionicons name="person-circle" size={40} color={COLORS.secondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.sm,
  },
  logoText: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
    letterSpacing: -0.5,
  },
  logoWordmark: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoWordmarkIcon: {
    marginRight: 8,
  },
  greetingText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  profileBadge: {
    padding: 4,
  },
});
