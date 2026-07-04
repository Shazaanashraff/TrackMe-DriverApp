import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

type Bus = {
  busName?: string;
  registrationNumber?: string;
  seatCapacity?: number;
};

type Props = {
  bus: Bus | null;
  onRegisterPress: () => void;
};

export default function AssignedBusCard({ bus, onRegisterPress }: Props) {
  if (!bus) {
    return (
      <TouchableOpacity style={styles.emptyCard} onPress={onRegisterPress}>
        <Ionicons name="add-circle-outline" size={32} color={COLORS.textSecondary} />
        <Text style={styles.emptyText}>No bus assigned. Tap to register.</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="bus" size={24} color={COLORS.white} />
        </View>
        <View style={styles.titleArea}>
          <Text style={styles.name}>{bus.busName}</Text>
          <Text style={styles.reg}>{bus.registrationNumber || 'No Registration'}</Text>
        </View>
      </View>

      <View style={styles.metaGrid}>
        <View style={styles.metaItem}>
          <Ionicons name="people-outline" size={18} color={COLORS.primary} />
          <Text style={styles.metaText}>{bus.seatCapacity || 0} Seats</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleArea: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
  },
  reg: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  metaGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
    gap: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.secondary,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginTop: 10,
  },
});
