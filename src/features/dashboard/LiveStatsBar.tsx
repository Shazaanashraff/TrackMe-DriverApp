import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, BORDER_RADIUS, SPACING, SHADOWS } from '../../constants/theme';
import { usePlaceName } from '../../hooks/usePlaceName';

type Props = {
  lat: number;
  lng: number;
};

export default function LiveStatsBar({ lat, lng }: Props) {
  const placeName = usePlaceName(lat, lng, true);
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name="location" size={24} color={COLORS.primary} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.label}>Current Location</Text>
        <Text style={styles.value} numberOfLines={1}>
          {placeName || 'Locating…'}
        </Text>
        <Text style={styles.coords}>
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
  textWrap: {
    flex: 1,
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
  coords: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
