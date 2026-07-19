import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import AppText from '../../components/ui/AppText';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';

type Bus = {
  busName?: string;
  registrationNumber?: string;
  seatCapacity?: number;
  routeName?: string;
};

type Props = {
  bus: Bus | null;
  onRegisterPress: () => void;
};

export default function VehicleCard({ bus, onRegisterPress }: Props) {
  if (!bus) {
    return (
      <Card>
        <EmptyState
          icon="bus-outline"
          title="No bus yet"
          subtitle="Add your bus so riders can find it"
          actionLabel="Add my bus"
          onAction={onRegisterPress}
        />
      </Card>
    );
  }

  const subLine = [
    bus.registrationNumber || 'No registration',
    `${bus.seatCapacity || 0} seats`,
    bus.routeName,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card>
      <View style={styles.row}>
        <View style={styles.iconBadge}>
          <Ionicons name="bus" size={20} color={theme.color.primary[500]} />
        </View>
        <View style={styles.textBlock}>
          <AppText variant="body" weight="medium">{bus.busName}</AppText>
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
