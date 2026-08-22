import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import AppText from '../../components/ui/AppText';
import StatusPill from '../../components/ui/StatusPill';

type Vehicle = {
  vehicleName?: string;
  routeName?: string;
  routeId?: string;
  driverId?: { isPrivate?: boolean } | string | null;
};

type Props = {
  vehicle: Vehicle | null;
  onRegisterPress: () => void;
};

export default function VehicleCard({ vehicle, onRegisterPress }: Props) {
  if (!vehicle) {
    return (
      <Pressable style={styles.emptyContainer} onPress={onRegisterPress}>
        <View style={styles.emptyIconBadge}>
          <Ionicons name="bus-outline" size={20} color={theme.color.primary[500]} />
        </View>
        <View style={styles.emptyTextBlock}>
          <AppText variant="h2" color={theme.color.text.primary}>No vehicle yet</AppText>
          <AppText variant="label" color={theme.color.text.muted}>
            Add your vehicle so riders can find it
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.color.text.muted} />
      </Pressable>
    );
  }

  const driver = vehicle.driverId;
  const isPrivate = typeof driver === 'object' && driver !== null && driver.isPrivate === true;
  const routeDisplay = vehicle.routeName || vehicle.routeId || null;

  return (
    <View style={styles.container}>
      <View style={styles.mainRow}>
        <View style={styles.iconBadge}>
          <Ionicons name="bus" size={20} color={theme.color.primary[600]} />
        </View>
        <View style={styles.textBlock}>
          <AppText variant="body" weight="medium" style={styles.vehicleName}>
            {vehicle.vehicleName}
          </AppText>
          {routeDisplay ? (
            <View style={styles.routeRow}>
              <Ionicons name="map-outline" size={14} color={theme.color.text.muted} />
              <AppText variant="caption" color={theme.color.text.muted} numberOfLines={1}>
                {routeDisplay}
              </AppText>
            </View>
          ) : null}
        </View>
        <StatusPill
          testID="vehicle-privacy-pill"
          label={isPrivate ? 'Approval req.' : 'Open'}
          variant={isPrivate ? 'warn' : 'live'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.surface.card,
    borderRadius: theme.radius.card,
    padding: theme.space[3],
    ...theme.elevation.card,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.control,
    backgroundColor: theme.color.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    marginBottom: 2,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[1],
  },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.color.surface.card,
    borderRadius: theme.radius.card,
    padding: theme.space[3],
    borderWidth: 1,
    borderColor: theme.color.border.strong,
    borderStyle: 'dashed',
    gap: theme.space[3],
  },
  emptyIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.color.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTextBlock: {
    flex: 1,
  },
});
