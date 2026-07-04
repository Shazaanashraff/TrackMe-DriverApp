import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { formatCurrency } from '../../helpers/formatters';

export type EarningsStats = {
  today?: { totalEarnings?: number; totalTrips?: number };
  week?: { totalEarnings?: number; totalTrips?: number };
  month?: { totalEarnings?: number; totalTrips?: number };
  pending?: { totalPending?: number; count?: number };
};

type Props = {
  stats: EarningsStats | null | undefined;
};

const CARD_DEFS = [
  { key: 'today', title: 'Today', icon: 'today', color: COLORS.primary },
  { key: 'week', title: 'This Week', icon: 'stats-chart', color: '#3b82f6' },
  { key: 'month', title: 'This Month', icon: 'calendar', color: '#f59e0b' },
] as const;

export default function EarningsSummary({ stats }: Props) {
  const pendingTotal = stats?.pending?.totalPending || 0;
  const pendingCount = stats?.pending?.count || 0;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Performance Summary</Text>

      {CARD_DEFS.map(({ key, title, icon, color }) => {
        const bucket = stats?.[key];
        return (
          <View key={key} style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: `${color}15` }]}>
              <Ionicons name={icon} size={24} color={color} />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statTitle}>{title}</Text>
              <Text style={styles.statAmount}>{formatCurrency(bucket?.totalEarnings || 0)}</Text>
              <Text style={styles.statSubText}>{bucket?.totalTrips || 0} completed trips</Text>
            </View>
            <View style={[styles.trendBadge, { backgroundColor: `${color}10` }]}>
              <Ionicons name="trending-up" size={12} color={color} />
            </View>
          </View>
        );
      })}

      <View style={styles.statCard}>
        <View style={[styles.statIconBox, { backgroundColor: '#8b5cf615' }]}>
          <Ionicons name="time" size={24} color="#8b5cf6" />
        </View>
        <View style={styles.statInfo}>
          <Text style={styles.statTitle}>Pending</Text>
          <Text style={styles.statAmount}>{formatCurrency(pendingTotal)}</Text>
          <Text style={styles.statSubText}>{pendingCount} completed trips</Text>
        </View>
        <View style={[styles.trendBadge, { backgroundColor: '#8b5cf610' }]}>
          <Ionicons name="trending-up" size={12} color="#8b5cf6" />
        </View>
      </View>

      {pendingCount > 0 && (
        <TouchableOpacity style={styles.payoutAction} activeOpacity={0.8}>
          <View style={styles.payoutIcon}>
            <Ionicons name="wallet-outline" size={24} color={COLORS.white} />
          </View>
          <View style={styles.payoutBody}>
            <Text style={styles.payoutTitle}>Withdraw Earnings</Text>
            <Text style={styles.payoutSub}>{formatCurrency(pendingTotal)} available for payout</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
    marginBottom: SPACING.md,
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  statIconBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statInfo: {
    flex: 1,
  },
  statTitle: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  statAmount: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
  },
  statSubText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  trendBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payoutAction: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  payoutIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  payoutBody: {
    flex: 1,
  },
  payoutTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.secondary,
  },
  payoutSub: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
    marginTop: 2,
  },
});
