import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import AppText from '../../components/ui/AppText';
import Card from '../../components/ui/Card';
import StatusPill, { StatusPillVariant } from '../../components/ui/StatusPill';
import EmptyState from '../../components/ui/EmptyState';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import { formatCurrency } from '../../helpers/formatters';
import { AppError } from '../../lib/errors';

export type EarningHistoryItem = {
  _id?: string;
  routeId?: { source?: string; destination?: string };
  journeyDate: string;
  netEarnings: number;
  paymentStatus: 'PENDING' | 'PROCESSED' | 'PAID' | 'FAILED';
};

type Props = {
  history: EarningHistoryItem[];
  isLoading: boolean;
  isError: boolean;
  error?: AppError | null;
  onRetry: () => void;
  onRequestPayout: (item: EarningHistoryItem) => void;
};

const STATUS_VARIANT: Record<EarningHistoryItem['paymentStatus'], StatusPillVariant> = {
  PAID: 'live',
  PROCESSED: 'neutral',
  PENDING: 'warn',
  FAILED: 'danger',
};

export default function EarningsHistoryList({
  history,
  isLoading,
  isError,
  error,
  onRetry,
  onRequestPayout,
}: Props) {
  if (isLoading) {
    return (
      <View style={styles.list}>
        <Skeleton height={84} style={styles.rowSkeleton} />
        <Skeleton height={84} style={styles.rowSkeleton} />
        <Skeleton height={84} />
      </View>
    );
  }

  if (isError) {
    return (
      <ErrorState
        error={error ?? new AppError('unknown', 'Failed to load history')}
        onRetry={onRetry}
        variant="compact"
        message="Couldn't load. Pull down to try again."
      />
    );
  }

  if (history.length === 0) {
    return (
      <EmptyState
        icon="receipt-outline"
        title="No history yet"
        subtitle="Your earnings history will appear here after your first trip."
      />
    );
  }

  return (
    <View style={styles.list}>
      {history.map((item, idx) => (
        <Card key={item._id ?? idx} style={styles.card}>
          <View style={styles.row}>
            <View style={styles.textBlock}>
              <AppText variant="body" weight="medium" numberOfLines={1}>
                {item.routeId?.source || 'Origin'} → {item.routeId?.destination || 'Destination'}
              </AppText>
              <AppText variant="caption" color={theme.color.text.muted}>
                {new Date(item.journeyDate).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </AppText>
            </View>
            <AppText variant="body" weight="medium">{`+${formatCurrency(item.netEarnings)}`}</AppText>
          </View>

          <View style={styles.footer}>
            <StatusPill label={item.paymentStatus} variant={STATUS_VARIANT[item.paymentStatus]} />
            {item.paymentStatus === 'PENDING' ? (
              <Pressable
                onPress={() => onRequestPayout(item)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
              >
                <AppText variant="label" weight="medium" color={theme.color.primary[500]}>
                  Request payout
                </AppText>
              </Pressable>
            ) : null}
          </View>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: theme.space[3],
  },
  rowSkeleton: {
    marginBottom: theme.space[3],
  },
  card: {
    gap: theme.space[3],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.space[3],
  },
  textBlock: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
