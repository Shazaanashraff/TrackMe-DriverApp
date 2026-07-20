import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import AppText from '../../components/ui/AppText';
import Card from '../../components/ui/Card';
import StatusPill from '../../components/ui/StatusPill';
import { formatCurrency } from '../../helpers/formatters';

export type Route = {
  _id?: string;
  routeId: string;
  routeName: string;
  source: string;
  destination: string;
  distance: number;
  estimatedTime: number;
  fare: number;
  isActive?: boolean;
};

type Props = {
  route: Route;
};

export default function RouteListItem({ route }: Props) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Ionicons name="map" size={18} color={theme.color.primary[500]} />
        </View>
        <View style={styles.titleArea}>
          <AppText variant="body" weight="medium">{route.routeName}</AppText>
          <AppText variant="caption" color={theme.color.text.muted}>{route.routeId}</AppText>
        </View>
        <StatusPill label={route.isActive ? 'ACTIVE' : 'INACTIVE'} variant={route.isActive ? 'live' : 'neutral'} />
      </View>

      <View style={styles.path}>
        <View style={styles.pathNode}>
          <View style={[styles.nodeDot, { backgroundColor: theme.color.primary[500] }]} />
          <AppText variant="label">{route.source}</AppText>
        </View>
        <View style={styles.pathLine} />
        <View style={styles.pathNode}>
          <View style={[styles.nodeDot, { backgroundColor: theme.color.text.muted }]} />
          <AppText variant="label">{route.destination}</AppText>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Ionicons name="resize-outline" size={14} color={theme.color.text.muted} />
          <AppText variant="label" weight="medium">{route.distance} km</AppText>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="time-outline" size={14} color={theme.color.text.muted} />
          <AppText variant="label" weight="medium">{route.estimatedTime} min</AppText>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="cash-outline" size={14} color={theme.color.text.muted} />
          <AppText variant="label" weight="medium">{formatCurrency(route.fare)}</AppText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.space[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    marginBottom: theme.space[3],
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.control,
    backgroundColor: theme.color.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleArea: {
    flex: 1,
  },
  path: {
    paddingVertical: theme.space[2],
    paddingLeft: theme.space[1],
    gap: theme.space[1],
  },
  pathNode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
  },
  nodeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pathLine: {
    width: 2,
    height: 12,
    backgroundColor: theme.color.border.hairline,
    marginLeft: 3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: theme.borderWidth.hairline,
    borderTopColor: theme.color.border.hairline,
    paddingTop: theme.space[3],
    marginTop: theme.space[1],
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[1],
  },
});
