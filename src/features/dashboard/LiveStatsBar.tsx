import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, BORDER_RADIUS, SPACING, SHADOWS } from '../../constants/theme';

type Props = {
  lat: number;
  lng: number;
};

export default function LiveStatsBar({ lat, lng }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name="location" size={24} color={COLORS.primary} />
      </View>
      <View>
        <Text style={styles.label}>Current Coordinates</Text>
        <Text style={styles.value}>
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    ...SHADOWS.sm,
  },
  label: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
  },
});
