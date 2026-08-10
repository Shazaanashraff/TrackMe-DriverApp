import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useRouteDetailsQuery } from '../../hooks/route';
import { computeTripProgress } from '../../helpers/tripProgress';
import type { LocationFix } from '../../helpers/locationUtils';

type Props = {
  routeId?: string;
  fix: LocationFix | null;
  isTracking: boolean;
};

const fmtKm = (km: number): string => `${km.toFixed(1)} km`;

export default function TripProgressCard({ routeId, fix, isTracking }: Props) {
  const { data: route } = useRouteDetailsQuery(routeId);

  // Nothing useful to show without a resolved route (e.g. no route, or a PRIVATE
  // custom route that 404s) — stay out of the way rather than render an empty shell.
  if (!route) return null;

  const totalKm = route.distance ?? 0;
  const progress =
    isTracking && fix ? computeTripProgress(route.stops, totalKm, fix.lat, fix.lng) : null;

  const percent = progress?.percent ?? 0;
  const from = route.source || 'Start';
  const to = route.destination || 'Destination';

  return (
    <View style={styles.card} testID="trip-progress-card">
      <View style={styles.header}>
        <Ionicons name="navigate-circle" size={20} color={COLORS.primary} />
        <Text style={styles.title}>Trip Progress</Text>
        {totalKm > 0 && <Text style={styles.totalKm}>{fmtKm(totalKm)} total</Text>}
      </View>

      <View style={styles.endpointsRow}>
        <Text style={[styles.endpoint, styles.endpointFrom]} numberOfLines={1}>{from}</Text>
        <Text style={[styles.endpoint, styles.endpointTo]} numberOfLines={1}>{to}</Text>
      </View>

      <View style={styles.trackWrap}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${percent}%` }]} testID="trip-progress-fill" />
        </View>
        {progress && (
          <View style={[styles.marker, { left: `${percent}%` }]} testID="trip-progress-marker">
            <View style={styles.markerDot} />
          </View>
        )}
      </View>

      {progress ? (
        <View style={styles.statsRow}>
          <Text style={styles.covered} testID="trip-progress-covered">
            {fmtKm(progress.coveredKm)} covered
          </Text>
          <Text style={styles.percent}>{percent}%</Text>
          <Text style={styles.remaining}>{fmtKm(progress.remainingKm)} to go</Text>
        </View>
      ) : (
        <Text style={styles.idleHint} testID="trip-progress-idle">
          Start tracking to see live progress
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    // Full brand-green border so the trip card clearly stands apart from the plain
    // grey-bordered cards around it.
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
  },
  totalKm: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  endpointsRow: {
    flexDirection: 'row',
    marginBottom: 6,
    gap: 12,
  },
  endpoint: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: COLORS.secondary,
  },
  endpointFrom: {
    textAlign: 'left',
  },
  endpointTo: {
    textAlign: 'right',
  },
  trackWrap: {
    position: 'relative',
    justifyContent: 'center',
    marginVertical: 6,
  },
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  // Live position pin: a solid dot with a soft green halo, riding the bar at the
  // current percent. marginLeft centres the 22px halo on the exact point.
  marker: {
    position: 'absolute',
    width: 22,
    height: 22,
    marginLeft: -11,
    borderRadius: 11,
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  covered: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  percent: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  remaining: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  idleHint: {
    marginTop: SPACING.sm,
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
