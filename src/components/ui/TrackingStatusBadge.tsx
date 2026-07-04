import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { TrackingStatus } from '../../hooks/useTrackingSession';

type DisplayStatus = TrackingStatus | 'reconnecting';

type Props = {
  status: TrackingStatus;
  isReconnecting?: boolean;
};

const STATUS_CONFIG: Record<
  DisplayStatus,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  idle: { label: 'Idle', icon: 'pause-circle-outline', color: COLORS.textSecondary },
  starting: { label: 'Starting…', icon: 'sync-outline', color: COLORS.info },
  tracking: { label: 'Tracking', icon: 'radio-button-on', color: COLORS.primary },
  reconnecting: { label: 'Reconnecting…', icon: 'cloud-offline-outline', color: COLORS.warning },
  error: { label: 'Error', icon: 'alert-circle-outline', color: COLORS.error },
};

export default function TrackingStatusBadge({ status, isReconnecting = false }: Props) {
  const displayStatus: DisplayStatus = status === 'tracking' && isReconnecting ? 'reconnecting' : status;
  const { label, icon, color } = STATUS_CONFIG[displayStatus];

  return (
    <View style={[styles.badge, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: FONTS.bold,
    fontSize: 12,
  },
});
