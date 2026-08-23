import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import AppText from '../../components/ui/AppText';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import StatusPill from '../../components/ui/StatusPill';

// Only what the card puts on screen. The API payload carries more (registration
// number, seat capacity); a driver already knows their own vehicle, so neither
// earns a place here.
type Vehicle = {
  vehicleName?: string;
  routeName?: string;
  driverId?: { isPrivate?: boolean } | string | null;
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

  const driver = vehicle.driverId;
  const isPrivate = typeof driver === 'object' && driver !== null && driver.isPrivate === true;

  return (
    <Card>
      <View style={styles.row}>
        <View style={styles.iconBadge}>
          {/* "vehicle" is not an Ionicons glyph, so this badge was rendering the
              missing-icon "?" placeholder. The set calls it "bus". */}
          <Ionicons name="bus" size={20} color={theme.color.primary[500]} />
        </View>
        <View style={styles.textBlock}>
          <AppText variant="body" weight="medium">{vehicle.vehicleName}</AppText>
          {/* The route is the only sub-line worth showing, and plenty of
              vehicles have none — so it renders or it is absent, never blank. */}
          {vehicle.routeName ? (
            <AppText variant="label" color={theme.color.text.muted}>{vehicle.routeName}</AppText>
          ) : null}
        </View>
        {/* Whether a passenger needs the manager's approval to enrol with this
            driver's key. Live/off-duty already reads off the duty hero above. */}
        <StatusPill
          testID="vehicle-privacy-pill"
          label={isPrivate ? 'Private' : 'Public'}
          variant={isPrivate ? 'warn' : 'live'}
        />
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
