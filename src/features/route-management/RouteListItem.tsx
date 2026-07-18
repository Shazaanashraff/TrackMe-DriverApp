import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
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
    <View style={styles.routeCard}>
      <View style={styles.routeHeader}>
        <View style={styles.routeIconBox}>
          <Ionicons name="map" size={20} color={COLORS.white} />
        </View>
        <View style={styles.routeTitleArea}>
          <Text style={styles.routeNameText}>{route.routeName}</Text>
          <Text style={styles.routeIdText}>{route.routeId}</Text>
        </View>
        <View style={[styles.statusBadge, route.isActive ? styles.activeBadge : styles.inactiveBadge]}>
          <Text style={[styles.statusText, { color: route.isActive ? COLORS.primary : COLORS.error }]}>
            {route.isActive ? 'ACTIVE' : 'INACTIVE'}
          </Text>
        </View>
      </View>

      <View style={styles.routePath}>
        <View style={styles.pathNode}>
          <View style={[styles.nodeDot, { backgroundColor: COLORS.primary }]} />
          <Text style={styles.pathText}>{route.source}</Text>
        </View>
        <View style={styles.pathLine} />
        <View style={styles.pathNode}>
          <View style={[styles.nodeDot, { backgroundColor: COLORS.error }]} />
          <Text style={styles.pathText}>{route.destination}</Text>
        </View>
      </View>

      <View style={styles.routeFooter}>
        <View style={styles.footerItem}>
          <Ionicons name="resize-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.footerValue}>{route.distance} km</Text>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.footerValue}>{route.estimatedTime} min</Text>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="cash-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.footerValue}>{formatCurrency(route.fare)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  routeCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  routeIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  routeTitleArea: {
    flex: 1,
  },
  routeNameText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
  },
  routeIdText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadge: {
    backgroundColor: `${COLORS.primary}20`,
  },
  inactiveBadge: {
    backgroundColor: `${COLORS.error}20`,
  },
  statusText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
  },
  routePath: {
    paddingVertical: SPACING.md,
    paddingHorizontal: 8,
    gap: 8,
  },
  pathNode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nodeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pathText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  pathLine: {
    width: 2,
    height: 12,
    backgroundColor: COLORS.border,
    marginLeft: 3,
  },
  routeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
    marginTop: SPACING.sm,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerValue: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
  },
});
