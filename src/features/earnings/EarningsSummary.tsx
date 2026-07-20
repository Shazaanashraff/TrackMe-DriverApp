import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import AppText from '../../components/ui/AppText';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import { formatCurrency } from '../../helpers/formatters';

export type EarningsStats = {
  today?: { totalEarnings?: number; totalTrips?: number };
  week?: { totalEarnings?: number; totalTrips?: number };
  month?: { totalEarnings?: number; totalTrips?: number };
  pending?: { totalPending?: number; count?: number };
};

type Props = {
  stats: EarningsStats | null | undefined;
  isLoading?: boolean;
};

const CARDS = [
  { key: 'today', title: 'Today', icon: 'today-outline' as const },
  { key: 'week', title: 'This week', icon: 'stats-chart-outline' as const },
  { key: 'month', title: 'This month', icon: 'calendar-outline' as const },
  { key: 'pending', title: 'Pending', icon: 'time-outline' as const },
] as const;

export default function EarningsSummary({ stats, isLoading = false }: Props) {
  return (
    <View style={styles.grid}>
      {CARDS.map(({ key, title, icon }) => {
        const amount = key === 'pending' ? stats?.pending?.totalPending : stats?.[key]?.totalEarnings;
        const trips = key === 'pending' ? stats?.pending?.count : stats?.[key]?.totalTrips;

        return (
          <Card key={key} style={styles.card}>
            <View style={styles.iconBadge}>
              <Ionicons name={icon} size={18} color={theme.color.primary[500]} />
            </View>
            <AppText variant="label" color={theme.color.text.secondary}>{title}</AppText>
            {isLoading ? (
              <Skeleton width={90} height={23} style={styles.amountSkeleton} />
            ) : (
              <AppText variant="h2" weight="medium" style={styles.amount}>{formatCurrency(amount || 0)}</AppText>
            )}
            <AppText variant="caption" color={theme.color.text.muted}>{trips || 0} trips</AppText>
          </Card>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space[3],
  },
  card: {
    width: '47%',
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.control,
    backgroundColor: theme.color.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.space[2],
  },
  amount: {
    marginTop: theme.space[1],
  },
  amountSkeleton: {
    marginTop: theme.space[1],
    marginBottom: theme.space[1],
  },
});
