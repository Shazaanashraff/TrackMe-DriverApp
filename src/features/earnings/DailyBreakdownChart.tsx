import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import AppText from '../../components/ui/AppText';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import Skeleton from '../../components/ui/Skeleton';
import { formatCurrency } from '../../helpers/formatters';
import { AppError } from '../../lib/errors';
import ErrorState from '../../components/ui/ErrorState';

export type DailyBreakdownItem = {
  _id: string;
  trips: number;
  passengers: number;
  earnings: number;
};

type Props = {
  breakdown: DailyBreakdownItem[];
  isLoading: boolean;
  isError: boolean;
  error?: AppError | null;
  onRetry: () => void;
};

export default function DailyBreakdownChart({ breakdown, isLoading, isError, error, onRetry }: Props) {
  if (isLoading) {
    return (
      <Card style={styles.card}>
        <AppText variant="h2" style={styles.title}>Daily breakdown</AppText>
        <Skeleton height={56} style={styles.rowSkeleton} />
        <Skeleton height={56} style={styles.rowSkeleton} />
        <Skeleton height={56} />
      </Card>
    );
  }

  if (isError) {
    return (
      <Card style={styles.card}>
        <AppText variant="h2" style={styles.title}>Daily breakdown</AppText>
        <ErrorState
          error={error ?? new AppError('unknown', 'Failed to load breakdown')}
          onRetry={onRetry}
          variant="compact"
          message="Couldn't load. Pull down to try again."
        />
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <AppText variant="h2" style={styles.title}>Daily breakdown</AppText>

      {breakdown.length > 0 ? (
        <View style={styles.list}>
          {breakdown.map((day, idx) => (
            <View key={day._id ?? idx} style={styles.row}>
              <View style={styles.dateBox}>
                <AppText variant="body" weight="medium">{day._id.split('-')[2]}</AppText>
                <AppText variant="caption" color={theme.color.text.muted}>
                  {new Date(day._id).toLocaleString('default', { month: 'short' })}
                </AppText>
              </View>
              <View style={styles.main}>
                <AppText variant="label" color={theme.color.text.secondary} style={styles.tripsLabel}>
                  {day.trips} trips · {day.passengers} passengers
                </AppText>
                <View style={styles.track}>
                  <View style={[styles.bar, { width: `${Math.min((day.earnings / 500) * 100, 100)}%` }]} />
                </View>
              </View>
              <AppText variant="body" weight="medium" style={styles.value}>{formatCurrency(day.earnings)}</AppText>
            </View>
          ))}
        </View>
      ) : (
        <EmptyState
          icon="calendar-outline"
          title="No breakdown yet"
          subtitle="Complete more trips to see your daily earnings."
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: theme.space[4],
  },
  title: {
    marginBottom: theme.space[3],
  },
  rowSkeleton: {
    marginBottom: theme.space[2],
  },
  list: {
    gap: theme.space[2],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateBox: {
    width: 44,
    marginRight: theme.space[3],
    paddingRight: theme.space[3],
    borderRightWidth: theme.borderWidth.hairline,
    borderRightColor: theme.color.border.hairline,
  },
  main: {
    flex: 1,
  },
  tripsLabel: {
    marginBottom: theme.space[1],
  },
  track: {
    height: 4,
    backgroundColor: theme.color.surface.field,
    borderRadius: 2,
    width: '100%',
  },
  bar: {
    height: '100%',
    backgroundColor: theme.color.primary[500],
    borderRadius: 2,
  },
  value: {
    marginLeft: theme.space[3],
  },
});
