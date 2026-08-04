import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import AppText from '../../components/ui/AppText';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';

type Vehicle = {
  vehicleName?: string;
  registrationNumber?: string;
  seatCapacity?: number;
  routeName?: string;
};

type Props = {
  vehicle: Vehicle | null;
  onRegisterPress: () => void;
};

export default function VehicleCard({ vehicle, onRegisterPress }: Props) {
  if (!vehicle) {
    return (
      <Card>
        <EmptyState
          icon="bus-outline"
          title="No vehicle yet"
          subtitle="Add your vehicle so riders can find it"
          actionLabel="Add my vehicle"
          onAction={onRegisterPress}
        />
      </Card>
    );
  }

  const subLine = [
    vehicle.registrationNumber || 'No registration',
    `${vehicle.seatCapacity || 0} seats`,
    vehicle.routeName,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card>
      <View style={styles.row}>
        <View style={styles.iconBadge}>
          <Ionicons name="vehicle" size={20} color={theme.color.primary[500]} />
        </View>
        <View style={styles.textBlock}>
          <AppText variant="body" weight="medium">{vehicle.vehicleName}</AppText>
          <AppText variant="label" color={theme.color.text.muted}>{subLine}</AppText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.control,
    backgroundColor: theme.color.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
  },
});
