import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { TrackingStatus } from '../../hooks/useTrackingSession';
import TrackingStatusBadge from '../../components/ui/TrackingStatusBadge';
import LiveStatsBar from './LiveStatsBar';

type Props = {
  status: TrackingStatus;
  isReconnecting: boolean;
  connecting: boolean;
  lastFix: { lat: number; lng: number } | null;
  children?: React.ReactNode;
};

export default function TrackingStatusCard({
  status,
  isReconnecting,
  connecting,
  lastFix,
  children,
}: Props) {
  const isTracking = status === 'tracking';
  const label = isTracking
    ? 'Currently On Journey'
    : connecting
    ? 'Connecting to server...'
    : 'Standby Mode';

  return (
    <View style={[styles.card, isTracking && styles.activeCardBorder]}>
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <View style={[styles.pulseDot, isTracking ? styles.pulseDotActive : styles.pulseDotInactive]} />
          <Text style={styles.label}>{label}</Text>
        </View>
        <TrackingStatusBadge status={status} isReconnecting={isReconnecting} />
      </View>

      {isTracking && lastFix && <LiveStatsBar lat={lastFix.lat} lng={lastFix.lng} />}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  activeCardBorder: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  pulseDotActive: {
    backgroundColor: COLORS.primary,
  },
  pulseDotInactive: {
    backgroundColor: COLORS.textSecondary,
    opacity: 0.3,
  },
  label: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
  },
});
