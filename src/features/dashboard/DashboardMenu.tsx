import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

type Props = {
  onEarningsPress: () => void;
  onHistoryPress: () => void;
  onLogoutPress: () => void;
};

export default function DashboardMenu({ onEarningsPress, onHistoryPress, onLogoutPress }: Props) {
  return (
    <View style={styles.grid}>
      <TouchableOpacity style={styles.card} onPress={onEarningsPress}>
        <View style={[styles.iconBox, { backgroundColor: '#ecfdf5' }]}>
          <Ionicons name="wallet" size={22} color={COLORS.primary} />
        </View>
        <Text style={styles.label}>Earnings</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={onHistoryPress}>
        <View style={[styles.iconBox, { backgroundColor: '#eff6ff' }]}>
          <Ionicons name="time" size={22} color="#3b82f6" />
        </View>
        <Text style={styles.label}>History</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={onLogoutPress}>
        <View style={[styles.iconBox, { backgroundColor: '#fef2f2' }]}>
          <Ionicons name="log-out" size={22} color={COLORS.error} />
        </View>
        <Text style={styles.label}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  card: {
    width: '31.5%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
  },
});
